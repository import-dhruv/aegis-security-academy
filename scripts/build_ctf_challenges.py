#!/usr/bin/env python3
"""Generate 1,000 original Aegis Academy CTF training challenges.

Every challenge is authored locally (no external data). Crypto/encoding
challenges are computed programmatically so the published flag and the
step-by-step solution are guaranteed to be correct. Offensive tasks are
framed for local labs only.

Run: npm run content:ctf
"""
from __future__ import annotations

import base64
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "ctf-challenges.json"

COUNTS = {
    "Web": 150,
    "Crypto": 120,
    "Forensics": 110,
    "Misc": 100,
    "Reverse Engineering": 90,
    "Steganography": 80,
    "Pwn / Binary": 80,
    "Networking": 70,
    "OSINT": 60,
    "Mobile Security": 50,
    "Cloud Security": 50,
    "AI Security": 40,
}
POINTS = {"Easy": 100, "Medium": 250, "Hard": 500, "Insane": 1000}
MINUTES = {"Easy": 15, "Medium": 35, "Hard": 70, "Insane": 120}

ADJ = [
    "Silent", "Broken", "Frozen", "Hidden", "Velvet", "Crimson", "Amber", "Hollow",
    "Ancient", "Neon", "Quiet", "Rusty", "Gilded", "Crooked", "Lucid", "Sable",
    "Wandering", "Fractured", "Midnight", "Glass", "Iron", "Paper", "Tidal", "Ember",
]
NOUN = [
    "Ledger", "Beacon", "Cipher", "Gateway", "Archive", "Signal", "Relay", "Vault",
    "Mirror", "Harbor", "Circuit", "Notebook", "Lantern", "Orbit", "Foothold", "Prism",
    "Basement", "Compiler", "Windmill", "Passport", "Rivet", "Bastion", "Cartel", "Atlas",
]
CORES = [
    "tiny_steps", "leftover_trust", "quiet_signal", "second_entrance", "mirror_key",
    "paper_token", "hidden_relay", "old_password", "broken_seal", "silent_witness",
    "cold_cache", "forgotten_route", "open_window", "wrong_assumption", "clear_text",
    "borrowed_identity", "small_mistake", "last_digit", "chain_of_trust", "double_take",
]


def title(rng: random.Random, category: str) -> str:
    return f"{rng.choice(ADJ)} {rng.choice(NOUN)}"


def flag(rng: random.Random, prefix: str = "") -> str:
    core = rng.choice(CORES)
    if prefix:
        core = f"{prefix}_{core}"
    return f"AEGIS{{{core}}}"


def difficulty(rng: random.Random) -> str:
    return rng.choices(["Easy", "Medium", "Hard", "Insane"], [40, 35, 20, 5])[0]


def caesar(text: str, shift: int) -> str:
    out = []
    for ch in text:
        if "a" <= ch <= "z":
            out.append(chr((ord(ch) - 97 + shift) % 26 + 97))
        elif "A" <= ch <= "Z":
            out.append(chr((ord(ch) - 65 + shift) % 26 + 65))
        else:
            out.append(ch)
    return "".join(out)


ATBASH = str.maketrans("abcdefghijklmnopqrstuvwxyz", "zyxwvutsrqponmlkjihgfedcba")


def atbash(text: str) -> str:
    return text.translate(ATBASH)


def xor_bytes(data: bytes, key: int) -> bytes:
    return bytes(b ^ key for b in data)


def railfence(text: str, rails: int) -> str:
    fence = [[] for _ in range(rails)]
    row, step = 0, 1
    for ch in text:
        fence[row].append(ch)
        if row == 0:
            step = 1
        elif row == rails - 1:
            step = -1
        row += step
    return "".join("".join(r) for r in fence)


def vigenere(text: str, key: str) -> str:
    out, i = [], 0
    for ch in text:
        if ch.isalpha():
            base = 65 if ch.isupper() else 97
            shift = ord(key[i % len(key)].lower()) - 97
            out.append(chr((ord(ch) - base + shift) % 26 + base))
            i += 1
        else:
            out.append(ch)
    return "".join(out)


