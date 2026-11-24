===MODULE===
TITLE: Where AI Helps and Where It Hurts in Bug Bounty
LEVEL: Beginner
MINUTES: 45
SUMMARY: Map the honest strengths and failure modes of AI assistants in bounty work so you use them as leverage rather than a crutch.
OBJECTIVES: identify high-value AI use cases | recognize tasks that demand human judgment | set realistic expectations for automation
TAKEAWAYS: AI is a force multiplier for skilled hunters | verification is non-negotiable | fundamentals still decide outcomes
PRACTICE: On a lab target you own, summarize one minified JavaScript file by hand and with AI, then compare every claim to the source.
SOURCES: None
---
## Core idea
AI assistants are pattern-recognition amplifiers: they compress information, propose hypotheses, and draft prose faster than a person can. In bounty work they excel at reading large JavaScript bundles, summarizing unfamiliar code, brainstorming test cases, and polishing writeups. They are unreliable at anything requiring ground truth you did not supply — confirming exploitability, judging real business impact, or recalling exact program policy. The honest framing is simple: AI does not find bugs on its own; a skilled hunter using AI finds more bugs, faster, with less drudgery. If you cannot perform a task without AI, you cannot reliably detect when the assistant is wrong. This module draws the boundary so you deploy assistants where they add leverage and keep human judgment where accuracy matters. Treat every AI output as a suggestion awaiting verification, never as a conclusion. The assistant is a fast, tireless, occasionally confident-wrong intern: excellent at first drafts, terrible at final authority.

### Method
Before opening a chat, classify the task with this decision table:

| Task | Good AI use | Keep human |
| --- | --- | --- |
| Summarize a minified JS file | First-pass overview | Confirm every call site |
| Generate payload ideas | Variant brainstorm | Validate in an owned lab |
| Decide severity and impact | Draft a CVSS vector | Final judgment |
| Read a program's rules | Paraphrase for notes | Quote the source verbatim |

For any analysis task, supply bounded context and request structured output:

```text
You are assisting an authorized review of a lab target I own. Given the
attached function, list (1) user-controlled inputs, (2) sinks they reach,
(3) confidence per path. Do not claim exploitability. Label unknowns
explicitly and cite the exact lines you relied on.
```

### Failure modes
- Confident fabrication of endpoints, APIs, or CVEs that do not exist.
- Repeating an assumption from your own prompt as if it were evidence.
- Quietly ignoring the portion of code you did not paste.
- Suggesting aggressive actions that exceed scope; you must filter every one.
- Optimizing for a polished-sounding answer rather than a correct one.

### Verification steps
Cross-check each claim against the raw artifact. Open the referenced line in the real file. Re-run the tool yourself. If a claim cannot be traced to a source you actually hold, discard it. Log disagreements between AI output and ground truth in an evaluation file so patterns emerge over time. Never promote an unverified suggestion into a report simply because it reads well.

### Worked example
You paste a ten-line function into the assistant and it reports that a parameter reaches `innerHTML`. Open the file: the sink is actually `textContent`, which escapes content. The assistant was wrong because a similar pattern in its training data dominated. You record the miss, correct your mental model of that framework, and continue. This is the normal loop — useful candidates, frequent corrections, and you as the final filter.

### Knowledge check
Q: Why must you still master fundamentals when using AI?
A: Because you need independent ground truth to catch hallucinations; AI amplifies skill, it does not replace it.

===MODULE===
TITLE: AI Amplifies Skill, It Does Not Replace Fundamentals
LEVEL: Beginner
MINUTES: 50
SUMMARY: Understand why strong security fundamentals are the prerequisite that makes AI assistance safe and productive.
OBJECTIVES: explain the amplification model | diagnose over-reliance on assistants | design a fundamentals-first workflow
TAKEAWAYS: skill determines the ceiling of AI usefulness | blind trust creates false confidence | practice without AI builds verification muscle
PRACTICE: Solve a vulnerability in a local lab with no AI, then redo it with AI and measure what the assistant actually improved.
SOURCES: None
---
## Core idea
A useful mental model is that AI multiplies your existing competence rather than adding to it. A hunter who understands HTTP semantics, browser same-origin rules, and memory layout can ask precise questions and judge answers critically. A beginner without that scaffolding gets fluent-sounding nonsense and no way to tell the difference. This is the amplification principle: a multiplier applied to zero is still zero. The assistant compresses the distance between a question and a plausible answer, but it does not supply the judgment that separates a real bug from an artifact. In practice, the hunters who gain the most from AI are those who already know what "right" looks like. They use it to read code faster, generate variants they would eventually have derived, and remove clerical work. The danger is skill atrophy: if you outsource the reasoning, you never build the internal model needed to review outputs. Protect fundamentals deliberately, the way an athlete protects base conditioning during a season.

### Method
Adopt a two-pass workflow. Pass one is unaided: form your own hypothesis about the target before consulting the assistant. Pass two is assisted: ask the model to challenge, expand, or refute your hypothesis. This preserves your judgment as the primary engine. A reusable pattern:

```text
My hypothesis: <state it in one sentence, with the evidence>.
Act as a skeptical reviewer of an authorized lab review. List three
reasons this hypothesis could be wrong, and three specific checks that
would confirm or refute it. Do not restate the hypothesis as fact.
```

Track how often the assistant changes your mind toward correctness. If it rarely does, you are asking shallow questions.

### Decision table
| Situation | Unaided first? | AI role |
| --- | --- | --- |
| Novel bug class | Yes | Explainer after you form a view |
| Repetitive triage | No | Summarizer and formatter |
| Impact judgment | Yes | Devil's advocate only |
| Syntax questions | No | Quick reference |

### Failure modes
- Skipping the unaided pass and inheriting the model's first guess.
- Treating fluency as correctness.
- Letting the assistant define the scope of the problem for you.
- Losing the ability to debug when the tool is unavailable.
- Practicing only with AI, so unaided skills decay.

### Verification steps
Keep a "no-AI Friday" habit for one lab exercise weekly. Re-derive conclusions from primary sources. When the assistant disagrees with you, write down who was right and why. Review the log monthly to spot systematic biases. If you cannot explain a concept without the tool, stop and study it directly.

### Worked example
You are reviewing a lab upload endpoint. Before asking anything, you note that the extension check happens client-side and hypothesize the server may trust it. Only then do you ask the assistant to list server-side checks that would refute this. It names MIME sniffing and content inspection, which you verify by inspecting server code. Your unaided hypothesis stayed in charge; AI expanded the checklist.

### Knowledge check
Q: What does the amplification principle imply for a beginner?
A: That AI multiplies existing skill; without fundamentals it produces confident nonsense the beginner cannot detect.

===MODULE===
TITLE: Platform Rules, Disclosure, and AI-Generated Reports
LEVEL: Beginner
MINUTES: 45
SUMMARY: Learn how platform policies treat AI-assisted work and why authorization and disclosure rules always override tooling.
OBJECTIVES: locate the authoritative rules for a program | explain safe harbor and disclosure timing | keep AI use within policy
TAKEAWAYS: the program page is the source of truth | disclosure embargoes bind you regardless of tools | AI never creates authorization
PRACTICE: Read a public program page and a training platform's disclosure policy, then write a one-page summary of the rules you must follow.
SOURCES: None
---
## Core idea
Every bounty engagement is a contract. The platform's program page defines scope, exclusions, safe harbor, rate limits, and disclosure expectations. AI does not alter that contract. A generated report is still your report, and you are accountable for its accuracy. Many programs now explicitly address AI: some permit assistance with analysis and writing, some restrict bulk-generated submissions, and some require disclosure of tool use. Because policies vary and evolve, the only safe practice is to read the current published rules for each program before testing or submitting. Safe harbor is conditional language: it protects good-faith research conducted within scope, not careless or out-of-scope activity. Disclosure rules typically impose an embargo while the owner fixes the issue; an AI draft that leaks details early can violate it. Treat the policy text as authoritative data that you quote verbatim rather than paraphrase from memory. When in doubt, ask the program through its official channel. Never let an assistant's confident claim about "what the policy says" substitute for reading it.

### Method
Build a rules checklist you complete before every engagement:

```text
Program: <name>   Scope: <assets>
Exclusions: <list>  Rate limits: <value>
Safe harbor: <quote exact text>
Disclosure: <embargo and channel>
AI policy: <allowed / restricted / undisclosed>
```

Paste only published rule text into your notes, with a URL and access date. If you ask an AI to summarize the rules, label the summary unverified and keep the original beside it.

### Decision table
| Question | Answer source | AI acceptable? |
| --- | --- | --- |
| Is this asset in scope? | Program page | No, read it yourself |
| What is the embargo? | Disclosure policy | Draft only, verify |
| Is AI use allowed? | Program/platform rules | No, read it yourself |
| How are duplicates handled? | Platform rules | Summarize, then verify |

### Failure modes
- Trusting a model's recollection of a platform policy.
- Reporting against an out-of-scope asset because a generator suggested it.
- Publishing details before the embargo ends.
- Assuming safe harbor covers activity that violates rate limits.
- Citing an old version of a policy after it changed.

### Verification steps
Quote the exact rule line that authorizes each action. Before submitting, re-read the program page for changes. Confirm the report contains only in-scope evidence and no personal data. Keep a timestamped snapshot of the policy you relied on, so a later dispute can be resolved with facts.

### Worked example
You ask an assistant what a platform's disclosure rule says and it gives a confident answer from memory. You open the program page and find the embargo is longer than stated. You discard the answer, quote the actual line into your notes, and set a calendar reminder. The assistant was a starting hint; the published text was the authority.

### Knowledge check
Q: Can an AI assistant grant you permission to test an asset?
A: Never. Authorization comes only from the program's published scope; AI has no authority.

===MODULE===
TITLE: Avoiding AI-Generated Report Spam and Low-Quality Submissions
LEVEL: Beginner
MINUTES: 40
SUMMARY: Recognize how bulk AI reports damage triage and your reputation, and adopt a quality-first submission discipline.
OBJECTIVES: define what makes a report low quality | detect generic AI-generated findings | apply a pre-submission quality gate
TAKEAWAYS: volume is not value | triage penalizes noise | every report needs evidence you personally verified
PRACTICE: Take a draft AI-generated finding and rewrite it into a single evidence-backed report, deleting unsupported claims.
SOURCES: None
---
## Core idea
Platforms and triage teams are increasingly flooded with reports that read fluently but contain no verified vulnerability. Often these are generated in bulk: a scanner output or a guessed endpoint is fed to a model that produces polished prose about "potential SQL injection" with no proof. Such submissions waste triage time, harm the receiver's trust in researchers, and damage your own reputation. Programs may close reports as spam or informative, and repeated low-quality submissions can get an account restricted. The root problem is not AI itself but skipping the verification step that turns an observation into a finding. A real report contains a specific affected asset, steps a triager can reproduce, evidence of impact, and an honest severity. Before writing anything, ask whether you have reproduced the behavior yourself. If the only support is an assistant's phrasing, you do not have a finding. Quality-first discipline means submitting fewer, better-evidenced reports and treating each one as a professional artifact that reflects your name.

### Method
Apply a hard pre-submission gate. A report must pass every line:

```text
[ ] Asset confirmed in scope, with the exact rule quoted
[ ] Behavior reproduced by me, with timestamps
[ ] Evidence (request/response, screenshot) attached
[ ] Impact stated concretely, not generically
[ ] Severity justified against the program matrix
[ ] No claims sourced only from an AI output
```

If any box is unchecked, do not submit. Use AI to edit clarity, never to invent the missing evidence.

### Decision table
| Draft state | Action |
| --- | --- |
| Observation, not reproduced | Keep in notes only |
| Reproduced, no impact proof | Investigate further |
| Reproduced with proof and scope | Write and submit |
| Generated from a guess | Delete immediately |

### Failure modes
- Submitting a finding because the assistant said "this looks vulnerable."
- Inflating severity to get attention.
- Copying a template without tailoring evidence.
- Sending many near-duplicate variants of the same issue.
- Reporting behavior that is documented, intended functionality.

### Verification steps
Reproduce from a clean session. Capture raw evidence. Re-read the report and strike any sentence you cannot defend. Check for duplicates in disclosed reports where available. Send one finding per report. Treat the quality gate as non-negotiable even when you are eager to submit.

### Worked example
A generator produces a polished report claiming reflected XSS on a lab parameter. You test it: the value is HTML-escaped and never executes. You delete the draft rather than submitting. Later, manual testing finds a real DOM sink in the same app, which you report with a screenshot and a minimal payload. One verified finding beats ten generated claims.

### Knowledge check
Q: What single test most reliably separates a real report from AI spam?
A: Whether you personally reproduced the behavior and can attach concrete evidence a triager can replay.

===MODULE===
TITLE: Verify Every Claim: Hallucination and False Confidence
LEVEL: Beginner
MINUTES: 50
SUMMARY: Build a systematic verification habit that catches fabricated APIs, paths, and impacts before they reach a report.
OBJECTIVES: recognize common hallucination patterns | trace claims to primary sources | build a verification checklist
TAKEAWAYS: fluent text is not evidence | every factual claim needs a source | uncertainty should be labeled, not hidden
PRACTICE: Feed an AI a short function, collect its claims, and mark each as verified or fabricated by checking the code directly.
SOURCES: None
---
## Core idea
Large language models generate text that is statistically plausible, not factually guaranteed. In security work this shows up as invented endpoint names, nonexistent CVE numbers, misquoted RFC sections, and confident claims about code the model never saw. The danger is amplified in our field because a plausible-sounding falsehood can look exactly like a real finding. Verification is therefore not an optional polish step; it is the core skill that makes AI usable. The discipline is to treat each sentence as a claim with a burden of proof. Ask: what source does this rely on, and can I open it? If the answer is "the model said so," the claim has no standing. Good assistants help by citing line numbers and flagging uncertainty when you ask them to. Bad outputs blur guessing into assertion. You should reward the former with careful follow-up and reject the latter outright. Over time, keeping a ledger of which claims held up teaches you which tasks are safe to delegate and which demand full human review.

### Method
Use a three-column claim ledger during analysis:

| Claim | Source | Status |
| --- | --- | --- |
| Endpoint /api/v1/x exists | Line 42 of bundle.js | Verified |
| Parameter id is injectable | None given | Rejected |
| CVE-2024-XXXX applies | Model recall | Unverified |
| Cookie is HttpOnly | Set-Cookie header line 8 | Verified |

For each assistant output, run this verification prompt:

```text
For every factual claim above, output a table with the claim, the exact
source (file and line or URL you were given), and your confidence. If you
cannot cite a provided source, write "no source" rather than guessing.
```

Then confirm independently. Never accept "no source" claims.

### Failure modes
- Assuming version numbers or library behavior from memory.
- Accepting a synthesized proof-of-concept without running it.
- Letting a fabricated CVSS score drive a report's severity.
- Confirmation bias: keeping claims that match your hypothesis.
- Treating a confident tone as a proxy for accuracy.

### Verification steps
Open each cited line. Run each command in a lab. Cross-check specs against official text, not a summary. Record corrections in your evaluation log. If a source cannot be reached, mark the claim unknown and exclude it from reports. When a claim is important and unverifiable, ask a different tool or read the primary document yourself.

### Worked example
The assistant claims a library version is vulnerable to a known CVE and suggests a matching payload. You check the dependency manifest: the app uses a patched version. The claim was fabricated from a common training pattern. You log the miss and verify all future version claims against the manifest before acting on them.

### Knowledge check
Q: What is the correct status for a claim that has no citable source?
A: Unknown or rejected — it must not appear in a report until independently verified.

===MODULE===
TITLE: Privacy and Data Handling: Never Paste Confidential Scope or Real User Data
LEVEL: Beginner
MINUTES: 45
SUMMARY: Learn to protect confidential program details and personal data when using assistants, whether local or hosted.
OBJECTIVES: classify sensitive inputs before sharing | avoid leaking scope and user data | choose safe local alternatives
TAKEAWAYS: hosted prompts may be retained or reviewed | private program scopes are confidential | minimize and anonymize by default
PRACTICE: Sanitize a sample log containing fake user emails and a private scope name, then feed only the sanitized version to an assistant.
SOURCES: None
---
## Core idea
Every prompt you send to a hosted assistant is data leaving your control. It may be logged, retained, or used for improvement depending on the provider's terms. In bounty work, two categories are especially sensitive. First, private program invitations, scopes, and targets are confidential; disclosing them can breach the program agreement and burn your access. Second, real user data — names, emails, tokens, session cookies, personal messages — must never be pasted into a tool, because doing so can violate privacy law and platform rules regardless of intent. The safe default is minimization: give the assistant only what the task requires, in synthetic or redacted form. Replace identifiers with placeholders such as <LAB_HOST>, <USER_EMAIL>, and <TOKEN>. Prefer a local model for anything you cannot sanitize. Treat your chat history as a document that might be read by someone else: write it so that it contains nothing you would not want exposed. Privacy discipline is not paranoia; it is professional hygiene that protects the program, its users, and your reputation.

### Method
Before each prompt, classify the data:

```text
Public code / synthetic data  -> hosted assistant is fine
Private scope or target names -> local model only, or omit entirely
Real user data or credentials -> never paste; redact to placeholders
```

Redaction pattern:

```text
Replace emails with <USER_EMAIL>, hostnames with <LAB_HOST>,
tokens and cookies with <TOKEN>. Keep structure, remove identity.
```

When a hosted tool is unavoidable, use a provider with a clear no-training policy and confirm it before sending.

### Decision table
| Data type | Hosted AI | Local AI |
| --- | --- | --- |
| Public docs, synthetic lab data | Allowed | Allowed |
| Private scope details | Avoid | Preferred |
| Real PII or secrets | Never | Never (sanitize first) |
| Screenshots with personal data | Redact first | Redact first |

### Failure modes
- Pasting a raw request dump that contains session cookies.
- Naming a private program in a chat title.
- Assuming "delete chat" removes retained copies.
- Sharing screenshots with unredacted personal data.
- Uploading production logs to a tool with unclear retention.

### Verification steps
Scan your prompt for emails, IPs, hostnames, and tokens before sending. Confirm every identifier is a placeholder. Store sensitive notes locally, not in a cloud-linked tool. Review chat history periodically and delete unnecessary threads. If you accidentally paste sensitive data, stop, delete the thread, and report it internally if required.

### Worked example
You want help parsing an error log. The raw log includes customer emails and a session token. You replace them with <USER_EMAIL> and <TOKEN>, keep the error structure intact, and paste the sanitized version. The assistant still identifies the failing code path. You got the insight without exposing anyone's data.

### Knowledge check
Q: What should you do with a private program's scope when you need AI help?
A: Use a local model or omit it entirely; never paste confidential scope into a hosted assistant.

