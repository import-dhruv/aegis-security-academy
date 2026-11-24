===MODULE===
TITLE: HTML Fundamentals: Tags, Attributes, and Document Structure
LEVEL: Beginner
MINUTES: 30
SUMMARY: Learn how HTML markup becomes a document tree and why the parser's forgiving rules matter for security.
OBJECTIVES: Parse an HTML document into elements and attributes | Distinguish raw text from parsed markup | Identify dangerous elements and attributes
TAKEAWAYS: HTML is a tolerant parser, not a strict format | Attributes can carry executable values | Document structure defines trust boundaries
PRACTICE: On a local lab page at <LAB_HOST>, submit inputs containing markup and entities to observe how the browser parses each one.
SOURCES: None
---
## Core idea
HTML is not a programming language; it is a set of instructions telling the browser how to build a document. The parser reads bytes, tokenizes them into tags and text, and constructs the Document Object Model (DOM). Security bugs appear when data the application intends as text is interpreted as markup instead.

### Mental model
Imagine the parser as a factory with two conveyor belts: one for structure (tags) and one for content (text). Untrusted data must stay on the content belt. If it crosses to the structure belt, it becomes executable markup. The parser is deliberately forgiving and repairs malformed HTML, so that repair behavior itself can be exploited.

### Method
1. Fetch a page from <LAB_HOST> and open its source.
2. List every place user data is reflected into the response.
3. Classify the parser context: text node, quoted attribute, URL attribute, or raw-text element such as `<script>`.
4. Test whether `<`, `>`, `"`, and `'` are encoded for that specific context.

### Concrete example
A search page at <LAB_HOST> builds `Welcome, <b>alice</b>`. If the name is `alice<img src=x onerror=alert(1)>`, the parser creates a second element. The fix is context-aware encoding: render the value as `alice&lt;img src=x onerror=alert(1)&gt;`.

| Context | Required encoding |
|---|---|
| Text node | Encode `<`, `>`, `&` |
| Quoted attribute | Encode `"` and `&` |
| URL attribute | URL-encode, then attribute-encode |
| `<script>` body | JavaScript-encode; entities do not work |

### Common mistakes
- Blacklisting "bad words" instead of encoding for context.
- Applying one universal escape function everywhere.
- Assuming JSON inside a script tag is automatically inert.

### Defense and verification
Use a vetted template engine with auto-escaping and never build markup through string concatenation. Verify by injecting a harmless `<img src=x onerror=...>` marker into every field and confirming in DevTools that it appears as a text node, not an element.

### Knowledge check
Q: Why is `<textarea>` a special context? A: It is an RCDATA element where entities are decoded but tags are not parsed, so it needs different escaping rules.

===MODULE===
TITLE: The DOM: Nodes, Trees, and the Browser Object Model
LEVEL: Beginner
MINUTES: 35
SUMMARY: Understand how the DOM represents a page as a live object tree that JavaScript can read and mutate at runtime.
OBJECTIVES: Describe the DOM tree and node types | Use safe DOM APIs to insert content | Trace how mutations create sinks
TAKEAWAYS: The DOM is a live API, not a static snapshot | Some properties are dangerous sinks | Source-to-sink flow drives client-side bugs
PRACTICE: In a lab page at <LAB_HOST>, compare `textContent` and `innerHTML` with a harmless markup payload.
SOURCES: None
---
## Core idea
The DOM is a programming interface representing the page as a tree of objects. JavaScript can walk, read, and modify that tree after the HTML is parsed. This mutability is powerful and dangerous: writing untrusted strings into certain DOM properties can create executable markup, and those properties are called sinks.

### Mental model
Treat the DOM as a mutable data structure shared between the page and every script on it. Data flows from a source (location.hash, a form value, a network response) through code to a sink (a property that interprets its input). A vulnerability exists when untrusted data reaches a dangerous sink without transformation.

### Method
1. Identify sources on the lab page: `location`, `document.referrer`, form inputs, `postMessage`.
2. Search scripts for sinks: `innerHTML`, `outerHTML`, `document.write`, `eval`, `insertAdjacentHTML`.
3. Follow each source forward; note any validation or encoding on the path.
4. Confirm reachability with a benign marker payload in the owned lab.

### Concrete example
At <LAB_HOST>, a profile page runs:
```js
const name = new URLSearchParams(location.search).get('name');
document.getElementById('out').innerHTML = '<b>' + name + '</b>';
```
The query parameter flows into `innerHTML`, a sink that reparses markup. Replacing it with `textContent` (or creating a text node) removes the parsing step entirely.

| API | Interprets markup? | Safe for untrusted data? |
|---|---|---|
| `textContent` | No | Yes |
| `createTextNode` | No | Yes |
| `innerHTML` | Yes | Only with trusted/sanitized input |
| `insertAdjacentHTML` | Yes | Only with sanitized input |

### Common mistakes
- Believing client-side validation protects the server.
- Sanitizing once and reusing the value in a different context.
- Forgetting that frameworks still expose raw HTML directives.

### Defense and verification
Prefer safe DOM APIs by default and keep a small allowlist of sanitizers for rich text. Verify by grepping the lab codebase for dangerous sinks and confirming each has a justified, tested guard.

### Knowledge check
Q: Why is `textContent` safe against markup injection? A: It creates a text node, so the browser never reparses the value as HTML tags.

===MODULE===
TITLE: JavaScript Essentials: Variables, Functions, and Scope
LEVEL: Beginner
MINUTES: 35
SUMMARY: Build the JavaScript vocabulary needed to read client-side code and reason about where values can be influenced.
OBJECTIVES: Explain scope, hoisting, and closures | Distinguish declarations | Recognize dynamic typing pitfalls
TAKEAWAYS: Scope determines which code can read or write a value | Closures capture references, not copies | Coercion can defeat naive checks
PRACTICE: In a local script at <LAB_HOST>, log values inside and outside a closure to observe captured state.
SOURCES: None
---
## Core idea
JavaScript is a dynamically typed language with function-level scope and automatic type coercion. To audit client-side code you must be able to answer two questions about any value: where did it come from, and who can change it? Scope rules and coercion determine the answer.

### Mental model
Picture each function as a room with a one-way mirror: it can see values in outer rooms but outer rooms cannot see inside. A closure is a function that keeps a window into its birth room even after leaving it. Values are references, so two variables can point at the same object.

### Method
1. Read declarations: `const` and `let` are block-scoped; `var` is function-scoped and hoisted.
2. Trace function boundaries to see which variables are reachable.
3. Flag comparisons using `==` and arithmetic on untrusted strings.
4. Note any use of `eval` or dynamic property access with user-controlled keys.

### Concrete example
At <LAB_HOST> a discount check runs:
```js
let qty = new URLSearchParams(location.search).get('qty');
if (qty == 1) applyDiscount();
```
If `qty` is the string `"1"`, loose equality coerces it to a number and passes; `"1abc"` behaves differently under arithmetic. Using `===` and explicit `Number.parseInt` with validation removes the ambiguity.

| Feature | Behavior | Security relevance |
|---|---|---|
| `var` | Function scope, hoisted | Unexpected reachable values |
| `let` / `const` | Block scope | Narrower exposure |
| `==` | Type coercion | Bypassable comparisons |
| `===` | Strict comparison | Predictable checks |

### Common mistakes
- Trusting a client-side numeric check as a server-side control.
- Assuming `const` objects are immutable; bindings are constant, contents are not.
- Overlooking that `eval` executes in the current scope with full privileges.

### Defense and verification
Keep validation on the server, use strict equality, and avoid `eval`. Verify by running the lab with non-numeric and coerced parameter values and confirming the server rejects them independently.

### Knowledge check
Q: Does `const obj = {}` prevent mutation of `obj.x`? A: No. `const` fixes the binding, not the object's contents.

===MODULE===
TITLE: Browser Events and the Event Loop
LEVEL: Beginner
MINUTES: 30
SUMMARY: Learn how the event loop schedules work and how event handlers become entry points for untrusted input.
OBJECTIVES: Explain the call stack and task queue | Trace event handler execution | Identify asynchronous trust issues
TAKEAWAYS: Callbacks run after the current stack clears | Event handlers are code entry points | Timing affects validation and DOM updates
PRACTICE: On a lab page at <LAB_HOST>, attach a click handler that reads a data attribute and log when it fires.
SOURCES: None
---
## Core idea
Browsers are single-threaded but asynchronous. The event loop moves completed tasks and microtasks onto the call stack, letting handlers react to clicks, network replies, and timers. For security work, the key insight is that any event handler is an entry point where attacker-influenced data can enter code.

### Mental model
Think of a restaurant kitchen: the call stack is the single chef, tasks are orders on a rail, and microtasks are rush orders served first. The chef never does two things at once, but the order of operations can surprise you — especially after `await` or `Promise.resolve()`.

### Method
1. Enumerate event registrations in the lab's scripts: `onclick`, `addEventListener`, inline `on=` attributes.
2. For each, identify the event object fields used (`target`, `data`, `origin`).
3. Check whether validation happens before or after an asynchronous gap.
4. Test message handlers with benign cross-frame data in your owned lab.

### Concrete example
At <LAB_HOST> a message handler runs:
```js
window.addEventListener('message', (e) => {
  document.getElementById('msg').textContent = e.data.text;
});
```
This is safe for DOM injection because it uses `textContent`, but it still accepts data from any origin. Checking `e.origin` against an allowlist closes the trust gap.

| Mechanism | Runs when | Microtask? |
|---|---|---|
| `setTimeout` callback | Timer expires | No |
| `Promise.then` / `await` | Promise settles | Yes |
| DOM event | Event dispatched | No |
| `queueMicrotask` | Explicitly queued | Yes |

### Common mistakes
- Assuming validation performed before `await` still holds after it.
- Reading `event.data` without checking `event.origin`.
- Using inline `on=` attributes that mix code and data.

### Defense and verification
Validate origin and schema inside every message handler and re-check state after asynchronous boundaries. Verify by sending a message from an unrelated test frame and confirming it is ignored.

### Knowledge check
Q: Which runs first: a queued `setTimeout` callback or a resolved promise's `.then`? A: The promise microtask runs before the next task.

===MODULE===
TITLE: Client-Side Storage: Cookies, localStorage, and sessionStorage
LEVEL: Beginner
MINUTES: 30
SUMMARY: Compare browser storage mechanisms and learn which flags and origins protect sensitive values.
OBJECTIVES: Distinguish cookie and web-storage semantics | Configure secure cookie flags | Assess where secrets should live
TAKEAWAYS: Cookies travel with requests automatically | Web storage is script-readable and not sent in headers | Flag configuration is the primary control
PRACTICE: Use DevTools on <LAB_HOST> to inspect cookies and storage after login in your lab account.
SOURCES: None
---
## Core idea
Browsers offer several places to keep state. Cookies are attached to HTTP requests automatically and can be hidden from JavaScript. Web storage (`localStorage`, `sessionStorage`) is larger and never sent in headers, but any script on the origin can read it. Choosing the wrong store exposes secrets to cross-site or cross-script attacks.

### Mental model
Think of cookies as a badge a visitor wears that the server checks at the door; web storage is a notebook in the visitor's pocket that only local scripts can read. The badge can be locked so wearers cannot see it (`HttpOnly`) or forced to travel only over HTTPS (`Secure`).

### Method
1. Inventory every value stored on <LAB_HOST> and classify its sensitivity.
2. For cookies, record `HttpOnly`, `Secure`, `SameSite`, `Domain`, and `Path`.
3. For web storage, check whether any token or personal data is persisted.
4. Confirm a logout clears all stores, not just the cookie.

### Concrete example
A session cookie set by <LAB_HOST>:
```
Set-Cookie: sid=abc123; HttpOnly; Secure; SameSite=Lax; Path=/
```
Yet the app also runs `localStorage.setItem('jwt', token)`, defeating `HttpOnly`. Prefer keeping tokens in `HttpOnly` cookies and letting the server issue them.

| Property | Cookie | localStorage |
|---|---|---|
| Sent with requests | Yes | No |
| JavaScript readable | Only without `HttpOnly` | Always |
| Lifetime | Session or `Max-Age` | Until cleared |
| Cross-subdomain | Configurable via `Domain` | Per-origin |

### Common mistakes
- Storing access tokens in `localStorage` and assuming XSS is impossible.
- Setting `Domain` too broadly, exposing the cookie to sibling subdomains.
- Forgetting to rotate the session value after login.

### Defense and verification
Use `HttpOnly; Secure; SameSite=Lax` (or `Strict`) for sessions and reserve web storage for non-sensitive UI state. Verify in DevTools that a script cannot read the session cookie and that logout clears every store.

### Knowledge check
Q: Which flag stops JavaScript from reading a cookie? A: `HttpOnly`.

===MODULE===
TITLE: Browser Architecture and the Rendering Pipeline
LEVEL: Beginner
MINUTES: 30
SUMMARY: Follow the path from bytes on the wire to painted pixels and see where security decisions are enforced.
OBJECTIVES: Describe parsing, style, layout, and paint stages | Identify the origin as the security boundary | Explain process isolation
TAKEAWAYS: Browsers parse incrementally while data is still arriving | Origin, not hostname alone, defines the security boundary | Renderer processes are sandboxed
PRACTICE: On a lab page at <LAB_HOST>, use the Performance panel to observe parsing and layout timing.
SOURCES: None
---
## Core idea
A browser is a distributed system disguised as an application. It fetches bytes, parses HTML into a DOM, computes CSS, lays out boxes, paints pixels, and runs scripts — often concurrently. Security controls such as origin checks and sandboxing are woven into these stages, so understanding the pipeline explains why some attacks work.

### Mental model
Picture a printing press: bytes arrive on a conveyor (network), a typesetter arranges them (parser), a designer applies style (CSSOM), and rollers produce the page (layout and paint). Each station can be interrupted by new input, which is why partially parsed documents can behave oddly.

### Method
1. Request <LAB_HOST> and open DevTools' Network panel to see response timing.
2. Switch to Performance and reload to watch parse, style, and layout events.
3. Note where scripts pause the parser and where defer/async change ordering.
4. Inspect the security panel for origin and isolation details.

### Concrete example
A response from <LAB_HOST> containing a large `<script>` before the body blocks parsing. Moving it to `defer` lets the DOM build first, changing when `document.getElementById` finds elements. Attackers exploit parser timing in mutation-based attacks where a script observes intermediate DOM states.

| Stage | Output | Security relevance |
|---|---|---|
| Parsing | DOM tree | Markup injection happens here |
| Style | CSSOM | CSS exfiltration edges |
| Layout | Box geometry | Clickjacking, UI redressing |
| Paint | Pixels | Visual spoofing |

### Common mistakes
- Assuming the browser waits for the full response before acting.
- Treating `192.0.2.10` and `lab.<LAB_HOST>` as the same origin.
- Ignoring that CSS can leak state through selectors and timing.

### Defense and verification
Send complete, well-formed responses; use CSP to limit script sources; and test overlays for clickjacking. Verify by checking that framing is denied via `X-Frame-Options` or CSP `frame-ancestors` on <LAB_HOST>.

### Knowledge check
Q: What three parts must match for two URLs to share an origin? A: Scheme, host, and port.

===MODULE===
TITLE: HTTP Requests, Responses, and Methods
LEVEL: Beginner
MINUTES: 30
SUMMARY: Master the structure of HTTP messages and how methods and status codes shape application behavior.
OBJECTIVES: Read request and response messages | Distinguish safe from state-changing methods | Interpret common status codes
TAKEAWAYS: HTTP is a text protocol with a strict blank-line separator | Method semantics drive server behavior | Responses are more than status and body
PRACTICE: Using a local proxy on <LAB_HOST>, capture a login request and annotate each line.
SOURCES: None
---
## Core idea
HTTP is a request/response protocol. A request carries a method, a path, headers, and an optional body; a response carries a status line, headers, and a body. Attacks often depend on bending these structures — adding parameters, changing methods, or smuggling extra requests — so fluency in raw messages is essential.