def wrap(cid: str, number: int, cat: str, t: str, diff: str, prompt: str,
         hints: list[str], flg: str, solution: str, lesson: str, tags: list[str]) -> dict:
    return {
        "id": cid,
        "number": number,
        "title": t,
        "category": cat,
        "difficulty": diff,
        "points": POINTS[diff],
        "minutes": MINUTES[diff],
        "prompt": prompt.strip(),
        "hints": hints,
        "flag": flg,
        "solution": solution.strip(),
        "lesson": lesson.strip(),
        "tags": tags,
        "labOnly": True,
        "source": "Aegis Academy original training challenge",
    }


def crypto_challenge(rng: random.Random, n: int, cid: str, cat: str) -> dict:
    t = title(rng, cat)
    diff = difficulty(rng)
    f = flag(rng, "crypto")
    kind = n % 8
    if kind == 0:
        s = rng.randint(3, 19)
        ct = caesar(f, s)
        prompt = f"The intercepted note reads `{ct}`. Historical notes suggest a simple cyclic shift was used. Recover the hidden message."
        hints = ["The alphabet wraps around after 26 letters.", "Try all 25 shifts and look for readable words.", f"The shift used was {s}."]
        solution = f"1. Try every Caesar shift (1–25) on `{ct}`.\n2. Shift {s} produces `{f}`.\n3. The recognizable `AEGIS{{...}}` wrapper confirms the result."
        lesson = "Caesar ciphers preserve letter frequency, so brute force over 25 keys is trivial. Never rely on a shifted alphabet for secrecy."
    elif kind == 1:
        ct = atbash(f)
        prompt = f"A suspicious-looking string was found in a notebook: `{ct}`. It appears to be a substitution where letters were replaced by their mirror in the alphabet. Decode it."
        hints = ["A maps to Z, B maps to Y, and so on.", "The transformation is its own inverse."]
        solution = f"1. Apply the Atbash mapping (a↔z, b↔y, …) to `{ct}`.\n2. The result is `{f}`."
        lesson = "Atbash is a fixed substitution with only one key; it offers no real confidentiality."
    elif kind == 2:
        key = rng.randint(1, 127)
        data = f.encode()
        ct = base64.b64encode(xor_bytes(data, key)).decode()
        prompt = f"You found this blob in a config file: `{ct}`. A comment says it was XORed with a single byte and then base64-encoded. Recover the plaintext."
        hints = ["Base64-decode first, then XOR.", "Only 256 possible keys — score candidates by printable ASCII."]
        solution = f"1. Base64-decode to get the XORed bytes.\n2. Brute-force all 256 single-byte keys; key `0x{key:02x}` gives printable text.\n3. Plaintext: `{f}`."
        lesson = "Single-byte XOR is trivially brute-forced by frequency and printable-character scoring."
    elif kind == 3:
        ct = base64.b64encode(base64.b64encode(f.encode())).decode()
        prompt = f"A log line contains `{ct}`. It looks like encoding was applied more than once. Unwrap it."
        hints = ["Look for trailing '=' padding.", "Base64 decode, then inspect the result."]
        solution = f"1. Base64-decode once: `{base64.b64encode(f.encode()).decode()}`.\n2. Decode again: `{f}`."
        lesson = "Encoding is not encryption. Nested encodings add no secrecy, only inconvenience."
    elif kind == 4:
        rails = rng.choice([3, 4, 5])
        ct = railfence(f, rails)
        prompt = f"The message `{ct}` was written by moving down and up across {rails} rails. Reconstruct the original."
        hints = ["Draw a zig-zag across the rail count.", "Read the zig-zag row by row to recover the order."]
        solution = f"1. Lay the ciphertext into a {rails}-rail zig-zag pattern.\n2. Read characters column by column following the zig-zag.\n3. Plaintext: `{f}`."
        lesson = "Transposition ciphers shuffle positions but do not change characters; known rail counts are easy to reverse."
    elif kind == 5:
        key = rng.choice(["delta", "nimbus", "cipher", "quartz", "ember"])
        ct = vigenere(f, key)
        prompt = f"An old dispatch reads `{ct}`. A keyword-based polyalphabetic cipher was used. Find the plaintext."
        hints = ["Repeated key letters create repeating shift patterns.", "Try dictionary words as the key."]
        solution = f"1. Guess the key by index-of-coincidence or dictionary search.\n2. The key is `{key}`.\n3. Decrypting gives `{f}`."
        lesson = "Vigenère resists simple frequency analysis but leaks structure through key length."
    elif kind == 6:
        ct = f.encode().hex()
        prompt = f"A hex dump was recovered: `{ct}`. Convert it back to text."
        hints = ["Two hex characters make one byte.", "The bytes are ASCII-encoded text."]
        solution = f"1. Split the hex string into byte pairs.\n2. Decode each byte as ASCII.\n3. Result: `{f}`."
        lesson = "Hex is a representation, not protection. Always check encodings before assuming encryption."
    else:
        core = f[6:-1]
        bits = " ".join(format(ord(c), "08b") for c in core)
        prompt = f"The following 8-bit groups were written on a whiteboard: `{bits}`. Convert them to characters."
        hints = ["Each group is one ASCII byte.", "Groups are separated by spaces."]
        solution = f"1. Convert each 8-bit group to its ASCII character.\n2. Wrap with `AEGIS{{}}`: `{f}`."
        lesson = "Binary-to-ASCII conversion is a basic encoding skill used constantly in CTFs and forensics."
    return wrap(cid, n, cat, t, diff, prompt, hints, f, solution, lesson, ["crypto", "encoding", "lab"])