===MODULE===
TITLE: Local Models vs Hosted Models: Choosing the Right Tool
LEVEL: Intermediate
MINUTES: 60
SUMMARY: Compare local and hosted AI options on privacy, capability, cost, and speed so you can pick the right assistant per task.
OBJECTIVES: weigh privacy against capability | identify tasks suited to each deployment | build a hybrid workspace
TAKEAWAYS: hosted models offer stronger reasoning | local models keep data on your machine | hybrid use gives the best coverage
PRACTICE: Run the same summarizing prompt on a local model and a hosted model using synthetic lab data, then compare accuracy and note privacy tradeoffs.
SOURCES: None
---
## Core idea
AI assistance comes in two broad flavors. Hosted models run in a provider's data center: they are typically more capable, always available, and cheap per use, but every prompt leaves your machine. Local models run on your hardware: nothing leaves, you control retention, and you can work offline, but capability is bounded by the model and your GPU, and setup takes effort. Neither is universally better. The right choice depends on the sensitivity of the data and the difficulty of the task. Confidential scopes, real logs, and proprietary code belong with a local model or should be sanitized first. Hard reasoning tasks — subtle code semantics, ambiguous specs — often justify a hosted model with synthetic or public inputs. A mature workspace uses both: local for bulk, sensitive, or offline work; hosted for deep reasoning on sanitized material. Cost also matters. Hosted usage has per-token pricing and rate limits; local usage has hardware and electricity costs. Availability matters too: a local model keeps working during outages. Build a personal decision rule and apply it consistently rather than choosing ad hoc each time.

### Method
Evaluate each task on four axes:

| Axis | Local | Hosted |
| --- | --- | --- |
| Data sensitivity | High privacy | Send only sanitized data |
| Reasoning depth | Adequate for summaries | Stronger for hard logic |
| Cost profile | Hardware upfront | Per-use billing |
| Availability | Offline capable | Needs internet |

A practical routing rule:

```text
If data is sensitive or confidential -> local, or sanitize heavily.
If task needs deep reasoning and data is public -> hosted.
If working offline or at volume -> local.
```

### Failure modes
- Assuming a local model is private if plugins enable network access.
- Sending private data to a hosted model because it was "just a quick question."
- Overestimating a small local model's reasoning on complex taint analysis.
- Ignoring rate limits and unexpected costs.
- Using a hosted model with a policy you never read.

### Verification steps
Check the privacy terms of any hosted tool before use. Confirm local model plugins are offline. Test both options on a known task and measure accuracy. Keep a routing log so you can audit why a given prompt went where. Revisit the decision whenever a provider changes its terms.

### Worked example
You have a private program's JavaScript bundle and want a summary. Because the scope is confidential, you run a local model on it and get a usable overview. For a subtle authentication-flow question, you reconstruct a synthetic version of the logic and ask a hosted model, citing no real data. Each tool handled what it was suited for.

### Knowledge check
Q: Which deployment is appropriate for confidential private-program scope data?
A: A local model, or omit the data entirely — never a hosted assistant.

===MODULE===
TITLE: Context Management: Feeding the Right Information
LEVEL: Intermediate
MINUTES: 55
SUMMARY: Learn to manage limited context windows so assistants get the right code and data without noise or leakage.
OBJECTIVES: explain context window limits | chunk large artifacts effectively | prioritize relevant context
TAKEAWAYS: more context is not always better | relevant beats complete | structure beats dumping
PRACTICE: Take a 5,000-line JavaScript bundle and produce a focused 200-line excerpt that preserves the relevant call chain for analysis.
SOURCES: None
---
## Core idea
An assistant only knows what you put in its context window. That window is finite, and attention degrades as irrelevant material accumulates. The practical skill is context curation: selecting the smallest set of artifacts that contains the answer. Dumping an entire codebase rarely works; it buries signal, increases cost, and can trigger truncation where the most important lines fall outside the window. Instead, chunk the problem. Identify the specific function, file, or log slice relevant to the question, and paste that. Add a short description of what you already tried so the model does not repeat it. When a task genuinely spans multiple files, provide a table of contents first, then drill into one section per exchange. Modern tools offer retrieval-augmented generation to fetch relevant chunks automatically, but even then you should understand what is being retrieved. A useful heuristic: if you cannot explain why each pasted item is in the prompt, remove it. Good context management also protects privacy, because it naturally limits how much sensitive data you expose. The result is cheaper, faster, and more accurate assistance.

### Method
Use a three-part prompt structure:

```text
CONTEXT: <the specific code excerpt or log slice, with file and line numbers>
WHAT I TRIED: <brief list of hypotheses already ruled out>
QUESTION: <one precise question with the desired output format>
```

For large artifacts, build an index first:

| Chunk | Contents | Relevance |
| --- | --- | --- |
| lines 1-800 | setup, imports | low |
| lines 801-1200 | request handler | high |
| lines 1201-2000 | utility helpers | medium |

Then feed only high-relevance chunks.

### Failure modes
- Pasting whole files when a function would do.
- Losing the question at the end of a huge prompt.
- Assuming the model saw a file you only referenced by name.
- Letting old chat context contaminate a new, unrelated task.
- Truncating the most important lines off the end.

### Verification steps
Start a fresh session for unrelated tasks. Re-state essential context explicitly. Ask the model to echo back what it believes the question is before answering. Trim any item whose removal would not change the answer. Check that referenced line numbers still match the file version you pasted.

### Worked example
You paste a full 4,000-line bundle and ask where tokens are validated; the answer is generic and misses the handler. You rebuild the prompt with just the 150-line auth function plus one line noting you already ruled out the client check. The answer now cites the exact validation call, which you verify by opening the line.

A practical way to keep context honest is to ask the assistant to restate the question in one sentence before answering. If its restatement differs from what you meant, you know the prompt needs tightening. This small echo-back step also catches the case where a large paste pushed your actual question out of the model's effective attention, which is a common source of confidently irrelevant answers.

### Knowledge check
Q: Why is a focused excerpt usually better than a full file dump?
A: It preserves signal, avoids truncation, reduces cost, and limits data exposure while keeping the relevant call chain intact.

===MODULE===
TITLE: Prompt Patterns for Security Analysis
LEVEL: Intermediate
MINUTES: 60
SUMMARY: Learn reusable prompt structures that turn vague assistance into consistent, auditable security analysis.
OBJECTIVES: write role-and-task prompts | request structured outputs | apply chaining and self-critique patterns
TAKEAWAYS: specificity beats cleverness | structured output enables verification | chaining beats one-shot prompts
PRACTICE: Build a prompt that asks for a taint table from a small lab function and refine it until outputs are consistent across three runs.
SOURCES: None
---
## Core idea
Ad hoc prompting produces ad hoc results. Reliable analysis comes from reusable patterns that constrain the model's role, input, task, and output format. A good prompt states the authorization context ("an authorized review of a lab target I own"), defines the role ("you are a code reviewer"), supplies bounded input, gives a precise task, and demands a structured output such as a table or JSON. This makes results comparable across runs and easy to verify. Several patterns recur in security work. Chaining breaks a large task into steps: first extract inputs, then trace to sinks, then assess likelihood. Self-critique asks the model to review its own answer for unsupported claims. Contrast prompting asks it to argue both sides of a hypothesis. Few-shot prompting provides one worked example of the desired output. The common thread is constraint: the more freedom the model has to wander, the more it will hallucinate. Treat prompts as code you version and refine, storing the ones that work in a personal library. Never put secrets or private scope in a prompt, regardless of pattern.

### Method
A core analysis pattern:

```text
ROLE: You are a security code reviewer for an authorized lab review.
INPUT: <function with line numbers>
TASK: Identify user-controlled inputs and the sinks they reach.
OUTPUT: A markdown table with columns: input, source line, sink, sink line,
confidence, evidence. Write "unknown" where evidence is absent.
CONSTRAINT: Do not claim exploitability. Do not invent identifiers.
```

Chain it with a second prompt that critiques the first table for rows lacking evidence.

### Decision table
| Pattern | Use when |
| --- | --- |
| Chaining | Task has dependent steps |
| Self-critique | Output will be relied upon |
| Few-shot | Format consistency matters |
| Contrast | Hypothesis is uncertain |

### Failure modes
- Prompts that assume the conclusion in the question.
- Asking for "all vulnerabilities" with no bounded artifact.
- Omitting the output format and getting unstructured prose.
- Reusing a prompt across unrelated tasks without resetting context.
- Forgetting the authorization context in the prompt.

### Verification steps
Run the prompt twice and compare outputs; inconsistency signals weak constraints. Validate each table row against the source. Store stable prompts in a versioned library with notes on what failed. If two runs disagree on a factual row, treat that row as unverified until you check it yourself.

### Worked example
Your first prompt asks "is this code vulnerable?" and gets a vague essay. You rewrite it to request a table with evidence columns and a no-invention constraint. Three runs now produce consistent rows, one of which lacks evidence; you strike it. The structured pattern turned noise into a checkable artifact.

### Knowledge check
Q: Which prompt pattern best reduces hallucinated support for claims?
A: Self-critique plus an explicit "write unknown where evidence is absent" constraint.

===MODULE===
TITLE: Deterministic Tasks vs Creative Tasks for AI
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Distinguish tasks where AI can be trusted to automate from tasks where it should only suggest, and route work accordingly.
OBJECTIVES: classify tasks by determinism | match verification effort to task type | avoid over-trusting creative outputs
TAKEAWAYS: deterministic tasks tolerate automation | creative tasks need human gates | risk scales with consequence
PRACTICE: Classify five lab tasks (formatting, decoding, fuzzing ideas, impact judgment, report tone) and assign an AI autonomy level to each.
SOURCES: None
---
## Core idea
Not all AI uses carry equal risk. Deterministic tasks have a checkable right answer: reformatting a report, decoding base64, converting a curl command to Python, generating a regex you can test against samples. For these, AI can be trusted to do the work because you can verify the output mechanically. Creative or judgment-heavy tasks have no single correct answer: hypothesizing where a bug might hide, judging business impact, choosing which finding matters. Here the assistant should only propose options that you evaluate. Routing work by this distinction prevents the two classic mistakes: over-trusting a creative suggestion as fact, and wasting human effort re-doing deterministic work a machine can verify. A useful autonomy ladder runs from fully automated (with tests), to assisted (with review), to human-only (AI may comment but not decide). Consequence matters too: a wrong format is cheap; a wrong severity or an out-of-scope action is expensive. Match the level of scrutiny to the cost of being wrong. Documenting this routing once saves endless case-by-case deliberation.

### Method
Classify each task on two axes: verifiability and consequence.

| Task | Verifiable? | Consequence | Autonomy |
| --- | --- | --- | --- |
| Format a report | Yes | Low | Automate |
| Decode encoded data | Yes | Low | Automate with tests |
| Suggest test hypotheses | No | Medium | Assisted only |
| Judge severity and impact | Partly | High | Human decision |

A routing rule:

```text
If a mechanical test can confirm the output -> automate and test.
If no test exists -> assisted, with a named human owner for the decision.
If the consequence is high -> require independent human sign-off.
```

### Failure modes
- Trusting a "creative" impact assessment as if it were verified.
- Manually redoing deterministic tasks out of habit.
- Automating a judgment call because it "looked routine."
- Skipping tests on automated outputs because the model sounded sure.
- Escalating autonomy without revisiting the routing table.

### Verification steps
For automated tasks, write a test that would catch an error. For assisted tasks, record who made the final decision and why. Re-audit the routing table when a task's consequence changes. When in doubt, downgrade autonomy: assisted is safer than automated, and a human gate is cheap.

### Worked example
You ask the assistant to convert a curl request into Python and test the result against a local mock endpoint: it matches, so you automate that step. Separately it suggests that an IDOR "must be high severity." You refuse to adopt the label and instead check the data sensitivity and program matrix yourself, rating it medium. The two tasks received different treatment because their verifiability differed.

### Knowledge check
Q: Which task is safest to fully automate with AI?
A: One with a mechanically checkable correct answer, such as reformatting or decoding, verified by a test.

===MODULE===
TITLE: Note-Taking and Knowledge Capture for AI-Assisted Work
LEVEL: Intermediate
MINUTES: 50
SUMMARY: Design a note system that captures evidence, AI contributions, and decisions so your work stays auditable and reusable.
OBJECTIVES: structure notes for reproducibility | record AI outputs with provenance | build a searchable personal knowledge base
TAKEAWAYS: notes are evidence, not memory | record what AI contributed | structure enables later RAG and review
PRACTICE: Create a markdown note for one lab finding with sections for evidence, AI hypotheses, verification, and final decision.
SOURCES: None
---
## Core idea
Analysis that lives only in a chat window is lost work. A durable note system turns each session into reusable evidence and makes your reasoning auditable. The key idea is provenance: for every conclusion, record where it came from — your own observation, a tool output, or an AI suggestion. This matters because a report must rest on evidence you can reproduce, not on a half-remembered assistant claim. A good note captures the target and date, the exact commands run, raw outputs, hypotheses (with who proposed them), verification results, and the final decision with rationale. Organize notes in a consistent folder structure with stable filenames and tags, so you can search them later and feed them into a retrieval system. Keep AI outputs in a clearly labeled section, separated from verified facts. Over time this library becomes a competitive advantage: patterns across engagements reveal recurring bug classes and effective prompts. It also protects you during disputes, because you can show how a conclusion was reached. Discipline here is what separates a one-off hunter from a systematic practitioner who compounds knowledge across every engagement.

### Method
Use a fixed note template:

```text
# Finding / Topic: <name>
Date: <date>   Target: <LAB_HOST or owned asset>   Status: <open/verified/closed>
## Evidence (raw commands and outputs)
## Hypotheses (mark: human or AI, with prompt ID)
## Verification (what confirmed or refuted each)
## Decision and rationale
## Follow-ups
```

Store prompts in a separate versioned library with IDs referenced from notes.

### Decision table
| Information | Where it goes |
| --- | --- |
| Raw tool output | Evidence section, unedited |
| AI suggestion | Hypotheses, labeled with prompt ID |
| Confirmed fact | Decision section, with source |
| Open question | Follow-ups section |

### Failure modes
- Editing raw output until it no longer matches reality.
- Losing the prompt that produced a useful hypothesis.
- Mixing verified facts and guesses in one paragraph.
- Using inconsistent filenames that defeat search.
- Storing everything in chat history with no export.

### Verification steps
Reopen a week-old note and try to reproduce the result from it alone. If you cannot, the note is incomplete. Check that every claim has a source line. Confirm AI contributions are labeled. Add tags for bug class, tech stack, and outcome so retrieval works later. Keep raw evidence immutable and append corrections rather than rewriting history.

### Worked example
A month later you encounter a similar lab application. Your note tagged "JWT / algorithm confusion" lets you retrieve the earlier analysis, including the exact prompt that produced the useful hypothesis and the verification that refuted one claim. You reuse the prompt, skip the dead end, and reach a conclusion in half the time. Without the note, you would have repeated both the work and the mistake.

### Knowledge check
Q: Why label whether a hypothesis came from you or an AI?
A: Because provenance tells you what needs independent verification and makes the reasoning auditable later.

===MODULE===
TITLE: Evaluation Logs: Measuring Your Assistant's Reliability
LEVEL: Intermediate
MINUTES: 55
SUMMARY: Build a lightweight evaluation log that tracks when your AI assistant is right, wrong, or hallucinating.
OBJECTIVES: define measurable accuracy signals | log assistant errors systematically | use logs to refine prompts and routing
TAKEAWAYS: intuition about reliability is unreliable | logs reveal systematic biases | prompt quality is measurable
PRACTICE: Run the same analysis prompt on five lab functions and log each claim as correct, incorrect, or unverifiable, then compute an accuracy rate.
SOURCES: None
---
## Core idea
Most hunters have a vague feeling that their assistant is "usually pretty good." That feeling is not data. An evaluation log replaces intuition with measurement. For each assistant output you rely on, record the task type, the prompt version, the claim made, and the outcome after verification: correct, incorrect, or unverifiable. Over dozens of entries, patterns emerge. You might discover that summarization is nearly always right but severity reasoning is frequently overstated, or that a certain prompt format consistently produces better citations. That evidence should drive your routing decisions and prompt refinements. An eval log also guards against complacency: a model update can change behavior without warning, and only measurement catches the regression. Keep the log simple enough that you will actually maintain it — a spreadsheet or markdown table with a handful of columns is enough. The goal is not academic rigor but a feedback loop that improves accuracy and keeps you honest about where AI can and cannot be trusted. A measured workflow is a safer workflow, and the log becomes the evidence base for every later automation decision you make.

### Method
Log each evaluated claim:

| Date | Task | Prompt ID | Claim | Outcome | Note |
| --- | --- | --- | --- | --- | --- |
| 2026-01-10 | JS summary | P3 | endpoint X exists | incorrect | invented |
| 2026-01-11 | Taint trace | P4 | input reaches sink | correct | verified line 88 |
| 2026-01-12 | Severity | P2 | rated critical | incorrect | no impact proof |

Compute simple rates: accuracy = correct / (correct + incorrect); unverifiable rate = unverifiable / total. Review monthly.

```text
For each claim, mark: correct (verified against source),
incorrect (contradicted by source), or unverifiable (no source
available). Repeat weekly to detect drift after model updates.
```

### Failure modes
- Logging only successes and forgetting failures.
- Vague outcome labels that prevent comparison.
- Changing prompts without recording the version.
- Treating a small sample as conclusive.
- Comparing results across different task types as if they were equal.

### Verification steps
Verify claims against primary sources before labeling. Reconcile the log with your evaluation notes at month end. Promote prompts with high accuracy into your standard library; retire unreliable ones. When a provider updates a model, re-run a fixed benchmark set so you can detect behavioral drift instead of assuming improvement.

### Worked example
Your log shows that prompt P7 produced correct citations in 18 of 20 code-summary tasks, while severity prompt P2 was wrong in 9 of 10. You stop using P2 for judgments and keep P7 as a standard summarizer, adding a human gate for all severity decisions. The log turned a vague sense that "severity was shaky" into a specific, actionable routing rule.

### Knowledge check
Q: What is the main value of an evaluation log?
A: It converts vague impressions of reliability into measured data that guides prompt refinement and task routing.

===MODULE===
TITLE: Building Your AI Workspace: Tools, Data, and Boundaries
LEVEL: Intermediate
MINUTES: 60
SUMMARY: Assemble a practical, privacy-aware AI workspace that integrates with your existing bounty tooling without creating new risk.
OBJECTIVES: list workspace components | set data-handling boundaries | integrate AI into an existing workflow
TAKEAWAYS: a workspace is more than a chat tab | boundaries prevent leaks | integration beats novelty
PRACTICE: Diagram your current tooling and mark where AI can assist, then define three data-handling rules for each insertion point.
SOURCES: None
---
## Core idea
An effective AI workspace is not just a browser tab; it is a deliberate arrangement of tools, data stores, and rules. At minimum it includes an assistant (local, hosted, or both), a note system, a prompt library, an evaluation log, and a clear boundary describing what data may go where. The workspace should fit your existing workflow rather than replace it. If you already use a proxy, a scanner, and a notes app, AI slots in as a reader and summarizer between those tools — not as an autonomous actor. Boundaries are the critical piece: define which data classes are allowed in each tool, where outputs are stored, and who reviews them. A workspace that ignores these boundaries will eventually leak a private scope or paste credentials. Simplicity helps. A small set of well-understood tools is more reliable than a sprawling stack you cannot audit. Document the workspace in a single page so you can review it when tools or policies change. The aim is a setup that makes verified, careful work the path of least resistance, so that doing the safe thing is also the convenient thing.

### Method
Map the workspace as a data-flow table:

| Component | Role | Data allowed | Boundary |
| --- | --- | --- | --- |
| Assistant | Analysis and drafting | Sanitized or public | No PII, no private scope |
| Notes | Evidence and decisions | Everything, stored locally | Access-controlled |
| Prompt library | Reusable prompts | No sensitive data | Versioned |
| Eval log | Reliability tracking | Claim labels only | No raw secrets |

A routing statement:

```text
Sensitive data stays local or is redacted before any hosted call.
Every AI output is labeled and verified before it enters a report.
No tool in this workspace may take an autonomous offensive action.
```

### Failure modes
- Adding tools without defining their data boundaries.
- Storing outputs in a cloud notes app by default.
- Letting the assistant become the system of record.
- Skipping the eval log because the workspace feels too complex.
- Granting an assistant tool permissions you never reviewed.

### Verification steps
Audit the workspace: for each component, confirm the boundary is enforced in practice. Test the data flow with synthetic sensitive-looking data. Review the map after any tool change. Confirm that every automated step still has a human review point and that outputs cannot be published without your sign-off.

### Worked example
You map your tools and discover that your notes app syncs to a cloud account. Private program details were being stored there, contrary to your intended boundary. You move sensitive notes to a local directory, update the map, and re-audit. The workspace now matches your policy in practice, not just on paper.

### Knowledge check
Q: What is the most important component of an AI workspace from a risk perspective?
A: Explicit data-handling boundaries that define what may go into each tool.

===MODULE===
TITLE: Reconnaissance with AI: Interpreting DNS Data
LEVEL: Intermediate
MINUTES: 55
SUMMARY: Use AI to interpret DNS records for owned or in-scope assets while keeping enumeration authoritative and bounded.
OBJECTIVES: summarize common DNS record types | interpret DNS data for authorized assets | generate legitimate test hypotheses
TAKEAWAYS: DNS reveals structure, not vulnerabilities | AI explains, tools verify | scope limits every query
PRACTICE: Using your own lab domain, collect DNS records and ask AI to summarize their meaning, then verify each interpretation with a DNS tool.
SOURCES: None
---
## Core idea
DNS is a map of an organization's external naming and routing. For an authorized engagement, records such as A, AAAA, CNAME, MX, NS, TXT, and SOA reveal how assets relate: which hostnames are aliases, where mail flows, which nameservers are authoritative, and what verification tokens exist. AI is useful here as an interpreter. It can explain what a record means, group related hostnames, and suggest which observed patterns are worth checking — for example, a CNAME pointing to a third-party service, or a stale subdomain. It should not be treated as the source of truth: the actual records come from DNS queries you run against in-scope assets. The assistant also cannot know your scope, so you must state it explicitly and constrain every suggestion to it. A good output is a structured summary: record, observed value, interpretation, and a hypothesis to verify. This turns raw data into a plan while keeping verification with you. Remember that enumeration itself must respect program rules; some programs forbid automated subdomain brute forcing or set rate limits. AI does not override those constraints. Use it to understand what you legitimately observed, not to expand access beyond authorization.

### Method
Collect records first with ordinary tools, then interpret:

```bash
# Authorized lookups against your own or in-scope domain only
dig +short <LAB_HOST> A
dig +short <LAB_HOST> MX
dig +short <LAB_HOST> TXT
```

Then prompt:

```text
Given these DNS records for an in-scope asset, produce a table:
record type | value | plain-English meaning | hypothesis to verify.
Only reference records shown. Do not suggest targets outside the
listed data. Do not claim vulnerabilities.
```

### Decision table
| Observation | Safe interpretation | Verification |
| --- | --- | --- |
| CNAME to external host | Service delegation | Confirm ownership and scope |
| TXT verification token | Owned service proof | Check which provider |
| Stale-looking A record | Possible legacy host | Resolve and confirm ownership |
| Missing SPF record | Mail config detail | Verify before hypothesizing |

### Failure modes
- Inventing subdomains the model has "seen" before.
- Treating a third-party CNAME target as in scope.
- Ignoring published rate limits during enumeration.
- Accepting an interpretation without checking the raw record.
- Assuming a TXT token proves current ownership.

### Verification steps
Re-run each lookup. Confirm every referenced record exists in your collected data. Check scope before any follow-up action. Record which hypotheses you tested and their outcomes. If a suggestion points outside your observed data or scope, discard it rather than pursuing it.

### Worked example
You collect records for a lab domain and the assistant notes that a subdomain has a CNAME to a cloud provider while the base domain uses a different host. It hypothesizes a legacy service, which you verify by resolving the name and checking it is still yours. That becomes one legitimate item to inspect in your own lab, not a target to scan elsewhere.

### Knowledge check
Q: What must accompany every DNS interpretation before it guides action?
A: Verification against the raw record you collected and a scope check on the affected asset.

===MODULE===
TITLE: Reconnaissance with AI: Certificate Transparency and ASN Data
LEVEL: Intermediate
MINUTES: 60
SUMMARY: Interpret certificate transparency logs and ASN/network data with AI to map owned infrastructure within scope.
OBJECTIVES: read CT log entries for authorized domains | interpret ASN and prefix data | prioritize verified assets
TAKEAWAYS: CT logs reveal issued certificates, not ownership | ASN data shows routing, not authorization | AI summarizes, tools confirm
PRACTICE: Query CT logs for a lab domain you own and use AI to cluster the results, then confirm each hostname is yours before any further step.
SOURCES: None
---
## Core idea
Certificate Transparency logs are public ledgers of issued TLS certificates. For an authorized domain they can reveal hostnames the organization registered, including subdomains not linked from the main site. ASN and prefix data describe which networks and autonomous systems route an organization's IP space. Both are useful reconnaissance inputs, but neither grants permission. A certificate for a hostname does not prove the organization still controls it, and an IP in an ASN does not mean the asset is in your program's scope. AI helps by clustering and summarizing large result sets: grouping certificates by SAN, flagging wildcard entries, or explaining what a particular ASN relationship implies. It can propose hypotheses such as "this hostname appears in certificates but not in DNS; verify ownership." The hunter then confirms with authoritative sources and the program scope. The output should be a prioritization table: observed item, source, confidence, and next verification step. This keeps the workflow evidence-led. Avoid the trap of treating a generated list of hosts as a to-do list for scanning; each entry must be validated and scoped first. Used carefully, AI turns noisy public data into a readable map that focuses your authorized effort.

### Method
Gather data from public sources for your own domain, then summarize:

```text
You are analyzing CT log entries for a domain I own. Group the SANs into:
(1) confirmed owned, (2) third-party, (3) unknown. For each, cite the
certificate source and give one verification step. Do not assume
ownership from a certificate alone.
```

ASN interpretation pattern:

```text
Explain what this ASN/prefix data indicates about routing for <LAB_HOST>,
and list what additional evidence would confirm organizational control.
```

### Decision table
| Signal | Meaning | Next step |
| --- | --- | --- |
| Wildcard cert | Covers many subdomains | Enumerate via authorized sources |
| Unrecognized SAN | May be third-party | Confirm ownership |
| Prefix in ASN | Routing relationship | Verify scope before testing |
| Expired certificate | May be abandoned | Check current DNS |

### Failure modes
- Assuming every certificate hostname is owned and in scope.
- Generating scan targets from unverified data.
- Ignoring that stale certificates can point to abandoned assets.
- Treating third-party infrastructure as the program's property.
- Forgetting that CT logs only show publicly logged certificates.

### Verification steps
Confirm DNS resolution and ownership. Cross-check against the scope document. Record which entries you excluded and why. Only then consider further testing. If a hostname cannot be tied to an owned or in-scope asset, leave it in the unknown bucket and move on.

### Worked example
CT data for your lab domain lists a wildcard certificate and one unusual SAN. The assistant clusters them and flags the wildcard for enumeration. You verify that the wildcard covers hostnames you control and that the odd SAN belongs to a shared service outside your scope, so you exclude it. The result is a short, verified list instead of a large unverified one.

### Knowledge check
Q: Does a certificate for a hostname prove it is owned and in scope?
A: No. It is a signal only; ownership and scope must be verified independently before any testing.

===MODULE===
TITLE: Reconnaissance with AI: Summarizing JavaScript Bundles
LEVEL: Intermediate
MINUTES: 65
SUMMARY: Use AI to navigate large JavaScript bundles from authorized targets, extracting structure and endpoints without trusting guesses.
OBJECTIVES: identify bundle structure and frameworks | extract endpoints and parameters with evidence | verify findings in the raw source
TAKEAWAYS: bundles are maps, not proof | extract with citations | minification hides semantics, so verify
PRACTICE: Take a JS bundle from your own lab app, ask AI to list API endpoints with line references, and verify each against the source.
SOURCES: None
---
## Core idea
Modern web applications ship large JavaScript bundles that encode routes, API calls, and client-side logic. Reading them manually is slow; AI is genuinely useful as a first-pass navigator. It can identify the framework, locate router definitions, list URL strings, and trace how a parameter flows from user input to a request. The crucial constraint is evidence: every extracted endpoint or parameter should come with a file and line reference you can open. Minified and obfuscated code is where hallucination thrives — a model may invent a plausible path that does not exist. Ask for citations and label anything without one as unknown. A productive workflow is to extract, then verify, then hypothesize. First extract candidate endpoints into a table. Second, confirm each exists in the raw bundle. Third, ask the assistant to propose test hypotheses only for confirmed items, scoped to your authorized target. This ordering prevents a cascade where a fabricated endpoint leads to a wasted or out-of-scope test. Also remember that client-side code is only half the picture; server behavior must be observed directly. Bundle analysis generates questions, not findings. Keep output structured and bounded, and never feed private or real-user data from a production bundle into a hosted tool.

### Method
Extraction prompt:

```text
Analyze this JS bundle from an authorized lab target. Output a table:
string | likely purpose | file:line | confidence. Include only strings
present in the text. Mark anything uncertain as "unknown", never invent
endpoints.
```

Verification loop:

```bash
# Confirm a candidate string actually exists in the local copy
grep -n "<candidate>" bundle.min.js
```

### Decision table
| AI output | Trust level | Action |
| --- | --- | --- |
| Endpoint with line reference | Candidate | Open the line to confirm |
| Endpoint without reference | Reject | Discard entirely |
| Framework identification | Low-stakes | Note, verify if important |
| Parameter name | Candidate | Confirm in request builder |

### Failure modes
- Inventing plausible API paths from pattern memory.
- Missing dynamic URL construction that defeats simple grep.
- Treating a client-side check as a server-side control.
- Pasting a production bundle containing tokens into a hosted tool.
- Assuming an extracted string is still used at runtime.

### Verification steps
Grep each extracted string in the local file. Open the surrounding code to understand construction. Confirm the endpoint is actually called. Only then form test hypotheses within scope. If a string is dynamically built from fragments, mark it as a manual-review item rather than asking the model to guess the final URL.

### Worked example
The assistant lists an endpoint `/api/v2/admin/export` with a line reference. You open the line and find it is part of a dead code path behind a feature flag that is off in your lab. You keep it as a note, not a test target. A second endpoint from the same table is live and becomes the basis for a legitimate, in-scope test hypothesis.

### Knowledge check
Q: Why must every extracted endpoint carry a line reference?
A: Because it makes the claim verifiable and filters out fabricated strings that do not exist in the bundle.

===MODULE===
TITLE: Reconnaissance with AI: API Schemas and Documentation
LEVEL: Intermediate
MINUTES: 55
SUMMARY: Use AI to read API schemas and docs for authorized services, building an accurate map of parameters and expected behavior.
OBJECTIVES: parse OpenAPI and GraphQL schemas | summarize parameters and auth requirements | identify gaps between docs and behavior
TAKEAWAYS: schemas describe intent, not implementation | docs often lag reality | every inference needs verification
PRACTICE: Load a sample OpenAPI spec from a lab app, ask AI to summarize endpoints and auth, then verify by making benign requests to your own service.
SOURCES: None
---
## Core idea
API documentation and machine-readable schemas such as OpenAPI or GraphQL SDL are high-value inputs for AI. They are structured, bounded, and usually public for an authorized service, which makes them safer to share than arbitrary production data. An assistant can condense a large spec into a table of endpoints, methods, parameters, required authentication, and described response codes. It can also spot inconsistencies — a parameter documented as optional everywhere except one endpoint, or an operation missing an auth requirement — that are worth verifying. The key limitation is that a schema describes intended behavior, not actual behavior. Implementations drift; hidden endpoints exist; validation may differ from documentation. Treat the summary as a map to test, not a description of truth. Another risk: asking the model to infer "vulnerable parameters" from a spec invites hallucination, because vulnerability depends on server behavior the spec does not show. Keep inference to structure and let observation decide. A good output separates documented facts from hypotheses and cites the schema section for each. This gives you a compact, checkable baseline for authorized testing and a clear list of questions to answer with real requests against your own service.

### Method
Summarization prompt:

```text
Given this OpenAPI spec for an authorized lab service, produce a table:
path | method | parameters (required/optional) | auth | described
responses | schema section. Then list three inconsistencies worth
verifying. Do not assert vulnerabilities; only report what the spec says.
```

Then verify with benign calls:

```bash
curl -sS -X GET "<LAB_HOST>/api/v1/items" -H "Accept: application/json"
```

### Decision table
| Source | What it tells you | What it does not |
| --- | --- | --- |
| OpenAPI spec | Documented parameters | Actual validation |
| GraphQL SDL | Types and operations | Resolver behavior |
| Generated summary | Structure hypotheses | Real vulnerabilities |
| Live response | Actual behavior | Intent |

### Failure modes
- Inferring a vulnerability from a schema alone.
- Assuming undocumented endpoints do not exist.
- Trusting a summary without checking the spec section.
- Sending real credentials from a production environment.
- Treating a documented auth requirement as enforced.

### Verification steps
Open each cited spec section. Make benign authorized requests to confirm behavior. Compare observed responses to documented ones and log drift. Never treat a doc gap as a confirmed finding. If the live service differs from the spec, record the difference as a question to investigate, not as a bug by itself.

### Worked example
The spec says an endpoint requires an API key, but a benign request to your lab service succeeds without one. The assistant flagged the mismatch as an inconsistency, not a vulnerability. You verify with a second request, confirm the auth check is genuinely missing, and then investigate whether the data returned is sensitive enough to matter. Observation, not the spec, drove the conclusion.

### Knowledge check
Q: What can an API schema reliably tell you, and what can it not?
A: It documents intended structure and parameters, but not actual server behavior or exploitability, which must be observed.

===MODULE===
TITLE: Generating Test Hypotheses from Reconnaissance Data
LEVEL: Intermediate
MINUTES: 55
SUMMARY: Turn verified reconnaissance observations into prioritized, testable hypotheses with AI while avoiding speculative findings.
OBJECTIVES: write falsifiable hypotheses from observations | rank by evidence and risk | keep guesses separate from facts
TAKEAWAYS: a hypothesis is a question, not a finding | each needs a disconfirming test | scope gates every hypothesis
PRACTICE: From five verified recon observations on your own lab app, generate and rank hypotheses, then design one test that could disprove each.
SOURCES: None
---
## Core idea
Reconnaissance produces observations; progress comes from converting them into questions you can answer. AI is good at this translation because it can propose many plausible explanations for a pattern, but that same fluency produces speculative noise. The discipline is to make each hypothesis falsifiable: state it so a specific test could prove it wrong. A weak hypothesis says "this might be vulnerable." A strong one says "if the server trusts the client-supplied role parameter, then changing it to admin on this lab endpoint will alter the response; otherwise the response stays the same." Attach each hypothesis to the observation that motivated it and to a disconfirming test. Rank hypotheses by evidence strength, potential impact, and testing cost, and mark clearly which ones are pure guesses. Never let a hypothesis become a report without verification. Also keep scope explicit in the prompt: the assistant does not know your authorization and will happily propose targets outside it. The output should be a table with columns for observation, hypothesis, disconfirming test, scope status, and priority. This structure keeps creativity useful and grounded.

### Method
Hypothesis prompt:

```text
Given these verified observations about an authorized lab target, produce
hypotheses in a table: observation | hypothesis | test that would DISPROVE
it | required evidence | priority. Each hypothesis must be falsifiable.
Flag any hypothesis that would require an out-of-scope target as EXCLUDED.
```

Ranking rule:

```text
priority = evidence strength (0-2) + potential impact (0-2) - test cost (0-2)
```

### Decision table
| Evidence | Hypothesis type | Handling |
| --- | --- | --- |
| Strong | Specific and falsifiable | Test first |
| Weak | Broad guess | Refine before testing |
| None | Pure speculation | Discard or park |
| Out of scope | Any | Exclude immediately |

### Failure modes
- Writing hypotheses that cannot be disproved.
- Treating a hypothesis as an established finding in notes.
- Letting the model invent observations you never made.
- Ranking by excitement rather than evidence.
- Ignoring scope flags in the generated table.

### Verification steps
Check each hypothesis cites a real observation. Confirm the disconfirming test is safe and authorized. Run the cheapest disconfirming test first. Record outcomes and update the ranking. Delete hypotheses whose motivating observation was later proven wrong.

### Worked example
From a lab observation that an export endpoint accepts a `format` parameter, the assistant proposes that server-side template rendering might occur. The disconfirming test is to submit a benign marker and check whether it appears transformed in the output. The marker is echoed literally, so the hypothesis is disproved and discarded — cheaply and without any real-world impact.

Keep the ranking sheet beside your notes and update it as tests return. A hypothesis that was high priority because of a strong observation should drop quickly once a disconfirming test passes, while a low-priority guess may rise if new evidence appears. Treating the list as living rather than fixed is what keeps reconnaissance from turning into a rigid checklist that ignores what you actually learned.

### Knowledge check
Q: What makes a hypothesis scientifically useful in security testing?
A: It is falsifiable — a specific test can disprove it — and it is tied to a real observation.

===MODULE===
TITLE: Prioritizing Assets with AI
LEVEL: Intermediate
MINUTES: 50
SUMMARY: Use AI to rank in-scope assets by likely value and exposure, then verify the ranking against evidence and program rules.
OBJECTIVES: build a transparent scoring rubric | rank verified assets | avoid bias from model guesses
TAKEAWAYS: prioritization is a decision aid, not truth | transparency beats opaque scores | scope is a hard filter
PRACTICE: Take ten in-scope lab assets and produce a scored priority table with written justifications, then re-score one asset after new evidence.
SOURCES: None
---
## Core idea
A large scope produces more assets than you can test deeply. Prioritization decides where your limited time goes, and AI can help by applying a consistent rubric across many items. The danger is that a model may produce confident scores based on superficial cues — a unfamiliar subdomain name or an old technology — without real evidence. The fix is a transparent rubric whose inputs you control: exposure, data sensitivity, technology complexity, observed surface area, and recency. Ask the assistant to apply the rubric and show its reasoning per asset, not just a number. Then verify the ranking yourself and adjust. A priority table should include the asset, each factor's value, the total, a written justification, and the evidence source. Anything outside scope is filtered out before scoring, not after. Keep the rubric stable across engagements so results are comparable, and revisit it when your goals change. Remember that prioritization is a bet about where bugs are likely; it is not a claim that an asset is vulnerable. Used well, AI turns an overwhelming scope into a focused, defensible plan that you can explain to yourself and, if needed, to a program.

### Method
Scoring rubric:

```text
For each in-scope asset, score 0-2 on:
exposure (publicly reachable), sensitivity (data handled), complexity
(attack surface), recency (recently changed). Sum for priority.
Show the justification for each score and cite the evidence source.
Exclude any asset whose scope status is not confirmed.
```

Verification prompt:

```text
Review this priority table. For each row, identify any score not backed
by the supplied evidence and set it to "unknown".
```

