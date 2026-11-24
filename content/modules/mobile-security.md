===MODULE===
TITLE: 01 Mobile Threat Modeling Fundamentals
LEVEL: Beginner
MINUTES: 35
SUMMARY: Learn to identify assets, adversaries, and trust boundaries in a mobile app before testing. Build a small, repeatable model that drives every later lab exercise.
OBJECTIVES: Name mobile assets and adversaries | Draw trust boundaries | Map a threat to a testable control
TAKEAWAYS: Clients are untrusted | STRIDE structures thinking | Every control needs a verification test
PRACTICE: In your notes, threat-model the login flow of an app you control; list assets, boundaries, and one STRIDE threat per boundary.
SOURCES: None
---
## Core idea
Threat modeling asks "what can go wrong, and does it matter?" before you write code or run a single test. The mobile mental model is a set of data-flow boundaries: your app is a client that holds secrets, calls APIs, and runs on a device the user physically controls. Unlike a server you own, the client executes in an environment an attacker may fully observe. You never *trust* it; you reason about what it protects and what someone with the device can extract. Start every engagement by naming assets (credentials, tokens, PII, session state), adversaries (a curious user, a malicious app, a network observer, a rooted-device owner), and trust boundaries (UI to app process, app to OS APIs, app to network, app to backing API). A good model is small, specific, and testable — not a generic checklist.

## Method
1. Draw a data-flow diagram with four zones: user input, app process, device/OS storage, and remote API. Mark every crossing as a trust boundary.
2. List assets and rank them by impact if disclosed or modified.
3. At each boundary, enumerate threats with STRIDE: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.
4. Map each threat to a concrete control and a lab test you can actually run.
5. State assumptions explicitly, such as "attacker controls the network but not the API."

## Example
Model a token flow for `<LAB_APP>` in your isolated lab:

```
Asset: refresh token
Boundary: app process -> API over TLS
Threat (I): token written to logcat
Control: never log secrets
Test: adb logcat | grep -i token
```

| Boundary | STRIDE | Control |
|---|---|---|
| UI -> app | Tampering | Input validation |
| app -> storage | Info disclosure | Keystore/encryption |
| app -> API | Spoofing | Certificate validation |

## Common mistakes
Modeling only the network and forgetting local storage; treating the client as trusted; omitting the rooted-device case; writing threats too vague to test.

## Defense and verification
Verify each modeled control with a concrete test and tag it to a MASVS category (storage, cryptography, network, platform). Revisit the model whenever a feature changes.

## Knowledge check
**Q:** Why is a mobile client never a trusted party? **A:** It runs on user-controlled hardware, so anyone with the device can inspect, modify, or replay everything it does or stores.

===MODULE===
TITLE: 02 Mobile Platform Security Architecture
LEVEL: Beginner
MINUTES: 30
SUMMARY: Compare the layered security stacks of Android and iOS so you know which OS primitive enforces each control. Understand where isolation, signing, and updates live.
OBJECTIVES: Identify the OS security layers | Contrast Android and iOS isolation | Locate where trust is anchored
TAKEAWAYS: Security is layered | Kernel enforces isolation | Hardware roots the chain
PRACTICE: On an isolated emulator, run the version and build-property commands below for `<LAB_APP>`'s host device and record each layer you can observe.
SOURCES: None
---
## Core idea
Both platforms are layered cakes. From the bottom up: hardware root of trust, bootloader, kernel, mandatory access control policy, per-app sandbox, managed runtime, and finally the app itself. Android builds on a Linux kernel with SELinux and a per-UID process sandbox; iOS builds on the XNU/Darwin kernel with its own sandbox profile and mandatory code signing. The crucial mental model is that the app is the *least* trusted layer — the OS, not the app, is the referee. Distribution also differs: Android apps are signed by the developer with a key they hold, while iOS apps must be signed by Apple-issued certificates and provisioned. Knowing which layer provides a control tells you where a test belongs: sandbox checks are OS-level, crypto checks are app-level, and signing checks are toolchain-level.

## Method
1. Sketch the six layers and write one sentence on what each enforces.
2. For a given control (say "app A cannot read app B's files"), identify the enforcing layer — here the kernel UID separation and SELinux.
3. Note the trust anchor: verified boot on Android, Secure Boot plus signed OS on iOS.
4. Identify which layer *you* can observe with lab tooling and which you must assume.

## Example
Inspect the running platform in an authorized emulator:

```
adb shell getprop ro.build.version.release     # 14
adb shell getprop ro.boot.verifiedbootstate    # green
adb shell id                                    # uid=2000(shell)
```

| Layer | Android primitive | iOS primitive |
|---|---|---|
| Boot | AVB / dm-verity | Secure Boot / SEP |
| Isolation | UID + SELinux | Sandbox profile |
| Signing | APK v2/v3 | Codesign + provision |

## Common mistakes
Assuming Android and iOS enforce a control the same way; confusing the app sandbox with the kernel; ignoring that the OS version determines available protections.

## Defense and verification
Verify platform assumptions by querying the device (`getprop`, `adb shell getenforce`) before concluding an app is vulnerable; a "missing" control may simply be an OS version difference.

## Knowledge check
**Q:** Which layer actually stops one app reading another's private files? **A:** The kernel-enforced per-app UID sandbox and SELinux (Android) or sandbox profile (iOS), not the apps themselves.

===MODULE===
TITLE: 03 Android Application Sandbox and UID Separation
LEVEL: Beginner
MINUTES: 30
SUMMARY: Understand how Linux UIDs, process isolation, and SELinux keep Android apps apart, and what that means when you test storage and IPC in a lab.
OBJECTIVES: Explain per-app UIDs | Read process and file ownership | Predict sandbox boundaries
TAKEAWAYS: One UID per app | Kernel enforces access | sharedUserId breaks isolation
PRACTICE: On an isolated emulator, install `<LAB_APP>` and two small helper apps you built; use `ps` and `ls -l` to show they cannot read each other's data.
SOURCES: None
---
## Core idea
At install time Android assigns each app a unique Linux UID (for example `u0_a123`). Every process of that app runs as that UID, and the kernel — not the app — decides which files and IPC it may touch. A file in `/data/data/<package>/` is owned by that UID with mode `0700`, so a different UID gets `Permission denied`. On top of discretionary Unix permissions, SELinux in enforcing mode confines even privileged-looking processes via mandatory policy. The mental model: the sandbox is a kernel boundary, so *escaping* it requires a kernel or policy flaw, while *misusing* it usually means the app voluntarily exported a component or wrote data to shared external storage. When you test, distinguish OS-enforced isolation from app-level mistakes.

## Method
1. Install your own app and check its UID with `adb shell ps -A`.
2. Inspect file ownership under `/data/data/<package>/` with `ls -la` (as root in your lab only).
3. Attempt a cross-app file read from a second app you control and observe the denial.
4. Check SELinux state and any denials in `logcat` if something unexpectedly succeeds.
5. Note any `sharedUserId` in the manifest — it merges apps into one UID and removes the boundary.

## Example
```
adb install <LAB_APP>-debug.apk
adb shell ps -A | grep <LAB_APP>
# u0_a121  2410  ... com.lab.myapp
adb shell ls -l /data/data/com.lab.myapp/
# drwx------  u0_a121  u0_a121  files
adb shell getenforce
# Enforcing
```

## Common mistakes
Believing `chmod` inside an app can override the sandbox; testing on a rooted device without noting that root defeats the boundary; overlooking `sharedUserId`.

## Defense and verification
Verification: a second UID cannot open the files; `getenforce` reports `Enforcing`. Defensively, keep `sharedUserId` absent, use internal storage for secrets, and never rely on obscurity.

## Knowledge check
**Q:** Why can't another app read your app's internal files even if it knows the path? **A:** The files are owned by your app's UID with private mode, and the kernel denies access to a different UID.

===MODULE===
TITLE: 04 Android Application Signing and Signature Schemes
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn how APK signatures prove authorship and integrity, and why the signing key is a security boundary for updates and signature-level permissions.
OBJECTIVES: Distinguish v1/v2/v3 schemes | Verify a signature locally | Protect signing keys
TAKEAWAYS: Signature equals identity | v2/v3 cover whole APK | Never ship debug keys
PRACTICE: Generate a debug and a release keystore for `<LAB_APP>` in your own project, sign both, and verify each with `apksigner verify --verbose`.
SOURCES: None
---
## Core idea
An APK signature is a statement of identity: "this binary came from the holder of this key and was not altered." Android checks it at install and, crucially, at update — an update must be signed with the same key, so losing the key means losing the ability to update. Scheme v1 signs individual JAR entries and leaves parts of the ZIP unprotected; v2 signs the entire APK file and is faster and stronger; v3/v3.1 add key rotation and target-SDK awareness. Signature-level permissions (`protectionLevel="signature"`) are granted only to apps signed by the same key, which is why the key is a trust boundary, not just a release detail. Debug keys are public and must never reach production.

## Method
1. Identify the signing scheme with `apksigner verify --verbose`.
2. Compare v1 versus v2 by verifying with `--min-sdk-version` overrides in your lab.
3. List the signer certificate fingerprint with `keytool`.
4. In the manifest, find any custom permission with `signature` protection and note which key must sign a consumer.
5. Check that release and debug builds use different keys.

## Example
```
apksigner verify --verbose <LAB_APP>-release.apk
# Verified using v2 scheme (sdk 24+) ... true
keytool -list -v -keystore lab-release.jks | grep SHA256
# SHA256: 3F:9A:...
apksigner verify --verbose <LAB_APP>-debug.apk
# WARN: debug key CN=Android Debug
```

| Scheme | Scope | Note |
|---|---|---|
| v1 | Per entry | Legacy, gaps |
| v2 | Whole file | Default today |
| v3 | Whole + rotation | Newer SDKs |

## Common mistakes
Shipping a debug-signed build; assuming v1 alone protects the whole APK; losing or sharing the release keystore.

## Defense and verification
Store release keys in a hardware-backed keystore or HSM with restricted access and rotate via v3. Verify every release artifact's signer before distribution.

## Knowledge check
**Q:** Why must an update be signed with the same key as the installed app? **A:** Android treats the signing key as app identity; matching signatures are required to grant the update the same UID and permissions.