WEB_SCENARIOS = [
    ("An IDOR in an invoice endpoint", "/api/invoice?id=", "Change the numeric identifier while authenticated as a second test user and confirm the response belongs to the other account.", "Object-level authorization must be checked server-side on every request."),
    ("A password-reset token that never expires", "reset_token=", "Request two tokens, use the older one after the newer was issued, and observe it still works.", "Tokens must be single-use, short-lived and invalidated on issue of a replacement."),
    ("A JWT accepting 'none'", "Authorization: Bearer", "Decode the token, change alg to none, strip the signature and replay the request in your lab proxy.", "Always pin the expected algorithm and verify signatures server-side."),
    ("An SSRF reaching the metadata address", "url=https://", "Point the fetch parameter at the lab metadata simulator and read the simulated role response.", "Block link-local ranges and require IMDSv2-style tokens."),
    ("GraphQL introspection left on", "POST /graphql", "Send an introspection query and enumerate the schema for hidden mutation names.", "Disable introspection in production and authorize fields individually."),
    ("A mass-assignment flaw", "isAdmin=true", "Add an unexpected privileged field to a JSON registration body and check the resulting account role.", "Whitelist accepted fields; never bind raw request objects to models."),
    ("A CORS policy trusting any origin", "Origin: https://evil.lab", "Send a cross-origin request with a spoofed Origin and observe the ACAO header.", "Use an explicit origin allowlist and never reflect arbitrary origins with credentials."),
    ("A cache poisoned by the Host header", "Host: attacker.lab", "Send a crafted absolute URL and check whether the generated link is cached for other users.", "Validate Host and use a canonical, allowlisted base URL."),
]