### Decision table
| Factor | High score when | Evidence |
| --- | --- | --- |
| Exposure | Publicly reachable, indexed | DNS, HTTP check |
| Sensitivity | Handles auth or personal data | Docs, observed fields |
| Complexity | Many parameters or integrations | Bundle, schema |
| Recency | Recently deployed or changed | Version headers |

### Failure modes
- Scoring assets the model merely guessed exist.
- Treating the score as a severity rating.
- Changing the rubric between assets to force a preferred result.
- Ignoring program exclusions during scoring.
- Letting novelty bias override evidence.

### Verification steps
Confirm every asset is in scope and exists. Check each score against its cited evidence. Re-run the scoring after new reconnaissance. Keep the rubric versioned. If two assets tie, break the tie with a stated rule rather than a hunch.

### Worked example
Your rubric ranks a lab admin panel above a flashy new subdomain because the panel handles authentication and has a larger parameter surface, while the subdomain is a static marketing page. The assistant's first pass had favored the newer host on novelty; showing the rubric and evidence corrected the ranking, and testing the panel first found the real issue.

### Knowledge check
Q: Why should a prioritization rubric be transparent and versioned?
A: So scores are reproducible, comparable across engagements, and auditable rather than opaque model guesses.

===MODULE===
TITLE: Building and Validating Tooling with AI
LEVEL: Intermediate
MINUTES: 65
SUMMARY: Generate small helper scripts with AI and validate them rigorously before trusting them in authorized lab work.
OBJECTIVES: specify helper tools precisely | test generated code for correctness | avoid unsafe or over-permissioned scripts
TAKEAWAYS: generated code is untrusted until tested | small tools are easier to verify | never automate out-of-scope actions
PRACTICE: Ask AI for a script that parses a lab JSON response, then write tests with synthetic data and fix bugs before using it.
SOURCES: None
---
## Core idea
One of AI's most practical uses is producing small helper scripts: a parser, a formatter, a request wrapper, a log summarizer. These are deterministic tasks with checkable outputs, so they are good candidates for automation — provided you test them. Generated code frequently contains subtle bugs: off-by-one errors, wrong encodings, unhandled nulls, and occasionally unsafe behavior such as disabling TLS verification or hard-coded credentials. Because the code looks professional, it is tempting to run it directly. Resist that. Treat generated tooling like code from an unknown contributor: read it, test it with synthetic inputs, and check it does only what you asked. Keep tools small and single-purpose so verification is tractable. Constrain the prompt to your authorized lab context and forbid capabilities you do not need, such as scanning hosts outside a given list. Add tests that include edge cases and malicious-looking inputs. Version the scripts and record which model produced them. A validated tool becomes a durable asset; an unvalidated one is a liability that can corrupt your evidence or, worse, act outside scope.

### Method
Specification prompt:

```text
Write a Python script for an authorized lab task that reads a JSON file
and prints a table of fields. Constraints: no network calls, no shell
execution, no file writes, stdlib only. Include input validation and
clear error messages. Explain each function in a comment.
```

Validation checklist:

```bash
python3 -m py_compile helper.py
printf '{"id":1,"user":"<USER_EMAIL>"}\n' > /tmp/opencode/ai-bb-sample.json
python3 helper.py /tmp/opencode/ai-bb-sample.json
```

### Decision table
| Tool behavior | Accept? | Check |
| --- | --- | --- |
| Reads local input only | Yes | Confirm no network calls |
| Disables TLS verification | No | Remove and justify |
| Writes outside a temp dir | No | Constrain path |
| Executes shell strings | No | Rewrite without eval |

### Failure modes
- Running generated code without reading it.
- Allowing network or shell access you did not request.
- Hard-coded credentials or tokens in the script.
- Trusting a parser without edge-case tests.
- Using the tool against assets outside your lab scope.

### Verification steps
Compile or lint the script. Test with synthetic data and malformed inputs. Confirm it performs only in-scope operations. Review every line you do not understand. Store the script with its prompt and test results so a later you can trust it.

### Worked example
The assistant produces a clean-looking request wrapper, but reading it reveals `verify=False` on TLS and a broad `try/except` that hides errors. You remove the TLS bypass, narrow the exception handling, and add a test that fails on a bad certificate. Only after those changes do you use it against your own lab service.

### Knowledge check
Q: Why must generated tooling be validated before use?
A: Because it is untrusted code that may contain bugs or unsafe behavior; testing with synthetic data catches errors before they affect evidence or scope.

===MODULE===
TITLE: Reading Unfamiliar Frameworks with AI
LEVEL: Intermediate
MINUTES: 60
SUMMARY: Use AI to accelerate understanding of an unfamiliar framework in an authorized codebase without mistaking summaries for truth.
OBJECTIVES: identify framework conventions quickly | locate security-relevant defaults | verify behavior against source and docs
TAKEAWAYS: frameworks encode implicit behavior | defaults are where bugs hide | summaries need source confirmation
PRACTICE: Pick a framework used in your lab app, ask AI to explain its request-handling defaults, then confirm each claim in the framework source.
SOURCES: None
---
## Core idea
Security reviewers constantly meet frameworks they have not used before. The framework decides how requests are parsed, how routing works, where validation happens, and what defaults apply — all of which shape vulnerability. AI compresses the learning curve by explaining conventions, naming the relevant components, and pointing to where behavior is configured. This is a genuine strength: models have seen a lot of framework documentation and can produce a useful map quickly. The limitation is specificity. A summary may describe a default from an older version, or conflate two frameworks, or invent a configuration key. Because defaults are exactly where security mistakes live, a wrong summary is dangerous. Verify against the framework's own source or official docs for the exact version in your lab. A good output separates "framework convention" from "this project's configuration" and cites where each came from. Use the assistant to generate questions — "where does this framework validate content types?" — then answer them from the code. The goal is faster orientation, not outsourcing understanding. Once you can navigate the framework unaided, you can judge when a generated claim is plausible and when it is wrong.

### Method
Orientation prompt:

```text
I am reviewing an authorized lab app built with <FRAMEWORK>. Explain its
request lifecycle in five steps, name the security-relevant defaults
(CSRF, content types, template escaping, cookie flags), and say where
each is configured. Cite official docs or source paths you were given.
Mark anything version-dependent as "check version".
```

Then verify in the local framework source:

```bash
grep -rn "csrf" vendor/<FRAMEWORK>/src | head -20
```

### Decision table
| Claim type | Trust | Verification |
| --- | --- | --- |
| General convention | Medium | Check docs for this version |
| Project configuration | High if from code | Open the file |
| Version-specific default | Low | Confirm in installed source |
| Invented config key | Reject | Search the source |

### Failure modes
- Assuming a default from a different framework version.
- Treating a summary as proof of a vulnerability.
- Missing a project override of a secure default.
- Not checking which middleware is actually enabled.
- Trusting a generated config name that does not exist.

### Verification steps
Confirm the framework version. Search the installed source for each cited behavior. Check project configuration for overrides. Test critical defaults in your lab with benign requests. Record which claims held up in your eval log.

### Worked example
The assistant says the lab framework enables CSRF protection by default. You check the installed middleware list and find the protection was disabled in project configuration. That discrepancy becomes the focus of a legitimate, in-scope test. Without verification, you would have wrongly assumed the app was protected.

### Knowledge check
Q: Why are framework defaults security-relevant but risky to trust from a summary?
A: They determine protection behavior, but summaries may describe a different version; confirm in the installed source and project config.

===MODULE===
TITLE: Tracing Taint Paths with AI
LEVEL: Advanced
MINUTES: 70
SUMMARY: Use AI to follow data from sources to sinks in an authorized codebase while verifying each hop in the real call graph.
OBJECTIVES: define sources and sinks precisely | trace candidate paths with evidence | detect broken or invented paths
TAKEAWAYS: taint analysis needs a verified call graph | models skip indirect flows | every hop must be confirmed
PRACTICE: In a small lab application, trace one user-controlled parameter to a sink and verify each intermediate function by reading the code.
SOURCES: None
---
## Core idea
Taint tracing asks a simple question with subtle answers: does data from a user-controlled source reach a dangerous sink without passing through a sanitizer? AI is helpful because reading long call chains is tedious, and a model can propose candidate paths quickly. It is also prone to a specific failure: hallucinating a link in the chain. It may assert that function A calls function B when the call actually goes through a wrapper or not at all. It also misses indirect flows through queues, caches, templates, or framework magic. The disciplined method is to treat the assistant's path as a hypothesis and reconstruct the call graph yourself. Each hop needs a file and line reference you can open. Classify transformations along the path as sanitizing, encoding, or neutral, and check whether the sink interprets the data in a way that undoes the transformation. A good output is a table of hops: source, intermediate calls, transformations, sink, and confidence per hop. Only a fully verified path with no effective sanitizer becomes a test hypothesis in your own lab. This keeps the creativity of the model while keeping authority with the code.

### Method
Taint prompt:

```text
For this authorized lab code, trace the parameter <NAME> from its source
to any of these sinks: SQL query, shell command, template render, file
path, HTTP redirect, deserialization. Output each hop as: caller ->
callee | file:line | transformation applied | confidence. Mark any hop
you cannot verify as "unconfirmed". Do not claim exploitability.
```

Then verify each hop:

```bash
grep -rn "functionName" src/ | head -20
```

### Decision table
| Hop evidence | Status | Action |
| --- | --- | --- |
| File and line confirmed | Verified | Continue tracing |
| Called via wrapper | Verify wrapper | Open wrapper source |
| No reference found | Unconfirmed | Discard path |
| Sanitizer applied | Analyze transform | Check sink semantics |

### Failure modes
- Inventing a call that does not exist.
- Ignoring a sanitizer because it is in another file.
- Assuming an encoding stops all interpretations at the sink.
- Missing asynchronous or indirect flows.
- Treating a partial path as a confirmed vulnerability.

### Verification steps
Open every cited line. Confirm the call relationship directly. Check what the transformation actually does against the sink's parser. Confirm the source is genuinely user-controlled. Only then design an authorized lab test.

### Worked example
The assistant proposed a four-hop path from a query parameter to a template render. Three hops checked out; the fourth was a guess — the real code passed the value through a framework helper that HTML-escaped it. You truncate the path at the verified hop and drop the false sink. The corrected path guides a safe, in-scope test.

### Knowledge check
Q: What is the most common taint-tracing failure mode for AI?
A: Inventing or skipping a hop in the call chain, so every hop must be verified against the real source.

===MODULE===
TITLE: Understanding RFCs and Specifications with AI
LEVEL: Intermediate
MINUTES: 55
SUMMARY: Use AI to navigate protocol specifications while grounding every interpretation in the actual normative text.
OBJECTIVES: locate normative requirements in a spec | distinguish must from should | avoid invented or misremembered clauses
TAKEAWAYS: specs define required behavior precisely | summaries can misstate obligations | quote the normative text
PRACTICE: Read a short RFC section on a lab protocol, ask AI to summarize requirements, then verify each against the exact RFC text.
SOURCES: None
---
## Core idea
Specifications and RFCs define how protocols are supposed to behave, and security bugs often hide in the gap between spec and implementation. AI can make dense specs readable: it summarizes sections, explains terminology, and maps requirements to observables. But it can also misstate a requirement, confuse RFC numbers, or present a recommendation as a mandate. That distinction — MUST versus SHOULD versus MAY — matters enormously when judging whether an implementation is wrong. The safe approach is to ask for citations to exact sections and then open those sections yourself. Treat generated summaries as an index, never as authority. A good output separates normative requirements from examples and notes, quotes the key sentence, and lists what an implementation must do. Use it to form hypotheses about where a lab implementation might deviate, then verify with real observations. This is especially useful for less familiar protocols where reading the full spec is slow. Keep the discipline of quoting primary text, and never let a generated claim about "what the RFC requires" enter a report without checking the document. Honesty about spec interpretation is part of professional credibility.

### Method
Spec prompt:

```text
Using only the RFC text provided, list the normative requirements that
apply to <FEATURE>. For each, quote the exact sentence and give the
section number. Label MUST, SHOULD, and MAY precisely. Do not add
requirements not present in the text. Flag anything you cannot cite.
```

Verification: open the cited section and read it, then compare the lab implementation with an observed request/response pair.

### Decision table
| Modal verb | Meaning | Security relevance |
| --- | --- | --- |
| MUST | Required | Deviation is a defect |
| SHOULD | Recommended | Deviation needs justification |
| MAY | Optional | Behavior varies legitimately |
| Example | Illustrative | Not a requirement |

### Failure modes
- Misremembering an RFC number or section.
- Treating a SHOULD as a MUST.
- Quoting an example as a requirement.
- Filling gaps with plausible-sounding text.
- Assuming the lab implements the latest spec version.

### Verification steps
Open the exact section. Check the modal verb. Confirm the spec version matches the implementation. Observe the lab behavior directly. Record any deviation as a hypothesis, not a finding, until impact is established.

### Worked example
The assistant claims a protocol "requires" a certain header, citing a section. You open it and find the text says SHOULD, not MUST. The lab omits the header, but because it is optional, that is not a bug. You log the correction and avoid a false positive that would have embarrassed you in a report.

When a specification has several versions, state which one you are using before asking for requirements, and confirm that the lab implementation matches it. A requirement that changed between revisions can turn a real deviation into a false positive or hide a genuine one. Keeping version numbers in your notes makes later review possible and prevents an assistant's memory of a newer text from contaminating your analysis of an older system.

### Knowledge check
Q: Why is precise attention to MUST versus SHOULD important in spec analysis?
A: Because only normative requirements define defects; treating a recommendation as mandatory creates false positives.

===MODULE===
TITLE: Decompilation-Assisted Analysis with AI
LEVEL: Advanced
MINUTES: 70
SUMMARY: Use AI to interpret decompiled code from software you own or are authorized to analyze, verifying every structural claim.
OBJECTIVES: extract control flow from decompiled output | identify security-relevant logic | avoid misreading compiler artifacts
TAKEAWAYS: decompiled code is lossy | models confuse artifacts with intent | verification against behavior is essential
PRACTICE: Decompile a small binary you built yourself, ask AI to explain a function, then confirm by stepping through it in a debugger.
SOURCES: None
---
## Core idea
Decompilation turns a binary back into approximate source. The output is lossy: variable names vanish, types are inferred, optimizations reshape control flow, and compiler-generated constructs look strange. AI is useful as a reader of this approximation, explaining what a function appears to do and flagging interesting patterns such as string comparisons, cryptographic constants, or memory copies. It is also prone to confident misreading: it may treat an optimizer artifact as intentional logic, invent a symbol name, or assign meaning to a constant without evidence. The correct stance is that decompiled output plus AI explanation is a hypothesis about behavior, not proof. Verify by dynamic observation — run the binary in your lab under a debugger, set breakpoints, and check actual values and branches. A good output cites addresses and instructions, distinguishes certain from inferred claims, and lists what a dynamic test should confirm. This pairing of static interpretation and dynamic verification is how professionals use the tool. Keep analysis within software you own or have explicit authorization to examine, and never let a generated explanation stand in for observed behavior in a report.

### Method
Decompilation prompt:

```text
This is decompiled output from a binary I own. Explain the function at
address <ADDR>. Output: likely purpose, referenced strings, calls made,
branches on user input, and confidence per claim. Cite addresses. Mark
anything inferred as "inferred". Do not assert exploitation.
```

Verify dynamically in your lab:

```bash
gdb -q ./lab_binary -ex 'break *0x<ADDR>' -ex run -ex 'info registers'
```

### Decision table
| Claim | Source | Confirmation |
| --- | --- | --- |
| Call to library function | Decompiler line | Breakpoint / disassembly |
| String comparison | Referenced string | Observe input branch |
| Buffer size | Inferred type | Check allocation call |
| Intent of constant | Inferred | Look up known constant |

### Failure modes
- Inventing meaningful names for compiler-generated variables.
- Treating an optimized branch as deliberate validation.
- Ignoring that symbols may be stripped or wrong.
- Asserting a vulnerability from static view alone.
- Analyzing software without authorization.

### Verification steps
Confirm addresses in the disassembler. Run the function under a debugger with controlled input. Observe which branches execute. Cross-check strings and constants. Only then form a lab-only test hypothesis.

### Worked example
The assistant interprets a repeated instruction pattern as a custom checksum. Disassembly shows it is a compiler-unrolled standard library call. You correct the interpretation, set a breakpoint at the real comparison, and observe the compared value. The dynamic check replaced a plausible static story with a fact.

Always record the exact addresses and the tool versions you used, because decompiler output changes between releases. A claim that was correct in one tool may be wrong in another, and dynamic verification is the only constant. Keep the analysis in software you built or are authorized to examine, and treat every generated explanation as a lead to confirm rather than a conclusion to report.

### Knowledge check
Q: Why must decompiled AI interpretations be confirmed dynamically?
A: Because decompilation is lossy and models misread artifacts; observed execution is the ground truth.

===MODULE===
TITLE: Differential Reasoning: Comparing Code Versions with AI
LEVEL: Advanced
MINUTES: 60
SUMMARY: Use AI to compare versions and configurations in an authorized codebase, focusing attention on security-relevant changes.
OBJECTIVES: summarize meaningful diffs | separate cosmetic from behavioral changes | verify each flagged change in context
TAKEAWAYS: diffs highlight where to look, not what is broken | generated impact claims need proof | context matters more than line count
PRACTICE: Diff two versions of a lab application, ask AI to flag security-relevant changes, then verify each flag by reading both versions.
SOURCES: None
---
## Core idea
Change is where regressions and new attack surface appear. Comparing two versions of an application, a dependency, or a configuration is a high-value task, and AI is good at summarizing what changed in plain language. It can group a noisy diff into themes: new endpoints, altered validation, changed dependencies, moved security checks. That saves substantial reading time. The risk is that the assistant may over-interpret a change, calling a refactor a security fix or declaring a vulnerability from a line move without understanding context. A diff only shows text change, not semantic intent. The disciplined method is to ask for a categorized list with file and line references, then open both versions around each flagged area. Decide whether behavior actually changed, and what the change means for trust boundaries. A good output separates cosmetic changes (renames, formatting) from behavioral ones (logic, configuration, dependencies) and ranks the latter for review. Keep the comparison within versions you are authorized to analyze, such as your own lab app or public releases. Never let a generated "this introduces XSS" claim substitute for testing the actual behavior.

### Method
Diff summary prompt:

```text
Compare these two versions of an authorized lab application. Output a
table: file | change | category (cosmetic/behavioral/config/dependency)
| security relevance | confidence | line references. Do not assert a
vulnerability; describe what changed and what questions it raises.
```

Verification:

```bash
git -C lab-app diff v1 v2 -- src/auth.js | head -80
```

### Decision table
| Change category | Default relevance | Action |
| --- | --- | --- |
| Cosmetic | Low | Skim |
| Behavioral | High | Read both versions |
| Config / dependency | High | Check defaults and versions |
| Moved code | Medium | Confirm semantics unchanged |

### Failure modes
- Treating a rename as a logic change.
- Missing a change hidden by formatting differences.
- Declaring a vulnerability from a diff alone.
- Ignoring dependency version bumps.
- Comparing the wrong versions or branches.

### Verification steps
Confirm file and line references in both versions. Read surrounding context, not just changed lines. Check dependency changes against known behavior. Observe the running lab app where behavior matters. Record which flags were real.

### Worked example
The diff removes a validation function call from one handler, and the assistant flags a likely regression. You open both versions and find the logic moved into shared middleware that still runs. No behavior changed. The flag was useful as a pointer, but verification prevented a false report.