### Mental model
Think of an HTTP message as a postcard: the header lines are the addressing information and the body is the letter. A blank line separates them. Proxies read the addressing information, which means ambiguity in headers can make two systems disagree about where one message ends.

### Method
1. Open the network tool and capture a request to <LAB_HOST>.
2. Label the request line, each header, the blank line, and the body.
3. Note which parameters appear in the path versus the body.
4. Check what the server does when the method is changed on the same endpoint.

### Concrete example
```
POST /login HTTP/1.1
Host: <LAB_HOST>
Content-Type: application/x-www-form-urlencoded
Content-Length: 29

username=alice&password=secret
```
A response might be `HTTP/1.1 302 Found` with `Location: /dashboard`. Treating the 302 body as the final result misses the redirect step.

| Method | Safe? | Idempotent? | Typical use |
|---|---|---|---|
| GET | Yes | Yes | Read data |
| POST | No | No | Create/submit |
| PUT | No | Yes | Replace resource |
| DELETE | No | Yes | Remove resource |

### Common mistakes
- Using GET for state-changing actions, enabling CSRF and cache leakage.
- Ignoring `Content-Length` versus `Transfer-Encoding` conflicts.
- Assuming a 200 response means the action succeeded.

### Defense and verification
Use correct method semantics, require CSRF tokens on state-changing requests, and normalize parsing at the edge. Verify by replaying a captured lab request with an altered method and confirming the server rejects it.

### Knowledge check
Q: Which line separates headers from the body in a raw HTTP message? A: A single empty line (CRLF CRLF).

===MODULE===
TITLE: HTTP Headers and Status Codes in Depth
LEVEL: Beginner
MINUTES: 30
SUMMARY: Explore the headers that control content type, caching, redirects, and security policy in every response.
OBJECTIVES: Interpret request and response headers | Recognize security-relevant headers | Predict browser behavior from headers
TAKEAWAYS: Content-Type determines how the browser parses a body | Cache and security headers are defense controls | Redirects can change method and destination
PRACTICE: Inspect response headers from <LAB_HOST> and classify each as informational, caching, or security-related.
SOURCES: None
---
## Core idea
Headers are the control plane of HTTP. They tell the browser what kind of content it received, how long it may cache it, which origins may frame it, and which transports are allowed. Misconfigured headers rarely crash an application, but they silently weaken its defenses.

### Mental model
Treat headers as a policy document attached to every message. The browser enforces that policy on your behalf. If a policy line is missing or wrong, the browser falls back to permissive defaults — the opposite of what a defender wants.

### Method
1. Capture a response from <LAB_HOST> and list all headers.
2. Identify `Content-Type`, `Location`, `Cache-Control`, and `Set-Cookie`.
3. Mark which security headers are present: HSTS, CSP, X-Content-Type-Options.
4. Test how changing a header in a lab proxy changes behavior.

### Concrete example
If <LAB_HOST> returns an uploaded file with `Content-Type: text/html`, the browser executes it as a document. Serving it as `application/octet-stream` with `X-Content-Type-Options: nosniff` prevents inline execution. A 302 with `Location: http://<LAB_HOST>` after an HTTPS request silently downgrades the connection unless HSTS is set.

| Header | Purpose | Weak value |
|---|---|---|
| `Content-Type` | Body interpretation | Missing or user-controlled |
| `Cache-Control` | Caching policy | `public` on private data |
| `Strict-Transport-Security` | Force HTTPS | Short or absent max-age |
| `X-Frame-Options` | Framing control | `ALLOWALL` / absent |

### Common mistakes
- Reflecting user input into a header value without stripping CR/LF.
- Setting security headers only on the homepage.
- Using `no-store` inconsistently on authenticated responses.

### Defense and verification
Define a baseline header set at the edge and apply it to every response. Verify with an automated header scanner against <LAB_HOST> and confirm each expected header appears on a deep, authenticated page.

### Knowledge check
Q: What does `nosniff` accomplish? A: It stops the browser from guessing a content type that differs from the declared one.

===MODULE===
TITLE: Cookies: Scope, Attributes, and Security Flags
LEVEL: Beginner
MINUTES: 30
SUMMARY: Understand cookie scope rules and how attributes decide when a cookie is sent and who can read it.
OBJECTIVES: Compute cookie scope from Domain and Path | Apply Secure, HttpOnly, and SameSite | Prevent session fixation
TAKEAWAYS: Cookies are scoped by domain, path, scheme, and SameSite | Prefix rules can harden names | Rotation defeats fixation
PRACTICE: From DevTools on <LAB_HOST>, modify a lab cookie's path and observe which requests include it.
SOURCES: None
---
## Core idea
A cookie is a small key/value pair the browser stores and replays on matching requests. Its scope is defined by `Domain`, `Path`, and the scheme. Its exposure is defined by `HttpOnly`, `Secure`, and `SameSite`. Session security is largely the practice of configuring these attributes correctly.

### Mental model
Think of a cookie as a bus pass with printing on it: the pass is valid only on certain routes (domain/path), only on the secure bus line (`Secure`), and the conductor reads it but passengers cannot (`HttpOnly`). `SameSite` decides whether the pass works when boarding from another site.

### Method
1. Capture `Set-Cookie` headers from <LAB_HOST> during login.
2. Evaluate each attribute against the guidelines below.
3. Check whether the value changes after authentication (rotation).
4. Test whether a cross-site navigation sends the cookie.

### Concrete example
A hardened cookie from <LAB_HOST>:
```
Set-Cookie: __Host-sid=abc123; Path=/; Secure; HttpOnly; SameSite=Lax
```
The `__Host-` prefix requires `Secure`, forbids `Domain`, and fixes `Path=/`, preventing a sibling subdomain from planting an overriding cookie.

| Attribute | Effect | Recommended |
|---|---|---|
| `HttpOnly` | Blocks script access | Always for sessions |
| `Secure` | HTTPS only | Always |
| `SameSite` | Cross-site send policy | `Lax` or `Strict` |
| `Domain` | Broadens scope | Omit for host-only |

### Common mistakes
- Setting `Domain=<LAB_HOST>` with a leading dot, allowing subdomain overwrite.
- Leaving `SameSite=None` without `Secure`.
- Reusing the pre-login cookie value after authentication.

### Defense and verification
Issue a fresh session identifier on privilege change and apply hardened attributes uniformly. Verify by inspecting `document.cookie` (session value must be absent) and watching a cross-site request in the lab proxy.

### Knowledge check
Q: Why omit `Domain` from a session cookie? A: Host-only cookies are not accepted from subdomains, narrowing the attack surface.

===MODULE===
TITLE: HTTPS, TLS, and Trust
LEVEL: Beginner
MINUTES: 35
SUMMARY: Learn what TLS guarantees, how certificates establish trust, and why mixed content and downgrade protections matter.
OBJECTIVES: Explain the TLS handshake at a high level | Validate certificate trust chains | Configure HSTS correctly
TAKEAWAYS: TLS provides confidentiality, integrity, and server authentication | Trust anchors are certificates in the browser store | HSTS closes the first-request downgrade gap
PRACTICE: Use `openssl s_client` from your lab host to inspect the certificate presented by <LAB_HOST>.
SOURCES: None
---
## Core idea
TLS sits between HTTP and TCP, encrypting the channel and authenticating the server. A browser accepts a certificate only if it chains to a trusted root, is valid for the hostname, and is within its validity window. Web application security depends on this foundation because cookies, tokens, and credentials travel inside it.

### Mental model
Picture a notary stamping a sealed envelope. The seal (encryption) hides contents and shows tampering; the notary's license (certificate chain) proves identity. A lock icon means the channel is protected, not that the site is honest — phishing sites can have valid certificates.

### Method
1. From the lab host, run:
```bash
openssl s_client -connect <LAB_HOST>:443 -servername <LAB_HOST> </dev/null
```
2. Read the certificate subject, issuer, and validity dates.
3. Check the response for HSTS: `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
4. Look for mixed-content warnings when loading lab pages over HTTP.

### Concrete example
A response from <LAB_HOST> includes an image loaded via `http://<LAB_HOST>/logo.png`. Even over HTTPS, passive mixed content can be rewritten in transit and may leak cookies if those are not `Secure`. Upgrading every subresource to HTTPS and adding HSTS removes both risks.

| Check | Good result | Risk if wrong |
|---|---|---|
| Certificate hostname | Matches `<LAB_HOST>` | Impersonation |
| Chain | Ends at trusted root | Interception |
| HSTS max-age | Long (e.g. 31536000) | SSL-strip window |
| Mixed content | None | Downgrade/leak |

### Common mistakes
- Treating the padlock as proof of application security.
- Setting HSTS with `includeSubDomains` before all subdomains support HTTPS.
- Terminating TLS at a proxy but forgetting to re-encrypt internally.

### Defense and verification
Enforce HTTPS everywhere, send HSTS with a long max-age, and eliminate mixed content. Verify with an SSL configuration scan of <LAB_HOST> and a browser console check for mixed-content messages.

### Knowledge check
Q: Does TLS protect against an application-level SQL injection? A: No. It protects the transport; the application still validates input.

===MODULE===
TITLE: Caching: Cache-Control, ETag, and Conditional Requests
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn how shared and private caches store responses and how cache directives prevent sensitive data leakage.
OBJECTIVES: Distinguish private and shared caches | Configure Cache-Control directives | Identify cache poisoning and leakage risks
TAKEAWAYS: Shared caches serve many users, so private responses must be marked | Validators enable conditional requests | User-specific URLs are dangerous cache keys
PRACTICE: On <LAB_HOST>, fetch an authenticated page twice through a lab proxy and inspect cache-related headers.
SOURCES: None
---
## Core idea
Caches improve performance by reusing responses, but a cached copy of a private page can be served to the wrong user. Correct configuration distinguishes responses that are public from those tied to a session, and uses validators so clients can ask whether a stored copy is still fresh.

### Mental model
Think of a cache as a library with many patrons. A public handbook can be loaned to anyone; a personal diary cannot. Cache-Control labels are the librarian's rules. If a private diary is mislabeled, the librarian eagerly hands it to the next person who asks for the same title.

### Method
1. Request an authenticated page from <LAB_HOST> through a lab proxy.
2. Record `Cache-Control`, `ETag`, `Last-Modified`, and any `Vary` header.
3. Re-request with `If-None-Match` to observe a 304 response.
4. Check whether the cache key includes user-specific headers such as `Cookie`.

### Concrete example
A response from <LAB_HOST> contains:
```
Cache-Control: private, no-store
ETag: "a1b2c3"
Vary: Accept-Encoding
```
`no-store` forbids saving the body anywhere; `private` allows only the browser's cache, not shared proxies. If an API instead returned `Cache-Control: public, max-age=600` for `/api/me`, an intermediary could replay one user's profile to another.

| Directive | Meaning | Use for |
|---|---|---|
| `no-store` | Never save | Auth responses, PII |
| `private` | Browser only | User-specific pages |
| `public, max-age` | Shareable, timed | Static assets |
| `Vary` | Key on listed headers | Content negotiation |

### Common mistakes
- Caching responses that embed CSRF tokens or account data.
- Omitting `Vary` when content depends on `Accept-Encoding` or headers.
- Treating `no-cache` as `no-store`; `no-cache` still stores and revalidates.

### Defense and verification
Default authenticated responses to `no-store`, fingerprint static assets for long-lived caching, and include all content-affecting headers in `Vary`. Verify by loading two different lab accounts through the same proxy and confirming neither sees the other's data.

### Knowledge check
Q: Which directive forbids storing a response at all? A: `no-store` (`no-cache` merely requires revalidation).

===MODULE===
TITLE: Proxies, Same-Origin Policy, CORS, and CSP
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Understand the browser's origin boundary, how CORS deliberately relaxes it, and how CSP limits script execution.
OBJECTIVES: Compute same-origin relationships | Interpret CORS headers | Design a restrictive Content Security Policy
TAKEAWAYS: SOP blocks cross-origin reads by default | CORS is a server-granted exception, not a client control | CSP is a second line of defense against script injection
PRACTICE: In a lab, serve two origins at <LAB_HOST> on different ports and test a cross-origin fetch with and without CORS headers.
SOURCES: None
---
## Core idea
The Same-Origin Policy (SOP) prevents a page from reading responses from another origin. Cross-Origin Resource Sharing (CORS) is a mechanism where the server grants specific exceptions. Content Security Policy (CSP) independently restricts which scripts and resources a page may load, limiting the impact of injection flaws.

### Mental model
Imagine an apartment building where each unit (origin) has its own key. SOP keeps tenants out of each other's units. CORS is a landlord's written permission slip naming exactly which visitor may enter. CSP is an alarm system inside the unit that blocks unknown tools from being used even if a visitor got in.

### Method
1. From `http://<LAB_HOST>:3000`, fetch `http://<LAB_HOST>:4000/data` and record the failure.
2. Add `Access-Control-Allow-Origin: http://<LAB_HOST>:3000` to the lab response and retry.
3. Test a preflight for a PUT request with a custom header.
4. Apply a nonce-based CSP to the lab page and observe blocked inline scripts.

### Concrete example
A preflight exchange at <LAB_HOST>:
```
OPTIONS /data HTTP/1.1
Origin: http://<LAB_HOST>:3000
Access-Control-Request-Method: PUT

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://<LAB_HOST>:3000
Access-Control-Allow-Methods: GET, PUT
Access-Control-Allow-Credentials: true
```
Never combine `Allow-Credentials: true` with a wildcard origin; use an explicit allowlist.

| Policy | Controls | Failure mode |
|---|---|---|
| SOP | Cross-origin reads | Blocked by browser |
| CORS | Server permission for reads | Misconfigured `*` or origin reflection |
| CSP | Script/resource sources | Missing `script-src` allows inline code |

### Common mistakes
- Reflecting any `Origin` header back in `Access-Control-Allow-Origin`.
- Using `unsafe-inline` in `script-src`, negating much of CSP's value.
- Assuming CORS protects the server from direct non-browser clients.

### Defense and verification
Use an exact origin allowlist, avoid credentials with wildcards, and deploy a nonce-based CSP without `unsafe-inline`. Verify with browser console errors and a CSP header analyzer on <LAB_HOST>.

### Knowledge check
Q: Does CORS protect an API from curl? A: No. It only governs browser-enforced cross-origin reads.

===MODULE===
TITLE: Server-Side Fundamentals and the Request Lifecycle
LEVEL: Beginner
MINUTES: 35
SUMMARY: Trace how a web application turns an HTTP request into data access and a response, and where trust boundaries lie.
OBJECTIVES: Map the request lifecycle | Identify trust boundaries | Locate input validation opportunities
TAKEAWAYS: Every request crosses multiple layers | Data changes representation at each layer | Validation must happen at each trust boundary
PRACTICE: On a local lab app at <LAB_HOST>, add logging at the router, controller, and database layers for a single request.
SOURCES: None
---
## Core idea
A web application is a pipeline: a web server hands a request to a router, a controller parses parameters, business logic operates on models, a database returns rows, and a view or serializer builds the response. Security failures concentrate at the boundaries between these layers, where data is reinterpreted.

### Mental model
Think of an airport baggage system. A bag (request) passes scanners (parsers), a sorting desk (router), security checks (validation), and a loading dock (database). Each station trusts the previous one, so a missed check at the first scanner propagates all the way to the plane.