def web_challenge(rng: random.Random, n: int, cid: str, cat: str) -> dict:
    t = title(rng, cat)
    diff = difficulty(rng)
    scenario, marker, steps, lesson = WEB_SCENARIOS[n % len(WEB_SCENARIOS)]
    f = flag(rng, "web")
    port = rng.choice([3000, 8080, 8443, 5000, 4000])
    prompt = (
        f"A lab web application exposes {scenario}. The flag is shown only to the account that "
        f"successfully demonstrates the issue. The relevant request uses `{marker}`. "
        f"Start Burp, scope it to `http://lab.local:{port}` and find the flag."
    )
    hints = [
        "Read the application's behaviour before sending payloads.",
        "Compare responses between two owned accounts byte for byte.",
        f"Focus your proxy scope on `lab.local:{port}` to stay in bounds.",
    ]
    solution = (
        f"1. Map the endpoint and capture a legitimate request in your lab proxy.\n"
        f"2. {steps}.\n"
        f"3. The successful response reveals `{f}`.\n"
        f"4. Fix: {lesson}"
    )
    return wrap(cid, n, cat, t, diff, prompt, hints, f, solution, lesson, ["web", "owasp", "lab"])


FORENSIC_SCENARIOS = [
    ("A PCAP with DNS exfiltration", "dns", "Follow the DNS query stream and concatenate the unique subdomain labels in packet order.", "DNS is often allowed out of networks; monitor for high-entropy subdomain patterns."),
    ("A PNG with data appended after IEND", "png", "Check the bytes after the PNG end chunk; a zip archive follows the image.", "Always inspect trailing data; many files hide payloads after the official end marker."),
    ("A memory image with a plaintext secret", "mem", "Run strings on the image and filter for the AEGIS marker with surrounding context.", "Secrets in process memory can be recovered; avoid keeping plaintext credentials resident."),
    ("A log file with a brute-force sequence", "logs", "Group failed authentication events by source IP and find the one that eventually succeeded.", "Rate limiting and alerting on auth failures would have caught this."),
    ("A JPEG with revealing EXIF", "exif", "Read EXIF metadata; the GPS and comment fields contain the answer.", "Strip metadata before publishing images."),
    ("A ZIP with a weak password", "zip", "Extract with a small wordlist derived from the case notes.", "Weak, guessable archive passwords provide no real protection."),
]


def forensics_challenge(rng: random.Random, n: int, cid: str, cat: str) -> dict:
    t = title(rng, cat)
    diff = difficulty(rng)
    name, kind, steps, lesson = FORENSIC_SCENARIOS[n % len(FORENSIC_SCENARIOS)]
    f = flag(rng, " forensic".strip())
    filename = rng.choice(["capture", "evidence", "artifact", "dump", "trace"]) + f".{kind}"
    prompt = f"You were handed `{filename}` from a training incident. {name}. Recover the hidden flag. Work only on the provided file."
    hints = ["Start with `file` and a hex dump of the header and tail.", "Know the expected format structure before parsing.", "Search for the literal `AEGIS` marker."]
    solution = f"1. Identify the file type and inspect header/trailer bytes.\n2. {steps}.\n3. Flag: `{f}`.\n4. Lesson: {lesson}"
    return wrap(cid, n, cat, t, diff, prompt, hints, f, solution, lesson, ["forensics", kind, "lab"])


STEGO_SCENARIOS = [
    ("least-significant bits of the RGB channels", "Extract the LSB plane and regroup bits into ASCII characters.", "LSB steganography is fragile but common in beginner challenges."),
    ("whitespace at the ends of lines", "Reveal invisible characters and map spaces/tabs to binary digits.", "Invisible whitespace can carry data through text channels."),
    ("a comment chunk after the image header", "Parse chunks and read the comment payload before the image data.", "Image container formats allow metadata chunks that are easy to overlook."),
    ("the order of frames in an animated GIF", "List frame delays and reorder frames by their delay values.", "Animation metadata can encode ordering information."),
    ("a spectrogram of an audio file", "Open the spectrogram view; the text is drawn in the frequency domain.", "Signals have more than one domain worth inspecting."),
]