===MODULE===
TITLE: 05 Android Verified Boot and Boot Integrity
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Trace the boot chain from hardware root of trust to the system partition and understand what verified boot does and does not protect in a lab.
OBJECTIVES: Describe the AVB chain | Read verified boot state | Explain dm-verity rollback
TAKEAWAYS: Root of trust anchors chain | green means verified | Boot integrity is not app integrity
PRACTICE: On a spare isolated emulator or device you own, query `verifiedbootstate` and `bootloader` from a shell and record what each value means, without unlocking anything.
SOURCES: None
---
## Core idea
Verified boot answers "has the OS been modified since it shipped?" A hardware-backed root of trust verifies the bootloader, which verifies the boot image, which verifies the system partition through Android Verified Boot (AVB) and `dm-verity` hashing at read time. Rollback protection stops an attacker from flashing an older, vulnerable image by tracking a version in tamper-resistant storage. The states you will see — `green` (verified with the device's key), `yellow` (verified with a user-installed key), `orange` (unverified/unlocked), and `red` (verification failed) — tell you how much to trust the platform. Crucially, boot integrity protects the *OS*, not third-party apps: a malicious app can still be installed with a valid signature on a green device. Keep these two trust chains separate in your mental model.

## Method
1. Query `ro.boot.verifiedbootstate` and `ro.boot.verifiedbootstate`-related props from a lab shell.
2. Check bootloader lock state without changing it.
3. Explain the result: green = signed by OEM, orange = unlocked, yellow = custom key.
4. Locate `dm-verity` in the kernel command line to confirm per-block hashing.
5. Note that rollback counters live outside the flash partitions an attacker can rewrite.

## Example
```
adb shell getprop ro.boot.verifiedbootstate   # green
adb shell getprop ro.boot.bootloader           # unlocked / locked
adb shell cat /proc/cmdline | grep -o 'dm-verity[^ ]*'
# dm-verity: ... root=... hash=...
```

| State | Meaning | Trust level |
|---|---|---|
| green | OEM key | Full |
| yellow | User key | Modified OS |
| orange | Unlocked | None |

## Common mistakes
Equating green boot with "no malicious apps"; unlocking a bootloader on the device you later test without documenting it; ignoring rollback version.

## Defense and verification
For a real assessment, record boot state as an environmental assumption. Defensively, keep bootloaders locked in production and rely on the OS for app sandbox enforcement.

## Knowledge check
**Q:** Does a green verified-boot state prove a third-party app is safe? **A:** No — it proves the OS image is intact; apps have their own independent signature chain.

===MODULE===
TITLE: 06 Android Permission Model
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn how Android classifies permissions and when runtime consent is required, so you can spot over-privileged apps in a manifest review.
OBJECTIVES: Classify permission protection levels | Explain runtime grants | Find custom permissions
TAKEAWAYS: dangerous needs runtime consent | signature means same key | Groups simplify UI but not grants
PRACTICE: In your own `<LAB_APP>` project, declare one normal and one dangerous permission, install on an isolated emulator, and observe the runtime prompt and `dumpsys package` state.
SOURCES: None
---
## Core idea
Android permissions are guarded resources with a `protectionLevel`: `normal` (low risk, auto-granted), `dangerous` (privacy-sensitive, requires a runtime prompt on API 23+), and `signature` (granted only to apps signed by the same key as the definer). Permissions are also grouped for the user prompt, but each permission is granted independently in modern Android. Install-time permissions are shown at install; runtime dangerous permissions must be requested in context and can be revoked by the user. Custom permissions let an app protect its own components, and a careless `protectionLevel="normal"` on a sensitive component effectively leaves it open. The mental model: permissions are a user-facing policy layer enforced by the OS, *above* the kernel sandbox.

## Method
1. Extract declared and granted permissions with `aapt` and `dumpsys package`.
2. Classify each by protection level using `pm list permissions -g -f`.
3. Identify dangerous permissions requested at install and check whether the app explains them in context.
4. Look for custom permissions in `<permission>` tags and verify their protection level.
5. Note permissions granted but unused — a sign of over-privilege.

## Example
```
adb shell dumpsys package <LAB_APP> | grep -A40 'requested permissions'
adb shell pm list permissions -g -f | grep -i READ_SMS
# permission:android.permission.READ_SMS
#   protectionLevel=dangerous
```

| Level | Grant rule | Example |
|---|---|---|
| normal | Automatic | INTERNET |
| dangerous | Runtime prompt | CAMERA |
| signature | Same signing key | Custom admin perm |

## Common mistakes
Assuming permission groups grant all members; declaring `dangerous` permissions the app never uses; using `normal` for a custom permission guarding sensitive data.

## Defense and verification
Verify with `adb shell dumpsys package` that only necessary permissions are granted, and that custom sensitive permissions use `signature` protection.

## Knowledge check
**Q:** Why is `protectionLevel="signature"` used for a custom admin permission? **A:** It restricts the permission to apps signed with the same key, preventing arbitrary third-party apps from obtaining it.

===MODULE===
TITLE: 07 Threat Actors, Assets, and Mobile Attack Surfaces
LEVEL: Beginner
MINUTES: 25
SUMMARY: Inventory who attacks mobile apps, what they want, and the surfaces they use, giving structure to later testing modules.
OBJECTIVES: List common threat actors | Categorize assets | Enumerate attack surfaces
TAKEAWAYS: Actors differ in capability | Assets drive impact | Surfaces are entry points
PRACTICE: For `<LAB_APP>`, write a one-page inventory of three assets, three actors, and the five surfaces you would test in an authorized lab.
SOURCES: None
---
## Core idea
A threat actor is whoever benefits from breaking your app: a curious end user, a competing app on the same device, a network observer on public Wi-Fi, a supply-chain attacker, or a motivated researcher in a bug-bounty program. Assets are the things worth protecting — session tokens, API keys, personal data, entitlements, and the integrity of the app itself. An attack surface is any place data crosses a boundary: the network client, local storage, inter-app IPC, exported components, WebViews, deep links, clipboard, logs, and the update mechanism. The mental model is a simple equation: risk rises with a valuable asset, a capable actor, and an exposed surface. You cannot test everything, so this inventory tells you where to spend lab time.

## Method
1. List assets and mark each as secret, integrity-sensitive, or availability-sensitive.
2. For each actor, note capability: can they control the network, install an app, or root the device?
3. Map each surface to the assets it can touch.
4. Rank surfaces by exposure times impact.
5. Turn the top surfaces into a test backlog for later modules.

## Example
```
Actor: other app on device (installs freely)
Surface: exported activity with no permission
Asset: reset-password token in Intent extra
Lab test: launch component via adb am start
```

| Surface | Likely asset | Actor |
|---|---|---|
| Exported activity | Tokens in extras | Malicious app |
| Cleartext traffic | Session cookie | Network observer |
| External storage | Cached PII | Local user |

## Common mistakes
Focusing only on remote actors and ignoring the device owner; treating every surface as equally important; forgetting the supply chain.

## Defense and verification
Reduce surface area: export only what is needed, validate all inputs, and move secrets off the client. Verify the inventory against the manifest and network capture.

## Knowledge check
**Q:** Which actor can read unencrypted files on external storage? **A:** Any app with storage permission (and often the user), because that storage is world-readable by design.

===MODULE===
TITLE: 08 Mapping the Mobile App Attack Surface
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Turn a general asset list into a concrete, testable inventory of entry points using manifests, binaries, and runtime observation in an authorized lab.
OBJECTIVES: Enumerate entry points | Correlate static and dynamic views | Prioritize tests
TAKEAWAYS: Manifest lists exported components | Traffic reveals endpoints | Every entry point gets a test
PRACTICE: Using `<LAB_APP>` in an isolated emulator, build a spreadsheet of exported components, URL endpoints, and file-parsing code paths, then mark a test for each.
SOURCES: None
---
## Core idea
Attack-surface mapping is the bridge between abstract threat modeling and hands-on testing. You want a finite list of doors into the app: exported components, intent filters, deep-link hosts, network endpoints, file parsers, WebViews, and native libraries. Static sources (the manifest, decompiled code) tell you what the app *can* accept; dynamic observation (traffic, logcat, filesystem) tells you what it *actually* uses. The mental model is to build two column sets — "declared" and "observed" — and explain every difference. A declared endpoint with no traffic may be dead code; traffic to an undeclared host may be a third-party SDK. This inventory becomes the checklist that keeps a 50-module assessment honest and complete.

## Method
1. From the manifest, list all components with `android:exported="true"` or an intent filter.
2. Grep decompiled code for `http(s)://`, path strings, and file-extension checks.
3. Run the app in the lab and capture traffic to see real hosts.
4. Watch `logcat` and `/data/data/<package>/` for file and preference writes.
5. Merge into one ranked list and attach a planned test to each entry.

## Example
```
aapt dump xmltree <LAB_APP>.apk AndroidManifest.xml | grep -i 'exported\|scheme'
# E: android:exported="true"
# E: android:scheme="https"
adb logcat -d | grep -i '<LAB_APP>'
```

| Entry point | Source | Test module |
|---|---|---|
| Exported activity | Manifest | 11, 14 |
| Deep link host | Intent filter | 13 |
| API host | Proxy capture | 43 |

## Common mistakes
Trusting the manifest alone; ignoring third-party SDK endpoints; mapping surface without linking each item to a concrete test.

## Defense and verification
Verify completeness by re-checking the list after each test phase; a good map changes as you learn. Minimize exported components to shrink the surface.

## Knowledge check
**Q:** Why compare declared endpoints with observed traffic? **A:** Differences reveal dead code, hidden SDK endpoints, or dynamic configuration that a manifest-only review would miss.

===MODULE===
TITLE: 09 APK Internals: ZIP Layout and Key Files
LEVEL: Beginner
MINUTES: 30
SUMMARY: Open an APK and recognize its ZIP contents so you know where code, resources, manifest, and signatures live before deeper analysis.
OBJECTIVES: List APK contents | Identify classes.dex | Locate signature metadata
TAKEAWAYS: APK is a ZIP | dex holds bytecode | META-INF holds signatures
PRACTICE: Copy an APK of an app you built to your lab, run `unzip -l <LAB_APP>.apk`, and annotate every top-level entry with its purpose.
SOURCES: None
---
## Core idea
An APK is just a ZIP archive with a defined layout. At the root you will find `AndroidManifest.xml` (binary XML, not plain text), `classes.dex` (Dalvik bytecode, often multiple files), `resources.arsc` (compiled resource table), `res/` (compiled resources), `assets/` (raw files), `lib/` (native `.so` libraries per ABI), and `META-INF/` (signature and manifest metadata). Understanding this map tells you which tool to reach for: jadx for dex, apktool for resources and smali, `aapt` for the manifest, `apksigner` for signatures. The mental model is "container first, content second" — before decompiling anything, list the archive so you know what you are dealing with and whether anything unusual (an unexpected `.so`, a large asset, a second dex) deserves attention.

## Method
1. List the archive with `unzip -l <LAB_APP>.apk`.
2. Identify manifest, dex files, resource table, and native libraries.
3. Count dex files — multiple dex indicates a large app or multidex.
4. Inspect `META-INF/` for signature files (`CERT.RSA`, `MANIFEST.MF` under v1).
5. Flag unusual entries such as embedded APKs, databases, or executables in `assets/`.

## Example
```
unzip -l <LAB_APP>.apk | head -30
# AndroidManifest.xml
# classes.dex
# classes2.dex
# resources.arsc
# META-INF/CERT.RSA
# lib/arm64-v8a/libnative.so
# assets/db/seed.db
```

| Entry | Meaning | Tool |
|---|---|---|
| classes.dex | App bytecode | jadx |
| resources.arsc | Resource table | apktool |
| META-INF | Signatures | apksigner |

## Common mistakes
Expecting readable XML in the APK; ignoring bundled databases or SDK assets; assuming one dex file.

## Defense and verification
Verify that shipped assets contain no secrets and that native libraries are expected. A known, minimal file inventory makes tampering easier to spot.

## Knowledge check
**Q:** Where would you look for the app's compiled Java/Kotlin logic and its signature, respectively? **A:** `classes*.dex` for logic and `META-INF/` for v1 signature metadata (v2/v3 data lives in the APK signing block).

===MODULE===
TITLE: 10 Reading the AndroidManifest.xml
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Decode and read the manifest to find components, permissions, exported flags, and security-relevant application attributes.
OBJECTIVES: Decode binary XML | Find exported components | Spot insecure app flags
TAKEAWAYS: exported is critical | debuggable and allowBackup matter | intent filters are entry points
PRACTICE: Decode the manifest of `<LAB_APP>` with `aapt dump xmltree` and mark every exported component, permission, and security-relevant application attribute.
SOURCES: None
---
## Core idea
`AndroidManifest.xml` is the app's declaration to the OS: what components exist, what they accept, what permissions they need, and how the app wants to run. Because it is binary XML inside the APK, you decode it with `aapt` or apktool rather than `cat`. The fields that matter most in a security review are `android:exported` (whether another app can invoke a component), `<intent-filter>` entries (implicit entry points), `android:debuggable`, `android:allowBackup`, `android:usesCleartextTraffic`, `android:networkSecurityConfig`, and `android:sharedUserId`. The mental model: the manifest is a map of trust boundaries the developer *declared*, and Android enforces those declarations. Misdeclaring `exported` or enabling debugging in a release build turns a design detail into a vulnerability.

## Method
1. Dump the manifest with `aapt dump xmltree <LAB_APP>.apk AndroidManifest.xml`.
2. List every `<activity>`, `<service>`, `<receiver>`, and `<provider>` and its `exported` value.
3. Note components with intent filters — on newer SDKs, a filter requires explicit `exported`.
4. Check application-level flags: `debuggable`, `allowBackup`, `usesCleartextTraffic`.
5. Record requested permissions and any custom `<permission>` definitions.

## Example
```
aapt dump xmltree <LAB_APP>.apk AndroidManifest.xml | grep -iE 'exported|scheme|debuggable|allowBackup'
# A: android:exported="true"
# A: android:debuggable="0xffffffff" (true)
# A: android:scheme="https"
```

| Attribute | Safe value | Risk if wrong |
|---|---|---|
| exported | false unless needed | External invocation |
| debuggable | false | Attach debugger |
| allowBackup | false for secrets | Data extraction |

## Common mistakes
Assuming no intent filter means not exported on old SDKs; missing `debuggable` in release builds; ignoring provider `exported` and grant rules.

## Defense and verification
Verify with runtime tools (`dumpsys package`) that the declared surface matches reality, and set `exported` explicitly for every component.

## Knowledge check
**Q:** Why is `android:debuggable="true"` dangerous in a production build? **A:** It allows debuggers and tooling to attach to the process, exposing memory and internal state that should be protected.

===MODULE===
TITLE: 11 Android Components: Activities, Services, Receivers, Providers
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn the four Android component types, how each is invoked, and how exported status determines who can reach them.
OBJECTIVES: Describe four component types | Identify exported components | Map components to risks
TAKEAWAYS: Components are entry points | exported controls reach | Providers guard structured data
PRACTICE: In an isolated emulator, take two apps you built and invoke each exported component type of `<LAB_APP>` using `adb` commands, recording which calls succeed.
SOURCES: None
---
## Core idea
Android apps are built from four component types, and each is a potential doorway. An **Activity** is a UI screen. A **Service** runs work in the background, started or bound. A **BroadcastReceiver** reacts to system or app announcements. A **ContentProvider** exposes structured data through a URI interface. The OS can only start a component if the manifest declares it and, for external callers, marks it `exported`. The mental model: a component is a public method on your app, and `exported` is its access modifier. An exported activity without permission checks can be launched by another app on the device; an exported provider with weak URI permissions can leak rows. Static review finds the declarations, while dynamic commands in your lab confirm actual reachability. Always pair "what the manifest says" with "what the device does."

## Method
1. Enumerate every component from the manifest and record `exported` and intent filters.
2. For each exported activity, find the required extras and any permission guard.
3. For services, check whether `onStartCommand` validates the caller or intent.
4. For receivers, identify the actions they accept and whether they validate the sender.
5. For providers, record authority, URI patterns, and read/write permissions.
6. Try invoking each from a second app you control in the lab; note successes and failures.

## Example
```
adb shell am start -n com.lab.app/.AdminActivity
# Error type 3: Activity not started (permission denial)
adb shell am startservice -n com.lab.app/.SyncService
adb shell content query --uri content://com.lab.app.provider/tokens
```

| Component | Invoked by | Typical risk |
|---|---|---|
| Activity | `am start` | UI spoof, token in extra |
| Service | `am startservice` | Unauthorized work |
| Receiver | `am broadcast` | Fake event injection |
| Provider | `content` | Data leakage |

## Common mistakes
Testing only activities; assuming implicit filters make a component safe; ignoring provider path permissions.

## Defense and verification
Set `exported="false"` unless cross-app access is required; protect remaining components with signature-level permissions and validate all inputs. Verify with a second-app invocation test.

## Knowledge check
**Q:** Which component exposes structured data via a URI and needs careful permission checks? **A:** The ContentProvider — it supports query/insert/update/delete and must restrict URIs and read/write access.

===MODULE===
TITLE: 12 Intents: Explicit vs Implicit
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Understand how intents route actions between components and how implicit intents can be intercepted in an authorized lab.
OBJECTIVES: Distinguish explicit and implicit intents | Read intent extras | Identify interception risk
TAKEAWAYS: Explicit names a class | Implicit matches filters | Extras are untrusted input
PRACTICE: With two apps you control on an isolated emulator, send an implicit intent from `<LAB_APP>` and register a competing receiver to observe resolution and data exposure.
SOURCES: None
---
## Core idea
An Intent is a message describing an operation: an action, data URI, category, component name, and a bundle of extras. An **explicit** intent names the exact target class; an **implicit** intent lets Android resolve a target by matching intent filters. The mental model: explicit intents are a direct phone call, implicit intents are a public announcement that anyone listening may answer. If a sensitive value is placed in an implicit intent's extras, any app whose filter matches can receive it — a classic information disclosure in a multi-app device context. Likewise, an app that *receives* implicit intents must treat extras as untrusted, because any app can send them. Both directions matter: the sender may leak, and the receiver may be tricked.

## Method
1. Search decompiled code for `new Intent(` and note whether `setComponent`/`setPackage` is used.
2. Classify each intent as explicit or implicit by checking for a target class name.
3. List extras attached to implicit intents and flag sensitive ones (tokens, paths, PII).
4. On the receiving side, check whether incoming extras are validated before use.
5. In the lab, register a competing filter and observe which app Android chooses.

## Example
```
adb shell am start -a android.intent.action.VIEW -d https://lab.example/reset?token=abc
# Resolves to a browser or any app declaring a matching filter
adb shell dumpsys package <LAB_APP> | grep -A8 'Activity Resolver Table'
```

| Intent type | Target | Risk |
|---|---|---|
| Explicit | Named class | Lower, still validate extras |
| Implicit | Filter match | Interception / data leak |
| Broadcast | Registered receivers | Spoofed events |

## Common mistakes
Putting secrets in implicit extras; assuming the app's own component always wins resolution; trusting incoming extras without validation.

## Defense and verification
Use explicit intents with `setPackage` for internal navigation; validate all incoming extras. Verify by checking logs that no unintended receiver can be resolved.

## Knowledge check
**Q:** Why should a token never be in an implicit intent extra? **A:** Because any app with a matching intent filter can receive the intent and read the extra.

===MODULE===
TITLE: 13 Deep Links and App Links
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn how custom-scheme deep links and verified HTTPS App Links route into an app, and how to test them safely in your own lab.
OBJECTIVES: Distinguish custom schemes from App Links | Test link handlers | Spot token-in-URL leaks
TAKEAWAYS: Custom schemes are unverified | App Links use domain verification | Links are untrusted input
PRACTICE: In an isolated emulator, define a `labapp://` scheme in `<LAB_APP>` and open it via `adb shell am start`, logging how parameters are parsed.
SOURCES: None
---
## Core idea
Deep links let a web URL open a native screen. A **custom scheme** like `labapp://reset` is declared by an intent filter, but Android does not verify that the app owns the scheme — any app can claim it. An **Android App Link** uses `http`/`https` plus `android:autoVerify="true"` and a hosted `assetlinks.json` file proving domain ownership, so the OS binds the host to your app. The mental model: custom schemes are "first come, first served," App Links are "identity proven by the domain." Security issues arise when links carry sensitive parameters (reset tokens, one-time codes) or when the handler trusts link input without validation. In an authorized lab you control the scheme and the domain, so you can observe parsing and confirm that no secrets travel in URLs.

## Method
1. Find intent filters with `<data android:scheme=...>` and note `android:host`.
2. Determine whether `autoVerify` is set and whether a matching `assetlinks.json` exists.
3. Identify activities that read `Intent.getData()` and which query parameters they consume.
4. Check for tokens or identifiers embedded in the URL.
5. In the lab, launch each link type with `am start` and record the parsed output.

## Example
```
adb shell am start -a android.intent.action.VIEW -d 'labapp://reset?token=abc123' <LAB_APP>/.LinkActivity
adb shell am start -a android.intent.action.VIEW -d 'https://lab.example/reset?code=123' <LAB_APP>/.LinkActivity
# Logcat: token=abc123 parsed by LinkActivity
```

| Link type | Verification | Risk |
|---|---|---|
| Custom scheme | None | Hijack / leak |
| App Link | assetlinks.json | Lower if verified |
| Cleartext http | None | Tampering in transit |

## Common mistakes
Placing reset tokens in URLs; forgetting `autoVerify` or a valid assetlinks file; trusting link parameters without checks.

## Defense and verification
Prefer verified App Links over custom schemes, avoid secrets in URLs, and validate all parameters. Verify `adb shell am start` behavior and check `assetlinks.json` with the Google statement list tool.

## Knowledge check
**Q:** What makes an App Link more trustworthy than a custom-scheme deep link? **A:** HTTPS plus `assetlinks.json` domain verification proves the app owns the host, preventing other apps from claiming it.

===MODULE===
TITLE: 14 Activity and Task Hijacking
LEVEL: Advanced
MINUTES: 50
SUMMARY: Understand how task and launch-mode misconfiguration can let a malicious app in your lab overlay or hijack an activity, and how to prevent it.
OBJECTIVES: Explain task affinity and launch modes | Recognize hijack conditions | Configure safe defaults
TAKEAWAYS: taskAffinity matters | singleTask can be abused | Validate the calling activity
PRACTICE: Using two apps you control on an isolated emulator, craft a task-affinity overlay against `<LAB_APP>`'s exported activity and observe the behavior, then apply a fix and retest.
SOURCES: None
---
## Core idea
Android groups activities into tasks with a `taskAffinity` and controls instantiation with `launchMode` values like `standard`, `singleTop`, `singleTask`, and `singleInstance`. When an exported activity uses a launch mode that reuses a task, a malicious app with the *same task affinity* can arrange its own activity to be on top and capture what the user sees — a task/activity hijack, sometimes called a "strandHogg" style attack. The mental model: a task is a stack of screens, and affinity decides which stack an activity joins. If you let an attacker choose or influence that stack with an exported entry point, they can place a look-alike screen above yours. Defenses center on reducing export, setting explicit `taskAffinity`, using `singleTask` carefully, and checking the caller at runtime. All experiments here are confined to apps you own in an isolated emulator.

## Method
1. Find exported activities and record `launchMode` and `taskAffinity`.
2. Note any activity that handles credentials or sensitive flows.
3. In your lab, build a second app declaring the same `taskAffinity` and launch the target activity via an explicit intent.
4. Observe whether your activity lands in the attacker's task stack and whether it appears on top.
5. Apply a fix (unique affinity, `exported=false`, or caller validation) and repeat the test.

## Example
```
adb shell am start -n com.lab.attacker/.Fake -n com.lab.victim/.Login
# Observe: victim Login activity appears in attacker's task stack
adb shell dumpsys activity activities | grep -A5 'TaskRecord'
```

| Setting | Safe posture | Risk if loose |
|---|---|---|
| taskAffinity | Unique per app | Stack injection |
| launchMode | standard / singleTop | Reuse abuse |
| exported | false | External launch |

## Common mistakes
Testing only one app and missing cross-app stack behavior; leaving a sensitive login activity exported without need; assuming recent Android versions fully remove the risk.

## Defense and verification
Set a unique `taskAffinity`, avoid `singleTask` on exported screens, and validate `getCallingActivity()`/package before sensitive UI. Verify retest shows no attacker-controlled stack.

## Knowledge check
**Q:** Why can a shared `taskAffinity` enable hijacking? **A:** It lets another app's activity join the same task stack, allowing it to sit above or intercept a sensitive screen.

===MODULE===
TITLE: 15 PendingIntent and Intent Redirection
LEVEL: Advanced
MINUTES: 50
SUMMARY: Learn how PendingIntents and forwarded intents can be abused when the base intent is attacker-influenced, and how to construct them safely.
OBJECTIVES: Explain PendingIntent semantics | Spot intent redirection | Apply immutability flags
TAKEAWAYS: PendingIntent carries caller identity | Fill-in intent is dangerous | Use immutable flags
PRACTICE: In an isolated emulator, modify a lab app you control to forward an incoming intent extra into a `startActivity` call, then demonstrate and fix the redirection with explicit target and flags.
SOURCES: None
---
## Core idea
A `PendingIntent` is a token that lets another app execute an action *as your app*, with your app's identity and permissions. If a PendingIntent is built from an implicit or attacker-influenced base intent, the receiver can redirect that authority to an unintended component — a confused-deputy problem. Related is **intent redirection**: an exported component takes an incoming Intent (often in an extra like `extraIntent`) and passes it to `startActivity` or `startService`. If the caller can fill in an arbitrary action or component, they pivot your app's privileges to launch any of your private components or grant URI access. The mental model: never let data from an untrusted caller become the *routing instructions* for a privileged operation. Use explicit intents and immutable PendingIntent flags (`FLAG_IMMUTABLE`), and isolate WebView or provider access behind strict checks.

## Method
1. Search for `PendingIntent.getActivity/getService` calls and inspect the base intent.
2. Flag implicit base intents or ones with mutable `fillIn` behavior.
3. Find components that take an Intent extra and forward it to an Android API.
4. Check whether the forwarded intent can target arbitrary components or URIs.
5. In the lab, supply a crafted extra that redirects to a private component, then fix and retest.

## Example
```
// Vulnerable lab pattern (do not ship)
Intent in = getIntent().getParcelableExtra("next");
startActivity(in);  // caller controls routing
// Fix: explicit, immutable
Intent fixed = new Intent(this, SafeActivity.class);
PendingIntent pi = PendingIntent.getActivity(this, 0, fixed, PendingIntent.FLAG_IMMUTABLE);
```

| Pattern | Risk | Fix |
|---|---|---|
| Implicit base PendingIntent | Redirected action | Explicit base |
| Forwarded `next` extra | Privilege pivot | Validate/whitelist |
| Mutable flags | Caller edits intent | FLAG_IMMUTABLE |

## Common mistakes
Treating a PendingIntent as harmless because it is just a token; whitelisting by action string instead of class; forgetting that URI grants ride along in intents.

## Defense and verification
Construct explicit intents, use `FLAG_IMMUTABLE`, and never forward caller-supplied intents wholesale. Verify with a lab app that attempts redirection and fails after the fix.

## Knowledge check
**Q:** Why is a mutable PendingIntent with an implicit base dangerous? **A:** The holder can change its action or target, so your app's identity executes an operation it never intended.

===MODULE===
TITLE: 16 Broadcast Receivers and Sticky Broadcasts
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Examine how broadcast receivers accept system and app messages, and why exported receivers need validation and permission guards.
OBJECTIVES: Classify broadcast types | Validate incoming broadcasts | Guard sensitive receivers
TAKEAWAYS: Dynamic vs manifest receivers | Sticky broadcasts carry data | exported means reachable
PRACTICE: On an isolated emulator, register a receiver in `<LAB_APP>` for a custom action and send forged broadcasts from a second app you control to test validation.
SOURCES: None
---
## Core idea
Broadcast receivers are event listeners: they react to actions such as `BOOT_COMPLETED` or a custom `com.lab.REFRESH` string. Receivers declared in the manifest are persistent; dynamically registered ones live only while the app is running. An exported receiver can accept broadcasts from any app, so any action it trusts is an injection point. Historically, **sticky broadcasts** stored a last value that new receivers could read, leaking data such as battery or SMS state; they are deprecated but still appear in older code. The mental model: a broadcast is an unauthenticated announcement. Unless you attach a signature-level permission or validate the sender, assume a malicious app on the device can send it. Sensitive actions triggered by broadcasts — token refresh, data wipe, state changes — deserve explicit protection.

## Method
1. List receivers in the manifest with their `exported` flag and accepted actions.
2. Identify any custom action tied to a sensitive state change.
3. Check whether the receiver verifies a permission or sender identity.
4. Look for sticky broadcasts or reading of sticky data in legacy code.
5. In the lab, send forged actions from a second app and observe responses.

## Example
```
adb shell am broadcast -a com.lab.REFRESH --es token forged
# <LAB_APP>: "REFRESH handled"  (no permission check)
adb shell dumpsys package <LAB_APP> | grep -A12 'Receiver Resolver Table'
```

| Receiver type | Lifetime | Risk |
|---|---|---|
| Manifest | Persistent | Always listening |
| Dynamic | While registered | Context-dependent |
| Sticky (legacy) | Stored value | Data exposure |

## Common mistakes
Assuming only the OS can send a broadcast; using custom actions without a signature permission; leaving legacy sticky-data reads in place.

## Defense and verification
Restrict exported receivers with `android:permission`, prefer explicit broadcasts to a known package, and validate payloads. Verify forged broadcasts are ignored after hardening.

## Knowledge check
**Q:** Why should a receiver that wipes user data require a signature-level permission? **A:** Otherwise any app on the device could send the broadcast and trigger a destructive action.

===MODULE===
TITLE: 17 Android Storage: Internal, External, and Scoped Storage
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn where Android apps can write data and which locations expose that data to other apps or users.
OBJECTIVES: Compare storage locations | Choose safe storage for secrets | Understand scoped storage
TAKEAWAYS: Internal is private | External is shared | Scoped storage limits paths
PRACTICE: In an isolated emulator, have `<LAB_APP>` write a harmless marker file to internal storage and to app-specific external storage, then inspect visibility from a second app or shell.
SOURCES: None
---
## Core idea
Android offers several storage zones with different exposure. **Internal storage** (`/data/data/<package>/`) is private to the app's UID and is the right place for tokens and databases. **App-specific external storage** (`/sdcard/Android/data/<package>/`) is removed with the app and, since scoped storage, is accessible to the owning app without broad permissions. **Shared/public external storage** (MediaStore, Downloads) is visible to other apps and the user — fine for photos, never for secrets. **SharedPreferences** are XML in internal storage and are only as safe as the data you put there. Scoped storage (Android 10+) restricts arbitrary paths and forces structured MediaStore access. The mental model: ask "who else can read this path?" before writing. A token in `MODE_WORLD_READABLE` or on public storage is a disclosure even on a non-rooted device.

## Method
1. Find all writes: `openFileOutput`, `getExternalFilesDir`, `MediaStore`, SQLite, and SharedPreferences.
2. For each, classify the storage zone and who can read it.
3. Flag secrets written to external or world-readable locations.
4. Check for `allowBackup="true"` which can export internal data via `adb backup` on older Android.
5. In the lab, write a marker file and verify cross-app visibility.

## Example
```
adb shell ls -l /data/data/<LAB_APP>/shared_prefs/
# -rw-rw---- u0_a121 u0_a121 prefs.xml   (private-ish; check modes)
adb shell ls -l /sdcard/Android/data/<LAB_APP>/files/
adb shell run-as <LAB_APP> cat shared_prefs/prefs.xml   # debuggable lab build only
```

| Location | Visibility | Suitable for secrets |
|---|---|---|
| Internal | App UID only | Yes |
| App-specific external | App + shell/owner | No |
| Public external | Many apps | Never |

## Common mistakes
Putting credentials in SharedPreferences unencrypted; assuming external means "hidden"; ignoring backup/auto-backup behavior.

## Defense and verification
Store secrets in internal storage at minimum, ideally encrypted via Keystore-backed keys, and disable `allowBackup` for sensitive data. Verify file modes and cross-app reads in the lab.

## Knowledge check
**Q:** Why must secrets never go to public external storage? **A:** It is readable by other apps and the user, so confidentiality cannot be guaranteed.

===MODULE===
TITLE: 18 The Android Keystore System
LEVEL: Advanced
MINUTES: 50
SUMMARY: Learn how hardware-backed keys protect cryptographic material and how to use Keystore correctly for secrets in an authorized lab app.
OBJECTIVES: Explain hardware-backed keys | Generate and use a key | Recognize misuse patterns
TAKEAWAYS: Keys never leave secure hardware | StrongBox is stronger | Key invalidation matters
PRACTICE: In your own `<LAB_APP>` lab project, generate an AES key in Android Keystore, encrypt a test string, and confirm the raw key bytes are not present in a heap dump you take yourself.
SOURCES: None
---
## Core idea
The Android Keystore is a container for cryptographic keys where the key material is generated and stored such that it is difficult to extract from the device. On supported hardware, keys live in the Trusted Execution Environment or StrongBox and never appear in app memory in plaintext. You ask the keystore to perform operations (sign, encrypt) rather than handing it a key byte array. This shifts the security boundary from "protect a secret file" to "authorize an operation," often gated by user authentication or a lock-screen state. The mental model: you hold a *handle* to a key, not the key itself. Misuse includes generating a key in code and then storing it in SharedPreferences, ignoring `setInvalidatedByBiometricEnrollment`, or assuming a software-backed key is hardware-protected on all devices. Always check `isHardwareBackedKey` and key properties in your lab.

## Method
1. Find key generation in code (`KeyGenParameterSpec`, `KeyStore.getInstance("AndroidKeyStore")`).
2. Check the key purpose, sizes, authentication requirements, and invalidation flags.
3. Verify the app never calls `getEncoded()` on the private key or writes it to disk.
4. Confirm encrypted data is stored in internal storage.
5. In the lab, generate a key, use it, and inspect for raw key bytes in memory or files.

## Example
```
adb shell cmd keystore2 list <LAB_APP>
adb shell dumpsys keystore | grep -A6 <LAB_APP>
# Key: lab_aes, hardware-backed=true, purposes=ENCRYPT|DECRYPT
```

| Property | Safe setting | Why |
|---|---|---|
| Hardware backed | true | Extraction resistant |
| User auth | Required for sensitive ops | Binding to user |
| Invalid on enrollment | true | Revoke on new biometric |

## Common mistakes
Assuming every device is hardware-backed; storing a copy of the key elsewhere; skipping authentication requirements for high-value keys.

## Defense and verification
Verify with `KeyInfo.isInsideSecureHardware()` and lab memory inspection. Defensively rotate keys, bind to authentication, and invalidate on biometric enrollment changes.

## Knowledge check
**Q:** Why does Keystore prefer performing operations in-place over returning key bytes? **A:** Because keeping the key inside secure hardware prevents extraction from app memory or filesystem.

===MODULE===
TITLE: 19 WebView Security
LEVEL: Intermediate
MINUTES: 50
SUMMARY: Learn the WebView settings that turn a harmless embedded browser into a bridge for JavaScript, file access, and token theft.
OBJECTIVES: Audit WebView settings | Understand JS bridges | Prevent local file access
TAKEAWAYS: JS enabled needs care | addJavascriptInterface is powerful | file:// access must be off
PRACTICE: In an isolated emulator, build a `<LAB_APP>` WebView that loads a local HTML file you wrote, then toggle `javaScriptEnabled`, `allowFileAccess`, and a JS bridge to observe the changed attack surface.
SOURCES: None
---
## Core idea
A WebView embeds a browser engine inside the app, making web content and native code share a process. That convenience creates risk: `setJavaScriptEnabled(true)` runs page scripts, `addJavascriptInterface` exposes native methods to those scripts, `setAllowFileAccess(true)` lets pages touch local files, and `setMixedContentMode` can allow insecure content. If a WebView loads attacker-influenced HTML — through a deep link, an open redirect, or an insecure network page — injected JavaScript can call exposed native methods or read local files. The mental model: a WebView is a sandbox *inside* your sandbox, and the bridge is a controlled hole between them. In a lab app you control, you can safely load local pages and observe exactly how each setting changes what script can reach.

## Method
1. Find every WebView creation and record `getSettings()` configuration.
2. Flag `setJavaScriptEnabled(true)` combined with remote or untrusted URLs.
3. Search for `addJavascriptInterface` and note which methods are exposed.
4. Check `allowFileAccess`, `allowContentAccess`, `allowFileAccessFromFileURLs`, and mixed-content settings.
5. Verify URLs loaded into the WebView are not derived from untrusted intent extras.

## Example
```
// Lab-only test harness
webView.getSettings().setJavaScriptEnabled(true);
webView.getSettings().setAllowFileAccess(true);   // risky with JS
webView.addJavascriptInterface(new Bridge(), "Android");
// Loaded page: <script>Android.getToken()</script>
```

| Setting | Risk when true | Safer default |
|---|---|---|
| javaScriptEnabled | Script injection | Only for trusted content |
| allowFileAccess | Local file read | false |
| JS interface | Native method exposure | Restrict & annotate |

## Common mistakes
Enabling all settings "to make it work" and never tightening; exposing broad interfaces; loading remote URLs from intent extras.

## Defense and verification
Disable file access, restrict JS to trusted pages, and annotate/interfaces with `@JavascriptInterface` only on minimal methods. Verify in the lab that a local script cannot reach native methods after hardening.

## Knowledge check
**Q:** Why is `allowFileAccessFromFileURLs` dangerous with JavaScript enabled? **A:** It lets script running from a local file read other local files, enabling data theft through injected HTML.

===MODULE===
TITLE: 20 Common Cryptographic Mistakes in Mobile Apps
LEVEL: Advanced
MINUTES: 50
SUMMARY: Recognize recurring crypto failures in mobile code — weak algorithms, static keys, bad randomness, and ECB mode — and verify fixes in your own lab app.
OBJECTIVES: Spot weak primitives | Find hardcoded keys | Verify correct usage
TAKEAWAYS: Don't invent crypto | Keys belong in Keystore | Randomness must be secure
PRACTICE: In `<LAB_APP>` you control, replace a lab-only hardcoded AES key and ECB mode with Keystore-backed AES-GCM, then confirm the old ciphertext no longer decrypts.
SOURCES: None
---
## Core idea
Mobile apps repeatedly fail cryptography in predictable ways: using ECB mode (identical plaintext blocks produce identical ciphertext), AES with a hardcoded key in the binary, MD5/SHA-1 for signatures or password hashes, `Random` instead of `SecureRandom`, and encryption without authentication (no integrity tag). The mental model: encryption provides confidentiality only when the key is protected, the mode is appropriate, and the ciphertext is authenticated. A hardcoded key is not a secret at all — anyone with the APK can extract it. Static analysis finds algorithm names and constants; dynamic analysis confirms what is actually used at runtime. All examples here are lab-only demonstrations with keys you generate yourself, never material from real services.

## Method
1. Grep decompiled code for algorithm strings: `AES/ECB`, `MD5`, `SHA1`, `DES`, `Random`.
2. Look for byte arrays or Base64 strings that look like keys near cipher initialization.
3. Check for integrity: is AES-GCM or HMAC used, or only raw CBC/ECB?
4. Verify randomness uses `SecureRandom` for tokens and nonces.
5. In the lab, replace weak code with Keystore-backed AES-GCM and confirm behavior.

## Example
```
// Weak lab-only pattern
Cipher.getInstance("AES/ECB/PKCS5Padding");
byte[] key = "labstatickey1234".getBytes();
// Fixed
Cipher.getInstance("AES/GCM/NoPadding");
// key from AndroidKeyStore, random IV per message
```

| Mistake | Consequence | Fix |
|---|---|---|
| ECB mode | Pattern leakage | GCM/CBC+MAC |
| Hardcoded key | Key extraction | Keystore |
| java.util.Random | Predictable tokens | SecureRandom |

## Common mistakes
Assuming "encrypted" means safe; reusing an IV/nonce; confusing encoding (Base64) with encryption; rolling a custom cipher.

## Defense and verification
Use vetted libraries and platform APIs, authenticated encryption, and hardware-backed keys. Verify in the lab by checking ciphertext randomness and absence of key strings in the APK.

## Knowledge check
**Q:** Why is a hardcoded AES key in an app effectively public? **A:** Anyone who obtains the APK can decompile it or search the binary and recover the key bytes.

===MODULE===
TITLE: 21 Data at Rest, Logcat, and Clipboard Leakage
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Find the quiet places secrets escape an app — logs, clipboard, screenshots, and caches — and verify they are cleaned up in a lab.
OBJECTIVES: Audit logging calls | Find clipboard and cache leaks | Check screenshot protection
TAKEAWAYS: Logs are globally readable | Clipboard is shared | Caches outlive sessions
PRACTICE: Run `<LAB_APP>` in an isolated emulator while capturing `adb logcat`, copying a test value to the clipboard, and backgrounding the app, then document every place the value appears.
SOURCES: None
---
## Core idea
Not every leak is a database file. Android's `logcat` is a system-wide stream other apps and tooling can read (within permissions), so `Log.d("token", value)` turns a secret into a public broadcast. The clipboard is a shared system service — anything copied can be pasted by another app. Background snapshots may show sensitive screens in the recent-apps switcher unless `FLAG_SECURE` is set. WebView caches, HTTP caches, and crash reports can persist data beyond logout. The mental model: trace the *afterlife* of a secret — where does it go after the feature completes? Static review finds `Log.*`, `ClipboardManager`, and cache APIs; dynamic review with `logcat` and filesystem diffs confirms actual exposure. These are low-effort findings that matter because they require no sophisticated attacker.

## Method
1. Grep code for `Log.`, `System.out.print`, `Timber`, and exception stack traces that include data.
2. Find `ClipboardManager` usage and note what is copied and whether it is cleared.
3. Check for `FLAG_SECURE` on screens showing sensitive content.
4. Inspect cache directories and HTTP cache configuration.
5. In the lab, capture `logcat` during a full workflow and diff `/sdcard` and `/data/media` for artifacts.

## Example
```
adb logcat -c && adb logcat -d | grep -iE 'token|password|secret'
# D/TokenFlow: token=eyJhbGciOi...   (leak in lab app)
adb shell ls -R /sdcard/Android/data/<LAB_APP>/cache
adb shell dumpsys activity activities | grep mResumedActivity
```

| Channel | Exposure | Control |
|---|---|---|
| logcat | System-wide | Strip logs in release |
| Clipboard | Other apps | Clear after use |
| Recents snapshot | Other users of device | FLAG_SECURE |

## Common mistakes
Removing only explicit logs but leaving library logs; forgetting clipboard persistence; ignoring crash-report payloads.

## Defense and verification
Use ProGuard/R8 to strip logging in release builds, clear the clipboard after use, set `FLAG_SECURE` on sensitive screens, and clear caches on logout. Verify by repeating the lab capture after fixes.

## Knowledge check
**Q:** Why is `Log.d` with a session token a real disclosure rather than a debugging convenience? **A:** Logcat output is readable system-wide, so other apps or connected tooling can capture the token.

===MODULE===
TITLE: 22 Secure Network Communication Fundamentals
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Understand TLS verification, cleartext traffic, and certificate validation on Android before intercepting anything in a lab proxy.
OBJECTIVES: Explain TLS trust chain | Find cleartext traffic | Identify custom trust managers
TAKEAWAYS: TLS protects in transit | Trust-all managers break it | Config governs cleartext
PRACTICE: With `<LAB_APP>` on an isolated emulator, run it over HTTP and HTTPS against your own lab server, capturing both and confirming when data is exposed.
SOURCES: None
---
## Core idea
Mobile apps spend most of their life talking to APIs over HTTPS. TLS provides confidentiality and server authentication, but only when the app actually validates certificates. Common failures: `usesCleartextTraffic="true"` sending secrets over HTTP, a custom `TrustManager` that accepts every certificate, and a network security config that trusts user CA certificates in production. The mental model: TLS is a locked channel whose lock is the certificate chain; a trust-all manager throws away the key. Android's network security config (`res/xml/network_security_config.xml`) centrally controls cleartext, trust anchors, and pin sets. In your isolated lab you will deliberately use a proxy CA to observe traffic — a controlled exception, not a production pattern. Understanding the correct baseline first keeps lab exceptions clearly bounded.

## Method
1. Check the manifest for `usesCleartextTraffic` and `networkSecurityConfig`.
2. Search code for `TrustManager`, `X509TrustManager`, `HostnameVerifier`, and `SSLSocketFactory`.
3. Identify hosts in cleartext URLs and any redirect from HTTPS to HTTP.
4. Read the network security config for `<domain-config>` and `<trust-anchors>`.
5. In the lab, capture traffic with your own proxy certificate and note what is visible.

## Example
```
adb shell am start -a android.intent.action.VIEW -d http://lab.local/api
# Proxy capture: GET http://lab.local/api -> plaintext body visible
grep -R "TrustManager" <LAB_APP>_src/
# class TrustAllX509 implements X509TrustManager { checkServerTrusted() {} }
```

| Configuration | Safe default | Risk |
|---|---|---|
| usesCleartextTraffic | false | Sniffing / tampering |
| Trust all manager | absent | MitM |
| Trust user CA | debug only | Interception |

## Common mistakes
Assuming HTTPS means validated; leaving debug trust settings in release builds; allowing cleartext for "internal" hosts.

## Defense and verification
Enforce TLS, remove trust-all managers, and limit user-CA trust to debug builds. Verify with a capture that untrusted certificates are rejected.

## Knowledge check
**Q:** What does a `TrustManager` with an empty `checkServerTrusted` do? **A:** It accepts any server certificate, defeating server authentication and enabling man-in-the-middle interception.

===MODULE===
TITLE: 23 iOS Security Architecture Overview
LEVEL: Beginner
MINUTES: 30
SUMMARY: Build a mental model of iOS security layers — hardware, boot chain, codesigning, sandbox, and data protection — for later iOS modules.
OBJECTIVES: Describe iOS security layers | Contrast with Android | Locate enforcement points
TAKEAWAYS: Codesigning is mandatory | Sandbox is mandatory | Secure Enclave anchors keys
PRACTICE: On a simulator you control, note which security features are present versus a real device, and record three differences you must account for in later labs.
SOURCES: None
---
## Core idea
iOS security is a chain anchored in hardware. Secure Boot validates each boot stage, and the Secure Enclave provides a hardware root for key operations and biometrics. Every executable must be signed by Apple-issued certificates and provisioned; unsigned code will not run on a non-jailbroken device. At runtime, each app gets a unique sandbox enforced by the kernel, restricting filesystem and IPC access. Data protection classes add a second layer by encrypting files with keys tied to device state and user authentication. The mental model: where Android distributes trust between developer keys and the OS, iOS centralizes it through Apple's signing infrastructure and the Secure Enclave. A simulator is useful for behavior but lacks several hardware protections, so note that limitation in any lab work.

## Method
1. Sketch the layers: hardware/Secure Enclave, boot chain, kernel, codesigning, sandbox, data protection, app.
2. For each Android concept, find the iOS counterpart and one difference.
3. Identify where user consent appears (permissions, Keychain access, Face ID).
4. Record which controls are absent or weaker in a simulator.
5. Decide which later tests need a real device versus a simulator.

## Example
```
# On a macOS lab host with a simulator booted
xcrun simctl list devices | grep Booted
# iPhone 15 Pro (Booted) - UDID ...
# Note: Secure Enclave and data protection are simulated, not hardware-backed
```

| Layer | Android | iOS |
|---|---|---|
| Signing | Developer key | Apple-issued cert |
| Isolation | UID + SELinux | Sandbox profile |
| Key store | Keystore/TEE | Keychain/SEP |

## Common mistakes
Assuming simulator results transfer to a device; treating iOS sandbox like Android's UID model; ignoring codesigning as a gate.

## Defense and verification
Document device versus simulator in every iOS lab. Corroborate security-relevant behavior on a real device when hardware protection matters.

## Knowledge check
**Q:** Why can't an arbitrary unsigned app run on a standard iPhone? **A:** iOS enforces mandatory code signing and provisioning through certificates issued by Apple, so only approved, signed binaries execute.

===MODULE===
TITLE: 24 iOS Code Signing and Provisioning
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn how certificates, app IDs, entitlements, and provisioning profiles combine to authorize an iOS build in an authorized development lab.
OBJECTIVES: Identify signing inputs | Explain provisioning | Verify a signed app
TAKEAWAYS: Cert links identity | Profile links app and entitlements | Entitlements gate capabilities
PRACTICE: In your own Xcode project for `<LAB_APP>`, create a development signing setup, build to a simulator you control, and inspect the entitlements in the resulting app bundle.
SOURCES: None
---
## Core idea
An iOS build will not launch unless it is signed with a valid certificate and covered by a provisioning profile. The **certificate** ties a signing identity (you or your team) to a private key. The **App ID** identifies the bundle identifier and enabled capabilities. The **provisioning profile** binds certificate, App ID, entitlements, and device UDIDs (for development). **Entitlements** are key-value claims like keychain-access-groups, associated domains, or push notifications that the OS enforces. The mental model: the profile is a permission slip from Apple describing who you are, which app you are, and what you may do. In a lab you control the team and bundle ID, so signing is a configuration exercise, not an attack. Entitlements discovered later tell you which capabilities an app legitimately claims.

## Method
1. In your Xcode project, inspect Signing & Capabilities for team, bundle ID, and profile.
2. Build `<LAB_APP>` to your own simulator or device and locate the `.app` bundle.
3. Dump entitlements with `codesign -d --entitlements` on the built product.
4. Note which entitlements are default versus explicitly enabled.
5. Compare debug and release profiles for differences in device scope and capabilities.

## Example
```
codesign -d --entitlements :- <LAB_APP>.app
# <?xml ...><plist>
#  <key>com.apple.developer.associated-domains</key>
#  <array><string>applinks:lab.example</string></array>
```

| Input | Role |
|---|---|
| Certificate | Identifies signer |
| App ID | Bundle ID + capabilities |
| Profile | Binds cert, app, devices, entitlements |

## Common mistakes
Assuming entitlements are optional; using a profile with broad capabilities in production; mixing debug and release identities.

## Defense and verification
Verify the shipped entitlements match the app's needs and that release builds use the correct profile. Reduce entitlements to the minimum required.

## Knowledge check
**Q:** What does a provisioning profile authorize? **A:** It binds a signing certificate, a specific App ID, entitlements, and (for development) devices, permitting the app to launch with those capabilities.

===MODULE===
TITLE: 25 iOS Entitlements and the App Sandbox
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Understand how entitlements grant capabilities and how the iOS sandbox confines apps at the filesystem and IPC level.
OBJECTIVES: Read entitlements | Explain sandbox confinement | Relate entitlements to attack surface
TAKEAWAYS: Sandbox is default-deny | Entitlements are explicit grants | Containers isolate apps
PRACTICE: On a simulator you control, inspect `<LAB_APP>`'s sandbox container directories and confirm a second app you built cannot read them.
SOURCES: None
---
## Core idea
Every iOS app runs inside a sandbox that denies access by default. It can read its own container (`/var/mobile/Containers/Data/Application/<UUID>/`) but not another app's, and system privileges require explicit entitlements. Entitlements such as `com.apple.security.application-groups`, `keychain-access-groups`, `inter-app-audio`, and `associated-domains` create controlled exceptions to the sandbox — they widen the boundary in specific, OS-enforced ways. The mental model: the sandbox is a closed room; entitlements are doors the OS cuts, not holes the app can drill itself. From a security view, each entitlement is part of the attack surface: an overly broad keychain group or associated domain can be abused if the app mishandles data. Reading entitlements therefore precedes testing storage, Keychain, and links.

## Method
1. Dump entitlements from your built `<LAB_APP>` with `codesign`.
2. For each entitlement, state which boundary it relaxes.
3. Map keychain-access-groups to Keychain items and app-group containers.
4. Inspect the app's container directories on your simulator.
5. Attempt cross-app reads from a second app you control and record denials.

## Example
```
codesign -d --entitlements :- <LAB_APP>.app | grep -A3 'application-groups'
xcrun simctl get_app_container booted com.lab.app data
# .../Containers/Data/Application/UUID/
```

| Entitlement | Boundary relaxed |
|---|---|
| keychain-access-groups | Shared Keychain items |
| application-groups | Shared container directory |
| associated-domains | Universal Link ownership |

## Common mistakes
Treating entitlements as harmless metadata; granting groups "just in case"; assuming simulator containers enforce exactly like a device.

## Defense and verification
Request only required entitlements and verify container isolation with a second app. Audit entitlements during release review against documented needs.

## Knowledge check
**Q:** What does `com.apple.security.application-groups` allow? **A:** It lets apps from the same team share a container directory through an OS-enforced group, bypassing the normal per-app container isolation.

===MODULE===
TITLE: 26 iOS Keychain and Data Protection Classes
LEVEL: Advanced
MINUTES: 50
SUMMARY: Learn how the iOS Keychain stores small secrets and how data protection classes bind items to device lock and user authentication.
OBJECTIVES: Explain Keychain attributes | Choose protection classes | Audit item accessibility
TAKEAWAYS: Keychain is encrypted storage | Classes gate availability | ACLs control access
PRACTICE: In an app you control on a simulator, write a test Keychain item with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`, then dump the item's attributes and confirm when it is readable.
SOURCES: None
---
## Core idea
The iOS Keychain is an encrypted database for small secrets — tokens, passwords, keys — managed by the OS and backed by the Secure Enclave on modern devices. Items carry attributes: a service/account pair, an access group, and an **accessibility class** that defines when the item is available. Classes range from `WhenUnlocked` (only while unlocked) to `AfterFirstUnlock` (available after the first unlock until reboot) and `Always`; the `ThisDeviceOnly` variants prevent migration to another device via backup. The mental model: the Keychain is a safe whose combination changes with device state. Choosing `Always` or a migratable class for a high-value token weakens protection. In a lab you control the items and can inspect attributes without touching real credentials.

## Method
1. Search code for `SecItemAdd`, `SecItemCopyMatching`, and `kSecAttrAccessible*`.
2. List each item's service, account, access group, and accessibility class.
3. Flag `Always` or non-`ThisDeviceOnly` classes for sensitive secrets.
4. Check for `kSecAccessControl` with `biometry` or `userPresence` where appropriate.
5. In the lab, write and read a test item, then inspect its class via a dump tool.

## Example
```
// Lab-only sample attribute set
NSMutableDictionary *q = @{
  (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
  (__bridge id)kSecAttrService: @"lab.token",
  (__bridge id)kSecAttrAccessible: (__bridge id)kSecAttrAccessibleWhenUnlockedThisDeviceOnly
};
```

| Class | Availability | Use |
|---|---|---|
| WhenUnlocked | Unlocked only | Sensitive tokens |
| AfterFirstUnlock | Post first unlock | Background services |
| Always | Always | Rarely appropriate |

## Common mistakes
Storing large data in Keychain; using `Always` for convenience; ignoring access-group scoping and backup migration.

## Defense and verification
Use `WhenUnlockedThisDeviceOnly` for high-value secrets, add biometric/user-presence access control, and verify classes in a dump of your own app.

## Knowledge check
**Q:** Why prefer `ThisDeviceOnly` accessibility for a sensitive token? **A:** It prevents the item from being restored to a different device via backup, keeping the secret bound to the original hardware.

===MODULE===
TITLE: 27 App Transport Security (ATS)
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn how ATS enforces HTTPS and how exceptions can silently weaken transport security in an iOS app you review.
OBJECTIVES: Explain ATS defaults | Find exceptions | Test against a lab server
TAKEAWAYS: ATS is on by default | NSAllowsArbitraryLoads is a red flag | Exceptions should be narrow
PRACTICE: With `<LAB_APP>` in a simulator, add a lab-only ATS exception for your own HTTP test server, capture the request, then remove the exception and confirm the request fails.
SOURCES: None
---
## Core idea
App Transport Security requires apps to use HTTPS with modern TLS versions and ciphers by default. Developers can weaken this through `NSAppTransportSettings` in `Info.plist`: `NSAllowsArbitraryLoads` disables ATS globally, while `NSExceptionDomains` carve out specific hosts with finer controls like `NSAllowsArbitraryLoads` or `NSRequiresCertificateTransparency`. The mental model: ATS is a seatbelt the app wears automatically; exceptions are you unclipping it, so each one needs justification. A global exception is a strong sign of transport weakness, though legitimate reasons (local device connections, older servers) exist. Static review reads the plist; dynamic testing against your own HTTP server confirms whether cleartext is truly allowed. Keep all exceptions lab-scoped and documented.

## Method
1. Open `Info.plist` and look for `NSAppTransportSecurity`.
2. Note whether `NSAllowsArbitraryLoads` is true and whether any `<domain-config>` style exceptions exist.
3. For each exception, record host and the specific relaxed setting.
4. In the lab, point a network request at an HTTP server you run and observe success or failure.
5. Remove the exception and confirm ATS blocks the request.

## Example
```
plutil -p <LAB_APP>.app/Info.plist | grep -A8 NSAppTransportSecurity
# NSAllowsArbitraryLoads => 1
# NSExceptionDomains => { "lab.local" => { NSAllowsArbitraryLoads => 1 } }
```

| Setting | Effect | Risk |
|---|---|---|
| NSAllowsArbitraryLoads | ATS off globally | Cleartext everywhere |
| NSExceptionDomains | Per-host exceptions | Targeted weakness |
| Certificate Transparency | Requires SCTs | Stronger identity |

## Common mistakes
Allowing arbitrary loads "temporarily" and forgetting to remove it; exception domains too broad; assuming ATS validates certificate identity the same as pinning.

## Defense and verification
Use HTTPS everywhere, narrow exceptions to exact hosts, and verify with a lab server that cleartext fails after hardening. Document any exception's business reason.

## Knowledge check
**Q:** Why is `NSAllowsArbitraryLoads = true` a significant finding? **A:** It disables ATS across the app, permitting cleartext HTTP and weak TLS for every connection.

===MODULE===
TITLE: 28 iOS URL Schemes and Universal Links
LEVEL: Advanced
MINUTES: 45
SUMMARY: Compare custom URL schemes with verified Universal Links and learn how to test link handling safely in a lab you control.
OBJECTIVES: Distinguish schemes from Universal Links | Test openURL handling | Spot token-in-URL flaws
TAKEAWAYS: Custom schemes are unverified | Universal Links use apple-app-site-association | Links are untrusted input
PRACTICE: In a simulator you control, register a `labapp://` scheme in `<LAB_APP>`, open it from a note or Safari, and log how the app parses query parameters.
SOURCES: None
---
## Core idea
iOS apps can be launched through custom URL schemes (`labapp://reset`) or Universal Links (HTTPS URLs bound to a domain via an `apple-app-site-association` file hosted at the domain and an associated-domains entitlement). Custom schemes are not ownership-verified, so multiple apps can register the same scheme and the OS picks one; Universal Links prove domain ownership the same way App Links do on Android. The app receives the URL in `application:openURL:options:` or the newer `userActivity` callbacks. The mental model: an incoming link is untrusted input that crosses a trust boundary from a browser or another app into your process. Risks include tokens in query strings, actions taken without confirmation, and parsing bugs. In an authorized lab you own both the scheme and the domain, so all testing is self-contained.

## Method
1. Check `Info.plist` for `CFBundleURLTypes` and list schemes.
2. Find the associated-domains entitlement and the hosted association file.
3. Locate link-handling callbacks and note which components/actions they route to.
4. Look for sensitive parameters in URLs and whether they are authenticated or validated.
5. In the lab, open each URL type and record the app's behavior.

## Example
```
xcrun simctl openurl booted 'labapp://reset?token=abc123'
# Lab log: openURL called, token param = abc123
# Universal link fallback: https://lab.example/reset?code=123
```

| Link type | Verification | Risk |
|---|---|---|
| Custom scheme | None | Hijack, token leak |
| Universal Link | AASA file | Lower if verified |
| http fallback | None | Redirect abuse |

## Common mistakes
Putting one-time codes in URLs; trusting scheme origin; forgetting the AASA file must be valid and reachable over HTTPS.

## Defense and verification
Prefer Universal Links, avoid secrets in URLs, validate and authenticate all link parameters, and confirm associations with a lab-hosted AASA file.

## Knowledge check
**Q:** What proves ownership of a Universal Link domain? **A:** An `apple-app-site-association` file hosted over HTTPS at the domain, matched by the app's associated-domains entitlement.

===MODULE===
TITLE: 29 Static Analysis Workflow Overview
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn the repeatable phases of static mobile analysis and how each tool contributes a different view of the same app.
OBJECTIVES: Describe static analysis phases | Choose the right tool | Build a workflow
TAKEAWAYS: Static never runs code | Tools see different layers | Triage matters more than volume
PRACTICE: Outline a four-phase plan for analyzing `<LAB_APP>` offline and list which tool (MobSF, jadx, apktool, class-dump) you would use at each phase.
SOURCES: None
---
## Core idea
Static analysis inspects an app without executing it. A good workflow has four phases: (1) **inventory** — identify the package, platforms, and file layout; (2) **automated scan** — let a framework like MobSF surface manifest issues, permissions, and secrets; (3) **manual deep dive** — decompile with jadx or apktool and read the code paths for high-value flows; (4) **triage** — turn tool output into a short list of real, testable findings. The mental model: each tool sees a different layer — a scanner sees patterns, a decompiler sees logic, a resource tool sees configuration — and none is sufficient alone. Static findings are hypotheses to confirm dynamically. Keeping the workflow consistent means you do not miss basics when a new app lands on your desk. All work here is on apps you own or are explicitly authorized to assess.

## Method
1. Inventory the artifact (APK/IPA) with hashes and file listing.
2. Run an automated scan and save the report as a baseline.
3. Manually inspect decompiled code for the flows that matter most (auth, storage, network).
4. Correlate tool warnings with code context to discard false positives.
5. Produce a ranked shortlist that seeds dynamic tests.

## Example
```
sha256sum <LAB_APP>.apk
mobsf <LAB_APP>.apk          # automated baseline
jadx -d out <LAB_APP>.apk    # source view
apktool d -o res <LAB_APP>.apk # smali + resources
```

| Phase | Tool | Output |
|---|---|---|
| Inventory | unzip, sha256sum | File map |
| Scan | MobSF | Baseline findings |
| Deep dive | jadx / apktool | Code paths |

## Common mistakes
Trusting scanner output without reading code; skipping hashes and losing reproducibility; analyzing too broadly without priorities.

## Defense and verification
Verify that every reported finding has a code location and a planned dynamic test. Reproducibility is maintained by recording tool versions and hashes.

## Knowledge check
**Q:** Why must static findings be confirmed dynamically? **A:** Static tools report patterns and possible paths; runtime behavior, configuration, and OS enforcement determine whether a real vulnerability exists.

===MODULE===
TITLE: 30 Setting Up MobSF for Automated Scanning
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn to run Mobile Security Framework (MobSF) against an APK or IPA you control and read its report without blindly trusting it.
OBJECTIVES: Install or launch MobSF | Submit an app | Interpret baseline findings
TAKEAWAYS: MobSF gives breadth | Reports need triage | Environment must be isolated
PRACTICE: In your own isolated lab environment, start MobSF, upload a build of `<LAB_APP>`, and export the first report, tagging three findings you want to verify manually.
SOURCES: None
---
## Core idea
MobSF is an automated mobile app security scanner that performs static analysis (and optional dynamic analysis) for Android and iOS. It parses the manifest, scores permissions, decompiles code, checks for insecure configurations, and flags secrets and API usage, producing a structured report. The mental model: MobSF is a breadth-first net — it casts wide to surface candidates, but it does not understand your app's intent. A "hardcoded secret" warning may be a test constant; a "cleartext" warning may be a lab-only host. Running it in an isolated lab on apps you own keeps the exercise safe and reproducible. Treat the output as a starting checklist, then verify each item with manual tools like jadx or apktool before calling it a finding.

## Method
1. Start MobSF in an isolated container or VM used only for lab apps.
2. Upload or submit `<LAB_APP>` (APK or IPA) through its interface or CLI.
3. Let the static scan complete and export the report.
4. Group findings by category: manifest, permissions, crypto, network, code, secrets.
5. Pick three high-risk items and plan a manual verification step for each.

## Example
```
# In your isolated MobSF lab container
docker run -p 8000:8000 opensecurity/mobile-security-framework-mobsf
# Submit <LAB_APP>.apk via the web UI, then:
# Report -> "Manifest Analysis", "Code Analysis", "Secrets"
```

| MobSF view | Useful for |
|---|---|
| Manifest analysis | exported flags, backup, cleartext |
| Code analysis | Weak crypto, WebView settings |
| Secrets | Hardcoded keys and tokens |

## Common mistakes
Treating the risk score as ground truth; scanning third-party apps without authorization; scanning a production artifact with real secrets in a shared environment.

## Defense and verification
Verify each finding against source or decompiled code and runtime behavior. Keep the lab isolated and store reports only for apps you are authorized to assess.

## Knowledge check
**Q:** What is the proper role of a MobSF report in an assessment? **A:** A broad baseline of candidate issues to triage and verify manually, not a final list of confirmed vulnerabilities.

===MODULE===
TITLE: 31 Decompiling Android Apps with jadx
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Learn to turn dex bytecode into readable Java-like source with jadx and navigate to the flows that matter in an app you own.
OBJECTIVES: Decompile an APK with jadx | Navigate classes | Trace a security-relevant flow
TAKEAWAYS: jadx yields Java-like source | Obfuscation degrades output | Search by strings and APIs
PRACTICE: Decompile a build of `<LAB_APP>` you control with jadx, find the login method by searching for a distinctive string, and document the token flow from UI to storage.
SOURCES: None
---
## Core idea
jadx converts Dalvik bytecode (`classes.dex`) back into approximate Java source, with a GUI and CLI. It is the fastest way to read an app's logic: search a string, jump to a class, and follow callers. The mental model: decompilation is reconstruction, not a perfect copy — names may be obfuscated, generics erased, and control flow flattened, so you reason about behavior, not exact original code. Use jadx for high-level logic and apktool/smali when you need exact instruction-level detail or to repackage a lab app. Static strings, API calls, and class names are your anchors. Reading decompiled code should always tie back to a threat model: focus on authentication, storage, network, and exported components first rather than wandering through thousands of classes. All examples use an app you control in an isolated lab.

## Method
1. Run `jadx -d out <LAB_APP>.apk` and open the source tree.
2. Search for distinctive strings (error messages, URLs, permission names).
3. Jump to the relevant class and read the method that handles the flow.
4. Use "Find usages" to trace callers and callees.
5. Record exact class/method locations for every candidate finding.

## Example
```
jadx -d /tmp/lab_out <LAB_APP>.apk
grep -R "invalid token" /tmp/lab_out | head
# com/lab/app/AuthActivity.java:42: if (!valid) log("invalid token")
```

| jadx feature | Use |
|---|---|
| Text search | Find strings and API calls |
| Find usages | Trace data flow |
| Smali view | Verify exact bytecode |

## Common mistakes
Assuming decompiled output is literal source code; chasing obfuscated names without string anchors; forgetting that code you see may be dead or feature-flagged.

## Defense and verification
Corroborate decompiled findings with runtime observation, and keep a mapping from finding to class/method line for the report. Use obfuscation in your own apps to raise the bar, never as the only control.

## Knowledge check
**Q:** Why is jadx preferred for understanding logic but not for exact instruction-level edits? **A:** It produces approximate Java source; smali/apktool preserves the exact bytecode needed for precise modification.

===MODULE===
TITLE: 32 apktool, Smali, and Resource Decompilation
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Learn when to drop to smali and resources with apktool, and how to repackage a lab app safely to test a hypothesis.
OBJECTIVES: Decode an APK with apktool | Read basic smali | Repackage a lab app
TAKEAWAYS: apktool handles resources | smali is exact | Repackaging changes signatures
PRACTICE: Decode `<LAB_APP>` with apktool, change a single string in a resource you control, rebuild and sign the APK, then install it only on your isolated emulator to confirm the change.
SOURCES: None
---
## Core idea
apktool decodes an APK into smali bytecode, decoded resources, and a reconstructed manifest. Smali is a human-readable rendering of dex instructions — verbose but exact. You reach for apktool when jadx output is ambiguous, when you need to inspect `res/xml/network_security_config.xml` or decoded manifest values, or when you want to patch a lab app to test a hypothesis (for example, removing a check to see what lies behind it). The mental model: jadx is the map, apktool is the surgical instrument. Repackaging invalidates the original signature, so the rebuilt APK must be signed with a key you control and installed only on an emulator or device you own. This keeps all modification squarely in an authorized lab context.

## Method
1. Decode with `apktool d -o out <LAB_APP>.apk`.
2. Inspect decoded `AndroidManifest.xml` and `res/xml/` configuration.
3. Find a class of interest in `smali/` and read the method invocations.
4. Make a minimal change (a string or a conditional) for a lab test.
5. Rebuild with `apktool b`, sign with `apksigner`, and install on your isolated emulator.

## Example
```
apktool d -o lab_decode <LAB_APP>.apk
apktool b lab_decode -o <LAB_APP>-patched-unsigned.apk
apksigner sign --ks lab-debug.jks --out <LAB_APP>-patched.apk <LAB_APP>-patched-unsigned.apk
adb install -r <LAB_APP>-patched.apk
```

| Artifact | Meaning |
|---|---|
| `smali/` | Exact dex instructions |
| `res/xml/` | Decoded configs |
| `AndroidManifest.xml` | Human-readable manifest |

## Common mistakes
Repackaging a production app you do not own; forgetting to re-sign after rebuild; assuming a resource change leaves logic untouched.

## Defense and verification
Verify the patched app runs only in your isolated environment and that the change did what you intended. Defensively, use signature checks and integrity verification in your own apps to detect tampering.

## Knowledge check
**Q:** Why must a repackaged APK be re-signed? **A:** Rebuilding changes the file contents, invalidating the original signature; Android will only install a validly signed APK.

===MODULE===
TITLE: 33 iOS Static Analysis with otool and class-dump
LEVEL: Advanced
MINUTES: 50
SUMMARY: Learn to inspect an iOS binary you control with otool and class-dump to recover classes, methods, linked frameworks, and hardened runtime flags.
OBJECTIVES: Inspect Mach-O metadata | Dump Objective-C interfaces | Read linked libraries
TAKEAWAYS: class-dump reveals headers | otool shows linkage and flags | Swift needs different tooling
PRACTICE: Build `<LAB_APP>` for a simulator you control, then run `otool -L` and `class-dump` on the binary and list every framework and exposed class you find.
SOURCES: None
---
## Core idea
iOS apps are Mach-O binaries. `otool` inspects their structure: linked frameworks (`otool -L`), load commands, and code-signing or hardened-runtime information. `class-dump` reconstructs Objective-C class and protocol declarations from metadata embedded in the binary, giving you method names and property types even without source. The mental model: Obj-C runtime metadata is a map of the app's API surface; Swift symbols are often name-mangled and need tools like `swift-demangle` or `nm`. Reading these lets you prioritize classes named `Auth`, `Keychain`, `Network`, or `Crypto` for deeper analysis. Combine with plist and entitlement review to build a complete static picture. All work here is on a binary you built yourself in a controlled lab.

## Method
1. Locate the app binary inside `<LAB_APP>.app` from a build you control.
2. List linked frameworks with `otool -L` and note anything unexpected.
3. Dump Objective-C interfaces with `class-dump` and save to a header directory.
4. Search headers for classes and methods related to auth, storage, crypto, and networking.
5. Check hardened runtime and entitlements with `codesign`.

## Example
```
otool -L <LAB_APP>.app/<LAB_APP> | head
# /usr/lib/libobjc.A.dylib
# @rpath/Alamofire.framework/Alamofire
class-dump -H <LAB_APP>.app/<LAB_APP> -o headers/
grep -R "keychain\|token" headers/ | head
```

| Tool | Reveals |
|---|---|
| otool -L | Linked frameworks |
| class-dump | Obj-C classes/methods |
| codesign -d | Entitlements, flags |

## Common mistakes
Expecting Swift to dump as cleanly as Objective-C; ignoring dynamically loaded frameworks; treating a class name as proof of behavior.

## Defense and verification
Verify static hypotheses with runtime tracing later, and keep your own binaries stripped where practical. Record tool versions because output format changes.

## Knowledge check
**Q:** What does `class-dump` recover from an Objective-C binary? **A:** Class, category, protocol, method, and property declarations reconstructed from runtime metadata.

===MODULE===
TITLE: 34 Secrets Discovery in Mobile Apps
LEVEL: Advanced
MINUTES: 50
SUMMARY: Find hardcoded credentials, API keys, and tokens in APKs and IPA bundles you control, and confirm whether each is really a secret.
OBJECTIVES: Search binaries and resources for secrets | Verify findings | Remediate correctly
TAKEAWAYS: Entropy finds candidates | Context decides severity | Rotation is the real fix
PRACTICE: Embed three deliberate test strings (a fake API key, a password, and a base64 blob) in `<LAB_APP>`, then find each using strings, grep, and a scanner, and plan how you would rotate them.
SOURCES: None
---
## Core idea
Secrets discovery looks for credentials the app ships with: API keys, passwords, signing secrets, encryption keys, and tokens. Text search finds literals (`AKIA...`, `password=`, private-key headers); entropy analysis finds high-randomness blobs worth inspecting; scanners automate both. The mental model: a match is a *candidate*, not a finding — a public key, a test constant, or an obfuscated library ID can look alarming. Context is everything: where is the string used, is it a client identifier meant to be public, and does it grant access to anything? Real secrets in a client cannot be protected, only removed from the client and moved server-side, then rotated. All examples here use fake values you create in a lab app.

## Method
1. Run `strings` on the binary and dex, plus grep decompiled source for patterns.
2. Search resources, plists, config files, and native libraries, not just Java/Swift code.
3. Compute entropy to surface encoded or encrypted-looking constants.
4. For each candidate, locate its use and decide if it is actually secret and live.
5. Report only verified secrets; recommend removal, server-side proxying, and rotation.

## Example
```
strings <LAB_APP>.apk | grep -iE 'AKIA|password|BEGIN (RSA|EC) PRIVATE'
grep -R "api_key" out_smali/ | head
# const-string v0, "AKIAlabfakeEXAMPLEKEY"
```

| Candidate | Likely reality |
|---|---|
| AKIA prefix | AWS key — verify scope |
| Base64 blob | Could be config or key |
| Private key header | Usually genuine secret |

## Common mistakes
Calling every base64 string a secret; ignoring native libraries and resources; reporting without checking if the credential is still valid.

## Defense and verification
Verify with usage context and a safe check against the issuing service in an authorized program. Remediate by moving secrets off-device and rotating exposed ones.

## Knowledge check
**Q:** Why is rotation necessary after a real secret is found in a shipped app? **A:** Assume it is already compromised; only rotating the credential invalidates copies extracted from distributed binaries.

===MODULE===
TITLE: 35 Manifest and Configuration Review at Scale
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Systematically review manifests and plists across many apps or builds, focusing on the configuration flags that change security posture.
OBJECTIVES: Build a review checklist | Compare builds | Spot configuration drift
TAKEAWAYS: Diff releases to find drift | Flags beat code volume | Baseline each platform
PRACTICE: Take two builds of `<LAB_APP>` you control, extract both manifests, and diff them to find any change in exported flags, backup, cleartext, or network config.
SOURCES: None
---
## Core idea
Configuration often matters more than code: a single `android:exported="true"` or `NSAllowsArbitraryLoads` can undo good engineering. A scale review standardizes which flags you check every time and across every build, so drift is caught. The mental model: treat the manifest/plist as a security header — a compact set of declarations that governs OS enforcement. Build a baseline checklist (exported components, permissions, backup, cleartext, network config, debuggable, sharedUserId, ATS exceptions, entitlements) and diff builds to see what changed between versions. Automation via scripts and scanners handles volume, but you must interpret each flag in context. This module prepares the evidence you will later write up as findings. All apps in scope are ones you own or are authorized to assess.

## Method
1. Define a fixed checklist of security-relevant configuration keys per platform.
2. Extract manifests/plists from each build with `aapt`, apktool, or `plutil`.
3. Normalize formatting and diff consecutive builds.
4. Investigate every newly added or weakened flag.
5. Triage changes into "expected feature" versus "security regression."

## Example
```
aapt dump xmltree <LAB_APP>-v1.apk AndroidManifest.xml > v1.txt
aapt dump xmltree <LAB_APP>-v2.apk AndroidManifest.xml > v2.txt
diff v1.txt v2.txt
# < A: android:usesCleartextTraffic="0xffffffff"
# > (absent)
```

| Flag | Platform | Concern |
|---|---|---|
| exported | Android | External invocation |
| allowBackup | Android | Data extraction |
| ATS exceptions | iOS | Cleartext allowed |

## Common mistakes
Reviewing only the newest build; using ad-hoc checklists that vary by reviewer; ignoring third-party SDK declarations merged into the manifest.

## Defense and verification
Automate the checklist in CI for your own apps so regressions fail the build. Verify manually that each flagged change is justified.

## Knowledge check
**Q:** Why diff two builds' manifests instead of reading only the latest? **A:** A diff reveals exactly which security-relevant configuration changed, making regressions easy to spot and attribute.

===MODULE===
TITLE: 36 Static Analysis Triage and Reporting
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Turn a pile of scanner output and decompiled code into a short, credible list of findings with evidence and severity.
OBJECTIVES: De-duplicate findings | Rank by risk | Record reproducible evidence
TAKEAWAYS: Context beats count | Every finding needs evidence | Triage is iterative
PRACTICE: Using the MobSF report and jadx notes you made for `<LAB_APP>`, reduce ten tool warnings to three confirmed findings with a location, impact, and proposed test.
SOURCES: None
---
## Core idea
Static tools produce volume; a good analyst produces signal. Triage asks three questions of each candidate: Is it real? Does it matter? Can I show it? De-duplicate scanner warnings that share a root cause, discard items that are expected behavior, and rank the rest by impact times exploitability. The mental model: a finding is a claim backed by evidence, not a tool's label. Evidence for static analysis includes exact file/class/line references, decoded manifest values, and code snippets. Severity should reflect the app's threat model — a hardcoded key for a lab-only endpoint is low risk; one for a production API is critical. Triage is iterative: dynamic testing will confirm, downgrade, or eliminate candidates. Keeping notes structured now makes the final report effortless.

## Method
1. Merge findings from each tool into one list with a common schema.
2. De-duplicate items pointing to the same root cause.
3. For each, record location, behavior, and why it matters to this app's assets.
4. Assign a provisional severity and a confidence level.
5. Mark each as "confirm dynamically" or "closed" with a reason.

## Example
```
ID-07 | Hardcoded "AKIA...lab..." | AuthClient.java:88
Impact: lab API key only        Confidence: high (confirmed string)
Severity: Low (lab-only)        Action: rotate in real deployment
```

| Field | Purpose |
|---|---|
| Location | Reproducibility |
| Impact | Severity |
| Confidence | Triage priority |

## Common mistakes
Copying scanner labels as final severity; reporting every warning; losing the mapping between duplicate findings and their root cause.

## Defense and verification
Peer-review your shortlist: another tester should be able to locate each finding from your notes. Re-open closed items when the app version changes.

## Knowledge check
**Q:** Why is confidence tracked separately from severity? **A:** Severity measures impact if true; confidence captures how sure you are, helping prioritize verification work.

===MODULE===
TITLE: 37 Dynamic Analysis Lab Setup: Emulator and Proxy
LEVEL: Intermediate
MINUTES: 50
SUMMARY: Build an isolated emulator-and-proxy lab so you can observe an app you control at runtime without touching real third parties.
OBJECTIVES: Configure an isolated emulator | Route traffic through a proxy | Snapshot the baseline
TAKEAWAYS: Isolation is mandatory | Proxy sees app traffic | Snapshots make tests repeatable
PRACTICE: Create a fresh Android emulator snapshot, configure it to use an HTTP proxy you control, install a build of `<LAB_APP>`, and confirm traffic reaches your proxy.
SOURCES: None
---
## Core idea
Dynamic analysis runs the app and watches what it actually does. A safe lab has three parts: an isolated emulator or simulator with no real accounts, a proxy you control to capture traffic, and a clean snapshot you can restore between tests. The mental model: the lab is a sealed observation chamber — nothing inside should touch production services or real user data. On Android, proxy settings can be applied via `adb shell settings put global http_proxy` or emulator flags; on iOS, a Wi-Fi proxy can be set in the simulator host. Start each test from a known snapshot so state from a previous run does not corrupt results. Because you own the app and the proxy, all interception is authorized and self-contained.

## Method
1. Create a dedicated emulator/simulator with no Google account or real credentials signed in.
2. Start a local proxy (for example, mitmproxy or Burp in your lab) and note its listening address.
3. Point the emulator's proxy setting at it and verify connectivity.
4. Take a clean snapshot before installing `<LAB_APP>`.
5. Install your app, launch it, and confirm requests appear in the proxy log.

## Example
```
adb shell settings put global http_proxy 10.0.2.2:8080
adb emu snapshot save clean_base
adb install <LAB_APP>-debug.apk
# Proxy log: GET https://lab.example/api 200
```

| Lab component | Purpose |
|---|---|
| Isolated emulator | Safe runtime |
| Local proxy | Traffic capture |
| Snapshot | Repeatability |

## Common mistakes
Using a device signed into real accounts; forgetting to restore snapshots between tests; pointing the proxy at services outside your scope.

## Defense and verification
Verify no traffic goes to unrelated third parties and that the snapshot restores cleanly. Keep the lab network segmented from production.

## Knowledge check
**Q:** Why restore a clean snapshot between dynamic tests? **A:** To remove state from prior runs so each observation is reproducible and not skewed by cached data or tokens.

===MODULE===
TITLE: 38 Intercepting HTTPS with a Proxy CA
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Learn how a proxy CA enables HTTPS inspection in a lab and what app-side controls can block it, using only your own app and emulator.
OBJECTIVES: Install a lab CA | Observe TLS interception | Recognize blocking controls
TAKEAWAYS: Proxy CA re-signs TLS | User CAs are trusted in debug | Pinning blocks interception
PRACTICE: In your isolated emulator, install your lab proxy's CA as a user CA, browse to an HTTPS site your proxy serves, then run `<LAB_APP>` and record whether its traffic is visible.
SOURCES: None
---
## Core idea
To view HTTPS in a proxy, the proxy presents its own certificate to the app. The app will only accept it if that certificate chains to a CA it trusts. In a lab you control the emulator, so you can install your proxy's CA as a user CA (Android) or trust it on the simulator host (iOS) — a deliberate, scoped exception. On Android 7+, apps targeting modern SDKs do not trust user CAs by default unless the network security config allows it in debug builds; this is a defense you must account for. Certificate pinning or public-key pinning in the app will reject the proxy certificate even with a trusted CA. The mental model: interception requires the app to trust your CA *and* not pin. Understanding both lets you distinguish a configuration issue from a pinning control.

## Method
1. Export your lab proxy's CA certificate and install it on the emulator.
2. Verify interception with a browser to a lab HTTPS endpoint.
3. Run `<LAB_APP>` and check whether its requests appear decrypted in the proxy.
4. Inspect the network security config for user-CA trust rules.
5. If traffic fails, distinguish "CA not trusted" from "pinning present."

## Example
```
adb push lab-ca.crt /sdcard/lab-ca.crt
# Install via Settings -> Security -> Install from storage (lab only)
adb shell settings put global http_proxy 10.0.2.2:8080
# Proxy: CONNECT lab.example:443 200, TLS handshake via lab CA
```

| Blocker | Symptom | Diagnosis |
|---|---|---|
| User CA not trusted | Handshake fails | Check network config |
| Pinning | Reject after CA trusted | Check pin set |

## Common mistakes
Installing a lab CA on a personal device; assuming a browser success means the app is interceptable; conflating CA trust with pinning.

## Defense and verification
Keep CA installation confined to the isolated lab, and document it as an explicit test precondition. Defensively, disable user-CA trust in production builds.

## Knowledge check
**Q:** Why can HTTPS still fail in the proxy even after its CA is trusted? **A:** The app may pin a specific certificate or public key, which rejects the proxy's certificate regardless of CA trust.

===MODULE===
TITLE: 39 Certificate Pinning Concepts in a Lab App
LEVEL: Advanced
MINUTES: 45
SUMMARY: Understand certificate and public-key pinning, why they stop interception, and how to implement a pin set safely in a lab app you control.
OBJECTIVES: Explain pinning models | Implement a lab pin | Plan rotation
TAKEAWAYS: Pinning narrows trust | Public-key pins survive reissue | Rotation must be planned
PRACTICE: Add a public-key pin for a lab HTTPS endpoint you own to `<LAB_APP>`, confirm the proxy CA is rejected, then add a backup pin and verify rotation works.
SOURCES: None
---
## Core idea
Pinning limits which certificates an app accepts for a host, beyond the normal CA system. A **certificate pin** matches the leaf certificate (fragile when it is reissued); a **public-key pin** (SPKI hash) matches the key and survives certificate renewal with the same key. Pins are usually expressed as SHA-256 hashes and configured through Android's network security config `<pin-set>` or a library like TrustKit on iOS. The mental model: the CA system says "trust anyone this CA signs"; pinning adds "and only this key." It is a strong defense against interception and mis-issued certificates, but it requires careful rotation — a bad pin set can brick an app's networking. In your lab you own the endpoint and the pins, so you can demonstrate both rejection and rotation safely. Never test pinning against services you do not control.

## Method
1. Compute the SPKI SHA-256 hash of your lab endpoint's certificate.
2. Add a `<pin-set>` with the primary pin and an independently generated backup pin.
3. Run the app through the lab proxy and confirm the connection is rejected.
4. Rotate the endpoint certificate reusing the pinned key and confirm success.
5. Verify expiration behavior and document the rotation runbook.

## Example
```
openssl s_client -connect lab.example:443 -servername lab.example </dev/null \
  | openssl x509 -pubkey -noout \
  | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64
# labPinHashBase64=
```
```
<domain-config><domain name="lab.example"/>
  <pin-set expiration="2027-01-01">
    <pin digest="SHA-256">labPinHashBase64=</pin>
  </pin-set>
</domain-config>
```

## Common mistakes
Pinning the leaf certificate without a backup; no rotation plan; setting an expiry that silently disables pins.

## Defense and verification
Always include abackup pin, test rotation, and monitor pin failures. Verify in the lab that an untrusted CA is rejected and the correct key is accepted.

## Knowledge check
**Q:** Why is a public-key pin preferable to a leaf-certificate pin? **A:** It remains valid when the certificate is reissued with the same key, reducing operational breakage.

===MODULE===
TITLE: 40 Frida Fundamentals in an Authorized Lab
LEVEL: Advanced
MINUTES: 50
SUMMARY: Learn how Frida instruments a running app process in your isolated lab to observe and modify behavior at runtime.
OBJECTIVES: Run Frida on a lab app | Hook a method | Interpret runtime data
TAKEAWAYS: Frida attaches to processes | Hooks see real arguments | Use only on apps you own
PRACTICE: On an isolated emulator, attach Frida to `<LAB_APP>`, hook a method that handles a test token, and log its arguments; then detach and confirm the app still works normally.
SOURCES: None
---
## Core idea
Frida is a dynamic instrumentation toolkit that injects a script into a running process, letting you intercept function calls, inspect arguments and return values, and change behavior. The mental model: where static analysis shows what the code *could* do, Frida shows what it *does*, with live data. A typical script attaches to a class method and prints `args` and the return value. You can also replace implementations temporarily to test whether a control matters — for example, observing what happens when a validation method is bypassed in your own app. All of this must be done on apps you own or are explicitly authorized to test, inside an isolated emulator. Keep hooks minimal and record exactly what you changed so results remain interpretable.

## Method
1. Start `<LAB_APP>` on the isolated emulator and list processes with `frida-ps`.
2. Write a small script targeting a known class/method from your jadx review.
3. Attach and log arguments and return values for one flow.
4. Optionally replace a method's result temporarily to observe the downstream effect.
5. Remove the hook, restart the app, and confirm normal behavior.

## Example
```
frida-ps -U | grep <LAB_APP>
frida -U -f com.lab.app -l hook.js
# hook.js:
# Java.perform(function () {
#   var A = Java.use('com.lab.app.AuthClient');
#   A.check.implementation = function (t) {
#     console.log('check arg: ' + t); return this.check(t);
#   };
# });
```

| Frida concept | Purpose |
|---|---|
| `Java.use` | Reference a class |
| `.implementation` | Replace/hook a method |
| `Java.perform` | Ensure VM ready |

## Common mistakes
Hooking broadly and flooding output; forgetting to detach / restart; using Frida on apps outside authorization.

## Defense and verification
Verify findings by repeating the flow without the hook. Defensively, use anti-tamper and runtime integrity checks in your own apps, understanding they raise but do not eliminate risk.

## Knowledge check
**Q:** What does `Java.use` do in a Frida script? **A:** It obtains a JavaScript wrapper for a Java class in the target process so you can hook or call its methods.

===MODULE===
TITLE: 41 Objection and Runtime Manipulation
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn how objection, built on Frida, speeds up common runtime checks on an app you own in an isolated lab.
OBJECTIVES: Use objection commands | Bypass simple root checks | Inspect storage at runtime
TAKEAWAYS: objection wraps common hooks | Runtime bypass is lab-scoped | Verify with clean reruns
PRACTICE: Against `<LAB_APP>` on an isolated emulator, use objection to list activities, inspect SharedPreferences, and observe a root-detection method, then restore a clean snapshot.
SOURCES: None
---
## Core idea
Objection is a runtime exploration tool built on Frida that packages common tasks into simple commands: listing activities, dumping keystores and preferences, disabling SSL pinning, and manipulating paths. The mental model: if Frida is a general-purpose instrument, objection is a set of ready-made probes. It is valuable for quickly confirming what static analysis suggested — for example, whether a preferences file holds a token. Bypasses it performs (root checks, pinning) are legitimate only in a lab with apps you control or explicit authorization. Each bypass changes runtime behavior, so always rerun the same flow with the bypass removed to establish the real baseline. Keep a record of which commands you ran, since a single command can alter multiple controls.

## Method
1. Patch/attach to `<LAB_APP>` on your isolated emulator with objection.
2. Use `android hooking list activities` to confirm exported components.
3. Use preference and keystore commands to inspect storage contents.
4. Run a documented bypass (such as root detection) against your own app and observe the change.
5. Restore the snapshot and repeat the baseline flow without the bypass.

## Example
```
objection -g com.lab.app explore
# ...> android hooking list activities
# ...> android sharedprefs list
# ...> android sslpinning disable   (lab app only)
# ...> android root disable         (lab app only)
```

| Command | Reveals |
|---|---|
| `hooking list activities` | Component inventory |
| `sharedprefs list` | Stored values |
| `sslpinning disable` | Effect of pinning |

## Common mistakes
Treating a bypassed result as the app's default behavior; running objection on third-party apps; forgetting to snapshot and restore.

## Defense and verification
Verify every conclusion against a clean run. Defensively, implement defense-in-depth so no single hook reveals or disables all protections.

## Knowledge check
**Q:** Why rerun a flow after removing an objection bypass? **A:** To confirm the observed behavior reflects the app's real controls rather than the artificial runtime change.

===MODULE===
TITLE: 42 Certificate Pinning Bypass in an Authorized Lab
LEVEL: Advanced
MINUTES: 50
SUMMARY: Understand, at a conceptual and lab level, how testers make a pinned app trust a lab proxy — strictly on apps they own or explicitly authorized.
OBJECTIVES: Explain bypass mechanisms | Apply one in a lab app | Re-verify with pinning enabled
TAKEAWAYS: Bypass means runtime patching | Never target third parties | Restoring baseline proves the control
PRACTICE: In your isolated lab, apply a documented pinning bypass to `<LAB_APP>` so its HTTPS traffic reaches your proxy, capture one request, then remove the bypass and confirm the connection is rejected.
SOURCES: None
---
## Core idea
When an app pins certificates, a lab proxy is rejected even with a trusted CA. In an explicitly authorized assessment, testers temporarily alter the app's runtime so the pin check no longer blocks interception — for example, by hooking the validation method or using a tool's built-in bypass. The mental model: you are not breaking the app for users; you are changing a local copy's behavior in a sealed environment to observe traffic that would otherwise be hidden. This is legitimate only for apps you own or are in-scope for a program with written authorization; it must never target real third parties or produce deployable malware. The value is in the comparison: with the bypass, you see the API traffic; without it, you confirm pinning works. Keep the bypass local and transient.

## Method
1. Confirm the app rejects the lab proxy with pinning intact and record the failure.
2. Attach your instrumentation tool to `<LAB_APP>` on the isolated emulator.
3. Apply a documented bypass targeting the pin-check method (lab app only).
4. Capture one request in the proxy and note its relevance to the threat model.
5. Detach, restore the snapshot, and confirm rejection returns.

## Example
```
objection -g com.lab.app explore
# ...> android sslpinning disable
# Proxy: GET https://lab.example/api -> 200 (visible only with bypass)
# After snapshot restore: SSL handshake rejected (pinning intact)
```

| State | Proxy result | Meaning |
|---|---|---|
| Pinning on | Rejected | Control works |
| Bypass applied | Visible | Test window only |

## Common mistakes
Applying bypasses outside authorized scope; concluding pinning is weak because a bypass exists; leaving the bypass active in notes as "default behavior."

## Defense and verification
Verify the control by the clean rerun; report pinning as effective if it rejects the proxy. Defensively, combine pinning with certificate transparency and integrity checks.

## Knowledge check
**Q:** What does a successful pinning bypass in a lab actually prove? **A:** That instrumentation can expose traffic for testing; it does not mean pinning is broken in production, which the clean rerun confirms.

===MODULE===
TITLE: 43 Mobile API Testing
LEVEL: Advanced
MINUTES: 50
SUMMARY: Test the backend APIs a mobile app calls, using the proxy capture and authorization boundaries established in earlier labs.
OBJECTIVES: Map API endpoints | Test auth and authorization | Check client-side trust
TAKEAWAYS: Client is not a control | Server must authorize | Tokens deserve careful handling
PRACTICE: Against an API you own that `<LAB_APP>` calls, replay one captured request with a modified identifier and confirm the server enforces authorization rather than trusting the client.
SOURCES: None
---
## Core idea
Mobile apps are thin clients over APIs, so many "app" vulnerabilities are actually server-side trust failures. The mental model: anything the client decides — price, user ID, entitlement, role — can be changed by an attacker, so the server must re-authorize every request. From a lab proxy capture you can enumerate endpoints, parameters, and auth headers, then replay requests with modified values against your own API. Look for missing object-level authorization, client-controlled role flags, weak token handling, and error messages that leak internals. Because you own the API, every test is authorized and self-contained. Correlate findings back to the app: if the server is correct, a modified client alone should not grant access.

## Method
1. From proxy history, list hosts, paths, methods, and auth headers.
2. Identify parameters representing identity, role, price, or entitlement.
3. Replay a request with a changed identifier through your own API and compare responses.
4. Test token lifecycle: expiry, refresh, revocation, and reuse after logout.
5. Record which controls are server-side versus client-side.

## Example
```
GET /api/lab/orders/12345 HTTP/1.1
Authorization: Bearer <userA-token>
# Replay with /orders/67890 (user B) using user A token
# Expected: 403 if server authorizes; 200 = broken object-level auth
```

| Test | Expected control |
|---|---|
| Change object ID | Server-side authorization |
| Reuse expired token | 401 rejection |
| Client role flag | Server ignores it |

## Common mistakes
Testing APIs outside authorization; assuming the app enforces access control; forgetting to test token revocation.

## Defense and verification
Verify server responses for every modified request. Defensively, enforce authorization on the server, minimize client-supplied trust, and log anomalous access.

## Knowledge check
**Q:** Why must the API re-authorize rather than trust a role flag sent by the app? **A:** The app is user-controlled; an attacker can edit any client-side value, so only server-side decisions are trustworthy.

===MODULE===
TITLE: 44 Runtime Storage and Memory Inspection
LEVEL: Advanced
MINUTES: 45
SUMMARY: Inspect what an app actually writes to disk and holds in memory at runtime, using only your lab app and emulator.
OBJECTIVES: Diff filesystem state | Inspect memory for secrets | Correlate with static findings
TAKEAWAYS: Runtime reveals real writes | Memory can hold plaintext | Snapshots enable clean diffs
PRACTICE: Snapshot `<LAB_APP>`'s emulator before and after a login flow you control, diff its data directory, and scan a process memory dump you take yourself for the test token.
SOURCES: None
---
## Core idea
Static analysis tells you where an app *could* store data; runtime inspection shows where it *does*. By diffing the app's data directory across a workflow, you find files, databases, and preferences created in practice, including third-party SDK artifacts. Memory inspection looks for secrets that exist transiently in plaintext — decrypted tokens, passwords, or keys — which may persist longer than developers expect. The mental model: a secret has a lifecycle spanning disk, memory, logs, and network; you want to see each stage. Take a clean snapshot, run the flow, diff the filesystem, and examine memory with lab tooling. All data used is synthetic and all targets are apps you own, so the exercise is safe and legitimate.

## Method
1. Restore a clean emulator snapshot and record the app data directory.
2. Run a sensitive flow (login, token refresh) in `<LAB_APP>`.
3. Diff the data directory to list new or modified files.
4. Inspect interesting files for plaintext secrets.
5. Capture a process memory dump and grep for a known synthetic token.

## Example
```
adb shell find /data/data/<LAB_APP>/ -type f -newermt '2026-01-01' | sort
adb shell run-as <LAB_APP> cat shared_prefs/session.xml
# <string name="refresh_token">LabFakeToken123</string>
```

| Artifact | Question |
|---|---|
| New file | Was it expected? |
| Plaintext token | Should it be encrypted? |
| Memory copy | How long does it persist? |

## Common mistakes
Diffing without a clean baseline; using real credentials in a lab; ignoring SDK-generated files.

## Defense and verification
Verify findings against multiple runs. Defensively, clear sensitive data on logout, use Keystore-backed encryption, and minimize lifetime of plaintext secrets.

## Knowledge check
**Q:** Why diff against a clean snapshot rather than inspect a single moment? **A:** A diff shows exactly which files the workflow created or changed, removing noise from pre-existing app data.

===MODULE===
TITLE: 45 Mapping Findings to MASVS and MSTG
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn how the OWASP Mobile Application Security Verification Standard and Test Guide structure a complete assessment and prevent gaps.
OBJECTIVES: Navigate MASVS categories | Link tests to MSTG | Build coverage matrix
TAKEAWAYS: MASVS is requirements | MSTG is procedures | Mapping proves coverage
PRACTICE: Take three findings from `<LAB_APP>` and map each to a MASVS control and its corresponding MSTG test case in a coverage table.
SOURCES: None
---
## Core idea
The OWASP Mobile Application Security Standard provides two complementary resources: **MASVS** defines verification requirements grouped by category (storage, cryptography, authentication, network, platform interaction, code quality, resilience), and **MSTG** describes how to test each requirement on Android and iOS. The mental model: MASVS is the "what," MSTG is the "how," and your coverage matrix is the proof you tried both. Mapping prevents the common failure of testing only what is interesting and ignoring entire categories. It also gives stakeholders a familiar language for severity and remediation. Mapping is not bureaucracy — it is a completeness check that turns a 50-module curriculum into a defensible methodology. Use it to plan, to track progress, and to show what was not tested.

## Method
1. Choose the MASVS profile appropriate to the app (standard or defense-in-depth).
2. List categories and mark which were covered by your labs.
3. For each confirmed finding, record the control ID and MSTG test.
4. Identify categories with no tests and schedule them.
5. Include "not applicable" with justification where a control truly does not apply.

## Example
```
Finding: cleartext HTTP endpoint
MASVS: MASVS-NETWORK-1 (TLS everywhere)
MSTG: "Testing Network Communication" / Android network config
Coverage: NETWORK tested, RESILIENCE not tested
```

| MASVS area | MSTG topic |
|---|---|
| Storage | Data storage & Keychain |
| Crypto | Cryptography tests |
| Network | Communication security |

## Common mistakes
Mapping only confirmed findings, not the tests you ran; marking categories covered without evidence; ignoring platform-specific differences.

## Defense and verification
Review the matrix before reporting; any gap must be tested or explicitly justified. Keep it with the engagement record.

## Knowledge check
**Q:** What is the difference between MASVS and MSTG? **A:** MASVS states security requirements; MSTG explains the testing procedures used to verify them.

===MODULE===
TITLE: 46 Writing Mobile Security Findings
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn to write clear, reproducible findings that a developer can act on, using evidence gathered across the static and dynamic labs.
OBJECTIVES: Structure a finding | Write proof of concept | Link to remediation
TAKEAWAYS: Evidence first | Impact must be concrete | Reproduction must be exact
PRACTICE: Turn your `<LAB_APP>` lab notes into one full finding with title, affected component, steps, evidence, impact, and a short fix.
SOURCES: None
---
## Core idea
A finding is a concise argument: "this component has this issue, here is proof, here is the impact, here is how to fix it." The mental model: write for the engineer who must reproduce and fix it, not for the person who already knows. Include the app version and hash, the exact class or configuration involved, step-by-step reproduction in the lab, and sanitized evidence (screenshots, log snippets, request/response). Separate observed behavior from inferred risk. Tie the impact to a real asset from your threat model — "an attacker with a malicious app could read a reset token" — rather than generic fear. Link to MASVS/MSTG for context and give a specific remediation. Keep all examples lab-only and free of real credentials.

## Method
1. Give the finding a short, specific title and a severity.
2. State the affected component with class/method or config key.
3. List reproduction steps with lab commands and <LAB_APP> placeholders.
4. Attach sanitized evidence: a log line, a diff, or a proxy request.
5. Describe impact using an asset and actor from the threat model, then recommend a fix.

## Example
```
Title: Reset token written to logcat (LAB-01)
Component: com.lab.app.AuthActivity:42
Steps: 1) Launch <LAB_APP> in emulator. 2) Trigger reset.
       3) Run adb logcat -d | grep token
Evidence: D/TokenFlow: token=LabFakeToken123
Impact: Local app/connected tooling can capture token.
Fix: Remove logging, use R8 to strip logs in release.
```

| Section | Content |
|---|---|
| Evidence | Sanitized log/request |
| Impact | Tied to an asset |
| Fix | Specific and testable |

## Common mistakes
Vague "might be vulnerable" language; unsanitized secrets in evidence; generic remediation like "use best practices."

## Defense and verification
Have a peer reproduce the finding from your steps alone. If they cannot, add detail. Verify the fix resolves it.

## Knowledge check
**Q:** Why should evidence be sanitized? **A:** Logs and captures may contain real tokens or personal data; reports should prove the issue without exposing live secrets.

===MODULE===
TITLE: 47 Risk Rating and Remediation Guidance
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn to assign defensible severity ratings and give remediation advice that balances security, usability, and feasibility.
OBJECTIVES: Apply a rating model | Justify severity | Prioritize fixes
TAKEAWAYS: Impact times likelihood | Context changes rating | Fixes should be verifiable
PRACTICE: Rate three `<LAB_APP>` findings you wrote using a simple impact/likelihood matrix and write one line of remediation and one verification test for each.
SOURCES: None
---
## Core idea
Severity is a communication tool, not a精确 science. A practical model rates **impact** (what happens if exploited) and **likelihood** (how easily an actor in your threat model can exploit it), then combines them into Critical/High/Medium/Low/Informational. The mental model: the same technical issue can be high or low depending on context — a hardcoded key for a lab endpoint is informational, while one for a production payment API is critical. Always explain the rating: name the asset, actor, and precondition (physical access, malicious app, network position). Remediation should be specific, prioritized, and verifiable — "move token to Keystore and confirm no plaintext in logs" beats "improve security." Distinguish immediate fixes, design changes, and accepted risks. All examples remain lab-scoped.

## Method
1. For each finding, state the concrete impact on an asset.
2. Estimate likelihood from the actor capability and preconditions in your model.
3. Combine into a rating and write one sentence of justification.
4. Recommend the smallest effective fix, plus a longer-term design change if needed.
5. Define a verification test that proves the fix.

## Example
```
Finding: token in logcat
Impact: High (session takeover if captured)
Likelihood: Medium (needs local access/tooling)
Rating: High
Fix: Remove log statements; strip in release via R8.
Verify: adb logcat | grep token -> no output.
```

| Impact \\ Likelihood | Low | High |
|---|---|---|
| High | Medium | Critical |
| Low | Low | Medium |

## Common mistakes
Rating by tool score; ignoring preconditions; giving remediation without a verification test.

## Defense and verification
Peer-review ratings for consistency across findings. Verify each fix with the defined test before closing.

## Knowledge check
**Q:** Why must a severity rating include context and justification? **A:** The same issue has different risk depending on assets, actors, and preconditions; justification makes the rating defensible.

===MODULE===
TITLE: 48 Building a Reusable Mobile Test Plan
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Assemble the entire curriculum into a repeatable test plan with scope, environment, checklist, evidence, and reporting steps.
OBJECTIVES: Define scope and rules | Sequence tests | Standardize evidence
TAKEAWAYS: Scope first | Checklist prevents gaps | Evidence is captured as you go
PRACTICE: Draft a one-page test plan for a future authorized assessment of `<LAB_APP>`, listing scope, lab setup, MASVS coverage, and evidence naming conventions.
SOURCES: None
---
## Core idea
A test plan turns a set of skills into a repeatable process. It states what is in and out of scope, the exact lab environment, the tools and versions, the checklist of tests (mapped to MASVS/MSTG), and the evidence conventions — how files are named, where logs go, and how findings are tracked. The mental model: the plan is a contract with the future tester (often you, weeks later). It prevents scope creep, ensures coverage, and makes results reproducible. Sequence matters: threat model, static analysis, dynamic analysis, API testing, triage, and reporting each feed the next. Include explicit authorization statements and stop conditions for anything outside scope. Build it once, reuse it, and improve it after every engagement.

## Method
1. Write scope, authorization, and out-of-scope boundaries, including third parties.
2. Describe the lab: emulator versions, proxy, tools, and snapshots.
3. List the test checklist with MASVS categories and module references.
4. Define evidence naming, storage, and sanitization rules.
5. Add a schedule and a stop/escalation condition.

## Example
```
Scope: <LAB_APP> v1.2 build 42, lab emulator, own API only
Out: third-party domains, real user accounts
Env: Android 14 emulator, proxy 10.0.2.2:8080, snapshot clean_base
Evidence: LAB-01-logcat.txt, LAB-02-proxy.har
```

| Section | Purpose |
|---|---|
| Scope | Legal boundary |
| Checklist | Coverage |
| Evidence | Reproducibility |

## Common mistakes
Starting tests before defining scope; vague evidence naming; re-planning from scratch each time.

## Defense and verification
Review the plan against authorization before every engagement and update it when tools or app versions change. Verify a dry run completes using only the plan.

## Knowledge check
**Q:** Why is scope the first section of a test plan? **A:** It defines legal and technical boundaries, ensuring testing stays on authorized apps and systems only.

===MODULE===
TITLE: 49 Capstone: Android App Assessment
LEVEL: Advanced
MINUTES: 60
SUMMARY: Integrate threat modeling, static analysis, dynamic analysis, and API testing into one end-to-end assessment of an Android lab app.
OBJECTIVES: Run a full workflow | Corroborate static and dynamic evidence | Deliver a complete report
TAKEAWAYS: Evidence must corroborate | Coverage beats cleverness | Report the negatives too
PRACTICE: Using an Android app you built or one explicitly in scope, run the full 50-module workflow from threat model through report, keeping a coverage matrix and three verified findings.
SOURCES: None
---
## Core idea
This capstone fuses everything. Start with a threat model and scope, inventory the APK, scan with MobSF, decompile with jadx/apktool, review the manifest and secrets, then move to an isolated emulator with a proxy, Frida/objection, and runtime inspection. Test the app's own API with modified requests, triage candidates, map them to MASVS/MSTG, and write findings with reproducible evidence. The mental model: a real assessment is a pipeline where each phase narrows uncertainty — static raises questions, dynamic answers them, and the report communicates both confirmed issues and tested-and-safe controls. Record what you tested and found clean, not just failures. Every step stays within apps you own or written authorization.

## Method
1. Define scope and threat model; snapshot a clean emulator.
2. Static: hash, MobSF, jadx, apktool, manifest, and secrets review.
3. Dynamic: install, intercept traffic, inspect storage/memory, run targeted hooks.
4. API: replay captured requests against your own backend with changed parameters.
5. Triage, map to MASVS, write findings, and peer-review reproduction.

## Example
```
sha256sum <LAB_APP>.apk        # baseline hash
mobsf <LAB_APP>.apk            # static baseline
frida -U -f com.lab.app -l hook.js
# Final: 3 findings, MASVS coverage 6/7 categories tested
```

| Phase | Deliverable |
|---|---|
| Static | Candidate list with code locations |
| Dynamic | Confirmed runtime evidence |
| Report | Findings + coverage matrix |

## Common mistakes
Skipping the clean snapshot; reporting unverified static candidates; omitting categories you found safe.

## Defense and verification
Peer-reproduce every finding and confirm the coverage matrix has no unexplained gaps. Verify fixes with defined tests before closing.

## Knowledge check
**Q:** Why report controls that tested clean? **A:** It demonstrates coverage and helps stakeholders know which areas were verified, not just which failed.

===MODULE===
TITLE: 50 Capstone: iOS App Assessment and Program Wrap-up
LEVEL: Advanced
MINUTES: 60
SUMMARY: Complete the mirror-image iOS capstone and close the curriculum with a reusable, authorized mobile security program mindset.
OBJECTIVES: Run a full iOS workflow | Compare platform differences | Institutionalize the practice
TAKEAWAYS: Platform differences matter | Reusability beats heroics | Authorization always comes first
PRACTICE: Using an iOS app you built or one explicitly in scope, run the full workflow from codesigning and entitlements through link, Keychain, ATS, and API testing, and deliver a coverage-mapped report.
SOURCES: None
---
## Core idea
The iOS capstone mirrors Android but changes the primitives: inspect codesigning and entitlements, read the sandbox container and information property list, analyze the Mach-O with otool/class-dump, review Keychain accessibility classes and data protection, test ATS exceptions and URL schemes/Universal Links, then observe runtime behavior in a simulator or authorized device. Use your proxy and instrumentation tools in the same disciplined, snapshot-based way. The mental model: the methodology is platform-independent — threat model, static, dynamic, API, triage, report — while the enforcement points differ. Wrap up by turning both capstones into a personal checklist and a habit of authorized, documented, repeatable work. Never test apps or services you do not own or that are outside a written scope.

## Method
1. Define scope and record device/simulator limitations and authorization.
2. Static: codesign entitlements, plist/ATS, otool/class-dump, secrets.
3. Dynamic: proxy capture, Keychain/container inspection, link handling.
4. API: replay requests against your own backend; check server-side authorization.
5. Triage, map to MASVS/MSTG, write findings, and peer-review.
6. Archive tools, versions, hashes, and the updated checklist for reuse.

## Example
```
codesign -d --entitlements :- <LAB_APP>.app
otool -L <LAB_APP>.app/<LAB_APP> | head
plutil -p <LAB_APP>.app/Info.plist | grep -A6 NSAppTransportSecurity
# Final: coverage mapped, findings reproducible, lab-only evidence
```

| Android primitive | iOS counterpart |
|---|---|
| Keystore | Keychain / Secure Enclave |
| networkSecurityConfig | ATS settings |
| App Links | Universal Links |

## Common mistakes
Assuming Android results transfer unchanged; ignoring simulator hardware gaps; testing outside written authorization.

## Defense and verification
Peer-review both capstone reports and verify every fix. Maintain the checklist and scope discipline for every future engagement.

## Knowledge check
**Q:** What is the single most important rule across all 50 modules? **A:** Test only apps and systems you own or that are explicitly in scope, in an isolated lab, with documented authorization.