### Method
1. Send a benign test request with an extra parameter to <LAB_HOST>.
2. Trace which code reads that parameter at each layer.
3. Record where type conversion, decoding, or escaping happens.
4. Identify the final sink (SQL query, file path, template, HTTP response).

### Concrete example
A route on <LAB_HOST> accepts `/user?id=5`. The controller reads `id`, casts it to a string, and interpolates it into SQL. Adding `id=5 OR 1=1` changes the query's structure. Correct handling means parameterized queries regardless of earlier "numeric" checks.

| Layer | Typical risk | Control |
|---|---|---|
| Parser | Ambiguous content types | Strict content-type checks |
| Controller | Unvalidated parameters | Schema validation |
| Model | Query/command injection | Parameterization |
| View | Output encoding | Context-aware escaping |

### Common mistakes
- Validating only in the browser and trusting the API.
- Re-decoding input after validation, reintroducing metacharacters.
- Letting raw request parameter names drive database column names.

### Defense and verification
Validate at each boundary with allowlists and use safe APIs for every sink. Verify by sending malformed parameter types to <LAB_HOST> and confirming the app returns controlled errors, not stack traces.

### Knowledge check
Q: Why is client-side validation insufficient? A: An attacker controls the client and can bypass it entirely, sending requests directly to the server.

===MODULE===
TITLE: SQL Injection: Root Cause and Lab-Safe Exploitation
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Learn how user input can alter SQL query structure and how to eliminate the flaw with parameterized queries.
OBJECTIVES: Explain the root cause of SQL injection | Demonstrate detection in an owned lab | Apply parameterized queries
TAKEAWAYS: Injection happens when data is concatenated into code | Errors and boolean behavior are signals | Parameterization removes the vulnerable interpreter boundary
PRACTICE: Against a deliberately vulnerable app at <LAB_HOST>, use UNION and boolean probes against a test parameter you control.
SOURCES: None
---
## Core idea
SQL injection occurs when untrusted input is concatenated into a query string, letting the input change the query's grammar. The fix is not clever escaping but separating code from data using prepared statements, so the database treats parameters strictly as values.

### Mental model
Think of a query as a fill-in-the-blank form. Concatenation handwrites the answer into the sentence, so a value containing punctuation can rewrite the sentence. A prepared statement prints the sentence first and then inserts the answer in a sealed box that cannot change the grammar.

### Method (authorized lab only)
1. Pick a parameter on <LAB_HOST> you own and append a single quote; observe error or behavior change.
2. Test boolean conditions (`' AND '1'='1` vs `' AND '1'='2`) and compare responses.
3. Determine column count with `ORDER BY` probes.
4. Confirm with a harmless UNION selecting a constant string.
5. Remediate the lab code with placeholders and retest — probes should become inert literals.

### Concrete example
Vulnerable code at <LAB_HOST>:
```python
cur.execute("SELECT id, email FROM users WHERE name = '" + name + "'")
```
Payload `x' UNION SELECT 1, 'pwned` changes the result set. The fix:
```python
cur.execute("SELECT id, email FROM users WHERE name = %s", (name,))
```

| Detection signal | Meaning |
|---|---|
| SQL error text | Query structure likely broken |
| Different response for `AND 1=1` vs `1=2` | Boolean injection |
| UNION returns extra column | Query shape controllable |

### Common mistakes
- Escaping quotes only; numeric contexts need no quotes.
- Believing stored procedures are automatically safe.
- Running intrusive payloads outside a lab or authorized scope.

### Defense and verification
Use parameterized queries everywhere, least-privilege database accounts, and generic error messages. Verify by re-running the exact lab payloads after the fix and confirming they return no rows and no errors.

### Knowledge check
Q: Why does a prepared statement stop injection? A: The SQL text is parsed before parameters are bound, so parameters cannot become syntax.

===MODULE===
TITLE: NoSQL Injection and ORM Security
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Understand how document databases and ORMs can still be injected through operators, type juggling, and dynamic queries.
OBJECTIVES: Recognize operator-based NoSQL injection | Audit ORM usage for unsafe APIs | Apply strict input schemas
TAKEAWAYS: NoSQL queries are code too | Operator objects can alter query semantics | Safe ORM APIs still require typed input
PRACTICE: In a lab API at <LAB_HOST>, submit a JSON operator object to a test login field and observe the response.
SOURCES: None
---
## Core idea
NoSQL databases avoid SQL string concatenation, but their query languages are still interpreters. If an application passes raw JSON into a query, an attacker can supply operator objects like `{"$ne": null}` or `{"$gt": ""}` to change matching logic. ORMs reduce risk but offer raw-query escape hatches that reintroduce it.

### Mental model
Picture a query as a filter specification rather than a sentence. Injection means the attacker edits the filter itself, not just the value being filtered. If the app expects a string but receives an object with operators, the database follows the object's instructions.

### Method
1. Find a JSON endpoint on <LAB_HOST> that accepts a filter or login field.
2. Submit the expected string type; note the response.
3. Submit an operator object in your own lab account context; compare.
4. Review application code for raw query constructors or `$where`-style features.
5. Add a schema validator that rejects non-string types and unexpected keys.

### Concrete example
A lab API at <LAB_HOST> receives:
```json
{"user": "alice", "pass": {"$ne": null}}
```
If the server forwards this object into a document query, the password check may match any user. The fix is type enforcement:
```js
if (typeof body.user !== 'string' || typeof body.pass !== 'string') return 400;
```

| Vector | SQL analogue | Defense |
|---|---|---|
| Operator objects (`$ne`, `$gt`) | `OR 1=1` | Reject non-scalar types |
| `$where` JS execution | Stacked queries | Disable server-side JS |
| ORM raw queries | String concatenation | Use builder methods |

### Common mistakes
- Assuming "NoSQL" means "no injection."
- Using permissive JSON parsers that accept objects where strings are expected.
- Enabling server-side JavaScript in production databases.

### Defense and verification
Define strict schemas, allowlist query operators, and disable dangerous database features. Verify by replaying the operator payload on <LAB_HOST> and confirming a 400 response rather than a successful login.

### Knowledge check
Q: Why can `{"$ne": null}` bypass a password check? A: The database interprets it as "not equal to null," matching most values instead of comparing a literal string.

===MODULE===
TITLE: Session Management: Tokens, Lifecycle, and Fixation
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn how sessions map requests to users and how to create, rotate, and destroy them safely.
OBJECTIVES: Explain session identifier properties | Prevent fixation and hijacking | Design correct expiry and logout
TAKEAWAYS: Session IDs must be unpredictable and rotated at login | Transport and storage controls matter as much as entropy | Logout must invalidate state server-side
PRACTICE: In your lab app at <LAB_HOST>, capture a session ID before and after login and verify rotation.
SOURCES: None
---
## Core idea
HTTP is stateless, so applications use a session identifier to associate requests with a user. If that identifier is predictable, stealable, or fixed by an attacker, identity is compromised. Secure session management covers generation, transport, rotation, idle and absolute timeouts, and invalidation.

### Mental model
Treat a session ID as a temporary key card. It should be minted randomly, issued at the door (login), changed when privileges change (rotation), expire after inactivity, and be cancelled immediately when the user leaves (logout). A card that never changes allows an attacker who saw it earlier to reuse it.

### Method
1. Log in to <LAB_HOST> with a lab account through a proxy.
2. Record the `Set-Cookie` session value before and after authentication.
3. Check entropy (length and randomness) and cookie attributes.
4. Trigger logout and replay the old ID to confirm rejection.
5. Test idle expiry with a test session you control.

### Concrete example
 vulnerable flow: `GET /?sid=abc` accepts a session ID from the URL and promotes it at login — classic fixation. Correct flow:
```
POST /login  ->  Set-Cookie: sid=<new-random>; HttpOnly; Secure; SameSite=Lax
```
The pre-login identifier is discarded and replaced, so an attacker-planted value cannot become an authenticated session.

| Property | Weak | Strong |
|---|---|---|
| Generation | Sequential | CSPRNG, 128-bit+ |
| Rotation | Never | On login/privilege change |
| Transport | URL parameter | `HttpOnly` cookie over TLS |
| Expiry | None | Idle + absolute timeouts |

### Common mistakes
- Accepting session IDs from query strings or referrers.
- Keeping the session valid on the server after client-side logout.
- Sharing one session across unrelated subdomains.

### Defense and verification
Rotate on authentication, store hashed session IDs server-side, and invalidate all sessions on password change. Verify by replaying a logged-out lab cookie and confirming it no longer authenticates.

### Knowledge check
Q: What is session fixation? A: An attacker forces a known session ID on a victim before login; rotation at login defeats it.

===MODULE===
TITLE: Authentication versus Authorization
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Separate proving identity from granting permissions, and learn where each class of control belongs.
OBJECTIVES: Define authentication and authorization | Identify common authn/authz flaws | Apply least privilege
TAKEAWAYS: Authentication answers who; authorization answers what | They require independent controls | Every request needs an authorization decision
PRACTICE: With two lab accounts of different roles on <LAB_HOST>, attempt a privileged action from the lower-privileged account.
SOURCES: None
---
## Core idea
Authentication (authn) verifies identity; authorization (authz) decides whether that identity may perform an action. Confusing the two leads to systems that know who a user is but fail to restrict what they can do. Every request must pass both checks, and authz must be enforced on the server.

### Mental model
Think of a concert venue: authentication is the ticket check at the entrance, authorization is the wristband that grants backstage access. Having a valid ticket does not entitle you to the stage, and staff must check the wristband at every restricted door — not just once at entry.

### Method
1. Map endpoints on <LAB_HOST> and label each as public, authenticated, or privileged.
2. For a privileged endpoint, remove credentials entirely and observe the result.
3. Repeat with a low-privilege lab account.
4. Test object-level variations by changing an ID in a request you own.
5. Confirm each failure returns a generic denial without leaking data.

### Concrete example
At <LAB_HOST>, `/admin/export` checks only `if (req.session)`. A low-privilege authenticated user passes. Add a role check:
```js
if (!req.session || req.session.role !== 'admin') return res.status(403).end();
```
Better still, use a centralized policy layer rather than scattered conditionals.

| Check | Question | Failure name |
|---|---|---|
| Authentication | Who are you? | Broken authentication |
| Authorization | May you do this? | Broken access control |
| Object-level | Is this record yours? | IDOR / BOLA |

### Common mistakes
- Relying on hidden UI elements instead of server checks.
- Checking roles only at login, not per request.
- Returning detailed errors that reveal whether a record exists.

### Defense and verification
Centralize authorization, default-deny, and test with multiple lab roles. Verify by scripting a matrix of account/role versus endpoint and confirming every cell returns the expected status.

### Knowledge check
Q: Can strong authentication compensate for missing authorization? A: No. Knowing the user's identity does not restrict their actions.

===MODULE===
TITLE: Password Storage: Hashing, Salting, and Key Derivation
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn why fast hashes are unsafe for passwords and how to store credentials with modern password KDFs.
OBJECTIVES: Explain why salted slow hashing is required | Compare bcrypt, scrypt, and Argon2 | Plan a hash migration
TAKEAWAYS: Passwords must never be stored in plaintext or fast general-purpose hashes | Salts are unique and non-secret | Work factors must be tuned and upgraded
PRACTICE: In a local script at <LAB_HOST>, hash the same password twice with different salts and compare outputs.
SOURCES: None
---
## Core idea
Password storage aims to make offline cracking expensive even after a database leak. General-purpose hashes like SHA-256 are far too fast: commodity hardware can test billions per second. Password KDFs such as Argon2id, scrypt, and bcrypt are deliberately slow and memory-hard, and each password gets a unique salt.

### Mental model
Think of a vault door. A fast hash is a flimsy lock that can be tried endlessly; a KDF is a heavy door whose cost can be dialed up. A salt ensures every vault has a different shape, so one precomputed table cannot open them all.

### Method
1. Inspect the lab app's user table (never a real one) for stored password values.
2. Identify the algorithm, salt, and work factor.
3. Benchmark a single verification to choose a work factor near 100-250 ms on your hardware.
4. Rehash existing records on successful login to migrate old algorithms.

### Concrete example
Verification with Argon2id in a lab service at <LAB_HOST>:
```python
from argon2 import PasswordHasher
ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=2)
stored = ph.hash(password)      # includes algorithm params + salt
ph.verify(stored, supplied)     # raises on mismatch
```

| Algorithm | Strength property | Note |
|---|---|---|
| SHA-256 | Fast, unsalted unsafe | Never use alone |
| bcrypt | CPU-hard, mature | 72-byte input limit |
| scrypt | Memory-hard | Tune memory cost |
| Argon2id | Memory + CPU hard | Preferred modern choice |

### Common mistakes
- Using a single global salt or a salt derived from the username.
- Truncating passwords or limiting length unnecessarily.
- Logging plaintext credentials during "temporary" debugging.

### Defense and verification
Store `algorithm+salt+hash` together, enforce long passphrases, and support transparent rehashing. Verify by checking that two lab users with the same password have different stored hashes and that verification stays under your latency budget.

### Knowledge check
Q: Why must salts be unique per user? A: Unique salts prevent precomputed rainbow tables and force attackers to crack each password separately.

===MODULE===
TITLE: JSON Web Tokens (JWT): Structure, Signing, and Verification
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Decode JWTs, understand signing and verification, and avoid the classic algorithm and claims pitfalls.
OBJECTIVES: Describe the three JWT parts | Verify signatures and claims correctly | Recognize common JWT attacks
TAKEAWAYS: A JWT is signed, not encrypted | Verification must check algorithm, signature, and claims | Client-side presence is not proof of validity
PRACTICE: On <LAB_HOST>, decode a lab-issued JWT and tamper with its payload in a controlled test.
SOURCES: None
---
## Core idea
A JWT is a compact, URL-safe token made of three base64url segments: header, payload, and signature. The signature lets a server detect tampering. Crucially, JWT contents are readable by anyone holding the token, so secrets must never be placed in the payload.

### Mental model
Think of a signed concert ticket. The printed sections (header and payload) are visible to everyone; the signature is a stamp the venue verifies. Changing the seat number invalidates the stamp. A torn or unfamiliar stamp should be rejected outright.

### Method
1. Capture a JWT from <LAB_HOST> and decode the first two segments locally.
2. Read `alg`, `iss`, `aud`, `sub`, `exp`, and `nbf`.
3. Verify the signature with the expected algorithm and key.
4. Validate claims: expiry, issuer, audience, and any nonce.
5. Test that modifying a payload byte causes rejection in the lab.

### Concrete example
```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwicm9sZSI6InVzZXIifQ.SIGNATURE
```
If a server accepts `alg: none` or trusts `alg` from the token header, an attacker can forge arbitrary payloads. Pin the expected algorithm in verification code:
```js
jwt.verify(token, publicKey, { algorithms: ['RS256'], audience: 'lab', issuer: '<LAB_HOST>' });
```

| Pitfall | Risk | Fix |
|---|---|---|
| `alg: none` | Signature bypass | Pin algorithms |
| HS/RS confusion | Wrong key type | Explicit key per algorithm |
| Missing `exp` check | Eternal tokens | Validate time claims |
| Sensitive payload data | Information disclosure | Put only identifiers |

### Common mistakes
- Decoding a JWT and treating the payload as trusted.
- Ignoring `exp`, `aud`, or `iss` validation.
- Storing long-lived tokens in web storage without rotation.

### Defense and verification
Use a vetted library with strict options, short expiry, and token rotation/revocation. Verify by forging a lab token with `alg: none` and confirming <LAB_HOST> rejects it.