def stego_challenge(rng: random.Random, n: int, cid: str, cat: str) -> dict:
    t = title(rng, cat)
    diff = difficulty(rng)
    where, steps, lesson = STEGO_SCENARIOS[n % len(STEGO_SCENARIOS)]
    f = flag(rng, "stego")
    ext = rng.choice(["png", "gif", "wav", "txt", "bmp"])
    prompt = f"A file named `poster_{n % 97:02d}.{ext}` looks ordinary, but the flag is hidden in {where}. Extract it using only local tools."
    hints = ["Compare the file against a clean version if one is provided.", "Try multiple representations: bits, bytes, metadata, frequency.", "The marker starts with AEGIS."]
    solution = f"1. Inspect the carrier with a hex editor and format-specific tooling.\n2. {steps}.\n3. Flag: `{f}`.\n4. Lesson: {lesson}"
    return wrap(cid, n, cat, t, diff, prompt, hints, f, solution, lesson, ["stego", ext, "lab"])


REVERSE_SCENARIOS = [
    ("a string comparison in the main function", "Locate the comparison call, follow the referenced string and read the expected value.", "Hardcoded comparison strings reveal secrets to anyone with the binary."),
    ("a key-check routine with arithmetic on input bytes", "Reverse the per-byte arithmetic by applying the inverse operation in reverse order.", "Simple transforms are invertible; derive the inverse rather than guessing."),
    ("a strip-packed executable", "Dump the process memory after unpacking, then search the dump for the flag.", "Packers hide code only until runtime; memory reveals the unpacked image."),
    ("obfuscated variable names but readable logic", "Rename symbols based on data flow and identify the final branch that prints success.", "Semantics survive renaming; follow data, not names."),
    ("a licence check that validates a checksum", "Recompute the expected checksum over candidate inputs and find the matching string.", "Checksums protect against typos, not against deliberate forgery."),
]


def reverse_challenge(rng: random.Random, n: int, cid: str, cat: str) -> dict:
    t = title(rng, cat)
    diff = difficulty(rng)
    where, steps, lesson = REVERSE_SCENARIOS[n % len(REVERSE_SCENARIOS)]
    f = flag(rng, "rev")
    prompt = f"A small crackme (`checkme_{n % 61}`) asks for a secret phrase. The validation logic is {where}. Reverse it locally in an isolated VM and recover the phrase, which is the flag."
    hints = ["Run `strings` first; then open the binary in a decompiler.", "Set a breakpoint on the success message.", "Do not execute untrusted binaries outside your lab VM."]
    solution = f"1. Load the sample in your disassembler/decompiler inside the lab VM.\n2. {steps}.\n3. Flag: `{f}`.\n4. Lesson: {lesson}"
    return wrap(cid, n, cat, t, diff, prompt, hints, f, solution, lesson, ["reverse", "binary", "lab"])


PWN_SCENARIOS = [
    ("a stack buffer overflow", "Find the offset with a cyclic pattern, then overwrite the return address with the lab win function.", "Stack canaries and ASLR exist to stop exactly this class of bug."),
    ("a format-string vulnerability", "Use positional format specifiers to leak a stack value, then write to a chosen address.", "Never pass user input directly as a printf format string."),
    ("a use-after-free", "Free the object, trigger reallocation with controlled data, then observe the dangling pointer's behaviour.", "UAF exploits hinge on allocator reuse patterns; use safe lifetimes."),
    ("a canary leak followed by overflow", "Leak the canary byte by byte via the format string, then restore it in the overflow payload.", "A canary is useful only if it cannot be leaked first."),
    ("an integer overflow in a size calculation", "Provide a length that wraps to a small value, then supply the larger payload.", "Validate ranges before allocating or indexing."),
]


def pwn_challenge(rng: random.Random, n: int, cid: str, cat: str) -> dict:
    t = title(rng, cat)
    diff = difficulty(rng)
    where, steps, lesson = PWN_SCENARIOS[n % len(PWN_SCENARIOS)]
    f = flag(rng, "pwn")
    prompt = f"A local service `vuln_srv_{n % 53}` contains {where}. Exploit it in your isolated lab to call the provided `win()` routine and print the flag. No remote targets are involved."
    hints = ["Check the binary's protections first with checksec.", "Use a debugger to confirm offsets before building a payload.", "The win function address is printed in the challenge README."]
    solution = f"1. Inspect protections and disassemble the vulnerable function.\n2. {steps}.\n3. The service prints `{f}`.\n4. Lesson: {lesson}"
    return wrap(cid, n, cat, t, diff, prompt, hints, f, solution, lesson, ["pwn", "binary", "lab"])