A useful habit is to write the suspected semantic change in one sentence before opening the diff details. If the sentence cannot be supported by a changed line, the flag is probably noise. This keeps you from being impressed by a large diff that changes nothing meaningful, and it makes the final review notes short enough that a teammate can check your reasoning quickly.

### Knowledge check
Q: What should a generated diff summary be treated as?
A: A prioritized list of places to inspect, not proof that a vulnerability was introduced.

===MODULE===
TITLE: Reasoning About Protocol State Machines with AI
LEVEL: Advanced
MINUTES: 65
SUMMARY: Model protocol state transitions with AI for authorized lab services, then verify which transitions the implementation really allows.
OBJECTIVES: describe valid state transitions | identify suspicious transitions | verify behavior with safe lab sequences
TAKEAWAYS: state models expose logic gaps | generated diagrams are hypotheses | out-of-order transitions need evidence
PRACTICE: Model the login and password-reset states of your lab app, then test whether any transition occurs out of the documented order.
SOURCES: None
---
## Core idea
Many security flaws are state-machine problems: a step that should require a prior step does not, a token is accepted in the wrong phase, or a reset flow can be completed out of order. AI can build a readable model of a protocol's intended states and transitions from documentation or code, naming states and the events that move between them. This makes gaps easier to see. The danger is that the generated model reflects what the model assumes, not what the implementation enforces. It may omit states the code actually has or add transitions that exist only in the spec. Treat the diagram as a map to test. For each transition, especially any that would let a user skip a step, design a safe lab-only sequence that checks whether the server enforces the ordering. Use benign markers and your own accounts. A good output lists states, allowed transitions, events, and which transitions are security-critical, with citations to the code or documentation. Verification comes from observing the lab service. This approach turns vague intuition about "flow logic" into a systematic, testable set of questions that can reveal real authorization or workflow bugs.

### Method
State-model prompt:

```text
From the provided lab documentation and code, build a state machine for
<FLOW>. List states, events, allowed transitions, and which transitions
must be guarded. Cite the source for each guard. Then list transitions
that would be suspicious if unguarded. Do not claim the implementation
is vulnerable.
```

Safe verification:

```text
Using my own lab account, perform step B without completing step A and
record the server response. Compare with the documented requirement.
```

### Decision table
| Transition | Expected guard | Test |
| --- | --- | --- |
| Reset -> complete | Token issued | Skip token step |
| Auth -> admin | Privilege check | Use low-privilege account |
| Upload -> publish | Review step | Publish without review |

### Failure modes
- Assuming the code enforces the documented order.
- Modeling only happy-path transitions.
- Inventing states not present in the code.
- Testing with real accounts or data outside the lab.
- Treating a suspicious transition as a confirmed bug.

### Verification steps
Confirm each state exists in code or docs. Check where the guard is enforced. Perform safe out-of-order sequences in your lab. Record responses and compare with expectations. Only investigate further when the observed behavior contradicts a required guard.

### Worked example
The model shows password reset should require a token issued after the request step. You perform the completion step with a made-up token in your lab; the server accepts it. That observed gap, not the diagram, is the basis for a legitimate in-scope finding, which you then document carefully.

### Knowledge check
Q: Why is an AI-generated state diagram only a hypothesis?
A: Because it reflects assumed behavior; only observing the lab implementation confirms which transitions are actually allowed.

===MODULE===
TITLE: Analyzing Authentication and Authorization Logic with AI
LEVEL: Advanced
MINUTES: 70
SUMMARY: Use AI to review auth logic in an authorized codebase, checking each claim against the real enforcement points.
OBJECTIVES: map authentication and authorization checks | spot missing or misplaced checks | verify findings against code and lab behavior
TAKEAWAYS: the location of a check matters as much as its presence | models miss framework-level auth | verify with two accounts in a lab
PRACTICE: In your lab app, map where authentication and authorization are enforced, then test one endpoint with two different owned accounts.
SOURCES: None
---
## Core idea
Authentication answers who a user is; authorization answers what they may do. Security bugs here are high impact and easy to get wrong, which makes them attractive targets for AI assistance and also dangerous to trust. A model can map where login is verified, where roles are checked, and which endpoints are protected. It can spot a missing check or a check applied too late. But it frequently misses framework-level protection it was not shown, confuses a client-side check with server enforcement, or asserts that a role check exists based on a naming convention. Because these mistakes directly affect severity claims, they must be verified. Ask for a map of enforcement points with file and line references, then confirm each in code. Test with two accounts you own in your lab: a low-privilege account and a high-privilege one, checking whether access control actually holds. A good output distinguishes "no check found in provided code" from "no check exists," and flags where framework behavior could supply an unseen check. This is one of the highest-value uses of AI when done carefully, and one of the worst when done carelessly.

### Method
Auth review prompt:

```text
For this authorized lab code, list every authentication and authorization
enforcement point with file:line. Identify endpoints that appear to rely
on client-side checks or missing role verification. Distinguish "no check
found in the provided code" from "no check exists". Cite each claim.
Do not assert exploitability.
```

Lab verification with two owned accounts:

```text
Use account A (low privilege) and account B (high privilege) in my lab.
Request the same endpoint with each and compare responses. Record whether
access control held.
```

### Decision table
| Finding | Meaning | Verification |
| --- | --- | --- |
| Missing check in code | Candidate only | Search framework config |
| Client-side check only | Strong candidate | Test server directly |
| Role name mismatch | Possible bug | Check role assignment |
| Framework guard | Verify it exists | Read middleware config |

### Failure modes
- Missing a global middleware guard not in the snippet.
- Treating a hidden field as enforcement.
- Assuming role names map to permissions.
- Reporting from static review without a lab test.
- Using real accounts or data to test.

### Verification steps
Open each cited enforcement point. Check global configuration and middleware. Perform the two-account test in your lab. Confirm the behavior with a clean session. Only then consider a report, with evidence from the actual service.

### Worked example
The assistant flags a missing admin check on a lab endpoint. You search the framework config and find a global middleware that requires admin for that route prefix. The two-account test confirms the low-privilege account is denied. The candidate was wrong, and verification kept a false claim out of your notes.

### Knowledge check
Q: How do you verify an authorization finding in a lab without guessing?
A: By testing the same endpoint with two owned accounts of different privilege levels and comparing the server's responses.

===MODULE===
TITLE: Building a Reusable Code-Review Prompt Library
LEVEL: Advanced
MINUTES: 60
SUMMARY: Create and maintain a versioned library of proven analysis prompts so your AI assistance is consistent and auditable.
OBJECTIVES: design parameterized prompts | version and test them | retire unreliable patterns
TAKEAWAYS: prompts are engineering artifacts | reuse beats improvisation | evaluation data decides what stays
PRACTICE: Write three reusable analysis prompts, run each on a lab function, and store the version and results in your prompt library.
SOURCES: None
---
## Core idea
A single clever prompt is a one-off gain; a library of tested prompts is a compounding asset. Code-review prompts share a common skeleton: authorization context, role, bounded input, precise task, output format, and explicit constraints against invention. By parameterizing the variable parts — the language, the bug class, the sink list — you get a small set of reliable tools instead of dozens of ad hoc questions. Treat each prompt as code: give it an ID and version, record what it is for, test it on known examples, and keep the results. Your evaluation log tells you which prompts are accurate and which produce hallucinations; retire the weak ones. A good library entry includes the prompt text, example input, example output, known failure modes, and the last tested date. Store it locally so sensitive tasks can use a local model without leaking. Over time the library becomes a personal methodology encoded in text, letting you reproduce analysis months later and share it with teammates safely. It also makes delegation possible: a trusted prompt applied consistently gives more reliable results than whatever phrasing happens to occur to you at the moment.

### Method
Library entry format:

```text
ID: P7  Version: 2  Purpose: taint table for web handler code
Params: <LANGUAGE>, <SINK_LIST>, <CODE>
Known failures: invents calls; use self-critique pass
Last tested: 2026-02-14  Accuracy: 18/20
```

Core skeleton:

```text
ROLE: authorized lab code reviewer. INPUT: <CODE with line numbers>.
TASK: <one precise task>. OUTPUT: table with evidence column.
CONSTRAINT: cite lines; write unknown when unsupported; no exploit claims.
```

### Decision table
| Library decision | Rule |
| --- | --- |
| Keep | Accuracy high across tasks |
| Revise | Format inconsistent |
| Retire | Frequent unsupported claims |
| Parameterize | Same shape, different inputs |

### Failure modes
- Accumulating prompts with no version or test record.
- Copying a prompt with sensitive data baked in.
- Reusing a prompt past its tested context.
- Treating a prompt as universally valid without re-testing.
- Letting the library grow without pruning.

### Verification steps
Test a new prompt on at least three known examples before adding it. Record results in the eval log. Review the library quarterly and remove stale entries. Confirm no prompt contains real targets or personal data.

### Worked example
You build prompt P9 for summarizing authentication checks and test it on three lab functions with known answers. Two runs are accurate; one invents a middleware call, so you add a constraint requiring citations and re-test until all three pass. P9 enters the library with a version and a known-failure note.

Share library entries only after removing every target name, token, and internal path. A prompt that embeds a lab hostname is harmless in your own notes but becomes a leak when posted publicly. Annotate each entry with the contexts where it worked and those where it failed, so a future session knows when to trust it and when to treat its output as a rough draft needing full verification.

### Knowledge check
Q: Why should prompts be versioned and evaluated like code?
A: Because consistent, tested prompts give reproducible results, and evaluation data tells you which ones still work.

===MODULE===
TITLE: Generating Payload Variants Safely in a Lab
LEVEL: Advanced
MINUTES: 60
SUMMARY: Use AI to brainstorm payload variants for bugs you have already confirmed in your own lab, never against third parties.
OBJECTIVES: generate diverse but bounded variants | keep all testing in owned labs | filter out harmful or out-of-scope suggestions
TAKEAWAYS: variants help after a finding is confirmed | the lab is the only safe target | human review filters every suggestion
PRACTICE: For a confirmed lab XSS, ask AI for ten encoding variants, test each in your own app, and log which actually execute.
SOURCES: None
---
## Core idea
Once you have confirmed a vulnerability in a lab you own, AI can generate variations that deepen understanding: alternate encodings, different contexts, or bypasses of a filter you control. This is a legitimate, high-value use because the target is yours and the goal is learning. The boundaries are strict. Never generate or test payloads against real third-party systems; all offensive work stays in an owned or explicitly authorized lab. Also filter the model's suggestions: it may propose destructive actions, data exfiltration, or techniques far outside your need. Keep the request bounded to the confirmed bug class and context. A good output is a table of variants with the reasoning for each and a safety note. Test them one at a time in the lab, record which work, and feed the results back into your notes. This is not about collecting a big payload list; it is about understanding why a class of inputs behaves as it does. The assistant accelerates variant generation, but you decide what is safe, relevant, and worth testing. Discipline here prevents both accidental misuse and wasted time on variants that teach you nothing.

### Method
Variant prompt:

```text
For a CONFIRMED XSS in a lab application I own, at parameter <PARAM> in
HTML text context, suggest ten payload variants that test different
encoding and context behaviors. For each, explain the hypothesis. Do not
include data exfiltration, external callbacks, or destructive actions.
All testing is in my own lab only.
```

Test in the lab:

```bash
curl -sS "<LAB_HOST>/search?q=<PAYLOAD>" | grep -n "<MARKER>"
```

### Decision table
| Suggested variant | Safe in lab? | Keep? |
| --- | --- | --- |
| Alternate encoding | Yes | Test and log |
| External callback | No | Reject |
| Destructive action | No | Reject |
| Out-of-scope target | No | Reject |

### Failure modes
- Generating variants before the base finding is confirmed.
- Testing against any system you do not own.
- Accepting exfiltration or destructive suggestions.
- Claiming a variant works without observing it.
- Losing the hypothesis behind a working payload.

### Verification steps
Confirm the lab target is yours. Review each variant before testing. Test one at a time and observe the result. Record which worked and why. Discard variants that add no understanding.

### Worked example
For a confirmed reflected XSS in a lab search field, the assistant proposes HTML-entity, URL-encoded, and mixed-case variants. You test each in your app and find only the mixed-case form executes, revealing a case-sensitive filter. That insight, not the payload list, is the real gain.

Keep a variant log that records the exact input, the lab response, and the hypothesis behind each test. Without it, a successful payload is easy to misremember as a simpler one, and your report may not reproduce. The log also shows which encodings the filter handled, turning a collection of experiments into an understanding of the target's behavior that will transfer to the next lab exercise.

### Knowledge check
Q: When is it appropriate to ask AI for exploit payload variants?
A: Only after a finding is confirmed in a lab or explicitly authorized target you own, with human filtering of every suggestion.

===MODULE===
TITLE: Reasoning About Filter Bypasses with AI
LEVEL: Advanced
MINUTES: 65
SUMMARY: Use AI to reason about how a lab filter works and generate bypass hypotheses, verifying each against observed behavior only.
OBJECTIVES: infer filter rules from observations | generate principled bypass hypotheses | avoid blind payload spraying
TAKEAWAYS: understand the filter before bypassing it | each hypothesis needs a reason | observe, do not assume
PRACTICE: In your own lab app, probe a word filter with benign markers, infer its rule, and use AI to propose a bypass you then test.
SOURCES: None
---
## Core idea
Filters are logic, and logic can be reasoned about. When a lab application blocks a keyword or transforms input, the useful question is not "what payload works?" but "what rule is the filter implementing?" AI helps by forming hypotheses about the rule from observed inputs and outputs: does it block exact strings, case-insensitive matches, encoded forms, or substring patterns? Once the rule is understood, bypass ideas follow naturally and are far more efficient than spraying payloads. This works only when grounded in observations you actually made. If you ask a model to guess a bypass without giving it the observed behavior, it will produce generic lists that teach little. A good output is a table mapping each test input to the observed result, an inferred rule, and a bypass hypothesis with reasoning. Verify each hypothesis in your lab, record the outcome, and refine the inferred rule. Keep everything within a system you own. Also be honest that many modern defenses are not simple filters; a model reasoning from a toy example may not generalize. The value is the disciplined loop of observe, infer, test, refine — with AI as a thinking partner and you as the experimenter.

### Method
Inference prompt:

```text
In my own lab app, these inputs produced these observed outputs:
<INPUT/OUTPUT pairs>. Infer the most likely filter rule, list alternatives,
and propose three bypass hypotheses with reasoning. State what observation
would confirm or refute each hypothesis. No external callbacks.
```

Verification:

```bash
curl -sS "<LAB_HOST>/filter?in=<MARKER>" | grep -n "<RESULT>"
```

### Decision table
| Observation | Inferred rule | Next probe |
| --- | --- | --- |
| Exact word blocked | Literal match | Test case variant |
| Case variant blocked | Case-insensitive | Test encoding |
| Encoded form blocked | Decode then match | Test double encoding |
| Substring blocked | Contains check | Test splitting |

### Failure modes
- Guessing a bypass without observed data.
- Spraying many payloads without a hypothesis.
- Assuming a toy filter generalizes to real defenses.
- Claiming success without recording the exact input and output.
- Testing outside your own lab.

### Verification steps
Record every probe and its exact result. State the inferred rule in one sentence. Test hypotheses one at a time. Update the rule when evidence contradicts it. Keep final notes with the reasoning chain, not just the working payload.

### Worked example
Your probes show the lab filter blocks the literal word but allows mixed case, suggesting a case-sensitive check. The assistant proposes a case-alternation bypass, which works. You record the inferred rule and the confirming observation; the next variant test becomes much faster because you understand why it works.

### Knowledge check
Q: What is more valuable than a large list of bypass payloads?
A: An inferred filter rule based on observed behavior, with reasoned hypotheses that can be confirmed or refuted.

===MODULE===
TITLE: Designing Proofs of Concept in Owned Labs
LEVEL: Advanced
MINUTES: 65
SUMMARY: Use AI to design clear, minimal proofs of concept for findings in systems you own, keeping every demonstration safe and reproducible.
OBJECTIVES: define what a PoC must prove | design minimal steps | verify reproducibility in your own lab
TAKEAWAYS: a PoC demonstrates impact, not cleverness | minimal steps aid triage | all demonstrations stay in owned labs
PRACTICE: For a confirmed lab finding, write a PoC with the fewest steps that shows impact, then have the assistant edit it for clarity without changing facts.
SOURCES: None
---
## Core idea
A proof of concept is evidence that a finding is real and impactful. In an authorized lab you own, AI can help design and describe PoCs: choosing the shortest path to demonstrate impact, deciding what evidence to capture, and writing steps a reader can follow. The key property of a good PoC is minimality. Every extra step is another place for a triager to get lost or for the demonstration to become unreliable. Ask the assistant to strip a PoC down to the essential actions and to explain what each step proves. Be careful: a model may suggest a more dramatic demonstration than the evidence supports, or invent an impact you did not observe. Reject anything that is not backed by what you actually saw. Also keep PoCs safe — in your own lab, avoid destructive actions or touching other users' data. A good output lists prerequisites, exact steps, expected observation, and what would disprove the claim. Verify by replaying the PoC from a clean state. Used properly, AI turns a messy investigation into a clean, reproducible demonstration that respects both the evidence and the boundary of authorization.

### Method
PoC design prompt:

```text
For this confirmed finding in my own lab, design a minimal proof of
concept. Output: prerequisites, numbered steps, expected observation,
and what each step proves. Remove any step that does not add proof.
Do not add impacts I did not observe. No destructive actions.
```

Replay check:

```text
Reset the lab to a clean state, replay the PoC exactly, and confirm the
same observation. Record any step that was unnecessary.
```

### Decision table
| PoC element | Keep if | Remove if |
| --- | --- | --- |
| Step | Proves something | Only adds drama |
| Payload | Is minimal | Has unused complexity |
| Evidence | Directly shows impact | Is decorative |
| Prerequisite | Truly required | Assumed from habit |

### Failure modes
- Adding unobserved impact to make the PoC impressive.
- Steps that depend on hidden lab state.
- Demonstrations that touch data you do not own.
- Trusting a generated PoC without replaying it.
- Overcomplicating the payload beyond the point.

### Verification steps
Reset the lab and replay from a clean state. Capture the exact observation. Confirm each step is necessary. Check the PoC stays within your owned environment. Only then attach it to your notes as verified evidence.

### Worked example
Your initial PoC for a lab authorization flaw had six steps, including two account switches. The assistant trimmed it to three steps after you confirmed the extra switches were unnecessary. Replaying from a clean state produced the same result, giving a clearer demonstration with fewer places to fail.

### Knowledge check
Q: What is the defining quality of a good proof of concept?
A: It demonstrates the observed impact with the fewest reproducible steps, using only evidence you actually captured.

===MODULE===
TITLE: Avoiding False Positives When AI Is Involved
LEVEL: Advanced
MINUTES: 60
SUMMARY: Build specific defenses against false positives that AI-generated analysis can introduce into your findings.
OBJECTIVES: recognize common false-positive sources | require disconfirming tests | apply a final review gate
TAKEAWAYS: a plausible story is not a finding | disconfirmation beats confirmation | impact must be observed
PRACTICE: Take three AI-suggested lab findings and try to disprove each; keep only the ones that survive a clean-state test.
SOURCES: None
---
## Core idea
A false positive wastes a triager's time and damages your credibility. AI increases the risk because it produces convincing narratives for things that are not actually vulnerabilities: a client-side check mistaken for server enforcement, a documented feature treated as a bug, a theoretical impact with no observed effect. The defense is a deliberate disconfirmation step. For every candidate finding, ask: what observation would prove this is not a bug? Then run that test. This inverts the natural tendency to look only for supporting evidence. Another defense is to separate the three layers: observation (what you saw), interpretation (what it means), and impact (why it matters). AI often jumps from observation to impact without evidence. Require each layer to be independently supported. A good practice is a review gate: before a finding is promoted to reportable, check that the behavior is reproducible from a clean state, that the data is genuinely sensitive or the control genuinely bypassed, and that no legitimate explanation exists. Honesty here is a competitive advantage — a hunter with a low false-positive rate gets taken seriously. Use AI to help generate disconfirming tests, not just confirming ones.