### Knowledge check
Q: Is a JWT encrypted? A: No. It is only encoded and signed; anyone with the token can read its payload.

===MODULE===
TITLE: OAuth 2.0 and OpenID Connect
LEVEL: Advanced
MINUTES: 50
SUMMARY: Learn the authorization code flow, the roles involved, and the checks that prevent token theft and cross-origin confusion.
OBJECTIVES: Distinguish OAuth from OIDC | Walk through the authorization code + PKCE flow | Validate state, nonce, and redirect URIs
TAKEAWAYS: OAuth handles authorization; OIDC adds identity | PKCE and state protect the code flow | Redirect URI allowlists are critical
PRACTICE: In a lab IdP at <LAB_HOST>, complete an authorization code flow with PKCE and inspect each redirect.
SOURCES: None
---
## Core idea
OAuth 2.0 lets an application obtain limited access to a resource without handling a user's password. OpenID Connect adds an identity layer with an ID token. Both rely on redirects, which makes redirect URI validation and CSRF defenses (`state`, PKCE, `nonce`) central to their security.

### Mental model
Imagine a valet key: the resource owner authorizes a limited key rather than handing over the master key. Authorization codes are like claim tickets exchanged for the valet key at a service desk. If an attacker steals the claim ticket or tricks the desk, they get the key.

### Method (lab only)
1. Register a lab client at <LAB_HOST> with an exact redirect URI.
2. Start the flow; record `state`, `code_challenge`, and the authorization response.
3. Exchange the code at the token endpoint with the `code_verifier`.
4. Modify `state` in a second lab run and confirm rejection.
5. Attempt a redirect URI outside the allowlist and confirm failure.

### Concrete example
A token request at <LAB_HOST>:
```
POST /oauth/token
grant_type=authorization_code&code=ABC&redirect_uri=https://app.<LAB_HOST>/cb
&code_verifier=dBjft...&client_id=lab-client
```
The code must be single-use, bound to the verifier and redirect URI. Public clients must use PKCE; confidential clients must authenticate at the token endpoint.

| Component | Purpose | Attack if missing |
|---|---|---|
| `state` | CSRF protection on redirect | Code injection |
| PKCE verifier | Binds code to client | Code interception |
| `nonce` | Binds ID token to session | Replay |
| Exact redirect URI | Prevents redirect abuse | Token leakage |

### Common mistakes
- Using the implicit flow instead of code + PKCE.
- Matching redirect URIs by prefix or wildcard.
- Accepting tokens without checking `iss`, `aud`, and signature.

### Defense and verification
Use code + PKCE, exact redirect matching, short-lived codes, and full token validation. Verify by replaying a used lab code and confirming the token endpoint rejects it.

### Knowledge check
Q: What does PKCE prevent? A: Interception of an authorization code by a malicious app on the same device.

===MODULE===
TITLE: CSRF: Mechanism and Defenses
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn how cross-site requests abuse ambient credentials and how tokens, SameSite, and origin checks stop them.
OBJECTIVES: Explain the CSRF precondition set | Implement synchronizer tokens | Verify SameSite and origin defenses
TAKEAWAYS: CSRF rides on credentials the browser attaches automatically | State-changing GETs are especially exposed | Layered defenses are more robust than one control
PRACTICE: In a lab app at <LAB_HOST>, build a harmless cross-site form that posts to a test endpoint with and without a CSRF token.
SOURCES: None
---
## Core idea
Cross-Site Request Forgery occurs when a malicious page causes a victim's browser to send a state-changing request to a site where the victim is authenticated. The browser automatically attaches cookies, so the server sees a legitimate session. The attack requires a state-changing action, cookie-based auth, and no unpredictable per-request value.

### Mental model
Picture a checkbook left on a desk. A visitor (malicious page) cannot read it, but can hand the bank a withdrawal slip while you are present; the bank recognizes your handwriting (the cookie) and cashes it. A CSRF token is a secret code you write on each slip that the visitor cannot see.

### Method (lab only)
1. Log in to <LAB_HOST> with a lab account.
2. Identify a state-changing POST endpoint and capture a valid request.
3. Host a test form on another lab origin that submits the same fields.
4. Observe that it succeeds without a token, then add a synchronizer token and repeat.
5. Set `SameSite=Strict` on the lab cookie and retry the cross-site form.

### Concrete example
A forged form at <LAB_HOST>:
```html
<form action="https://<LAB_HOST>/account/email" method="POST">
  <input type="hidden" name="email" value="attacker@lab.test">
</form>
<script>document.forms[0].submit()</script>
```
Defense: embed a per-session random token in the form and require it on the server:
```js
if (!req.body.csrf || req.body.csrf !== req.session.csrf) return res.status(403).end();
```

| Defense | Strength | Caveat |
|---|---|---|
| CSRF tokens | Strong | Must cover every state-changing route |
| `SameSite=Lax/Strict` | Strong browser default | Legacy clients vary |
| Origin/Referer checks | Useful layer | Can be stripped by proxies |
| Custom headers + CORS | Effective for XHR/Fetch | Not for plain forms |

### Common mistakes
- Using GET for actions that change state.
- Making tokens readable cross-origin via CORS misconfiguration.
- Treating a CAPTCHA on login as CSRF protection elsewhere.

### Defense and verification
Combine tokens with `SameSite` cookies and origin checks. Verify by replaying the lab form without its token and confirming a 403, and with an invalid token likewise.

### Knowledge check
Q: Why does a CSRF token work? A: It is unpredictable and tied to the session, and the cross-site attacker cannot read it due to SOP.

===MODULE===
TITLE: Authorization Models: RBAC, ABAC, and Least Privilege
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Compare permission models and learn to express authorization as centralized, testable policy rather than scattered checks.
OBJECTIVES: Contrast RBAC and ABAC | Apply least privilege | Design a policy decision point
TAKEAWAYS: RBAC maps roles to permissions; ABAC evaluates attributes | Centralized policy beats scattered conditionals | Default-deny prevents omissions
PRACTICE: On <LAB_HOST>, expand an existing role check into a small policy function and test three lab roles.
SOURCES: None
---
## Core idea
Authorization models formalize who may do what. Role-Based Access Control assigns permissions to roles and users to roles. Attribute-Based Access Control evaluates attributes of the subject, object, and environment. Both should be implemented through a centralized decision point that defaults to deny.

### Mental model
Think of a building's access system. RBAC is a set of key rings: "staff" opens the office, "admin" opens the server room. ABAC is a smart badge that also checks time of day and department. A central guard (policy engine) decides at each door instead of every employee improvising.

### Method
1. Inventory protected actions on <LAB_HOST> and the attributes involved.
2. Choose the simplest model that expresses the rules.
3. Implement a single `can(user, action, resource)` function.
4. Call it at every entry point, including background jobs and APIs.
5. Write a role/action matrix test that must all pass.

### Concrete example
A centralized check at <LAB_HOST>:
```js
function can(user, action, doc) {
  if (!user) return false;
  if (action === 'read' && doc.owner === user.id) return true;
  if (user.roles.includes('admin')) return true;
  return false; // default deny
}
```
Scattered `if (user.role === 'admin')` checks drift over time; a single function is auditable and testable.

| Model | Granularity | Best for |
|---|---|---|
| RBAC | Coarse, role-based | Clear organizational roles |
| ABAC | Fine, attribute-based | Complex, contextual rules |
| ReBAC | Relationship-based | Shared documents, teams |
| DAC/MAC | Owner or mandatory labels | Specialized systems |

### Common mistakes
- Granting admin by convention without an explicit permission record.
- Forgetting non-HTTP paths such as scheduled tasks or message consumers.
- Allowing by default and adding denials afterwards.

### Defense and verification
Adopt default-deny, centralize decisions, and log denials for monitoring. Verify by running the role/action matrix on <LAB_HOST> and confirming no lower-privilege role reaches admin actions.

### Knowledge check
Q: Why is default-deny safer than default-allow? A: New or forgotten endpoints are protected automatically instead of accidentally exposed.

===MODULE===
TITLE: Multi-Factor Authentication and Account Security
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Understand MFA factors, enrollment and recovery flows, and the attacks that target them.
OBJECTIVES: Classify authentication factors | Harden enrollment and recovery | Recognize MFA fatigue and bypass
TAKEAWAYS: Factors must be independent | Recovery is often the weakest link | Phishing-resistant factors resist real-time relay
PRACTICE: In a lab IdP at <LAB_HOST>, enable TOTP for a test account and attempt a replay of a used code.
SOURCES: None
---
## Core idea
Multi-factor authentication requires evidence from more than one category: something you know (password), have (TOTP, hardware key), or are (biometric). Its value depends on factor independence and on the security of enrollment, recovery, and session issuance — flows attackers frequently target instead of the factors themselves.

### Mental model
Think of a safe with two locks requiring different keys. If both keys hang on the same hook, a single theft opens the safe. Likewise, a password reset sent to the same email that hosts your authenticator seeds collapses MFA back to one factor.

### Method
1. Map the lab account lifecycle on <LAB_HOST>: register, enroll, login, recover, disable.
2. Identify which factor each step requires and where a session is created.
3. Test replay of a used TOTP code within the same 30-second window.
4. Attempt an unverified recovery request in the lab and confirm it is blocked.
5. Check that step-up authentication gates sensitive changes.

### Concrete example
A login flow at <LAB_HOST> that sets `loggedIn=true` immediately after password submission, before the second factor, is bypassable by skipping the OTP step. The session must only be promoted after successful verification of both factors, and the pre-MFA state must be bound to a short-lived, signed challenge.

| Factor | Phishing resistance | Notes |
|---|---|---|
| SMS/email OTP | Low | SIM swap, mailbox takeover |
| TOTP app | Medium | Real-time relay possible |
| Push approval | Medium | MFA fatigue attacks |
| WebAuthn / FIDO2 | High | Origin-bound, phishing-resistant |

### Common mistakes
- Allowing weak "security questions" as the only recovery path.
- Treating OTP codes as reusable within their window.
- Leaving old MFA sessions valid after factor changes.

### Defense and verification
Prefer WebAuthn, allow TOTP with replay prevention, require verified recovery, and bind sessions to the authentication level. Verify by replaying a used lab OTP and confirming rejection, and by attempting a reset without identity proof.

### Knowledge check
Q: Why are SMS codes weaker than WebAuthn? A: They are not bound to the site's origin and can be intercepted or relayed.

===MODULE===
TITLE: Token Storage and Client-Side Session Handling
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Choose where to keep access and refresh tokens in a browser app, balancing XSS exposure against CSRF risk.
OBJECTIVES: Compare cookie and in-memory token storage | Configure rotation and refresh | Mitigate XSS-driven token theft
TAKEAWAYS: `HttpOnly` cookies hide tokens from scripts but reintroduce CSRF concerns | In-memory tokens limit persistent theft but require refresh handling | Neither replaces XSS prevention
PRACTICE: In a lab SPA at <LAB_HOST>, store a token in memory and observe behavior across a page reload.
SOURCES: None
---
## Core idea
After authentication, a client must hold some credential for subsequent requests. Storing tokens in `localStorage` makes them easy for JavaScript to read — including injected malicious JavaScript. `HttpOnly` cookies shield them from scripts but are attached automatically, requiring CSRF defenses. In-memory storage reduces the window of theft at the cost of losing tokens on reload.

### Mental model
Imagine carrying a badge. A pocket badge (localStorage) is easy for anyone in the room to grab. A locked jacket badge (HttpOnly cookie) is harder to steal but the building opens doors automatically when you walk by. A badge you hold only during a meeting (memory) vanishes when you leave.

### Method
1. Inspect how <LAB_HOST>'s lab SPA stores its access token.
2. Reload the page and note whether the session survives and why.
3. Check whether refresh tokens are long-lived and rotatable.
4. Run a benign DOM-injection test to see whether the token is reachable via script.
5. Apply the chosen pattern and re-run the test.

### Concrete example
A refresh rotation design at <LAB_HOST>:
```
POST /oauth/token { grant_type: refresh_token, token: R1 }
-> { access_token: A2, refresh_token: R2 }   // R1 invalidated
```
If R1 is replayed later, the server detects reuse and revokes the token family, limiting theft.

| Store | XSS theft | CSRF risk | Persistence |
|---|---|---|---|
| localStorage | High | Low | Until cleared |
| HttpOnly cookie | Low | Needs tokens | Configurable |
| In memory | Low during rest | N/A | Lost on reload |
| Service worker | Moderate | N/A | Persistent |

### Common mistakes
- Keeping refresh tokens in JavaScript-readable storage indefinitely.
- Ignoring token reuse detection during rotation.
- Assuming CSP makes token theft impossible.

### Defense and verification
Use `HttpOnly; Secure; SameSite` cookies with CSRF tokens, or short-lived in-memory access tokens with rotating refresh tokens. Verify by injecting a harmless script in the lab and confirming no credential is exfiltratable.

### Knowledge check
Q: Which storage prevents JavaScript from reading a token? A: An `HttpOnly` cookie (or keeping it only in a non-exposed closure is not a security boundary, so prefer the cookie).

===MODULE===
TITLE: OWASP A01 — Broken Access Control
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Study the top OWASP category: failing to enforce who may access objects and functions, and how to test it safely.
OBJECTIVES: Identify horizontal and vertical escalation | Test object-level access in a lab | Implement centralized enforcement
TAKEAWAYS: Deny by default and verify every object reference | UI hiding is not authorization | Log and alert on denial patterns
PRACTICE: With two owned lab accounts on <LAB_HOST>, swap object IDs in requests and confirm cross-account denial.
SOURCES: None
---
## Core idea
Broken access control covers failures that let users act outside their permissions: viewing another user's records, changing roles, accessing admin functions, or bypassing checks by forcing browsing to a previously authorized URL. It is consistently the most common serious web flaw because authorization is frequently duplicated and inconsistently applied.

### Mental model
Think of a hotel where room keys open only your room. Broken access control is a lock that opens any door if you know the number, or a staff-only door that is guarded only on the first floor. The key (identity) is valid; the door simply forgot to check it.

### Method (lab only)
1. Enumerate every endpoint on <LAB_HOST>, including hidden or undocumented ones.
2. For each object ID, request a record belonging to your second lab account.
3. Test vertical actions by calling admin routes with a normal account.
4. Change request methods (GET→POST) and parameter names to find alternate paths.
5. Record exact status codes and bodies for each attempt.

### Concrete example
At <LAB_HOST>, `GET /api/invoices/1842` returns another tenant's invoice because the query filters only by ID. The fix adds ownership to the query:
```sql
SELECT * FROM invoices WHERE id = ? AND tenant_id = ?;
```
The tenant ID comes from the authenticated session, never from the request.

| Escalation | Meaning | Example |
|---|---|---|
| Horizontal | Same role, other user's data | Swap invoice ID |
| Vertical | Higher privilege function | Normal user calls admin route |
| Context/flow | Skip or repeat steps | Force-browse final step |

### Common mistakes
- Relying on unguessable IDs as the only control.
- Checking access in the client before calling the API.
- Leaving debug or legacy endpoints unguarded.

### Defense and verification
Centralize policy, deny by default, scope every query to the authenticated principal, and log denials. Verify by running the object-ID swap matrix on <LAB_HOST> and confirming every unauthorized request returns 403 or 404.

### Knowledge check
Q: Why return 404 rather than 403 for someone else's object? A: It avoids confirming that the object exists while still denying access.