NET_SCENARIOS = [
    ("a capture with an ARP spoofing sequence", "Filter `arp` in Wireshark and find the duplicate IP claim.", "Dynamic ARP inspection and static mappings mitigate spoofing."),
    ("a DNS query trail", "Apply the display filter `dns` and follow the query names.", "Unusual query volume is a strong exfiltration signal."),
    ("a TCP handshake anomaly", "Filter `tcp.flags.syn == 1 && tcp.flags.ack == 1` and identify the half-open attempt.", "SYN flood defences rely on tracking incomplete handshakes."),
    ("an HTTP header mismatch", "Follow the TCP stream and compare Host and SNI values.", "Inconsistent identifiers often reveal proxy or virtual-host confusion."),
    ("a subnetting puzzle", "Work out the network and broadcast addresses for the given prefix.", "Binary subnet math underpins network access control."),
]


def net_challenge(rng: random.Random, n: int, cid: str, cat: str) -> dict:
    t = title(rng, cat)
    diff = difficulty(rng)
    where, steps, lesson = NET_SCENARIOS[n % len(NET_SCENARIOS)]
    f = flag(rng, "net")
    prompt = f"The provided training capture `lab_{n % 47}.pcap` contains {where}. Analyse it locally with Wireshark or tcpdump and extract the flag."
    hints = ["Start with the protocol hierarchy view.", "Use display filters rather than scrolling.", "Follow streams around the suspicious packet."]
    solution = f"1. Open the capture in Wireshark.\n2. {steps}.\n3. Flag: `{f}`.\n4. Lesson: {lesson}"
    return wrap(cid, n, cat, t, diff, prompt, hints, f, solution, lesson, ["networking", "pcap", "lab"])


OSINT_SCENARIOS = [
    ("a username reused across platforms", "Search the handle in several public sources and correlate profile details.", "Reused handles link otherwise separate identities."),
    ("a certificate transparency entry", "Query a CT log for the domain and list unexpected subdomains.", "Certificate logs leak asset names before they are protected."),
    ("a photo with embedded geodata", "Read EXIF GPS coordinates and identify the location.", "Strip geotags before publishing personal images."),
    ("a leaked document with a username pattern", "Derive the email format from the sample and enumerate valid accounts.", "Predictable identifiers aid enumeration; use random internal IDs."),
    ("an archived version of a page", "Use the Wayback Machine to recover a removed contact address.", "Deleted public content often persists in archives."),
]


def osint_challenge(rng: random.Random, n: int, cid: str, cat: str) -> dict:
    t = title(rng, cat)
    diff = difficulty(rng)
    where, steps, lesson = OSINT_SCENARIOS[n % len(OSINT_SCENARIOS)]
    f = flag(rng, "osint")
    prompt = f"A fictional persona in this training scenario has {where}. Using only public information in the provided notes, reconstruct the finding and recover the flag `AEGIS{{osint_...}}`."
    hints = ["Treat every clue as a pivot to another source.", "Record sources so findings are reproducible.", "The persona and domains are fictional lab artefacts."]
    solution = f"1. Collect all identifiers from the case notes.\n2. {steps}.\n3. Flag: `{f}`.\n4. Lesson: {lesson}"
    return wrap(cid, n, cat, t, diff, prompt, hints, f, solution, lesson, ["osint", "recon", "lab"])


MOBILE_SCENARIOS = [
    ("a hardcoded API key in an APK", "Decompile the app, search string references for key-like patterns and read the constant.", "Secrets in clients are public; use backend-mediated access."),
    ("an exported activity accepting arbitrary URLs", "Inspect the manifest, identify the exported component and note the URL-loading behaviour.", "Exported components need explicit permission checks."),
    ("a deep link that bypasses login", "Enumerate intent filters and follow the route to the authenticated screen.", "Deep links must enforce the same authorization as normal navigation."),
    ("insecure local storage", "Inspect the app data directory in the lab emulator and read the unencrypted file.", "Sensitive data belongs in Keystore/Keychain, not plain files."),
    ("a permissive WebView", "Find the bridge configuration and note which origins can call exposed methods.", "Restrict WebView origins and disable unnecessary bridges."),
]