### Method
Disconfirmation prompt:

```text
For this candidate finding in my authorized lab, list the strongest
reasons it might NOT be a vulnerability. Provide one safe test for each
that could disprove it. Do not assume the finding is real.
```

Review gate:

| Layer | Question | Evidence required |
| --- | --- | --- |
| Observation | What did I actually see? | Raw request/response |
| Interpretation | What does it mean? | Code or config proof |
| Impact | Why does it matter? | Observed effect |

### Decision table
| Candidate survives? | Action |
| --- | --- |
| Clean-state replay fails | Discard |
| Legitimate explanation found | Discard |
| Disconfirming test refuted | Investigate further |
| All layers supported | Document for report |

### Failure modes
- Seeking only confirming evidence.
- Treating a generated impact paragraph as proof.
- Ignoring documented intended behavior.
- Skipping the clean-state replay.
- Reporting a theoretical risk with no observed effect.

### Verification steps
Run at least one disconfirming test. Replay from a clean state. Check for a legitimate explanation. Confirm impact with an observed effect, not a claim. Record discarded candidates and why — this trains your judgment.

### Worked example
The assistant calls a lab parameter an IDOR. You test with a second account you own and find the response is identical because the app returns only public data. The disconfirming test showed no sensitive exposure, so you discard the finding despite a plausible access-control story.

Track discarded candidates as carefully as kept ones, including the test that killed each. Over a few months this record teaches you which patterns tend to be false positives in your workflow, and you can warn the assistant about them in future prompts. A low false-positive rate is a reputation asset: triagers learn that your reports are worth reading, which makes the findings you do submit more likely to receive careful attention.

### Knowledge check
Q: Which habit most reduces false positives from AI-assisted analysis?
A: Actively seeking disconfirming evidence and requiring a clean-state replay before promoting a candidate.

===MODULE===
TITLE: Chaining Findings with AI Assistance
LEVEL: Advanced
MINUTES: 70
SUMMARY: Use AI to explore how multiple low-severity observations might combine in an owned lab, while requiring evidence for every link.
OBJECTIVES: model interactions between findings | identify credible chains | reject speculative links
TAKEAWAYS: chains need each link verified | models over-connect observations | impact must be demonstrated end to end
PRACTICE: In your lab app, take two confirmed low-severity findings and test whether they chain into a meaningful impact, documenting each link.
SOURCES: None
---
## Core idea
Individual observations may be minor, but their combination can matter: a weak information leak plus a permissive redirect can become account takeover, for example. AI is useful for brainstorming how findings might interact because it can hold many pieces at once and propose connections a person might overlook. It is also prone to over-connection: linking two observations with an assumption rather than evidence, producing a chain that collapses at the first untested link. The rule is that every link in a chain needs its own verification, and the final impact must be demonstrated end to end in your lab. A good output is a graph: nodes are confirmed findings, edges are interactions, and each edge carries the condition required and evidence status. Ask the assistant to state what would break each link. Then test in a safe, owned environment. Chaining is legitimate when it reveals real impact; it is misleading when it inflates severity with hypothetical steps. Keep the whole exercise within systems you own and never chain into real user data.

### Method
Chain prompt:

```text
These are confirmed findings in my own lab: <list with evidence>. Propose
ways they might interact. For each proposed link, state the condition
required, the evidence available, and a test that would break the link.
Do not assume untested steps succeed. Do not claim final impact.
```

Test in the lab:

```text
Execute the chain end to end using only accounts and data I own. Record
each step's result. Stop if any link fails and mark the chain broken.
```

### Decision table
| Link | Condition required | Status |
| --- | --- | --- |
| Finding A -> B | Shared parameter | Verify with request |
| B -> C | Same session context | Verify with account |
| C -> impact | Sensitive action | Observe effect |

### Failure modes
- Connecting findings with untested assumptions.
- Inflating severity with hypothetical final steps.
- Ignoring that a link fails under clean-state conditions.
- Chaining into data you do not own.
- Forgetting that triagers evaluate demonstrated impact.

### Verification steps
Confirm each finding independently first. Test each link separately. Execute the full chain in your lab and observe the final effect. If any link fails, document the chain as broken. Report only what you demonstrated.

### Worked example
The assistant proposed chaining a lab information leak with a CSRF-like behavior to change a setting. You test and find the setting change requires a token the leak does not expose. The chain breaks at the second link, so you keep the two findings separate and accurately scoped rather than reporting a dramatic but false combined impact.

### Knowledge check
Q: What makes a finding chain credible?
A: Every link is individually verified and the final impact is demonstrated end to end in an authorized lab.

===MODULE===
TITLE: When NOT to Use AI in Security Work
LEVEL: Advanced
MINUTES: 45
SUMMARY: Identify the situations where AI assistance adds risk or no value and where human judgment must work alone.
OBJECTIVES: recognize no-AI scenarios | protect confidential material | know when speed undermines accuracy
TAKEAWAYS: some data should never leave your machine | some decisions need unaided judgment | restraint is a skill
PRACTICE: List five scenarios in your workflow where you will deliberately not use AI, and practice one of them unaided in a lab.
SOURCES: None
---
## Core idea
Skillful use of AI includes knowing when to stop using it. Scenarios where the tool adds risk or little value are common. Confidential material such as private program scopes, real user data, and unreleased details of a finding should not go into a hosted assistant at all. High-consequence judgments — final severity, whether an impact is real, whether an action is in scope — should be made by you, with AI at most offering a devil's-advocate view. Tasks where you are learning a new fundamentals concept benefit from unaided struggle, because the struggle builds the mental model you need later. When a model and your own analysis disagree and you cannot verify either, the right move is to gather more evidence, not to pick whichever sounds better. There are also practical cases: a simple grep is faster than a prompt, and a deterministic formatting task may not justify the overhead. Restraint protects accuracy, privacy, and your own skills. A mature hunter treats AI as one tool among many and is comfortable leaving it closed for entire sessions. Documenting your no-AI list makes the boundary explicit and prevents drift under time pressure.

### Method
Build a no-AI list:

```text
Never in hosted AI:
- private program names, scopes, or target lists
- real user data, tokens, cookies, or credentials
- unreleased finding details

Decide without AI:
- final severity and impact
- scope authorization questions
- whether evidence is sufficient to report

Prefer no AI:
- first pass at a new fundamentals concept
- simple commands you already know
```

### Decision table
| Situation | AI? | Why |
| --- | --- | --- |
| Private scope details | No | Confidentiality |
| Real user data | No | Privacy and rules |
| Final severity | No | High consequence |
| Learning a core concept | No | Builds fundamentals |
| Summarizing public code | Yes | Low risk, high value |

### Failure modes
- Reaching for AI out of habit on trivial tasks.
- Pasting confidential details "just this once."
- Letting the model make a scope decision.
- Using AI before forming your own view.
- Treating the tool as always-on.

### Verification steps
Audit a recent session: did any prompt contain data from your no-AI list? Check that final decisions were yours. Practice one scenario completely unaided and note whether it felt harder — that difficulty is useful. Update the list when a new risk appears.

### Worked example
You receive a private program invitation and want help summarizing scope. Instead of pasting it into a hosted tool, you read it yourself and keep the details local. Later, you use a local model on a sanitized version. The boundary held, and no confidential information left your control.

### Knowledge check
Q: Give one example of a decision that should always be made without AI.
A: Final severity and impact, or any scope-authorization question — these are high-consequence judgments that require human accountability.

===MODULE===
TITLE: AI-Assisted Fuzzing Input Generation in Labs
LEVEL: Advanced
MINUTES: 60
SUMMARY: Use AI to design diverse fuzzing inputs for a lab application you own, then validate that each input actually adds coverage.
OBJECTIVES: generate input classes rather than random strings | measure coverage gains | keep fuzzing inside your own lab
TAKEAWAYS: variety of classes beats volume | generated inputs need coverage checks | fuzz only systems you own
PRACTICE: For a parser in your lab app, ask AI for input classes, run them through your local fuzzer, and log which increased coverage or found crashes.
SOURCES: None
---
## Core idea
Fuzzing works when inputs explore distinct behaviors, not when they repeat the same pattern with minor changes. AI can help by proposing categories of inputs a person might not think of: boundary lengths, unusual encodings, nested structures, mixed character sets, and malformed but structured data. This is a creative task, so the suggestions are hypotheses to evaluate, not truths. The discipline is to measure whether an input class adds coverage or triggers new behavior. If a generated class never reaches new code, it is noise. Keep the target strictly within a lab you own; fuzzing is an offensive technique and must never be aimed at third-party systems. A good output is a table of input classes with rationale, predicted behavior, and a way to detect novelty — coverage counters, new error messages, or different response shapes. Run the fuzzer locally, log results, and feed interesting cases back to the assistant for refinement. Be honest that AI does not replace a good fuzzing harness or coverage instrumentation; it only helps diversify the input generator. The combination of a solid harness, measured coverage, and thoughtful input classes is what actually finds bugs.

### Method
Input-class prompt:

```text
For this parser in a lab application I own, propose ten input CLASSES
(not individual strings) likely to exercise distinct code paths. For each,
give the rationale and a way to detect whether it added coverage.
Do not suggest targeting anything outside my lab.
```

Local run:

```bash
python3 fuzz_local.py --target <LAB_HOST> --corpus ./generated --max 500
```

### Decision table
| Input class | Predicted path | Novelty signal |
| --- | --- | --- |
| Empty and boundary lengths | Length checks | New error message |
| Mixed encodings | Decoder branches | Coverage counter |
| Nested structures | Recursive parser | Different response shape |
| Malformed delimiters | Error handling | Crash or reset |

### Failure modes
- Fuzzing a system you do not own.
- Generating volume without class diversity.
- Assuming an input adds coverage without measuring.
- Ignoring crashes because they "look benign."
- Letting the model replace a proper fuzzing harness.

### Verification steps
Confirm target ownership. Check coverage counters or response diversity per class. Investigate any crash or new error. Record which classes were productive. Discard classes that add nothing.

### Worked example
The assistant proposes deeply nested JSON structures for a lab parser. Your coverage tool shows no new branches, while a class of boundary-length strings reaches an unchecked allocation path and crashes the local process. You keep the productive class and drop the unproductive one based on measurement, not intuition.

Treat coverage data as the judge, not the assistant's confidence. A model can explain why an input class should be interesting, but only instrumentation shows whether it reached new code. Keep the harness simple and deterministic so measurements are comparable between runs, and resist the urge to add input classes faster than you can evaluate them; a smaller, measured corpus teaches more than a large unmeasured one.

### Knowledge check
Q: What determines whether an AI-generated fuzzing input class is worth keeping?
A: Measured novelty — increased coverage or new behavior in your own lab — not the number of inputs produced.

===MODULE===
TITLE: Validating Exploit Reliability Before Reporting
LEVEL: Advanced
MINUTES: 60
SUMMARY: Use AI to help test whether a lab exploit is reliable and reproducible, stripping out flaky or environment-dependent behavior.
OBJECTIVES: test reproducibility across clean states | identify flaky steps | produce stable evidence
TAKEAWAYS: reliability is part of evidence quality | flaky PoCs get dismissed | stability comes from controlled retesting
PRACTICE: Replay a lab PoC five times from a clean state, use AI to spot variable steps, and stabilize the demonstration.
SOURCES: None
---
## Core idea
An exploit that works once is a curiosity; one that works reliably is evidence. Reliability problems are common: a PoC may depend on timing, cached state, a specific session, or an assumption about the environment. Triagers who cannot reproduce a finding will discount it, regardless of whether it was real once. AI can help by reviewing a PoC for steps that introduce variability and suggesting controls: reset state, fix timing, pin versions, remove dependencies on prior actions. This is an analysis task where a second reader is useful. But the assistant cannot tell you whether your PoC is reliable — only repeated observation can. A good output lists each step, what state it assumes, how to control that state, and a suggested number of clean replays. Run the PoC multiple times from a clean state and record the success rate. If it is not consistently reproducible, either stabilize it or downgrade your confidence. Honest reliability assessment prevents embarrassing reports and teaches you which bug classes are genuinely solid. Keep all testing in owned labs and avoid tricks that make a demonstration look more reliable than it is.

### Method
Reliability review prompt:

```text
Review this PoC for a lab finding I own. For each step, list the state it
assumes and how to control it. Flag timing dependencies, cached values,
and reliance on prior actions. Suggest a clean-state replay protocol.
Do not change the demonstrated impact.
```

Replay protocol:

```text
Reset lab -> replay PoC -> record success -> repeat 5 times.
Success rate below 100% means the PoC is not yet reliable.
```

### Decision table
| Variability source | Control |
| --- | --- |
| Cached state | Reset before replay |
| Timing | Add waits or remove race |
| Session dependency | Use a fresh session |
| Version drift | Pin the lab version |

### Failure modes
- Reporting from a single successful run.
- Hiding flaky steps rather than fixing them.
- Depending on hidden prior state.
- Changing impact during "stabilization."
- Confusing a lab quirk with a real bug.

### Verification steps
Replay from a clean state at least five times. Record every failure. Control each source of variability you find. Re-test until stable. If reliability cannot be achieved, document the limitation honestly rather than overstating the finding.

### Worked example
A lab PoC succeeded twice and failed three times. The assistant identified a dependency on a cached token from a prior request. You add a fresh-session step and replay five more times with full success. The stabilized PoC is now credible evidence rather than a lucky result.

If a finding cannot be made reliable, say so in the notes and lower your confidence rather than searching for a trick that hides the instability. Triagers prefer an honest, narrow finding to a dramatic one that fails on replay. The discipline of reliability testing also improves your understanding of the bug, because the conditions that make it flaky often reveal the true root cause more clearly than the successful run did.

### Knowledge check
Q: Why is repeated clean-state replay essential before reporting?
A: Because a triager must be able to reproduce the finding; flaky demonstrations undermine credibility even when the underlying bug is real.

===MODULE===
TITLE: Structuring Reports with AI Assistance
LEVEL: Beginner
MINUTES: 50
SUMMARY: Learn to use AI to organize findings into clear, complete reports without letting it invent details or change your evidence.
OBJECTIVES: define the core sections of a report | use AI for structure, not substance | verify every generated statement
TAKEAWAYS: structure helps triagers | substance must come from your evidence | generated prose needs line-by-line checking
PRACTICE: Turn your lab notes for one finding into a structured report using AI, then verify that every sentence is supported by your own evidence.
SOURCES: None
---
## Core idea
A well-structured report lets a triager understand a finding quickly: what it is, where it is, how to reproduce it, and why it matters. AI is good at turning rough notes into that shape. It can group your evidence into sections, write a concise summary, and format steps consistently. The risk is that in the act of "writing it up" the model may fill gaps with plausible text — an impact you never observed, a severity it inferred, or a step it thinks should exist. Your job is to keep substance human and use AI for presentation. A good output follows a fixed structure: title, affected asset and scope, summary, steps to reproduce, evidence, impact, severity, and remediation. Each section should contain only what your notes support. Ask the assistant to mark any sentence it added that is not in your notes. Then verify line by line. A clear report is a professional artifact that reflects your name; a padded one wastes time and invites doubt. Structure is a force multiplier for good evidence, not a substitute for it.

### Method
Structuring prompt:

```text
Using ONLY the notes provided, organize this lab finding into sections:
Title | Affected asset (with scope reference) | Summary | Steps to
reproduce | Evidence | Impact | Severity | Remediation. Mark any sentence
that is not directly supported by the notes as ADDED. Do not add impacts,
steps, or severity judgments of your own.
```

Verification: read the draft beside your original notes and strike anything unsupported.

### Decision table
| Section | Source of truth | AI role |
| --- | --- | --- |
| Summary | Your notes | Condense |
| Steps | Your replay log | Format |
| Evidence | Raw captures | Attach, not rewrite |
| Impact | Observed effect | Edit for clarity |
| Severity | Program matrix | Draft vector only |

### Failure modes
- Accepting an ADDED sentence because it sounds reasonable.
- Letting the model reorder steps so they no longer reproduce.
- Rewriting evidence until it no longer matches the raw capture.
- Adding a dramatic impact you did not observe.
- Omitting the scope reference.

### Verification steps
Compare every sentence to your notes. Replay the steps exactly as written. Confirm the evidence is the original capture. Check the severity against the program matrix yourself. Remove all ADDED claims that lack support.

### Worked example
Your notes describe a lab endpoint that reveals internal IDs. The assistant's draft says it "could enable full account takeover." You strike that sentence because you never observed it, and replace it with the accurate statement that internal IDs are disclosed. The report stays honest and defensible.

Put the most important information first: a one-sentence summary, the affected asset, and the observed impact. A triager who understands the finding in the first ten seconds is more likely to evaluate the rest carefully. Use AI to check that the structure is complete, but keep the evidence section in its original form so nothing is lost in translation between your notes and the report.

### Knowledge check
Q: What is the correct role for AI in report writing?
A: Organizing and clarifying content you supply, never adding impacts, steps, or severity that your evidence does not support.

===MODULE===
TITLE: Explaining Impact and CVSS Honestly
LEVEL: Beginner
MINUTES: 55
SUMMARY: Use AI to help articulate real impact and draft CVSS vectors while keeping final severity judgments grounded and human.
OBJECTIVES: connect observations to impact | draft CVSS vectors as a starting point | avoid inflated scores
TAKEAWAYS: impact must be observed or clearly reasoned | CVSS is a communication tool | final severity is your responsibility
PRACTICE: For a confirmed lab finding, write an impact statement and a CVSS vector, then have AI critique both for overstatement and verify against the program matrix.
SOURCES: None
---
## Core idea
Impact is the difference between a bug and a finding. A triager needs to know what an attacker could actually do, not just that a technically odd behavior exists. AI can help articulate impact by asking the right questions: what data is exposed, what action is enabled, what precondition is required, and who is affected. It can also draft a CVSS vector from your description. But both tasks are easy to overstate. A model may turn "an internal identifier is disclosed" into "complete account compromise," or assign high scores based on the mere existence of a flaw. Honest impact reasoning stays close to what you observed and clearly labels anything that is a reasoned extrapolation. CVSS is a structured way to communicate severity, not a truth machine — the metrics depend on context such as privileges required and scope of data. Always check the program's own severity matrix, which may differ from generic CVSS. A good output separates observed effect from possible escalation, justifies each metric, and flags uncertainty. Your final judgment should be conservative: if impact is ambiguous, say so. Credibility comes from accurate severity, not dramatic numbers.

### Method
Impact prompt:

```text
For this confirmed lab finding, produce an impact statement that separates
(1) what I directly observed, (2) what follows logically, and (3) what is
speculative. Then draft a CVSS vector with a one-sentence justification
for each metric. Flag any metric the provided evidence cannot support.
```

Checklist:

```text
Observed effect: ...
Preconditions required: ...
Data or action affected: ...
Program matrix rating: ...
```

### Decision table
| Impact statement | Accept? | Reason |
| --- | --- | --- |
| Directly observed | Yes | Evidence supports it |
| Logical consequence | Maybe | State the reasoning |
| Speculative escalation | No | Mark as uncertain or omit |
| Dramatic but unsupported | No | Remove |

### Failure modes
- Inflating impact to increase reward.
- Treating a theoretical escalation as observed.
- Ignoring privileges or preconditions in CVSS.
- Using generic CVSS instead of the program matrix.
- Letting the model choose the final score.

### Verification steps
Tie each impact claim to an observation. Check each CVSS metric against evidence. Compare with the program's severity matrix. Downgrade uncertain claims. Record the final rating as your decision, not the model's.

### Worked example
The assistant drafted a high-severity vector for a lab finding because it assumed no privileges were needed. You check your replay: a logged-in session was required. You correct the vector to reflect that precondition, producing an accurate medium rating that a triager can trust.

State preconditions explicitly, because they are what separate a high-severity issue from a low one. An action that requires an authenticated admin is very different from the same action available to an anonymous visitor. When evidence does not establish a precondition, mark it as unknown rather than assuming the most favorable case; an honest vector with a flagged gap is more useful than a confident score that collapses under review.

### Knowledge check
Q: Why should final severity be a human decision even if AI drafts the vector?
A: Because severity depends on context and evidence that only you have verified, and inflated scores damage credibility.

===MODULE===
TITLE: Editing Reports for Triagers
LEVEL: Beginner
MINUTES: 45
SUMMARY: Use AI to make reports concise and readable for triagers while preserving all evidence and factual accuracy.
OBJECTIVES: write for a busy reader | remove ambiguity without removing facts | keep verification intact
TAKEAWAYS: triagers value clarity and brevity | editing must not change meaning | evidence stays original
PRACTICE: Take a draft report and ask AI to tighten the prose, then confirm that no factual detail or evidence was altered.
SOURCES: None
---
## Core idea
A triager reads many reports quickly. Clear, concise writing gets a finding understood; vague or bloated prose slows everything down. AI is well suited to editing for readability: shortening sentences, removing redundancy, making steps unambiguous, and putting the most important information first. This is a low-risk use because the facts are already in your draft and you can compare before and after. The risk is subtle meaning drift. In tightening a sentence, a model can drop a qualifier such as "only when logged in," changing the scope of a claim. It can also merge two steps and break reproducibility. So treat editing as a diff review: check that every factual detail, qualifier, and evidence reference survived. Ask the assistant to list what it changed and why. Keep the original draft and the evidence attachments untouched. A good output is the same finding, easier to read, with no new claims and no lost conditions. Editing for triagers is a service to the reader and to your own reputation — it signals that you respect their time and take accuracy seriously.

### Method
Editing prompt:

```text
Edit this lab report for clarity and brevity. Keep every factual detail,
qualifier, step, and evidence reference exactly as meaningful. List all
changes you made and why. Do not add or remove claims. Do not change the
severity or impact.
```

Diff check:

```text
Compare the edited version to the original. Confirm no qualifier
("only", "when", "if") was dropped and no step was merged.
```

### Decision table
| Edit | Accept? | Check |
| --- | --- | --- |
| Shorten sentence | Yes | Meaning unchanged |
| Remove qualifier | No | Restores condition |
| Merge steps | No | Steps stay separate |
| Reorder sections | Yes | Logic preserved |
| Change severity word | No | Keep your rating |

### Failure modes
- Dropping conditions that limit a claim.
- Merging steps so replay fails.
- "Polishing" evidence into something it is not.
- Changing your voice beyond recognition.
- Removing the scope reference.

### Verification steps
Read both versions side by side. Confirm every evidence reference still points to the original capture. Replay the steps as edited. Check that qualifiers survived. Reject any edit you cannot justify.

### Worked example
The assistant shortened "accessible only to authenticated users with the editor role" to "accessible to users," which broadened the claim. You caught the dropped qualifier and restored it. The final report was more concise without misrepresenting the precondition.

Keep both versions of a report while editing so you can diff them at the end. The diff makes accidental meaning changes obvious, especially dropped qualifiers and merged steps. If an edit improves readability but weakens precision, reject it. The goal is a report that is easier to read without being easier to misread, and a quick side-by-side check is the cheapest way to guarantee that.

### Knowledge check
Q: What is the main risk of AI-editing a report for brevity?
A: Losing qualifiers or merging steps so the meaning and reproducibility change, even though the prose reads better.

===MODULE===
TITLE: Producing Minimal Proofs of Concept for Reports
LEVEL: Intermediate
MINUTES: 50
SUMMARY: Learn to reduce a PoC to its smallest reliable form with AI help, making findings easy to reproduce without losing proof.
OBJECTIVES: identify essential steps | remove non-essential complexity | verify minimality by replay
TAKEAWAYS: minimal PoCs reproduce more reliably | each step must earn its place | never invent a shorter path that does not work
PRACTICE: Take a working lab PoC and ask AI to propose a shorter version, then replay both and keep the shorter one only if impact is unchanged.
SOURCES: None
---
## Core idea
A minimal PoC is the shortest sequence that still demonstrates the finding. It is easier to read, faster to reproduce, and less likely to fail for incidental reasons. AI can help by identifying steps that do not contribute to the proof and proposing a tighter sequence. This is a judgment task with a mechanical check: replay the shortened version and confirm the same impact. If the shorter PoC fails, the removed step was essential and must return. Be wary of a model inventing a "simpler" path that skips a necessary precondition — that produces a PoC that looks elegant and does not work. Always replay before adopting. Minimality is not the same as simplicity of payload; a single complex request may be minimal if it proves the point, while five simple steps may not be. A good output lists each step with what it proves, flags steps that appear redundant, and states the expected observation. Keep everything in owned labs. The payoff is a report a triager can reproduce in seconds, which leads to faster validation and a stronger reputation for precision.

### Method
Minimization prompt:

```text
Here is a working PoC for a lab finding I own. For each step, state what
it proves. Propose the shortest sequence that still demonstrates the same
impact. Do not remove preconditions. Mark steps you believe are
non-essential and explain why. Do not invent new steps.
```

Replay check:

```text
Replay the proposed minimal PoC from a clean state three times. Confirm
the identical observation. If it fails, restore the removed step.
```

### Decision table
| Step | Proves | Essential? |
| --- | --- | --- |
| Log in | Authenticated context | Yes |
| Set parameter | Triggers behavior | Yes |
| Extra navigation | Nothing new | Remove |
| Refresh | Cached state reset | Test, then decide |

### Failure modes
- Removing a necessary precondition.
- Inventing a shorter path that does not work.
- Equating a shorter payload with a more minimal PoC.
- Adopting a minimal PoC without replay.
- Changing the demonstrated impact during minimization.

### Verification steps
Replay the original and the minimal version from clean states. Compare observations. Confirm the impact is identical. Keep the version with the fewest steps that still works reliably. Record which steps were removed and why.

### Worked example
Your lab PoC included a page reload before the final request. The assistant flagged it as non-essential. You replay three times without it and the impact is unchanged, so you keep the shorter version. A later failure in a different environment taught you to re-check this assumption when conditions change.

Revisit minimality when the environment changes. A step that was redundant in one lab version may become essential after a framework update or a configuration change. Keeping notes on why each step was removed lets you restore it quickly if a replay fails elsewhere. A minimal PoC is a conclusion from evidence, not a permanent property of the finding, and it should be revalidated whenever conditions shift.

### Knowledge check
Q: How do you know a minimized PoC is still valid?
A: By replaying it from a clean state and confirming it demonstrates the identical impact reliably.

===MODULE===
TITLE: Keeping Your Own Voice in AI-Assisted Reports
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Learn to use AI for polish while preserving the precise, personal, evidence-led style that makes your reports credible.
OBJECTIVES: recognize voice erosion in generated prose | edit toward your own style | keep accountability visible
TAKEAWAYS: a report carries your name | generic AI phrasing weakens trust | clarity and precision beat polish
PRACTICE: Take an AI-drafted report section and rewrite one paragraph in your own voice, then confirm no facts changed.
SOURCES: None
---
## Core idea
Reports are professional communication, and a triager learns to recognize a researcher's voice over time. A clear, precise, consistent style builds trust; a generic, slightly padded AI style does the opposite. When you let a model write entire sections, your voice erodes: sentences become longer, qualifiers soften, and the writing sounds like everyone else's. That matters because specificity is a signal of honesty — "the parameter is reflected inside an attribute in the response at line 12" is more credible than "the application may be susceptible to injection." Use AI as an editor, not a ghostwriter: ask it to tighten structure, then rewrite the key passages yourself in your own words, keeping only the facts. Preserve your terminology, your sentence rhythm, and your habit of stating evidence before conclusions. A useful test is to read a paragraph aloud: if it does not sound like you, rewrite it. A good output is a report that is cleaner than your rough notes but still unmistakably yours, with every claim traceable to evidence you gathered. The goal is not literary flair but a trustworthy, recognizable professional voice that triagers can rely on.

### Method
Voice-preserving prompt:

```text
Suggest structural improvements only. Do not rewrite the technical
description. Where prose is unclear, mark the sentence and explain the
problem; I will rewrite it myself.
```

Rewrite loop:

```text
Draft in my own words -> ask AI to flag ambiguity -> rewrite flagged
sentences myself -> verify facts are unchanged.
```

### Decision table
| AI suggestion | Use? | Reason |
| --- | --- | --- |
| Reorder sections | Yes | Improves flow |
| Shorten a factual sentence | Maybe | Check meaning |
| Replace my description | No | Erodes voice and precision |
| Add introductory fluff | No | Adds no evidence |

### Failure modes
- Accepting a full generated rewrite of technical sections.
- Losing qualifiers that limit a claim.
- Sounding more certain than your evidence allows.
- Letting generic phrasing replace specific observations.
- Forgetting that the report carries your name.

### Verification steps
Read the report aloud. Compare each paragraph to your original notes. Confirm no fact was added or softened. Check that your key terms and phrasing remain. If a sentence does not sound like you, rewrite it and re-verify the facts.

### Worked example
The assistant rewrote your evidence paragraph into smooth, generic prose that said the behavior "appears anomalous." You replaced it with your original precise statement naming the exact parameter and response fragment. The report became clearer without losing the specificity that made it convincing.

A quick way to test your voice is to replace the assistant's phrasing with how you would explain the finding to a peer over a call. That phrasing is usually more direct and more accurate. Then check that the technical content survived unchanged. Reports written this way read like a person who did the work, which is exactly the impression you want a triager to have when evaluating your submission.

### Knowledge check
Q: Why is preserving your own voice in a report valuable?
A: Because specific, consistent phrasing signals honesty and accountability; generic AI prose erodes trust and precision.

===MODULE===
TITLE: Avoiding Hallucinated Impacts in Reports
LEVEL: Intermediate
MINUTES: 50
SUMMARY: Build a final defense against impacts that an assistant invents during report writing, keeping every claim evidence-backed.
OBJECTIVES: identify fabricated impact claims | trace each impact to observation | apply a final honesty gate
TAKEAWAYS: generated impacts are common and dangerous | a claim needs observed support | uncertainty must be stated
PRACTICE: Take an AI-written report, highlight every impact claim, and label each as observed, reasoned, or unsupported, deleting the last.
SOURCES: None
---
## Core idea
Of all the places AI hallucination appears, impact statements are among the most dangerous. A model asked to "explain why this is serious" will readily produce a chain of escalation that no one observed: data theft, account takeover, lateral movement. These claims sound authoritative and can inflate severity, but they are fiction if not backed by evidence. When a triager finds one exaggerated claim, doubt spreads to the entire report. The defense is a strict impact gate. For every impact statement, ask what you directly observed, what follows logically from that observation, and what is speculation. Only the first two belong in a report, and the second must show its reasoning. Ask the assistant to label each impact sentence with its basis, then strike anything unsupported. Be especially careful with words like "could allow an attacker to," which often introduce a leap. A good report describes the demonstrated effect, states preconditions honestly, and flags any uncertainty rather than smoothing it over. The professional standard is conservative accuracy: it is better to understate a real finding than to overstate it and lose credibility.

### Method
Impact audit prompt:

```text
For each impact claim in this lab report, label it: OBSERVED (directly
seen in evidence), REASONED (logical consequence, state the premise), or
UNSUPPORTED. Quote the evidence for OBSERVED claims. Do not defend
unsupported claims; list them for removal.
```

Final gate:

```text
Remove every UNSUPPORTED impact. Convert overstated "could allow" claims
into the precise observed effect. Confirm severity still matches evidence.
```

### Decision table
| Impact claim | Label | Action |
| --- | --- | --- |
| Internal IDs visible in response | Observed | Keep with evidence |
| May enable phishing | Reasoned | State premise or omit |
| Full account takeover | Unsupported | Delete |
| Could steal all user data | Unsupported | Delete |

### Failure modes
- Accepting an impact because it sounds plausible.
- Letting a model escalate a minor issue into a critical one.
- Omitting preconditions that limit impact.
- Treating a reasoning chain as observed fact.
- Skipping the final gate under time pressure.

### Verification steps
Highlight every impact sentence. Label each with its basis. Quote evidence for observed claims. Delete the rest. Re-check severity against the program matrix after edits. Read the report once more looking for overstatement.

### Worked example
The assistant wrote that a lab open-redirect "could be used to steal user credentials." You found no evidence of a credential-harvesting page in your test. You removed that sentence and kept the accurate statement that an arbitrary redirect was observed. The report remained truthful and was accepted on its merits.

### Knowledge check
Q: How should an unverified but plausible impact be handled in a report?
A: Remove it or mark it clearly as speculation with its premise; never present it as demonstrated fact.

===MODULE===
TITLE: Orchestration Scripts Under Human Review
LEVEL: Advanced
MINUTES: 70
SUMMARY: Design AI-assisted scripts that coordinate tools for authorized lab work while keeping every action gated by a human.
OBJECTIVES: build bounded orchestration | require review before actions | prevent autonomous scope drift
TAKEAWAYS: automation must stay within declared scope | human gates prevent runaway actions | logs make behavior auditable
PRACTICE: Write a lab-only wrapper that calls two local tools, requires your confirmation before each action, and logs every step.
SOURCES: None
---
## Core idea
Agentic workflows chain tools: collect data, summarize it, form a hypothesis, run a check, record the result. AI can write the glue code and even decide the next step, but an orchestration script that acts without review is a risk. It can misinterpret scope, loop indefinitely, or take an action you never intended. The safe pattern is bounded orchestration with human gates: the script declares its allowed targets and actions, proposes each step, waits for confirmation, and logs everything. Use it only on owned lab targets. A good design keeps the model in an advisory role — it proposes, the script enforces boundaries, and you approve. Include hard limits: a fixed target list, a maximum number of steps, no network access outside the lab, and a dry-run mode that prints proposed actions without executing them. A good output is a transparent log of what the workflow intended and what it actually did. Audit the log after every run. This is how you gain the speed of automation without surrendering control. Agentic assistance is powerful precisely because it reduces manual steps, which is also why it demands the strongest guardrails.

### Method
Wrapper sketch:

```python
ALLOWED = {"<LAB_HOST>"}          # hard-coded, no expansion
MAX_STEPS = 5
def propose(action):
    print("PROPOSED:", action)
    return input("Approve? [y/N]: ").strip().lower() == "y"
def run(action):
    if not propose(action):
        print("SKIPPED"); return
    if action.target not in ALLOWED:
        print("BLOCKED: out of scope"); return
    execute(action); log(action)
```

### Decision table
| Safeguard | Purpose |
| --- | --- |
| Fixed target list | Prevents scope drift |
| Step limit | Stops runaway loops |
| Dry-run mode | Lets you inspect intent |
| Approval prompt | Keeps a human in control |
| Full logging | Makes actions auditable |

### Failure modes
- Letting the script expand its own target list.
- Skipping approval for "routine" steps.
- No step limit, causing infinite loops.
- Logging only successes and hiding blocked actions.
- Pointing the workflow at anything but a lab you own.

### Verification steps
Run in dry-run mode first and inspect every proposed action. Confirm the target list matches your lab scope. Test that an out-of-scope action is blocked. Review the full log after each run. Never grant the script credentials with broad permissions.

### Worked example
A proposed workflow suggested resolving a hostname that appeared in a tool output. Because the target was not in the hard-coded list, the script blocked it and logged the attempt. You reviewed the log, confirmed the host was outside your lab, and left it excluded. The guardrail worked as designed.

Run the workflow in dry-run mode after any change, even a small one. A new tool call or a reworded prompt can alter the sequence of proposed actions in ways that are hard to predict from reading the code. The dry run prints what would happen without doing it, giving you a cheap chance to catch a target that drifted outside the allowed list before anything is executed against your lab.

### Knowledge check
Q: What is the essential safeguard in an AI-orchestrated security workflow?
A: A human approval gate plus a hard-coded, non-expanding target list so the script cannot drift outside scope.

===MODULE===
TITLE: RAG Over Your Own Notes and Writeups
LEVEL: Advanced
MINUTES: 65
SUMMARY: Build a retrieval system over your own authorized notes so assistants answer from your verified material, not from invention.
OBJECTIVES: structure notes for retrieval | build a grounded query workflow | verify retrieved answers against sources
TAKEAWAYS: retrieval grounds answers in your evidence | chunking and metadata matter | retrieved content still needs checking
PRACTICE: Create five lab notes, index them locally, and ask a grounded question, then verify the answer against the source notes.
SOURCES: None
---
## Core idea
Retrieval-augmented generation, or RAG, gives an assistant a library of documents to search before answering. For a hunter, the most valuable library is your own: lab notes, verified writeups, prompt library entries, and evaluation logs. Grounding answers in material you produced reduces hallucination and lets you reuse hard-won knowledge. It also keeps sensitive data local if the index and model run on your machine. The quality of a RAG system depends on preparation. Notes must be chunked at a useful size — small enough to be relevant, large enough to keep context — and tagged with metadata such as bug class, technology, date, and authorization status. A query should retrieve a few relevant chunks and the model should be told to answer only from them, citing which chunk supports each claim. Even then, retrieved content can be misread, so verify answers against the source note. A good output includes an answer plus cited note IDs and a clear "not found in my notes" when evidence is absent. This turns your notes into a durable, queryable asset that makes each new engagement start from everything you have learned rather than from zero.

### Method
Preparation and query:

```text
Chunk each note into 300-500 word sections. Tag with: bug class, stack,
date, target type, status (verified/unverified). Never index confidential
program scopes into a hosted service.
```

```text
Using ONLY the retrieved note chunks, answer the question. Cite the note
ID for each claim. If the notes do not contain the answer, write "not in
my notes" rather than guessing.
```

### Decision table
| Design choice | Good default |
| --- | --- |
| Chunk size | 300-500 words |
| Retrieval count | 3-5 chunks |
| Metadata | Class, stack, date, status |
| Data location | Local for sensitive notes |

### Failure modes
- Indexing confidential material into a hosted service.
- Chunks so small that context is lost.
- Accepting an answer with no citation.
- Letting the model fill gaps from general knowledge.
- Never updating the index as notes change.

### Verification steps
Open each cited note and confirm it supports the claim. Test with a question you know is not in the notes and check that the system says so. Re-index after adding notes. Keep the index local for anything sensitive.