===MODULE===
TITLE: OWASP A02 — Cryptographic Failures
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn how weak or misapplied cryptography exposes sensitive data in transit and at rest.
OBJECTIVES: Identify sensitive data flows | Detect weak ciphers and key handling | Apply transport and storage protections
TAKEAWAYS: Use modern vetted algorithms with correct modes | Key management is as important as the cipher | Sensitive data should not be stored unnecessarily
PRACTICE: Audit a lab app at <LAB_HOST> for plaintext secrets in logs, URLs, and storage; then remediate one finding.
SOURCES: None
---
## Core idea
Cryptographic failures include transmitting data in cleartext, using obsolete algorithms or modes, reusing IVs, poor key management, and storing secrets where they do not need to be stored. The impact is exposure of passwords, tokens, and personal data — often after a seemingly minor compromise.

### Mental model
Think of transporting valuables. A strong armored truck (TLS 1.3) is useless if you leave the back door open (mixed content), hand the keys to a stranger (hardcoded secret), or write the combination on the manifest (token in a URL). Protection must cover the whole journey.

### Method
1. Map sensitive data on <LAB_HOST>: credentials, tokens, PII, payment fields.
2. Check that every flow uses TLS with valid certificates and HSTS.
3. Scan code and configs for hardcoded keys, ECB mode, MD5/SHA-1, and weak randomness.
4. Inspect logs and browser history for secrets in URLs or query strings.
5. Replace one weak primitive with an approved alternative and retest.

### Concrete example
A lab service at <LAB_HOST> encrypts tokens with AES-ECB, causing identical plaintexts to produce identical ciphertexts and leaking structure. Migrate to authenticated encryption:
```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
nonce = os.urandom(12)
ct = AESGCM(key).encrypt(nonce, plaintext, None)  # integrity + confidentiality
```

| Failure | Risk | Fix |
|---|---|---|
| Cleartext HTTP | Interception | TLS + HSTS |
| ECB / reused IV | Pattern leakage | AEAD with random nonce |
| Hardcoded key | Source leak = total compromise | Secret manager |
| Secrets in URLs | Logs/history leakage | Use POST body or headers |

### Common mistakes
- Rolling custom encryption instead of using a library.
- Using random numbers from a non-cryptographic PRNG for tokens.
- Logging full authorization headers during debugging.

### Defense and verification
Minimize stored sensitive data, use AEAD and modern KDFs, rotate keys, and scrub logs. Verify with a TLS scan and a secret-scanning grep over <LAB_HOST>'s lab repo.

### Knowledge check
Q: Why is ECB mode unsafe? A: Identical plaintext blocks produce identical ciphertext blocks, revealing patterns.

===MODULE===
TITLE: OWASP A03 — Injection Beyond SQL
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Explore command, LDAP, XPath, and header injection and the general rule of never letting data become code.
OBJECTIVES: Recognize interpreter boundaries beyond SQL | Demonstrate lab-safe command injection | Apply safe APIs and encoding
TAKEAWAYS: Any interpreter is a potential injection sink | Avoid shells and dynamic expressions | Context-appropriate encoding is the recurring fix
PRACTICE: On a lab diagnostic endpoint at <LAB_HOST>, test a benign command separator payload and then replace the shell call with a direct API.
SOURCES: None
---
## Core idea
Injection is a family of flaws where untrusted data is interpreted as part of a command or query. Beyond SQL, common variants include OS command injection, LDAP injection, XPath injection, and CRLF/header injection. The root cause is always the same: data and code share a channel.

### Mental model
Imagine giving a verbal instruction to an assistant over the phone. If you let the caller append words to your sentence, they can change "list the folder" into "list the folder; delete it." Safe APIs are like handing the assistant a structured form instead of an open-ended sentence.

### Method (lab only)
1. Find a lab feature on <LAB_HOST> that invokes an external tool or builds a query.
2. Submit a benign marker such as `; echo LAB` or a wildcard in the test field.
3. Compare output with a plain input to confirm interpretation.
4. Replace the shell invocation with a library call that accepts an argument array.
5. Re-run the marker; it should appear as a literal filename or be rejected.

### Concrete example
Vulnerable Node code at <LAB_HOST>:
```js
exec('ping -c 1 ' + req.query.host);   // shell interprets ';'
```
Fixed by avoiding the shell entirely:
```js
spawn('ping', ['-c', '1', host]);      // arguments passed literally
```

| Injection | Sink | Safe alternative |
|---|---|---|
| OS command | `system`, `exec` | Argument-array APIs |
| LDAP | Filter string | Escaped filter builders |
| XPath | Query string | Parameterized XPath |
| Header/CRLF | Header concatenation | Validate and strip CR/LF |

### Common mistakes
- Escaping only spaces or quotes instead of removing shell metacharacters.
- Using denylists that miss alternate separators and encodings.
- Running testing payloads against systems outside your lab/authorization.

### Defense and verification
Prefer safe APIs, allowlist inputs, and run services with minimal OS privileges. Verify by replaying the exact lab markers after remediation and confirming literal treatment and no side effects.

### Knowledge check
Q: Why does `spawn` with an argument array help? A: It passes arguments directly to the process without a shell parsing metacharacters.

===MODULE===
TITLE: OWASP A04 — Insecure Design
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Understand flaws that arise from missing or weak design controls, and how threat modeling prevents them.
OBJECTIVES: Distinguish design flaws from implementation bugs | Perform lightweight threat modeling | Build abuse cases
TAKEAWAYS: Secure coding cannot fix an insecure design | Threat modeling finds missing controls early | Business logic needs explicit abuse cases
PRACTICE: For a lab feature at <LAB_HOST>, write three abuse cases and propose a design control for each.
SOURCES: None
---
## Core idea
Insecure design refers to weaknesses where no effective control was conceived: missing rate limits, lack of ownership models, workflows that can be skipped, or business rules that trust clients. Unlike implementation bugs, these require a design change. Threat modeling and abuse cases are the primary defenses.

### Mental model
Think of building a bank. A bug is a faulty lock; an insecure design is a bank with no vault in the plan. You cannot patch your way out — you must redraw the blueprint and ask, "How would someone abuse this room?"

### Method
1. Pick a lab feature on <LAB_HOST>, such as password reset or checkout.
2. List the assets it protects and the trust boundaries it crosses.
3. Ask what an attacker could do at each step using STRIDE (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation).
4. Record misuse cases such as replay, reordering, and skipping steps.
5. Define a control for each and add it to the design before coding.

### Concrete example
A lab checkout at <LAB_HOST> trusts a client-supplied `price` field. No amount of input validation makes that design safe. Redesign so price is derived server-side from a product ID and the cart's state, with a signed order token tying the two together.

| Design flaw | Abuse case | Control |
|---|---|---|
| Client-supplied price | Write `price=0.01` | Server-side pricing |
| Stateless step sequence | Skip payment step | Signed workflow state |
| Unlimited attempts | Brute-force OTP | Rate limits + lockout |

### Common mistakes
- Treating threat modeling as a one-time paperwork exercise.
- Assuming honest users and omitting abuse paths.
- Adding rate limits only at the UI layer.

### Defense and verification
Adopt reusable secure design patterns, maintain abuse-case libraries, and review designs before implementation. Verify by walking each abuse case against <LAB_HOST> and confirming a control blocks it.

### Knowledge check
Q: Why can't input validation fix a client-supplied price? A: The client can send any value; the design must not trust client pricing at all.

===MODULE===
TITLE: OWASP A05 — Security Misconfiguration
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn how default settings, verbose errors, and exposed services create easy entry points.
OBJECTIVES: Harden framework and server defaults | Remove debug surfaces | Build repeatable configuration baselines
TAKEAWAYS: Defaults are rarely secure | Verbose errors and directory listings leak reconnaissance data | Configuration must be automated and verified
PRACTICE: Scan a lab server at <LAB_HOST> for exposed debug endpoints and default banners, then harden one finding.
SOURCES: None
---
## Core idea
Security misconfiguration covers insecure defaults, incomplete configurations, exposed administrative interfaces, verbose error messages, and unnecessary services or features. It is widespread because modern stacks have many knobs, and because configuration drift accumulates across deployments.

### Mental model
Picture a new house where the builder leaves the factory default lock codes, leaves a side door unlocked, and puts a spare key under the mat labeled "spare key." Nothing was hacked in a sophisticated way — the settings were simply never changed.

### Method
1. Enumerate services and paths exposed by <LAB_HOST> using only your authorized lab scope.
2. Check for default credentials, debug consoles, and directory listings.
3. Trigger errors and inspect whether stack traces or versions leak.
4. Review headers, CORS, and cloud storage permissions.
5. Apply a hardening baseline and re-run the same checks.

### Concrete example
A lab framework at <LAB_HOST> runs with `DEBUG=true`, returning full stack traces and an interactive console on errors. An attacker learns library versions and may execute code. Disable debug in production and return generic errors:
```
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{"error":"An internal error occurred"}
```

| Finding | Risk | Fix |
|---|---|---|
| Default admin password | Immediate takeover | Rotate on first boot |
| Stack traces | Version reconnaissance | Generic errors + logs |
| Open S3 bucket | Data exposure | Block public access |
| Extra services | Larger attack surface | Remove or firewall |

### Common mistakes
- Hardening one environment but not staging or backups.
- Leaving cloud storage and CI artifacts public.
- Assuming a framework's default config is production-ready.

### Defense and verification
Use immutable, version-controlled configuration and automated hardening checks. Verify with a configuration scanner against <LAB_HOST> and confirm no debug path or banner remains.

### Knowledge check
Q: Why disable verbose errors in production? A: They leak implementation details that speed up attacker reconnaissance.

===MODULE===
TITLE: OWASP A06 — Vulnerable and Outdated Components
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn to inventory dependencies, track advisories, and manage patching without breaking applications.
OBJECTIVES: Build a software bill of materials | Interpret CVEs and severity scores | Establish a patch workflow
TAKEAWAYS: You cannot patch what you have not inventoried | Exploitability depends on reachability, not just CVSS | Automated scanning belongs in CI
PRACTICE: Generate an SBOM for the lab project at <LAB_HOST> and identify one outdated dependency with a known advisory.
SOURCES: None
---
## Core idea
Applications are assembled from frameworks, libraries, and transitive dependencies. When a component has a known vulnerability, every application using it inherits the risk. Managing this requires an accurate inventory, continuous advisory monitoring, and a tested upgrade process.

### Mental model
Think of a car assembled from parts from many suppliers. A recall on one brake model affects every car using it. You need a parts list (SBOM) to know which cars are affected and a service process to replace the part safely.

### Method
1. Generate an SBOM from the lab project at <LAB_HOST> using its package manager.
2. Feed it into a vulnerability scanner and list findings with versions.
3. For each, check whether the vulnerable code path is actually reachable.
4. Upgrade the dependency in a branch and run the full test suite.
5. Add the scanner to CI with a policy that fails on critical findings.

### Concrete example
A project at <LAB_HOST> pins `example-lib@1.2.3`, which has a published RCE advisory fixed in 1.4.0. The remediation is a verified upgrade:
```bash
npm install example-lib@1.4.0
npm audit --omit=dev
```
If an upgrade is impossible, apply a compensating control such as removing the affected route or adding a WAF rule.

| Concept | Meaning |
|---|---|
| SBOM | Inventory of components and versions |
| CVE | Identified vulnerability record |
| CVSS | Severity score; not a Business risk score |
| Reachability | Whether the vulnerable code is callable |

### Common mistakes
- Scanning only direct dependencies and ignoring transitive ones.
- Ignoring "medium" findings that are trivially reachable.
- Never scheduling time for routine upgrades.

### Defense and verification
Automate scanning, prioritize by reachability and exposure, and maintain a fast patch pipeline. Verify by re-running the SBOM scan on <LAB_HOST> and confirming no critical finding remains open.

### Knowledge check
Q: Why is a high CVSS score not the whole story? A: It does not account for whether the vulnerable feature is used or reachable in your app.

===MODULE===
TITLE: OWASP A07 — Identification and Authentication Failures
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Study credential attacks, session weaknesses, and the controls that keep authentication reliable.
OBJECTIVES: Detect credential stuffing and brute force | Harden session and recovery flows | Implement rate limiting and monitoring
TAKEAWAYS: Authentication failures include weak passwords, predictable sessions, and missing rate limits | Recovery flows are prime targets | Defense requires both prevention and detection
PRACTICE: In your lab app at <LAB_HOST>, add per-account rate limiting to login and verify lockout with a test account.
SOURCES: None
---
## Core idea
This category covers flaws that let attackers compromise identities: permissive password rules, credential stuffing, missing rate limits, weak session IDs, and insecure password recovery. Because credentials are reused across sites, a breach elsewhere can cascade into your application unless controls and monitoring are in place.

### Mental model
Think of a front door with a doorbell. Without a limit on how many keys can be tried, an attacker with a huge keyring eventually finds a match. Rate limiting is a lockout mechanism; monitoring is a camera that alerts when someone tries hundreds of keys.

### Method (lab only)
1. Map login, registration, and recovery endpoints on <LAB_HOST>.
2. Test password policy requirements against a list of common weak passwords.
3. Submit repeated failed logins for a test account and observe whether throttling occurs.
4. Check whether session IDs change after login and password reset.
5. Verify that all authentication failures are logged with source metadata.

### Concrete example
A lab login at <LAB_HOST> accepts unlimited attempts. Add progressive delay and counter:
```js
const key = `login:${ip}:${username}`;
if (await rl.consume(key, { limit: 5, window: 300 })) return res.status(429).end();
```
Pair this with breached-password screening and MFA so that a correct guess alone is insufficient.

| Control | Prevents | Detection signal |
|---|---|---|
| Rate limiting | Brute force/stuffing | Spike in 429s per IP |
| Strong password policy | Weak credentials | Password reuse hits |
| MFA | Stolen passwords | Failed second factors |
| Session rotation | Fixation/hijacking | Reuse of old IDs |

### Common mistakes
- Rate-limiting only by IP, missing distributed attacks.
- Allowing unlimited password-reset attempts.
- Logging passwords or full tokens during failed logins.

### Defense and verification
Layer rate limits, MFA, password screening, and alerting. Verify by running a controlled burst of failed logins against your lab account and confirming throttling plus an alert entry.

### Knowledge check
Q: Why is per-account plus per-IP limiting stronger than either alone? A: It covers both distributed attacks against one account and single-source attacks across many accounts.

===MODULE===
TITLE: OWASP A08 — Software and Data Integrity Failures
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn how trusting unsigned updates, serialized data, and CI/CD artifacts can compromise an application.
OBJECTIVES: Verify digital signatures and integrity checks | Harden CI/CD pipelines | Detect tampered artifacts
TAKEAWAYS: Code and data must be verified before execution | Build pipelines are high-value targets | Integrity failures often lead to supply-chain compromise
PRACTICE: In a lab pipeline at <LAB_HOST>, add a checksum verification step to a deployment artifact and test a tampered file.
SOURCES: None
---
## Core idea
Integrity failures occur when software or data is trusted without verification. Examples include unsigned auto-updates, deserialization of untrusted objects, insecure CI/CD pipelines, and plugins loaded from untrusted repositories. If an attacker can modify an artifact, every downstream system inherits the compromise.

### Mental model
Picture receiving a sealed package. A signature or checksum is the tamper-evident seal: it proves the contents match what the sender produced. Trusting an unsealed package because it arrived from a familiar courier is how supply-chain attacks succeed.

### Method
1. Identify all artifacts consumed by <LAB_HOST>: packages, configs, webhooks, serialized sessions.
2. Check whether each is verified by signature or cryptographic hash before use.
3. Review CI/CD permissions, secrets, and third-party actions for excessive trust.
4. Add verification for one artifact and test a deliberately corrupted copy in the lab.
5. Confirm the pipeline rejects the tampered artifact and alerts.