def mobile_challenge(rng: random.Random, n: int, cid: str, cat: str) -> dict:
    t = title(rng, cat)
    diff = difficulty(rng)
    where, steps, lesson = MOBILE_SCENARIOS[n % len(MOBILE_SCENARIOS)]
    f = flag(rng, "mobile")
    prompt = f"The lab app `fieldnotes_{n % 29}.apk` contains {where}. Analyse it statically in your emulator and recover the flag."
    hints = ["Start with the manifest and resources.", "Search decompiled code for the AEGIS marker.", "Run only in an isolated emulator you control."]
    solution = f"1. Unpack the APK and inspect the manifest.\n2. {steps}.\n3. Flag: `{f}`.\n4. Lesson: {lesson}"
    return wrap(cid, n, cat, t, diff, prompt, hints, f, solution, lesson, ["mobile", "android", "lab"])


CLOUD_SCENARIOS = [
    ("a publicly readable storage bucket", "List the lab bucket without credentials and read the marker object.", "Block public access at account level and audit bucket policies."),
    ("a wildcard IAM policy", "Read the simulated policy document and identify the over-broad action.", "Scope actions and resources; deny by default."),
    ("an SSRF reaching instance metadata", "Point the lab fetch parameter at the metadata simulator and read the simulated role.", "Require IMDSv2 tokens and block link-local egress."),
    ("a Kubernetes service account with broad RBAC", "Inspect the lab role binding and list what the account can read.", "Grant namespace-scoped least privilege only."),
    ("a CI workflow with write permissions", "Review the workflow YAML and find the step where secrets reach untrusted code.", "Use OIDC short-lived credentials and pin actions."),
]


def cloud_challenge(rng: random.Random, n: int, cid: str, cat: str) -> dict:
    t = title(rng, cat)
    diff = difficulty(rng)
    where, steps, lesson = CLOUD_SCENARIOS[n % len(CLOUD_SCENARIOS)]
    f = flag(rng, "cloud")
    prompt = f"In a lab cloud account you are given {where}. Using read-only tooling against your own resources, recover the flag. Never assess accounts you do not own."
    hints = ["Prefer read-only checks first.", "Review identity policy before workload configuration.", "The flag is stored as a simulated marker object or variable."]
    solution = f"1. Inventory the lab resources you own.\n2. {steps}.\n3. Flag: `{f}`.\n4. Lesson: {lesson}"
    return wrap(cid, n, cat, t, diff, prompt, hints, f, solution, lesson, ["cloud", "iam", "lab"])


AI_SCENARIOS = [
    ("indirect prompt injection in a retrieved document", "Plant an instruction in a document you control and observe how the lab assistant follows it.", "Treat retrieved content as untrusted data, never as instructions."),
    ("excessive tool permissions on an agent", "Ask the lab agent to perform an action outside its stated purpose and note what it attempts.", "Grant the minimum tool set and confirm consequential actions."),
    ("an MCP server exposing unrestricted file reads", "Enumerate the tool list and read a marker file through the lab server.", "Sandbox tool servers and allowlist accessible paths."),
    ("a RAG index with poisoned content", "Insert a misleading record into your own index and query it to see the effect.", "Validate and provenance-tag ingested documents."),
    ("jailbreak via role-play framing", "Try several framing variants against your own local model and record which changes behaviour.", "Layer input filtering, output checks and capability limits."),
]