### Worked example
You ask your RAG system how you previously handled a JWT algorithm-confusion lab. It returns two note chunks with IDs and a concise summary. You open the cited notes, confirm the steps match, and reuse the approach. When you ask about a topic you never recorded, it correctly answers "not in my notes."

### Knowledge check
Q: What makes RAG answers more trustworthy than ordinary assistant answers?
A: They are constrained to retrieved, cited material from your own verified notes, with an explicit "not found" option.

===MODULE===
TITLE: Evals for Your AI Assistant
LEVEL: Advanced
MINUTES: 60
SUMMARY: Create a small, repeatable evaluation set so you can measure whether your assistant improves or regresses over time.
OBJECTIVES: build a benchmark from known lab tasks | score outputs consistently | detect drift after model changes
TAKEAWAYS: evals turn opinion into measurement | fixed tasks enable comparison | regressions are caught, not assumed
PRACTICE: Build five lab benchmark tasks with known answers, run your assistant on them, and record a baseline score for later comparison.
SOURCES: None
---
## Core idea
An evaluation set is a fixed collection of tasks with known correct answers, used to measure an assistant's performance. For a hunter, a practical eval set might include summarizing a function, extracting endpoints with citations, drafting a taint table, explaining a spec clause, and writing an impact statement — all from lab material you control. Each task has a rubric: required facts, forbidden errors, and a scoring rule. Run the same set whenever you change a prompt, switch models, or suspect a provider update changed behavior. The result is a baseline you can compare against, turning "this feels worse" into a measurable regression. Keep the set small enough to run often; five to ten tasks are enough to reveal big changes. Include adversarial cases where the correct answer is "unknown" or "no vulnerability," so a model that always invents findings scores poorly. A good output is a scorecard per task with pass/fail and notes. Store it in your evaluation log. Evals are the engineering backbone of reliable AI use: they tell you whether your tooling is actually helping, and they catch the quiet degradation that otherwise goes unnoticed until a bad claim reaches a report.

### Method
Benchmark entry:

```text
Task: extract endpoints from lab bundle.js lines 100-160
Required: 3 real endpoints with correct line numbers
Forbidden: invented paths, claims of exploitability
Score: 1 point per correct cited endpoint, -1 per invented endpoint
```

Run protocol:

```text
Run all tasks with the same prompt versions. Record date, model version,
and prompt IDs. Compare with the previous baseline. Investigate any drop.
```

### Decision table
| Result | Interpretation | Action |
| --- | --- | --- |
| Score improves | Change helped | Keep it |
| Score drops | Regression | Roll back and investigate |
| Same score | No effect | Consider removing complexity |
| "Unknown" cases wrong | Hallucination risk | Strengthen constraints |

### Failure modes
- Changing the benchmark between runs.
- Scoring subjectively without a rubric.
- Only including easy tasks that always pass.
- Skipping "no answer" cases.
- Running evals once and never again.

### Verification steps
Freeze the benchmark and rubric. Score each run consistently. Record model and prompt versions. Investigate regressions before relying on the tool. Add a new task whenever a failure mode is discovered.

### Worked example
After a provider update, your eval set dropped from 9/10 to 6/10, with failures concentrated in citation tasks. You revert to the previous model for citation work and keep the new one for drafting. Without the eval set, you would have trusted the updated model until a bad claim reached a report.

### Knowledge check
Q: Why should an eval set include cases where the right answer is "unknown"?
A: Because models that invent answers on absent evidence are dangerous; those cases directly measure hallucination risk.

===MODULE===
TITLE: Measuring Real Productivity Gains
LEVEL: Advanced
MINUTES: 55
SUMMARY: Learn to measure whether AI actually improves your bounty productivity, using honest metrics instead of a sense of speed.
OBJECTIVES: define meaningful productivity metrics | track time and quality | avoid vanity measurements
TAKEAWAYS: output volume is not productivity | quality and verified findings matter | measurement reveals real leverage
PRACTICE: Track one week of lab sessions with and without AI, recording time per task and number of verified findings, then compare.
SOURCES: None
---
## Core idea
It is easy to feel faster with AI and still be less effective. A model can produce a lot of text quickly, but if you spend the saved time verifying hallucinations or writing reports for weak findings, net productivity may fall. Honest measurement focuses on outcomes: verified findings, accepted reports, time from observation to conclusion, and error rates. Track a few metrics consistently. Time per task: did summarization actually get faster once verification is included? Verified findings per session: did AI help you reach more real bugs, or just more candidates? False-positive rate: did generated claims increase the number of discarded candidates? Report acceptance: did clarity improve triage outcomes? Compare periods with and without AI, keeping the target type similar. Use your evaluation log and notes as data sources. A good output is a simple weekly scorecard with numbers and a short interpretation. Be wary of vanity metrics such as prompts sent or lines generated. The goal is not to prove AI is wonderful; it is to find where it genuinely helps and where it costs you time. This evidence should drive your routing decisions and justify which tools earn a place in your workspace.

### Method
Weekly scorecard:

```text
Sessions: N   Verified findings: V   Discarded candidates: D
Hours spent: H   Time to verified conclusion (median): T
False-positive rate = D / (V + D)
Compare with the previous no-AI or low-AI week.
```

Review rule:

```text
If V rises and D stays flat or falls -> real gain.
If both V and D rise sharply -> more activity, maybe less quality.
If T falls but D rises -> speed is coming at the cost of accuracy.
```

### Decision table
| Metric | Good direction | Caution |
| --- | --- | --- |
| Verified findings | Up | Must be verified |
| False-positive rate | Down | watch for inflation |
| Time to conclusion | Down | Only if quality holds |
| Prompts sent | Ignore | Vanity metric |

### Failure modes
- Measuring activity instead of outcomes.
- Counting unverified candidates as findings.
- Comparing different target types unfairly.
- Ignoring time spent verifying AI output.
- Cherry-picking good weeks.

### Verification steps
Use the same definition of "verified finding" across periods. Include verification time in totals. Review the scorecard weekly and adjust routing. If a tool does not improve the numbers, consider removing it.

### Worked example
Your first AI-heavy week produced twice as many candidate findings but only the same number verified, with a higher discard rate. You realized time had shifted from analysis to cleaning up generated claims. You restricted AI to summarization and structuring, and the next week showed fewer candidates but a higher verified rate and less total time.

### Knowledge check
Q: Which productivity metric matters most for a hunter using AI?
A: Verified findings and their quality, not the volume of generated candidates or prompts.

===MODULE===
TITLE: Guardrails Against Over-Automation
LEVEL: Advanced
MINUTES: 60
SUMMARY: Recognize the risks of excessive automation and put explicit limits on what your AI workflows may do.
OBJECTIVES: identify over-automation signals | set hard limits | preserve human accountability
TAKEAWAYS: more automation is not automatically better | limits prevent scope and quality failures | accountability stays with you
PRACTICE: Audit one automated lab workflow and add three hard limits, then run it again and confirm each limit is enforced.
SOURCES: None
---
## Core idea
Automation tends to expand. A helper that summarized one file becomes a script that scans many; a script that proposes actions becomes one that executes them. Each expansion removes a human check, and the failure mode is not dramatic — it is a quiet drift into actions you did not intend, scope boundaries you no longer verify, and reports you no longer fully understand. Over-automation also erodes learning: if the workflow does every step, you stop building the judgment needed to catch its mistakes. Guardrails are explicit limits you set before expansion happens. Define which actions may never be automated, which targets are allowed, how many steps a workflow may take, and where a human must approve. Require that every report be reviewed and signed by you with an understanding of the evidence. Monitor signals: a rising discard rate, reports you cannot explain, or a workflow that surprises you are warnings. A good output is a written guardrail document plus a log showing the limits held in practice. Automation should serve your judgment, not replace it. Keeping a human firmly in the loop is what makes agentic workflows safe and defensible in authorized lab work.

### Method
Guardrail document:

```text
Never automate: submitting reports, changing scope, touching real user data.
Allowed targets: <lab hosts only>, hard-coded.
Step limit: 5. Approval required before any action.
Human sign-off: every report, with evidence review.
```

Monitoring signals:

```text
Rising discard rate | actions I cannot explain | workflows that surprise me
-> pause automation and review the log.
```

### Decision table
| Proposed capability | Allowed? | Reason |
| --- | --- | --- |
| Summarize lab code | Yes | Read-only, low risk |
| Execute proposed actions | With approval | Human gate required |
| Expand target list | No | Scope is human-controlled |
| Submit a report | No | Accountability is human |

### Failure modes
- Letting a tool expand its own permissions.
- Removing approval steps for convenience.
- Trusting a workflow you no longer understand.
- Ignoring early warning signals.
- Automating tasks that build core skills.

### Verification steps
Audit the workflow against the guardrail document. Test that each limit actually blocks the prohibited action. Review the action log for drift. Pause and simplify if any limit was violated. Re-authorize only after understanding what changed.

### Worked example
Your lab workflow began proposing follow-up hosts from tool output. The guardrail document forbade target expansion, and a test confirmed the script blocked the new host. You reviewed the log, kept the limit, and avoided an out-of-scope action that would have been a serious mistake.

Review the action log for near misses, not just violations. A blocked action that was almost taken reveals where the workflow wanted to expand and why, which is useful information about its tendencies. Each near miss is a prompt to tighten a rule or add a check. Treating them as learning opportunities rather than annoyances keeps the automation honest and prevents the gradual normalization of behavior you originally rejected.

### Knowledge check
Q: What is the clearest sign that automation has gone too far?
A: When you cannot explain what the workflow did or when it acts outside the scope and limits you set.

===MODULE===
TITLE: The Augmented Hunter: Daily and Weekly Workflow
LEVEL: Intermediate
MINUTES: 60
SUMMARY: Integrate AI into a sustainable daily and weekly routine that keeps verification, learning, and rest in balance.
OBJECTIVES: design a repeatable daily loop | schedule weekly review and maintenance | avoid burnout and drift
TAKEAWAYS: consistency beats intensity | verification stays central | the routine protects both skill and accuracy
PRACTICE: Draft a one-week lab schedule with daily focus blocks and a weekly review, then follow it and note where AI helped or hurt.
SOURCES: None
---
## Core idea
A flagship practice is not a series of heroic sessions; it is a sustainable routine. The augmented hunter's day separates activities by their nature. Morning might be unaided: read scope, form hypotheses, do the core analysis while your judgment is fresh. Midday can be assisted: use AI to summarize code, organize notes, and generate variants for confirmed findings in your lab. Late day is verification and notes: replay PoCs, check claims, and record outcomes. AI fits where it reduces drudgery, not where it replaces the reasoning that builds skill. The weekly cycle adds evaluation: review your eval log, update prompts, prune notes, check privacy boundaries, and practice one fundamentals exercise without AI. Rest is part of the system — fatigue increases false positives and careless scope errors, which are worse than lost hours. A good output is a written schedule with time blocks, a short checklist per block, and a weekly review template. Track where AI actually helped using your productivity metrics, and adjust the routine with evidence. The aim is a workflow that compounds skill and accuracy over months, not a burst of activity that burns you out.

### Method
Daily loop:

```text
AM: unaided analysis and hypothesis formation (no AI)
Midday: AI-assisted summarization, note organization, lab variants
PM: verification, clean-state replays, evidence capture
End: update notes and eval log
```

Weekly review:

```text
Review eval log | prune prompt library | check data boundaries |
one no-AI fundamentals exercise | adjust next week's focus
```

### Decision table
| Time block | AI role | Human role |
| --- | --- | --- |
| Morning analysis | None | All reasoning |
| Midday assistance | Summarize and draft | Decide and verify |
| Verification | None | Replay and confirm |
| Weekly review | Summarize logs | Set priorities |

### Failure modes
- Using AI throughout the day until fundamentals decay.
- Skipping verification when time runs short.
- Never reviewing the eval log.
- Scheduling without rest, leading to careless errors.
- Letting the routine become rigid despite evidence.

### Verification steps
Follow the schedule for a week and log where AI helped or hurt. Confirm every reportable claim went through a verification block. Check that the weekly review actually happened. Adjust the routine based on your scorecard, not on enthusiasm.

### Worked example
You notice your best findings come from unaided morning analysis, while AI-assisted afternoons mostly produce candidates that get discarded. You shift verification earlier and limit variant generation to confirmed findings. The next week shows fewer discarded candidates and less total time, confirming the change.

Protect the boundary between work and rest as deliberately as you protect scope. Tired analysis produces the same failure that over-automation does: actions taken without the verification you would normally perform. End each day by writing down what is verified and what is still a guess, so the next session starts from a clear state rather than from memory and momentum.

### Knowledge check
Q: Why does a sustainable routine matter more than occasional intense sessions?
A: Because consistency compounds skill and accuracy, while fatigue and unstructured bursts increase false positives and scope errors.

===MODULE===
TITLE: Skill Maintenance: Preventing AI Atrophy
LEVEL: Intermediate
MINUTES: 50
SUMMARY: Protect your security fundamentals so reliance on AI never erodes the judgment that makes you effective.
OBJECTIVES: identify at-risk fundamentals | schedule deliberate unaided practice | test yourself regularly
TAKEAWAYS: unused skills decay | fundamentals are what let you verify AI | maintenance is deliberate, not incidental
PRACTICE: Choose one fundamentals area you have delegated to AI, practice it unaided in a lab for a week, and record the difficulty and what you relearned.
SOURCES: None
---
## Core idea
Any skill you stop using begins to fade. If AI writes your regexes, explains every protocol, and drafts every report, the underlying abilities — reading code, reasoning about protocols, expressing impact — weaken quietly. This is dangerous because those are exactly the abilities you need to detect AI mistakes. Skill maintenance is the deliberate practice of doing core tasks unaided, even when a tool could do them faster. The principle is simple: the verification muscle only stays strong if you use it. Schedule regular no-AI exercises in your lab: read a function and trace data flow manually, write a PoC from scratch, decode a protocol by hand, or explain a concept without looking it up. Track what felt hard — difficulty is a signal of decay, and improving over weeks is a sign of recovery. A good output is a maintenance plan with one or two focus areas per month and a short record of each session. This is not nostalgia for pre-AI work; it is the practical foundation of reliable augmentation. The stronger your unaided fundamentals, the more value you extract from AI and the less likely you are to be fooled by it. Protect the base so the multiplier has something to multiply.

### Method
Maintenance plan:

```text
Monthly focus: one fundamentals area (e.g., HTTP semantics, binary basics).
Weekly exercise: 45 minutes unaided in a local lab.
Record: task, difficulty (1-5), what I relearned, errors made.
Re-test the same exercise after four weeks.
```

Self-test prompts (to answer before looking anything up):

```text
Explain the same-origin policy in your own words.
Trace this parameter to a sink without tool assistance.
Describe what a CVSS scope change means, with an example.
```

### Decision table
| Area delegated most | Maintenance exercise |
| --- | --- |
| Code reading | Manual taint trace |
| Protocol knowledge | Explain and diagram unaided |
| Report writing | Draft full report by hand |
| Tooling | Write a small parser from scratch |

### Failure modes
- Assuming past competence persists indefinitely.
- Only practicing what AI makes easy.
- Skipping maintenance when busy — exactly when it matters.
- Treating difficulty as a reason to delegate again.
- Never re-testing to see improvement.

### Verification steps
Complete the scheduled exercise and record the difficulty. Compare with a previous attempt at the same task. Re-read the relevant primary source after attempting, not before. Adjust the focus area based on what decayed most.

### Worked example
You notice you have stopped reading assembly because a model summarized binaries for you. A four-week unaided practice on small binaries you built feels hard at first, then improves. You restore the ability to check the model's decompilation claims, which immediately catches an error in a later session.

### Knowledge check
Q: Why is unaided practice necessary even when AI is available?
A: Because fundamentals are the verification mechanism; if they decay, you lose the ability to detect AI mistakes.

===MODULE===
TITLE: Capstone: An AI-Assisted Mock Engagement
LEVEL: Advanced
MINUTES: 90
SUMMARY: Run a complete mock engagement in an owned lab with AI assistance, producing a scoped plan, verified findings, and honest reports.
OBJECTIVES: apply the full augmented workflow | produce a complete deliverable set | demonstrate verification and honesty
TAKEAWAYS: the workflow matters more than any single tool | every claim must be verified | the final deliverable reflects disciplined judgment
PRACTICE: Using a lab environment you own, run a time-boxed mock engagement and deliver a scope map, prioritized hypotheses, two verified findings with minimal PoCs, and an evaluation summary.
SOURCES: None
---
## Core idea
The capstone integrates everything: mindset, workspace, reconnaissance, code and protocol analysis, lab-only exploitation exercises, reporting, and agentic guardrails. You work in an environment you own, with a defined scope you wrote yourself, and you use AI where it adds leverage while keeping verification human. The deliverables mirror a real engagement: a scope and rules map, a prioritized set of hypotheses grounded in observations, verified findings with minimal PoCs and honest impact statements, and an evaluation summary showing where AI helped and where it failed. This is the moment to be brutally honest. Note every hallucinated claim you caught, every false positive you discarded, and every decision you made without AI. The goal is not to collect findings for their own sake but to demonstrate a repeatable, defensible process. A good output is a package a peer could audit: notes with provenance, prompts with versions, evidence with timestamps, and a scorecard. If you cannot trace a claim to evidence, it does not belong. Completing this capstone shows that you can use AI as a genuine force multiplier while remaining accountable for every word you submit.

### Method
Engagement plan:

```text
1. Write scope and rules for a lab I own; note AI policy and data boundaries.
2. Recon: collect DNS, schema, and bundle data; summarize with AI; verify.
3. Hypotheses: generate, rank, and design disconfirming tests.
4. Analysis: code and protocol review with citations; verify each hop.
5. Lab exploitation: confirm findings, build minimal PoCs, replay 5 times.
6. Reports: structure, impact, CVSS, voice review, hallucination gate.
7. Eval summary: metrics, AI wins and failures, skill-maintenance notes.
```

Deliverable checklist:

```text
[ ] Scope map with source quotes
[ ] Prioritized hypotheses with verification status
[ ] Two verified findings with minimal PoCs and honest impact
[ ] Notes with provenance and prompt IDs
[ ] Evaluation scorecard and privacy audit
```

### Decision table
| Deliverable | Pass criterion |
| --- | --- |
| Scope map | Every rule quoted from source |
| Hypotheses | Falsifiable and evidence-linked |
| Findings | Reproduced from clean state |
| PoCs | Minimal and stable |
| Reports | No unsupported claims |
| Eval summary | Honest wins and failures recorded |

### Failure modes
- Reporting findings you did not personally reproduce.
- Inflating impact with generated claims.
- Letting automation act outside the declared scope.
- Omitting the evaluation summary because it is uncomfortable.
- Treating the capstone as a speed contest.

### Verification steps
Audit each deliverable against its pass criterion. Replay every PoC from a clean state. Strike any claim without a source. Confirm the privacy audit found no sensitive data in hosted tools. Present the package as a process artifact, not a trophy case.

### Worked example
Your capstone produced two verified findings from twelve hypotheses. Three generated impacts were deleted as unsupported, and one automated step was blocked by a guardrail for pointing outside scope. The evaluation summary recorded these honestly, demonstrating disciplined judgment rather than mere output volume — the real mark of an augmented hunter.

### Knowledge check
Q: What does the capstone primarily assess?
A: A repeatable, verifiable, honest workflow — not the raw number of findings — proving you can use AI while remaining accountable.