### Concrete example
A lab deploy script at <LAB_HOST> downloads an update and runs it without checking. Add verification:
```bash
curl -sS https://<LAB_HOST>/updates/app.bin -o app.bin
echo "EXPECTED_SHA256  app.bin" | sha256sum -c - || exit 1
```
Better still, verify a cryptographic signature against a pinned public key.

| Trust point | Risk | Verification |
|---|---|---|
| Auto-update | Malicious binary | Signature + pinned key |
| CI artifact | Build tampering | Provenance attestation |
| Webhook | Forged events | HMAC secret |
| Serialized object | Object injection | Avoid or sign |

### Common mistakes
- Trusting HTTPS alone as证明 of artifact integrity.
- Storing signing keys in the same repository they sign.
- Allowing pull-request workflows to access production secrets.

### Defense and verification
Sign and verify artifacts, restrict pipeline permissions, and pin dependencies by hash. Verify by introducing a tampered lab artifact and confirming deployment is blocked and logged.

### Knowledge check
Q: Why does HTTPS not replace a signature? A: HTTPS protects transport, but a compromised source or mirror can still serve malicious content; a signature proves authorship.

===MODULE===
TITLE: OWASP A09 — Security Logging and Monitoring Failures
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn what to log, how to protect logs, and how to turn events into detection and response.
OBJECTIVES: Define useful security events | Protect log integrity and privacy | Build simple detection rules
TAKEAWAYS: Logs without context or alerting do not provide detection | Never log secrets | Correlation across services reveals slow attacks
PRACTICE: On <LAB_HOST>, generate failed-login and access-denied events and write a rule that alerts on a burst.
SOURCES: None
---
## Core idea
Without logging and monitoring, breaches can persist undetected. This category covers missing security-relevant events, logs that omit context, logs stored only locally, and no alerting or incident response. The goal is to make attacker behavior visible and actionable.

### Mental model
Think of a ship's bridge. Cameras and radar are useless if nobody watches them or if the footage is erased nightly. Logging records the events; monitoring interprets them; response is the crew's action. All three are required.

### Method
1. List security events on <LAB_HOST>: logins, failures, denials, privilege changes, password resets.
2. Confirm each log line has who, what, when, where, and outcome.
3. Check that logs exclude credentials and tokens, and are shipped off-host.
4. Create a detection rule, for example more than 10 denials per account in 5 minutes.
5. Trigger the pattern in the lab and confirm an alert fires.

### Concrete example
A useful denial log from <LAB_HOST>:
```json
{"ts":"2026-01-01T12:00:00Z","actor":"u-42","action":"read_invoice",
 "object":"inv-1842","result":"denied","ip":"203.0.113.10","ua":"lab-client"}
```
Unlike a bare `403`, this record supports correlation and investigation.

| Event | Why log it | Alert idea |
|---|---|---|
| Auth failure | Credential attacks | Burst per account/IP |
| Access denied | Enumeration attempts | Many objects probed |
| Role change | Privilege escalation | Any unexpected change |
| Config change | Tampering | Out-of-hours edits |

### Common mistakes
- Logging passwords, tokens, or full request bodies containing PII.
- Keeping logs only on the compromised host.
- Alerting on so much noise that real signals are ignored.

### Defense and verification
Centralize tamper-evident logs, define a small set of high-value alerts, and rehearse response. Verify by replaying a lab attack pattern and confirming the alert includes enough detail to investigate.

### Knowledge check
Q: What five questions should a security log answer? A: Who acted, what they did, when, where, and what the outcome was.

===MODULE===
TITLE: OWASP A10 — Server-Side Request Forgery (SSRF)
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn how attacker-controlled URLs make a server issue unintended requests and how to constrain egress.
OBJECTIVES: Identify URL-fetching features | Demonstrate lab-only SSRF probes | Apply allowlists and network controls
TAKEAWAYS: SSRF turns the server into a confused proxy | Cloud metadata endpoints are high-value targets | Allowlists beat denylists
PRACTICE: In a lab app at <LAB_HOST>, submit a URL pointing to a controlled lab listener and observe the server-side fetch.
SOURCES: None
---
## Core idea
SSRF happens when a server fetches a URL supplied by a user without adequate restrictions. The attacker cannot reach an internal service directly, but the server can. By pointing the server at internal addresses or cloud metadata, the attacker reads data or triggers actions from a trusted position.

### Mental model
Think of a receptionist authorized to fetch packages from any address you write down. If you write "the secure storeroom," the receptionist fetches it because the request comes from them. The fix is a strict list of acceptable destinations and no trust in user-supplied addresses.

### Method (lab only)
1. Find features on <LAB_HOST> that accept URLs: imports, webhooks, image fetchers, PDF generators.
2. Point one at a listener you control in the lab and confirm a callback.
3. Test whether private ranges, alternate IP formats, and redirects are blocked.
4. Try a harmless metadata-style path on a lab mock, never a real cloud endpoint.
5. Implement an allowlist of hostnames and resolve/validate the IP before connecting.

### Concrete example
A lab endpoint at <LAB_HOST> fetches `url` and returns content. Vulnerable code forwards the value directly. Mitigation:
```python
host = urlparse(url).hostname
if host not in ALLOWED_HOSTS:            # exact allowlist
    return error()
ip = resolve(host)
if is_private(ip): return error()        # block private/link-local
# re-resolve at connect time and disable redirects to prevent bypass
```

| Bypass | Technique | Defense |
|---|---|---|
| Decimal/octal IP | `2130706433` | Resolve then check IP |
| Redirect chain | Public URL → internal | Disable or revalidate redirects |
| DNS rebinding | Host changes after check | Pin validated IP at connect |
| Metadata service | `169.254.169.254` | Block link-local, IMDSv2 |

### Common mistakes
- Denylisting only `127.0.0.1` and `localhost`.
- Validating once but following redirects without rechecking.
- Allowing arbitrary schemes such as `file://` or `gopher://`.

### Defense and verification
Use exact hostname allowlists, validated resolution, restricted egress firewall rules, and no raw URL fetching when a fixed API exists. Verify by replaying the lab callback and private-range attempts and confirming all are blocked.

### Knowledge check
Q: Why must redirects be disabled or revalidated? A: A public URL can redirect to an internal address after the initial check.

===MODULE===
TITLE: Cross-Site Scripting: Reflected, Stored, and DOM
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Master the three XSS families, their contexts, and the encoding and policy controls that stop them.
OBJECTIVES: Distinguish reflected, stored, and DOM XSS | Choose context-correct encoding | Deploy CSP as defense in depth
TAKEAWAYS: XSS is output-context injection, not input pollution | Encoding must match the sink context | CSP reduces impact but is not a substitute for fixing sinks
PRACTICE: In a lab app at <LAB_HOST>, demonstrate all three XSS types with harmless `alert(document.domain)` markers.
SOURCES: None
---
## Core idea
XSS occurs when untrusted data is executed as script in a victim's browser. Reflected XSS arrives in the request and is echoed in the response; stored XSS is persisted and served to others; DOM XSS arises entirely in client-side code when a source flows into a sink. The fix is context-aware output handling at the point of rendering.

### Mental model
Think of a theater script. Reflected XSS is a guest whispering a line the actor repeats immediately; stored XSS is a note left in the script for future performances; DOM XSS is the actor rewriting their own lines mid-scene. Each requires controlling what the audience sees and hears.

### Method (lab only)
1. On <LAB_HOST>, find inputs reflected into responses and test a harmless marker.
2. Persist a marker in a profile field and view it as another lab user to confirm stored XSS.
3. Search client scripts for sources feeding `innerHTML`, `eval`, or `location`.
4. Classify each context (text, attribute, URL, script) and apply the matching encoder.
5. Add a nonce-based CSP and confirm injected inline scripts are blocked.

### Concrete example
At <LAB_HOST>, a comment containing `<img src=x onerror=alert(1)>` is stored and executed when viewed. Server-side fix in a text context:
```js
function esc(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
```
For rich text, use a vetted sanitizer allowlisting safe tags and attributes.

| Type | Delivery | Persistence |
|---|---|---|
| Reflected | Crafted link | None |
| Stored | Saved content | Server-side |
| DOM | Client script flow | Page lifetime |

### Common mistakes
- HTML-encoding data placed inside a `<script>` block.
- Sanitizing on input but rendering in multiple contexts.
- Believing CSP alone makes XSS harmless.

### Defense and verification
Encode on output per context, sanitize rich HTML, use safe DOM APIs, and add CSP with `script-src` nonces. Verify by replaying all three lab markers and confirming they render as inert text.

### Knowledge check
Q: Why doesn't HTML entity encoding work inside a `<script>` tag? A: Script contents are raw text; entities are not decoded there, so JavaScript-encoding is required.

===MODULE===
TITLE: File Upload and Path Traversal Vulnerabilities
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn how unsafe file handling enables code execution, overwrites, and arbitrary file reads.
OBJECTIVES: Validate uploads safely | Prevent traversal and overwrite | Configure storage outside the web root
TAKEAWAYS: Never trust filenames or Content-Type from the client | Store uploads with generated names outside the document root | Validate canonical paths
PRACTICE: On a lab upload endpoint at <LAB_HOST>, attempt a `../` filename and an HTML file, then apply defenses and retest.
SOURCES: None
---
## Core idea
File uploads and file-path parameters are dangerous because they cross from web input into the filesystem. Without strict validation, an attacker can write a script into a served directory, traverse to sensitive files, or overwrite existing ones. The core rule is to treat all client-supplied path data as hostile.

### Mental model
Imagine a mailroom that accepts packages labeled with any destination written by the sender. A malicious label saying "../../vault" would redirect the package. Safe handling ignores the sender's label entirely and assigns its own sealed, numbered box in a locked room.

### Method (lab only)
1. Locate an upload form and a file-read parameter on <LAB_HOST>.
2. Submit a filename containing `../` segments and a harmless marker file.
3. Upload a small HTML file with an inert marker and see whether it is served as executable content.
4. Inspect how the app derives the storage path and content type.
5. Apply generated names, strict extension allowlists, and canonical path checks; retest.

### Concrete example
A lab handler at <LAB_HOST> uses `path.join(uploadDir, req.file.name)`, allowing traversal. Safer approach:
```js
const ext = path.extname(req.file.originalname).toLowerCase();
if (!['.png','.jpg','.pdf'].includes(ext)) return res.status(400).end();
const name = crypto.randomUUID() + ext;              // generated name
await fs.writeFile(path.join(uploadDir, name), data); // fixed directory
```

| Risk | Cause | Control |
|---|---|---|
| Traversal | User path segments | Canonicalize and confine |
| Webshell | Executable upload | Allowlist type, store outside root |
| Overwrite | Original filename used | Generated names |
| Content sniffing | Client Content-Type | Server-side detection |

### Common mistakes
- Trusting the `filename` header or extension alone.
- Serving uploads from a directory where scripts can execute.
- Checking extension but not actual file content.

### Defense and verification
Store uploads outside the web root with generated names, validate content, and serve them via a controlled handler with `Content-Disposition: attachment`. Verify by replaying both lab payloads and confirming neither writes outside the target directory nor executes.

### Knowledge check
Q: Why generate a new filename instead of using the client's? A: It removes traversal sequences and prevents overwriting existing files.

===MODULE===
TITLE: HTTP Request Smuggling
LEVEL: Advanced
MINUTES: 50
SUMMARY: Learn how disagreement between front-end and back-end about request boundaries enables request smuggling.
OBJECTIVES: Explain CL.TE and TE.CL desync | Identify risky proxy configurations | Apply normalization and reject ambiguous messages
TAKEAWAYS: Smuggling exploits parser disagreement, not application logic | `Content-Length` and `Transfer-Encoding` conflicts are the classic cause | Fix at the infrastructure layer
PRACTICE: Against a lab proxy chain at <LAB_HOST>, send a harmless ambiguous request and observe how each tier frames it.
SOURCES: None
---
## Core idea
HTTP request smuggling, or desync, occurs when a front-end proxy and a back-end server interpret request boundaries differently. An attacker crafts a message whose end is ambiguous, leaving extra bytes that the back end treats as the start of another request. This can bypass access controls, poison caches, or hijack another user's request.

### Mental model
Think of two postal workers reading the same letter. One stops at the word count on the envelope (`Content-Length`); the other stops at the "end" marker (`Transfer-Encoding`). If they disagree about where the letter ends, the remainder becomes a new letter — one the attacker wrote.

### Method (lab only)
1. Map the request chain at <LAB_HOST>: which proxy, which server, which protocol versions.
2. Send a benign request with both `Content-Length` and `Transfer-Encoding` and compare behaviors.
3. Identify the desync class: CL.TE (front uses length, back uses chunked) or TE.CL (reverse).
4. Use timing-based probes with a harmless body to confirm, keeping all tests inside your lab.
5. Remediate and re-run probes; ambiguous messages should be rejected with 400.

### Concrete example
A crafted lab request might contain:
```
POST / HTTP/1.1
Host: <LAB_HOST>
Content-Length: 6
Transfer-Encoding: chunked

0

G
```
If tiers disagree, `G` is prepended to the next request. The mitigation is to reject any message carrying both framing headers, normalize at one layer, and use HTTP/2 end-to-end where possible.

| Variant | Front end | Back end | Symptom |
|---|---|---|---|
| CL.TE | Content-Length | Chunked | Back end sees leftover bytes |
| TE.CL | Chunked | Content-Length | Back end waits/queues |
| TE.TE | Both, different parsing | Depends | header obfuscation |

### Common mistakes
- Testing against systems outside authorized scope.
- Assuming HTTP/2 at the edge removes all parsing differences.
- Ignoring timeout anomalies in favor of only content-based checks.

### Defense and verification
Strip conflicting headers, reject ambiguous framing, align server configurations, and keep connections from mixing users. Verify by replaying the lab probes and confirming uniform 400 responses and no leftover-byte effects.

### Knowledge check
Q: What header conflict classically enables smuggling? A: Both `Content-Length` and `Transfer-Encoding` present in one request.

===MODULE===
TITLE: Web Cache Poisoning
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn how unkeyed inputs get stored in a cache and served to other users, and how to make caching keys safe.
OBJECTIVES: Identify cache keys and unkeyed inputs | Construct a lab-only poisoning test | Harden cache configuration
TAKEAWAYS: Only keyed inputs should influence cached content | Dangerous headers like `X-Forwarded-Host` must not affect responses | Verification requires an unkeyed probe and a victim-style request
PRACTICE: On a lab cache at <LAB_HOST>, add a harmless header that is reflected but not keyed and observe whether it is cached.
SOURCES: None
---
## Core idea
Cache poisoning happens when an attacker causes a cache to store a harmful response under a key that legitimate users will later hit. The flaw is a mismatch between the cache key (what distinguishes stored responses) and inputs that actually change the response, such as headers or unkeyed parameters.

### Mental model
Think of a coat check that labels every coat "red" regardless of its actual color. If you hand over a red coat containing a surprise, the next person asking for a red coat receives yours. The label (cache key) failed to capture what mattered.

### Method (lab only)
1. Identify the cache key at <LAB_HOST> — often path and query, sometimes selected headers.
2. Find inputs that change the response but are not part of the key: custom headers, cookies, or unusual parameters.
3. Send a request with a harmless reflected value plus a cache-busting key.
4. Request the same key without the value and see whether the poisoned response is served.
5. Disable the dangerous reflection and verify the cache no longer stores it.

### Concrete example
At <LAB_HOST>, a response reflects `X-Forwarded-Host` into a script URL but the cache keys only on path. A poisoned response can serve an attacker-controlled URL to all visitors of that path. Defenses include normalizing headers at the edge and adding them to the cache key or removing the reflection entirely.