def ai_challenge(rng: random.Random, n: int, cid: str, cat: str) -> dict:
    t = title(rng, cat)
    diff = difficulty(rng)
    where, steps, lesson = AI_SCENARIOS[n % len(AI_SCENARIOS)]
    f = flag(rng, "ai")
    prompt = f"A lab AI application has {where}. Using your own local model and test data, demonstrate the issue and recover the flag marker."
    hints = ["Separate instructions from data in your test inputs.", "Keep an evaluation log of what you tried.", "Only test systems you control."]
    solution = f"1. Map the app's trust boundaries and inputs.\n2. {steps}.\n3. Flag: `{f}`.\n4. Lesson: {lesson}"
    return wrap(cid, n, cat, t, diff, prompt, hints, f, solution, lesson, ["ai", "llm", "lab"])


MISC_SCENARIOS = [
    ("a chain of base32, hex and base64", "Decode in reverse order of encoding, checking the output type after each step.", "Encoding chains are common in CTFs; identify each layer before decoding."),
    ("a morse-code audio clip", "Transcribe dots and dashes, then map groups to letters.", "Morse is a simple mapping that survives many encodings."),
    ("a QR code with malformed error correction", "Repair the quiet zone and re-scan with a local decoder.", "Error correction can recover surprisingly damaged codes."),
    ("a compressed stream with a trailing comment", "Decompress, then inspect the original stream tail for a note.", "Container tails often hide data."),
    ("a regex that matches too much", "Find the input that satisfies the pattern but breaks the assumption.", "Overly broad regexes are a recurring source of validation bugs."),
    ("git history with a removed secret", "Walk commits with `git log -p` and look for deleted files.", "Removing a secret from the working tree does not remove it from history."),
]


def misc_challenge(rng: random.Random, n: int, cid: str, cat: str) -> dict:
    t = title(rng, cat)
    diff = difficulty(rng)
    where, steps, lesson = MISC_SCENARIOS[n % len(MISC_SCENARIOS)]
    f = flag(rng, "misc")
    prompt = f"A training file contains {where}. Decode, inspect or reason your way to the flag. Only local tools are needed."
    hints = ["Look at the raw bytes before assuming a format.", "Try several encodings in sequence.", "The answer starts with `AEGIS{`."]
    solution = f"1. Inspect the artifact with `file`, `xxd` and `strings`.\n2. {steps}.\n3. Flag: `{f}`.\n4. Lesson: {lesson}"
    return wrap(cid, n, cat, t, diff, prompt, hints, f, solution, lesson, ["misc", "encoding", "lab"])


BUILDERS = {
    "Web": web_challenge,
    "Crypto": crypto_challenge,
    "Forensics": forensics_challenge,
    "Misc": misc_challenge,
    "Reverse Engineering": reverse_challenge,
    "Steganography": stego_challenge,
    "Pwn / Binary": pwn_challenge,
    "Networking": net_challenge,
    "OSINT": osint_challenge,
    "Mobile Security": mobile_challenge,
    "Cloud Security": cloud_challenge,
    "AI Security": ai_challenge,
}


def main() -> None:
    all_challenges: list[dict] = []
    number = 0
    for idx, (cat, count) in enumerate(COUNTS.items()):
        rng = random.Random(1337 + idx * 101)
        for n in range(count):
            number += 1
            cid = f"ctf-{number:04d}"
            all_challenges.append(BUILDERS[cat](rng, n, cid, cat))
    # Ensure unique titles by appending the category when a collision occurs.
    seen: dict[str, int] = {}
    for c in all_challenges:
        key = c["title"]
        seen[key] = seen.get(key, 0) + 1
        if seen[key] > 1:
            c["title"] = f"{c['title']} ({c['category']} {seen[key]})"
    for c in all_challenges:
        c["solution"] = re.sub(r"\.\.+", ".", c["solution"])
        c["prompt"] = re.sub(r"\.\.+", ".", c["prompt"])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(all_challenges, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {len(all_challenges)} CTF challenges to {OUT.relative_to(ROOT)}")
    print("categories:", ", ".join(f"{k}={v}" for k, v in COUNTS.items()))
    print("unique ids:", len({c['id'] for c in all_challenges}))


if __name__ == "__main__":
    main()