| Input | Usually keyed? | Risk |
|---|---|---|
| Path | Yes | Baseline key |
| Query string | Often | Partial keys common |
| `Host` / `X-Forwarded-Host` | Rarely | High |
| `Cookie` | Sometimes | Session mixup |

### Common mistakes
- Assuming a CDN's default key includes all headers.
- Testing with a cache-buster that prevents observing reuse.
- Forgetting that internal caches (not just CDNs) can be poisoned.

### Defense and verification
Make cache keys explicit and complete, strip or normalize unkeyed headers, and avoid reflecting raw header values. Verify by replaying the lab probe and confirming the reflected value never appears for a fresh key.

### Knowledge check
Q: Why is an unkeyed header dangerous? A: Its value can change the cached response without changing the cache key, so the poisoned response is served to others.

===MODULE===
TITLE: Host Header Attacks
LEVEL: Advanced
MINUTES: 40
SUMMARY: Learn how trusting the Host header enables password-reset poisoning, cache issues, and routing bypasses.
OBJECTIVES: Explain Host header roles | Demonstrate lab-only poisoning | Apply canonical host allowlists
TAKEAWAYS: The Host header is attacker-controlled | Absolute URLs built from it can redirect tokens | Validation must be exact and consistent across tiers
PRACTICE: In a lab app at <LAB_HOST>, send a password-reset request with a modified Host header and inspect the generated link.
SOURCES: None
---
## Core idea
The `Host` header tells a web server which virtual host to serve, but applications sometimes reuse its value to build absolute URLs, reset links, or redirect targets. Because the header is fully client-controlled, an attacker can substitute another domain and cause sensitive URLs to point at them.

### Mental model
Think of a form letter that fills in the return address from whatever envelope it arrives in. If an attacker supplies their own return address, replies containing secrets go to them. The application should use its own configured domain, not the caller's.

### Method (lab only)
1. Find features on <LAB_HOST> that build absolute links: password reset, email verification, redirects.
2. Send a request with a benign alternate host you control in the lab and inspect the generated URL.
3. Test duplicate `Host` headers and `X-Forwarded-Host` overrides.
4. Check whether the front end and back end agree on the canonical host.
5. Replace dynamic host usage with a fixed configured value; retest the lab request.

### Concrete example
A reset at <LAB_HOST> builds `https://${req.headers.host}/reset?token=...`. If the attacker sets `Host: evil.<LAB_HOST>`, the emailed token points to their server. Use a configured canonical origin:
```js
const base = process.env.CANONICAL_ORIGIN; // https://app.<LAB_HOST>
const link = `${base}/reset?token=${token}`;
```

| Attack | Goal | Defense |
|---|---|---|
| Reset poisoning | Steal token | Fixed canonical origin |
| Cache key abuse | Serve attacker host | Normalize at edge |
| Virtual host bypass | Reach internal route | Exact Host allowlist |

### Common mistakes
- Validating Host with a weak regex or suffix match.
- Trusting `X-Forwarded-Host` from external clients.
- Using the Host value in security decisions without normalization.

### Defense and verification
Configure a single canonical origin, reject unknown Host values, and strip untrusted forwarding headers at the edge. Verify by replaying the lab header variants and confirming all links use the configured domain.

### Knowledge check
Q: Why is the Host header untrusted? A: It is supplied by the client and can be set to any value independent of DNS.

===MODULE===
TITLE: Prototype Pollution
LEVEL: Advanced
MINUTES: 45
SUMMARY: Understand how JavaScript prototype manipulation changes object behavior and leads to authorization or XSS bugs.
OBJECTIVES: Explain JavaScript prototypes and pollution | Trace untrusted keys into object merges | Apply defenses and safe merge patterns
TAKEAWAYS: Objects inherit properties from prototypes | Writing `__proto__` or `constructor.prototype` can alter all objects | Freezing prototypes and using null-prototype objects help
PRACTICE: In a lab Node app at <LAB_HOST>, merge a benign payload containing `__proto__` and observe the effect on a fresh object.
SOURCES: None
---
## Core idea
Prototype pollution is a JavaScript-specific flaw where an attacker sets properties on `Object.prototype` through unsafe object merging or path assignment. Because most objects inherit from that prototype, the injected property appears on objects throughout the application — potentially flipping permission flags or enabling XSS in template libraries.

### Mental model
Think of a recipe book shared by every chef. If someone scribbles a new instruction on the master template page, every chef following the book suddenly behaves differently, without any of their own recipes being edited. That master page is the prototype.

### Method (lab only)
1. Find code at <LAB_HOST> that merges objects using user-controlled keys, e.g. recursive `merge(a, b)`.
2. Send a benign payload containing `__proto__` with a harmless marker property.
3. Check whether a freshly created object inherits the marker.
4. Identify downstream sinks: permission checks, template rendering, configuration lookup.
5. Fix by rejecting dangerous keys and using safe merge libraries; retest.

### Concrete example
Vulnerable merge at <LAB_HOST>:
```js
for (const k in src) obj[k] = src[k];   // '__proto__' edits the prototype
```
Safe approach:
```js
if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
```
or use `Object.create(null)` for dictionaries and maintained deep-merge utilities that block pollution keys.

| Defense | Effect |
|---|---|
| Reject `__proto__`/`constructor`/`prototype` keys | Blocks common entry |
| `Object.freeze(Object.prototype)` | Prevents changes globally |
| Null-prototype dictionaries | Removes inheritance |
| Schema validation | Rejects unexpected keys |

### Common mistakes
- Blocking only `__proto__` but missing `constructor.prototype` paths.
- Using `JSON.parse` results directly in deep merges without checks.
- Assuming the impact stops at the merge function.

### Defense and verification
Combine key rejection, frozen prototypes, and schema validation. Verify by replaying the lab payload and confirming fresh objects lack the marker and no permission flag changes.

### Knowledge check
Q: Why does polluting `Object.prototype` affect many objects? A: Because ordinary objects inherit properties from it through the prototype chain.

===MODULE===
TITLE: Server-Side Template Injection (SSTI)
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn how user input embedded in server-side templates can execute code, and how to separate templates from data.
OBJECTIVES: Recognize template sinks and engine syntax | Demonstrate lab-only detection | Render templates with static strings and data contexts
TAKEAWAYS: Templates are code, not data | Detection starts with arithmetic-style probes | Fix by never concatenating user input into template sources
PRACTICE: In a lab app at <LAB_HOST>, submit a harmless `7*7` probe to a template-rendering field and observe the output.
SOURCES: None
---
## Core idea
Server-side template injection occurs when attacker input is concatenated into a template string that the server compiles and renders. Unlike XSS, execution happens on the server, often enabling file access or remote code execution. The defect is treating template source as a data field.

### Mental model
Think of a form letter with placeholders. If you let the recipient write the letter itself, they can include instructions the typing service obeys. Safe use keeps the letter fixed and slips values only into marked blank spaces with no instruction power.

### Method (lab only)
1. Find a lab feature at <LAB_HOST> that renders user text through a template engine (emails, reports, greetings).
2. Submit a benign expression such as `7*7` or `${7*7}` and compare output with literal text.
3. Identify the engine by which syntax variations evaluate.
4. Confirm with a harmless marker (e.g. printing a version constant) inside your lab.
5. Refactor so the template string is fixed and input is passed as a data variable; retest.

### Concrete example
Vulnerable code at <LAB_HOST>:
```js
res.send(engine.render('Hello ' + req.query.name));
```
Input `{{7*7}}` may render as `Hello 49`. Fixed version:
```js
res.send(engine.render('Hello {{name}}', { name: req.query.name }));
```
Now the expression characters are data and are escaped by the engine.

| Engine | Typical syntax | Detection probe |
|---|---|---|
| Jinja/Twig | `{{ }}` | `{{7*7}}` |
| EJS/Handlebars | `<%= %>` / `{{ }}` | `<%= 7*7 %>` |
| Freemarker/Velocity | `${}` / `#{}` | `${7*7}` |

### Common mistakes
- Confusing SSTI with plain XSS; check where evaluation happens.
- Using a single generic probe and missing engine-specific syntax.
- Sanitizing HTML characters, which does not neutralize template syntax.

### Defense and verification
Keep template sources static, pass untrusted data as context variables, and sandbox or avoid dynamic template compilation. Verify by replaying the lab probes and confirming they render literally with no evaluation.

### Knowledge check
Q: Why does HTML escaping fail to stop SSTI? A: Template syntax is not HTML; characters like `{` and `}` remain meaningful to the engine.

===MODULE===
TITLE: Insecure Deserialization
LEVEL: Advanced
MINUTES: 50
SUMMARY: Understand how deserializing untrusted objects can trigger gadget chains and how to avoid object deserialization entirely.
OBJECTIVES: Explain serialization and gadget chains | Identify risky formats and sinks | Replace object deserialization with data-only formats
TAKEAWAYS: Deserialization reconstructs objects and can invoke code | Type whitelists are fragile | Prefer JSON with schema validation
PRACTICE: In a lab service at <LAB_HOST>, replace a serialized session cookie with JSON and confirm signature validation still works.
SOURCES: None
---
## Core idea
Insecure deserialization occurs when an application reconstructs objects from untrusted data. Many languages support "magic" methods invoked during reconstruction; attackers chain existing classes (gadgets) to execute actions. Even without code execution, tampered objects can corrupt authorization state or cause denial of service.

### Mental model
Think of a machine that rebuilds a device from a parts diagram supplied by a stranger. If the diagram includes a note saying "start the motor," the machine complies. Safe systems accept only a plain parts list, not instructions or exotic part types.

### Method (lab only)
1. Identify formats at <LAB_HOST> that carry objects: Java serialized blobs, PHP sessions, Python pickle, .NET ViewState.
2. Check whether values are signed or encrypted and whether the signature is verified before parsing.
3. In the lab, use a harmless tool to inspect a serialized token's structure — do not run exploit chains outside the lab.
4. Replace the format with JSON plus a strict schema and an HMAC.
5. Replay the original blob and confirm rejection.

### Concrete example
A lab service reads a signed pickle. Safer design:
```python
payload = {"uid": 42, "roles": ["user"]}
token = base64(payload) + "." + hmac_sha256(secret, base64(payload))
# on receipt: verify HMAC first, then json.loads, then schema check
```

| Format | Risk | Safer choice |
|---|---|---|
| Java serialization | Gadget chains | JSON / protobuf |
| Python pickle | Arbitrary calls on load | JSON |
| PHP serialize | Object injection | JSON + signature |
| XML with external entities | XXE | Disable DTDs |

### Common mistakes
- Verifying a signature after deserializing instead of before.
- Relying on a class blocklist that misses available gadgets.
- Confusing encoding with security; base64 is not protection.

### Defense and verification
Avoid native object deserialization of untrusted data, verify HMACs before parsing, enforce schemas, and run services with least privilege. Verify by replaying the lab blob and confirming a clean rejection with no side effects.

### Knowledge check
Q: Why must the HMAC be checked before parsing? A: Parsing itself can trigger dangerous behavior, so unauthenticated data must never reach the deserializer.

===MODULE===
TITLE: Race Conditions
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn how concurrent requests exploit time-of-check/time-of-use gaps and how to make critical sections atomic.
OBJECTIVES: Explain TOCTOU and check/use gaps | Design a lab-only concurrency test | Apply atomic operations and idempotency
TAKEAWAYS: Separate check and update steps create exploitable windows | Concurrency bugs are timing-sensitive | Database constraints are the strongest fix
PRACTICE: On a lab endpoint at <LAB_HOST>, send parallel requests to withdraw from a test balance and observe overspending before and after locking.
SOURCES: None
---
## Core idea
A race condition occurs when two or more requests interleave around a shared resource, and the application's intended sequence is not guaranteed. Common examples include double-spending, bypassing one-time-use limits, and reusing invitation tokens. The classic pattern is time-of-check/time-of-use: validate a condition, then act on it later.

### Mental model
Imagine two people checking an empty parking space at the same moment and both driving into it. Each check was correct when made, but the update was not coordinated. A lock or a single atomic reservation makes only one driver succeed.

### Method (lab only)
1. Find a lab endpoint at <LAB_HOST> with a check-then-update pattern: balance, coupon, one-time token.
2. Send two requests in parallel with synchronized timing and a harmless marker.
3. Measure the final state versus the expected state.
4. Implement atomicity — a conditional UPDATE, transaction, or distributed lock.
5. Re-run the parallel test and confirm only one request succeeds.

### Concrete example
Vulnerable logic at <LAB_HOST>:
```
bal = SELECT balance FROM accounts WHERE id=1;
if bal >= 100: UPDATE accounts SET balance = bal - 100 ...
```
Fix with a single conditional statement:
```sql
UPDATE accounts SET balance = balance - 100
WHERE id = 1 AND balance >= 100;
```
Then verify the affected row count is 1; otherwise reject.

| Technique | Use | Caution |
|---|---|---|
| Conditional UPDATE | Numeric limits | Simple, atomic |
| Unique constraint | One-time codes | Enforces at DB level |
| Optimistic locking | Version column | Retry on conflict |
| Distributed lock | Cross-service critical section | Must handle expiry |

### Common mistakes
- Testing only sequentially, so the bug never appears.
- Locking in one process while another scales horizontally.
- Adding sleeps to "fix" timing instead of making operations atomic.

### Defense and verification
Make state changes atomic with database constraints and transactions, and use idempotency keys for retries. Verify by running the parallel lab test repeatedly and confirming the invariant always holds.

### Knowledge check
Q: Why does a conditional UPDATE fix double-spending? A: The check and the change happen atomically in one statement, so only one request can meet the condition.

===MODULE===
TITLE: Mass Assignment and Auto-Binding
LEVEL: Advanced
MINUTES: 40
SUMMARY: Learn how binding request fields directly to objects lets attackers set properties they should never control.
OBJECTIVES: Explain auto-binding behavior | Identify hidden sensitive fields | Implement explicit allowlists and DTOs
TAKEAWAYS: Frameworks map request parameters into model fields automatically | Hidden fields are still attacker-controlled | Allowlists, not blocklists, define bindable properties
PRACTICE: On a lab registration endpoint at <LAB_HOST>, add a harmless `role` field to a signup request and observe whether it is accepted.
SOURCES: None
---
## Core idea
Mass assignment occurs when a framework binds all incoming parameters to an object's properties. If the object contains fields such as `role`, `isAdmin`, or `balance`, an attacker can set them simply by adding parameters — even if those fields never appear in the UI. The fix is to bind only explicitly allowed fields.

### Mental model
Think of a form that automatically fills every blank in a database record from a submission. A customer writes "isAdmin: yes" in the margin, and the clerk copies it in. Safe forms have a printed list of fields the clerk is permitted to fill, ignoring everything else.

### Method (lab only)
1. Inspect a lab model at <LAB_HOST> for fields not present in the corresponding form: roles, flags, ownership IDs.
2. Send a registration or update request with an extra harmless field set to a marker value.
3. Check whether the stored object reflects the injected value.
4. Replace direct binding with a DTO or explicit field allowlist.
5. Replay the request and confirm the extra field is ignored or rejected.

### Concrete example
Vulnerable code at <LAB_HOST>:
```js
User.create(req.body);   // req.body may include {role:'admin'}
```
Fixed with an allowlist:
```js
const { email, password } = req.body;
User.create({ email, password, role: 'user' });
```

| Defense | Strength | Note |
|---|---|---|
| DTO / allowlist | Strong | Define writable fields explicitly |
| Framework `fillable` | Good | Must be maintained |
| Blocklist of sensitive fields | Weak | Easy to miss new fields |
| Schema validation | Strong | Rejects unknown keys |

### Common mistakes
- Listing forbidden fields instead of permitted ones.
- Forgetting nested objects and array syntax in binding.
- Allowing `ownerId` to be set from the request rather than the session.

### Defense and verification
Use DTOs with strict schemas, derive ownership and roles server-side, and reject unknown keys. Verify by re-sending the lab marker field and confirming it has no effect on the stored record.

### Knowledge check
Q: Why is an allowlist safer than a blocklist for binding? A: New sensitive fields are excluded by default instead of being accidentally writable.

===MODULE===
TITLE: API Recon and Endpoint Discovery
LEVEL: Advanced
MINUTES: 40
SUMMARY: Learn systematic, authorized discovery of API surfaces, documentation, and parameter behavior.
OBJECTIVES: Map an API's hosts and routes | Discover documentation and schemas | Fuzz parameters safely in scope
TAKEAWAYS: Recon defines the testable attack surface | Documentation and client code leak routes | Every test must stay inside explicit authorization
PRACTICE: Enumerate routes and parameters of a lab API at <LAB_HOST> using passive sources and controlled fuzzing.
SOURCES: None
---
## Core idea
API security testing begins with knowing what exists. Recon combines passive observation — traffic from the lab client, documentation, JavaScript bundles, error messages — with active, in-scope discovery of hosts, paths, methods, and parameters. The output is a map that drives later tests.

### Mental model
Think of surveying a building before a permitted inspection. You read the floor plan (docs), watch where people enter (client traffic), and check which doors exist (routes). You do not kick in doors that are not part of the authorized survey.

### Method (authorized scope only)
1. Record all hosts and base paths used by the lab client at <LAB_HOST>.
2. Collect documentation endpoints such as `/openapi.json`, `/swagger`, `/graphql`.
3. Inspect client bundles and source maps for route strings and parameter names.
4. Use a wordlist against discovered base paths with modest concurrency.
5. Log method, status, content type, and authentication requirement for each finding.

### Concrete example
A discovered spec at <LAB_HOST> might include:
```
paths:
  /v1/users/{id}: { get: ..., delete: ... }
  /v1/admin/export: { post: ... }
```
This reveals object IDs, methods, and an admin route to prioritize in later access-control tests.

| Source | What it reveals | Caveat |
|---|---|---|
| Client traffic | Real used endpoints | May miss legacy routes |
| OpenAPI/Swagger | Full schema | Sometimes stale or hidden |
| JS bundles | Hidden routes/params | Minification complicates |
| Error responses | Stack traces, framework | Do not rely on leakage |

### Common mistakes
- Treating a 404 as definitive proof a route is absent.
- Fuzzing hosts or paths outside written authorization.
- Ignoring non-production environments discovered in scope.

### Defense and verification
From the defender side, remove exposed docs in production, prune unused routes, and monitor for scanning patterns. Verify your lab map is complete by cross-checking documentation against observed client traffic.

### Knowledge check
Q: Why start with passive recon before active fuzzing? A: It focuses testing on real, in-scope surfaces and avoids noisy or out-of-scope requests.

===MODULE===
TITLE: BOLA and BFLA: API Access Control
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn the API-specific access-control failures — object-level and function-level — and how to test and fix them.
OBJECTIVES: Distinguish BOLA from BFLA | Test object and function authorization with multiple lab accounts | Enforce server-side, per-object checks
TAKEAWAYS: BOLA is accessing another user's object; BFLA is calling a function above your role | IDs must be authorized, not just parsed | Centralized policies prevent drift
PRACTICE: Using two lab accounts on <LAB_HOST>, swap object IDs and call an admin API function to confirm both are denied.
SOURCES: None
---
## Core idea
Broken Object Level Authorization (BOLA) lets a user access or modify another user's resource by changing an identifier. Broken Function Level Authorization (BFLA) lets a user invoke an endpoint reserved for higher privileges. Both are API-top risks because APIs expose object references and functions directly.

### Mental model
Imagine a self-service storage facility. BOLA is locker 42 opening with any key that looks like a locker key; BFLA is the manager's office door that opens for any badge. Valid identity is not enough — each door needs its own check.

### Method (lab only)
1. Log in as two lab users with different roles on <LAB_HOST>.
2. Capture a request containing an object ID and replace it with the other account's ID.
3. Repeat for create, update, and delete methods.
4. Call an admin-only endpoint with a normal user's token and record the response.
5. Fix by scoping queries to the authenticated principal and checking role per function; retest.

### Concrete example
A lab API at <LAB_HOST> runs:
```
GET /v1/orders/9142   Authorization: Bearer <user-A-token>
```
Returning user B's order means the query filtered only by ID. Correct:
```sql
SELECT * FROM orders WHERE id = ? AND owner_id = ?;
```
The owner ID is taken from the verified token, never from the request.

| Failure | Test | Expected after fix |
|---|---|---|
| BOLA on GET | Swap object ID | 404 |
| BOLA on PUT/DELETE | Modify other's object | 403/404 |
| BFLA | Normal user calls admin route | 403 |

### Common mistakes
- Using opaque IDs as the only security control.
- Checking roles only in the API gateway, not in the service.
- Allowing bulk endpoints to bypass per-object checks.

### Defense and verification
Authorize every object and function on the server, default-deny, and test with role/object matrices in CI. Verify by replaying all lab cases and confirming consistent denials plus denial logs.

### Knowledge check
Q: Why doesn't a random UUID prevent BOLA? A: It only hides the identifier; if it leaks, there is no authorization check to stop access.

===MODULE===
TITLE: GraphQL Security
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn GraphQL-specific risks: introspection exposure, deeply nested queries, and authorization at the resolver level.
OBJECTIVES: Understand GraphQL execution and introspection | Test query depth and batching in a lab | Secure resolvers and limit complexity
TAKEAWAYS: GraphQL is an API surface with its own attack patterns | Authorization belongs in resolvers, not just at the gateway | Query complexity must be bounded
PRACTICE: Against a lab GraphQL endpoint at <LAB_HOST>, run a harmless introspection query and a deeply nested query to observe costs.
SOURCES: None
---
## Core idea
GraphQL exposes a single endpoint where clients define the shape of the response. That flexibility creates unique risks: introspection can reveal the entire schema, deeply nested or aliased queries can exhaust resources, and authorization must be applied per field or resolver rather than per URL.

### Mental model
Think of a restaurant with a menu that lets guests invent dishes. That is powerful, but a guest can order the same expensive ingredient thousands of times in one request. The kitchen needs recipe limits and checks at each station, not just at the door.

### Method (lab only)
1. Query the lab endpoint at <LAB_HOST> with a standard introspection request and record exposed types and fields.
2. Build a modestly nested query and measure response time and payload size.
3. Test aliases and batching that repeat a field many times.
4. Attempt access to an object belonging to your second lab account through a resolver.
5. Apply depth limits, complexity scoring, disabled production introspection, and resolver-level auth; retest.

### Concrete example
A lab introspection query at <LAB_HOST>:
```graphql
{ __schema { types { name fields { name } } } }
```
If this succeeds in production, it hands attackers a map. Also consider a query with deeply nested `friends { friends { ... } }` that multiplies database calls exponentially.

| Risk | Mechanism | Control |
|---|---|---|
| Schema disclosure | Introspection | Disable in production |
| DoS | Deep/aliased queries | Depth + complexity limits |
| BOLA via resolver | Object args | Authorize in each resolver |
| Batching abuse | Array of queries | Limit batch size |

### Common mistakes
- Authorizing only the top-level field and trusting nested fields.
- Assuming a single endpoint means a smaller attack surface.
- Returning raw validation errors with internal details.

### Defense and verification
Disable introspection outside development, enforce query cost limits, and centralize resolver authorization. Verify by replaying the lab queries and confirming introspection is blocked and expensive queries are rejected.

### Knowledge check
Q: Why is per-resolver authorization necessary? A: Different fields and nested objects can expose different data, so a single endpoint-level check is insufficient.

===MODULE===
TITLE: Rate Limiting, Throttling, and Resource Exhaustion
LEVEL: Advanced
MINUTES: 40
SUMMARY: Learn how to protect APIs from brute force, scraping, and denial of service with layered rate controls.
OBJECTIVES: Design rate-limit keys and windows | Distinguish throttling from quota enforcement | Test limits in a lab without disrupting others
TAKEAWAYS: Choose keys that reflect the threat: IP, account, token, or endpoint | Return clear 429 responses with Retry-After | Distributed limiters require shared state
PRACTICE: In a lab API at <LAB_HOST>, send a controlled burst of requests to a test endpoint and verify the configured limit and headers.
SOURCES: None
---
## Core idea
Rate limiting restricts how many requests a client may make in a window. It slows credential attacks, scraping, and abuse of expensive endpoints. Good design picks keys that match the threat model, applies limits consistently across instances, and returns predictable responses.

### Mental model
Think of a highway with metered on-ramps. The meter can limit each car (IP), each fleet (account), or only the express lane (expensive endpoint). If every on-ramp has its own meter with no shared count, a driver can bypass limits by switching ramps.

### Method (lab only)
1. Identify sensitive endpoints on <LAB_HOST>: login, OTP, search, export, GraphQL.
2. Choose a key per endpoint — for login, combine account and IP.
3. Set windows and burst limits appropriate to legitimate use.
4. Send a controlled burst from your lab client and record status codes and headers.
5. Confirm the 429 response includes `Retry-After` and that limits are shared across app instances.

### Concrete example
A lab gateway rule at <LAB_HOST>:
```
limit: 5 requests / 300s
key: ip + route
response: 429 Too Many Requests, Retry-After: 120
```
For login, add an account-based counter so distributed attacks against one account are also stopped.

| Strategy | Key | Best for |
|---|---|---|
| Fixed window | IP + route | Simple throttling |
| Sliding window | IP + route | Smoother bursts |
| Token bucket | Account/token | Burst tolerance |
| Cost-based | Query complexity | GraphQL/expensive ops |

### Common mistakes
- Limiting only by IP, so distributed attacks evade limits.
- Forgetting long-running or streaming endpoints.
- Returning 200 with an error body instead of a proper 429.

### Defense and verification
Layer edge and application limits, use shared state, and monitor limit hits as attack signals. Verify by replaying the lab burst and confirming consistent enforcement across two app instances.

### Knowledge check
Q: Why include the account in a login rate-limit key? A: To stop distributed attacks that target one account from many IPs.

===MODULE===
TITLE: API Authentication and Key Management
LEVEL: Advanced
MINUTES: 40
SUMMARY: Learn how API keys, tokens, and service credentials should be issued, stored, rotated, and revoked.
OBJECTIVES: Compare API key and bearer token models | Implement secure key storage and rotation | Prevent key leakage in clients
TAKEAWAYS: API keys identify callers but are weak proof of identity alone | Never ship long-lived secrets in client code | Rotation and revocation are mandatory controls
PRACTICE: In a lab service at <LAB_HOST>, issue a scoped key, use it once, then rotate and confirm the old key is revoked.
SOURCES: None
---
## Core idea
API authentication answers who is calling. Common mechanisms include API keys, OAuth bearer tokens, and mutual TLS. Keys are simple but are bearer secrets: anyone holding one can act as the owner. Security depends on scopes, secure storage, short lifetimes where possible, and a reliable rotation and revocation path.

### Mental model
Think of a building access card. A card with no photo (plain API key) grants access to whoever holds it. Limiting which floors it opens (scopes), setting an expiry, and deactivating lost cards (revocation) reduce the damage.

### Method
1. Inventory credential types accepted by <LAB_HOST> and where each is stored.
2. Check that keys are high-entropy and never derived from usernames or emails.
3. Confirm keys are scoped to the minimum required permissions and environments.
4. Test rotation: issue a new key, verify it works, and confirm the old one is rejected.
5. Scan client-side code and repositories for embedded secrets; move any to a secret manager.

### Concrete example
A lab request at <LAB_HOST>:
```
GET /v1/orders HTTP/1.1
Authorization: Bearer ak_lab_9f3a...
X-Request-Id: 7c1e...
```
The server should hash stored keys (like passwords), check scopes, and log only a key fingerprint — never the full secret.

| Control | Purpose |
|---|---|
| Scopes | Limit blast radius |
| Hashing at rest | Limit database-leak impact |
| Rotation | Limits lifetime of stolen keys |
| Environment separation | Prevent prod keys in dev |

### Common mistakes
- Embedding keys in mobile or browser clients and calling them secret.
- Logging full keys or returning them in API responses after creation.
- Letting rotated keys remain valid "for compatibility."

### Defense and verification
Use scoped, short-lived tokens where possible, hash keys at rest, and automate rotation with immediate revocation. Verify by replaying a rotated lab key and confirming rejection, plus a repository secret scan.

### Knowledge check
Q: Why hash API keys at rest? A: A database leak then yields unusable values instead of directly usable credentials.

===MODULE===
TITLE: Capstone: Full-Scope Authorized Web Assessment
LEVEL: Advanced
MINUTES: 60
SUMMARY: Integrate the entire curriculum into a disciplined, documented, and safe end-to-end assessment workflow.
OBJECTIVES: Plan scope and rules of engagement | Execute a systematic test lifecycle | Report findings with verification and remediation
TAKEAWAYS: Process and evidence separate professional testing from random probing | Prioritize by real impact and exploitability | Every offensive action is authorized and lab-bounded
PRACTICE: Perform a complete assessment of the lab application at <LAB_HOST> and produce a structured report with reproduced findings.
SOURCES: None
---
## Core idea
A professional web assessment is a structured process: define scope, map the application, identify vulnerabilities, validate them safely, prioritize by risk, and report with clear remediation and verification. Mastery means applying the right technique from the previous 49 modules at the right time — and never straying beyond authorization.

### Mental model
Think of a medical diagnosis. You take a history (recon), run targeted tests (exploration), confirm with lab results (safe validation), and prescribe treatment (remediation), then follow up (retest). Random tests without a hypothesis waste effort and can harm the patient.

### Method
1. **Scope and rules**: written authorization for <LAB_HOST>, allowed techniques, test windows, and stop conditions.
2. **Map**: hosts, routes, parameters, roles, and data flows from recon and documentation.
3. **Analyze**: apply checklists per layer — client, transport, auth, access control, APIs, config.
4. **Validate**: reproduce each candidate with the least intrusive proof inside the lab; record evidence.
5. **Prioritize**: rate by impact and exploitability, not just tool severity.
6. **Report and retest**: give exact steps, affected URLs with <LAB_HOST> placeholders, remediation, and verification after fixes.

### Concrete example
A finding entry at <LAB_HOST>:
```
Title: BOLA on GET /v1/orders/{id}
Severity: High  (cross-tenant data disclosure)
Evidence: user A token retrieved user B's order 9142
Root cause: query filtered by id only
Fix: add AND owner_id = ? from verified token
Verification: reissue request -> 404
```

| Phase | Output | Gate |
|---|---|---|
| Scope | Written authorization | No work without it |
| Recon | Asset/route map | Coverage check |
| Testing | Candidate findings | Safe reproduction |
| Reporting | Prioritized report | Actionable fixes |
| Retest | Closure evidence | Finding resolved |

### Common mistakes
- Escoping into systems or third parties not explicitly authorized.
- Reporting tool output without confirming real impact.
- Omitting verification steps, leaving fixes unconfirmed.

### Defense and verification
Treat the lab as a system you own, keep an activity log, and constrain all payloads to harmless markers. Verify closure by re-running each lab reproduction after remediation and capturing a clean result.

### Knowledge check
Q: What single document must exist before any offensive testing begins? A: Written authorization defining scope, rules of engagement, and stop conditions.
