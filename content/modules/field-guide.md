===MODULE===
TITLE: What Bug Bounty Actually Is
LEVEL: Beginner
MINUTES: 30
SUMMARY: The honest shape of a bug bounty program: permission, scope, policy, triage, and reward — and why it is not a hunt for "any bug anywhere."
OBJECTIVES: define a bounty program | distinguish valid from merely interesting | describe the reporting lifecycle
TAKEAWAYS: permission precedes testing | scope is a contract | value is judged by the organization
PRACTICE: In your own lab, pick a deliberately vulnerable app and write a one-page "program policy" for it: assets, prohibited tests, reporting channel, and expected response time.
SOURCES: HackerOne learn to hack|https://www.hackerone.com/hackers/how-to-start-hacking ; Snyk 7 tips|https://dev.to/snyk/7-tips-to-become-a-successful-bug-bounty-hunter-529e ; PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community
---
## Core idea
Bug bounty is a formal arrangement: an organization names assets, publishes rules, and invites independent researchers to report flaws in those assets only. HackerOne's "Learn to Hack" guidance treats it as a partnership governed by a policy, not a licence to probe the internet. Snyk's tips add the reality check: public programs are saturated with experienced hunters, so early efforts often yield more learning than rewards. PortSwigger community members repeatedly stress that the goal is understanding a system well enough to find something its owners did not anticipate — not collecting payloads.

Worked decision table for where to spend your first hours:

| Arena | Permission | Best use |
| --- | --- | --- |
| Your own lab / deliberately vulnerable app | Full | Learning mechanics, reproducing writeups |
| VDP | Disclosure allowed, reward not promised | Building methodology, first reports |
| Public bounty | Explicit scope + reward | Testing maturity, competing with veterans |

## Concrete practice
Before touching any target, copy its policy into a notes file with four headings: in-scope assets, out-of-scope assets, prohibited techniques, reporting channel. Write one sentence explaining what a *valid* report would mean to that organization. In your lab, practice the same exercise on an app you own.

## Common mistakes
Treating "publicly reachable" as "in scope"; assuming every technical flaw is reportable; spending a week on an asset the policy excludes; measuring progress by rejections rather than by what you learned.

## Where practitioners disagree
@Troll_13 in the PortSwigger community recommends going for something easy you understand and celebrating a small first result; @sh1yo_ suggests an older private program with smaller rewards; Snyk recommends starting with a VDP. All three are strategies for the same problem: low odds on crowded public programs.

## Knowledge check
Q: A subdomain is reachable and vulnerable-looking but absent from the policy. Test it? A: No. Out of scope is out of scope; ask the program first, and use your lab for practice instead.
===MODULE===
TITLE: VDP vs Bounty: Choosing Your First Arena
LEVEL: Beginner
MINUTES: 30
SUMMARY: Why Snyk recommends a Vulnerability Disclosure Program before a paid bounty, and how to decide which arena fits your current skill level.
OBJECTIVES: compare VDP and bounty goals | pick a first arena | set a learning objective
TAKEAWAYS: VDPs reward method building | public bounties are crowded | permission differs by program
PRACTICE: Using a lab app you own, draft a mock VDP submission for a flaw you found, then rewrite it as a bounty report with exploitability and impact sections.
SOURCES: Snyk 7 tips|https://dev.to/snyk/7-tips-to-become-a-successful-bug-bounty-hunter-529e ; PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community ; HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work
---
## Core idea
Snyk's explicit personal recommendation is to start with a VDP before a public bounty. Its reasoning: experienced hunters already work the public programs, so a beginner's valid findings and first-report odds are better where the organization's goal is disclosure rather than competition. A VDP lets you build a methodology, practice reconnaissance, and learn automation without the pressure of a leaderboard. A bounty program adds reward mechanics, triage SLAs, and tougher competition — useful later, when your process is repeatable.

Checklist for choosing:

1. Does the policy authorize the exact asset class you understand (web, API, mobile)?
2. Does it describe a safe reporting channel and response expectations?
3. Can you name one thing you will learn there in four weeks?
4. Will you accept "no reward" or "informative" as a valid outcome?

## Concrete practice
In your own lab, create two folders: `vdp-practice` and `bounty-practice`. Find one low-severity issue, write the short disclosure-style note first, then expand it using HackerOne's three topics — reproduction steps, exploitability, impact — and note what changed.

## Common mistakes
Assuming a VDP is "lesser" because it may not pay; jumping to the most famous program because it looks prestigious; ignoring the response-time expectations in the policy; quitting after the first non-rewarded report.

## Where practitioners disagree
Snyk's learning-first path conflicts with the PortSwigger community's pragmatic advice to pick an older program with smaller rewards, where a quieter target may be easier to understand. Both accept the same premise: choose an arena where deep work is possible.

## Knowledge check
Q: Why does Snyk suggest a VDP first? A: Because saturated public programs make first valid findings unlikely, while a VDP gives room to build methodology and practice reporting.
===MODULE===
TITLE: Expectation Setting for Your First Months
LEVEL: Beginner
MINUTES: 25
SUMMARY: What normal progress looks like — long quiet periods, steep learning curves, and why "bug hunting is a marathon, not a sprint."
OBJECTIVES: set realistic timelines | define progress metrics | avoid early burnout
TAKEAWAYS: silence is normal | count controllable inputs | consistency beats intensity
PRACTICE: Write a 30-day learning log template in your lab notes with hours, asset studied, one new concept, and one submitted mock report.
SOURCES: NahamSec duplicates|https://www.nahamsec.com/posts/why-bug-bounty-hunters-keep-finding-duplicates-and-how-to-stop ; Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners ; Snyk 7 tips|https://dev.to/snyk/7-tips-to-become-a-successful-bug-bounty-hunter-529e
---
## Core idea
Ben Sadeghipour (NahamSec) summarizes the career honestly: "Bug hunting is a marathon, not a sprint." Intigriti's beginners guide warns against switching targets quickly and recommends staying with one target for weeks, ideally up to a month. Snyk calls dry spells normal and advises re-evaluating strategy rather than quitting. Put together, the first months should be measured in understanding, not payouts: how many assets you mapped, how many bug classes you can explain, how many reports you wrote clearly.

Progress ledger example (fill weekly, for an authorized target only):

| Week | Hours | Asset studied | New concept | Report outcome |
| --- | --- | --- | --- | --- |
| 1 | 4 | Login + reset flow | Parameter inventory | Draft only |
| 2 | 5 | Password reset | Token handling | Mock submitted in lab |

## Concrete practice
Create a spreadsheet with columns like the table above. For the next four weeks, log only what you control — hours, pages understood, classes studied — and one sentence on what you still cannot explain. Review the sheet, not your inbox, to judge progress.

## Common mistakes
Using "zero submissions" as proof of failure; hunting twelve-hour days then stopping for a month; comparing your month one to someone's year five; chasing a target because it trended this week.

## Where practitioners disagree
Some hunters chase quick, easy wins to build confidence; Snyk and NahamSec emphasize slow accumulation of expertise. They are reconciled by arena choice: quick wins suit a quiet VDP or lab, while deep accumulation is required on crowded programs.

## Knowledge check
Q: Which is a better monthly goal: "find three bugs" or "spend twelve hours on one in-scope program and study two new classes"? A: The latter — Intigriti calls these controllable goals because effort, not discovery, is under your control.
===MODULE===
TITLE: Authorization, Scope, and Rules of Engagement
LEVEL: Beginner
MINUTES: 35
SUMMARY: How to read a policy as a binding boundary — assets, techniques, data handling, and what to do when the policy is ambiguous.
OBJECTIVES: parse a program policy | build a scope map | resolve ambiguity safely
TAKEAWAYS: no scope, no test | ask before assuming | document every permission
PRACTICE: Build a color-coded scope map for a lab app you own, marking allowed, excluded, and uncertain areas with a written rule for each.
SOURCES: HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work ; Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners ; HackerOne learn to hack|https://www.hackerone.com/hackers/how-to-start-hacking
---
## Core idea
HackerOne's report guide says to check the program rules page and scope *first*; if there is no scope, ask before spending a week on an out-of-scope asset. That single habit prevents most beginner disasters. A policy typically defines four boundaries: which hosts and applications are in scope, which techniques are prohibited (for example aggressive scanning or social engineering), how discovered data must be handled, and how to submit. Intigriti adds that matching your assets to your skills matters — recon hunters fit wildcard scopes, web/API hunters fit programs listing those assets.

Scope map template:

| Asset | In scope? | Technique limits | Evidence rule | Decision |
| --- | --- | --- | --- | --- |
| `app.example.test` | Yes | Manual only | Screenshots, no data export | Test |
| `legacy.example.test` | Unclear | — | — | Ask program |

## Concrete practice
Take an app you own, write a policy for it, then deliberately write one ambiguous entry. Practice the safe response: stop, record the ambiguity, and send a short clarification request. Never "resolve" ambiguity by testing.

## Common mistakes
Treating a wildcard as permission to test every related service; ignoring prohibitions on automated traffic; assuming a staging host inherits production permission; forgetting that third-party services inside a page are usually out of scope.

## Where practitioners disagree
Hunters debate how aggressively to interpret wildcard scopes. The conservative reading — explicit host list plus written confirmation — is the one supported by HackerOne's guidance and keeps you safe when policies are silent.

## Knowledge check
Q: The policy has no scope section at all. What next? A: Ask the program before investing time; do equivalent practice in your own lab meanwhile.
===MODULE===
TITLE: Valid, Duplicated, Informative: What Counts
LEVEL: Beginner
MINUTES: 30
SUMMARY: A practical taxonomy of report outcomes and what each one teaches you about impact, evidence, and timing.
OBJECTIVES: interpret outcome labels | distinguish duplicate from invalid | extract learning from each
TAKEAWAYS: duplicate means someone reported first | informative means impact unproven | timing matters
PRACTICE: Write three mock report cards in your lab: one valid, one duplicate, one informative, and justify each classification in one sentence.
SOURCES: HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work ; HackerOne triage|https://www.hackerone.com/blog/view-other-side-security-analysts-perspective-bug-bounty-triage ; Bugcrowd duplicates|https://www.bugcrowd.com/blog/the-three-principles-of-bug-bounty-duplicates/
---
## Core idea
HackerOne's triage analyst Shreya Pohekar explains that every report on a managed program is first reviewed by triage, which filters Informative, Duplicate, and Not Applicable before the program team sees it. A *duplicate* means someone reported the same underlying issue first — not that your work was worthless. *Informative* usually means the technical observation is real but the impact was not demonstrated. *Not applicable* often means out of scope or expected behaviour. Bugcrowd's Grant McCracken adds nuance: a similar-looking finding may still be unique if it needs a separate code change.

Outcome decision table:

| Outcome | Likely reason | Your next move |
| --- | --- | --- |
| Duplicate | Same root issue, earlier report | Study the class, pick a different code path |
| Informative | Impact not shown | Build a stronger, authorized PoC in the lab |
| Not applicable | Out of scope / intended | Re-read policy, adjust target choice |

## Concrete practice
In your lab, reproduce one known issue twice under different pretexts: first as a bare observation, then with a clear impact statement. Write the two report cards and compare which one triage would accept.

## Common mistakes
Reading "duplicate" as "you did everything wrong"; resubmitting the same finding with a different title; treating "informative" as a personal verdict on skill; ignoring the triage analyst's questions.

## Where practitioners disagree
Some hunters treat duplicates as pure bad luck; NahamSec argues they are largely predictable — crowded tools on obvious spots find the same issues within minutes — and are best addressed by deeper product knowledge.

## Knowledge check
Q: Your report closes Duplicate but the earlier report covers a different function. What does Bugcrowd's principle suggest? A: "Similar is not same" — if a separate fix is needed, it may warrant its own report; ask politely with evidence.
===MODULE===
TITLE: The Legal and Ethical Line
LEVEL: Beginner
MINUTES: 30
SUMMARY: The non-negotiable rules: authorized targets only, respect for user data, no persistence, and what to do when you stumble on something sensitive.
OBJECTIVES: state the ethical baseline | handle sensitive data correctly | escalate safely
TAKEAWAYS: authorization first | minimize data access | stop when uncertain
PRACTICE: Write a personal "stop rule" checklist for your lab work, including what triggers an immediate halt and who you would notify.
SOURCES: HackerOne learn to hack|https://www.hackerone.com/hackers/how-to-start-hacking ; HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work ; OWASP MASTG|https://mas.owasp.org/MASTG/
---
## Core idea
Every technique in this track is for an authorized, in-scope target or a lab you own. HackerOne's beginner material and report guide both assume a consensual engagement: the organization invited testing, bounded it, and expects responsible handling of anything found. The ethical baseline has four rules. Test only named assets. Use the minimum data necessary to prove impact. Do not modify or destroy data, add accounts, or maintain access. Stop and report immediately if you encounter real user data, credentials, or signs of an active compromise.

Stop-rule checklist for your own lab:

1. Did I leave the declared scope? Stop.
2. Am I looking at real personal data? Stop, note where, notify the owner.
3. Did a test change state for another user? Stop and revert if authorized.
4. Is a technique prohibited by the policy? Stop before running it.

## Concrete practice
Using a deliberately vulnerable app you own, simulate finding a file of "real" user records. Practice the response: stop the test, record the path and time without copying contents, and write the notification message you would send to the owner.

## Common mistakes
Treating a lab mindset as transferable to the open internet; dumping databases "to prove impact"; installing a shell for convenience; continuing after a policy question arises.

## Where practitioners disagree
Hunters debate how much data access is needed to demonstrate severity. HackerOne's triage analyst advises showing real-world impact without over-collection; OWASP's mobile testing guidance likewise emphasizes controlled, documented testing environments.

## Knowledge check
Q: You find live customer emails while testing an in-scope endpoint. What now? A: Stop accessing them, record the minimal facts needed, and notify the program owner through the reporting channel.
===MODULE===
TITLE: Building a Safe Lab and Basic Workspace
LEVEL: Beginner
MINUTES: 45
SUMMARY: A repeatable, isolated practice environment plus the minimum tooling and note-taking habits needed before any real program.
OBJECTIVES: set up an isolated lab | organize notes and evidence | install core tools safely
TAKEAWAYS: isolate everything | take notes from day one | labs precede programs
PRACTICE: Install a deliberately vulnerable app locally, capture one request in a proxy, and write a lab note with request, observation, and hypothesis.
SOURCES: PortSwigger Academy|https://portswigger.net/web-security ; HackerOne learn to hack|https://www.hackerone.com/hackers/how-to-start-hacking ; PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community
---
## Core idea
James Kettle's first practical advice in the PortSwigger community interview is to get lab experience before joining programs. PortSwigger Web Security Academy and a local deliberately vulnerable app give you a place where every mistake is free. The workspace should have three parts: an isolated environment you own, a proxy tool to inspect requests and responses, and a notes system that records what you observed versus what you guessed.

Minimum viable lab setup:

| Component | Purpose | Safety rule |
| --- | --- | --- |
| Local vulnerable app | Safe repetition | Never expose it publicly |
| Intercepting proxy | See and modify traffic | Scope it to localhost only |
| Notes file per session | Build a knowledge base | Store no real personal data |

## Concrete practice
Start the app, open a form, and capture the request. Write a four-line note: endpoint, parameters, one observation, one hypothesis to test next time. Repeat for three different features so the habit sticks.

## Common mistakes
Pointing tools at the internet while learning; installing dozens of extensions before understanding HTTP; skipping notes and losing the thread between sessions; treating a tool's output as proof without reading the response.

## Where practitioners disagree
Some say learn tooling first; @atul_hax argues that understanding *how things work* matters more than running tools and one-liners. The compromise: learn just enough tooling to observe accurately, then spend the saved time reading the application.

## Knowledge check
Q: Why keep separate lab notes for observation and hypothesis? A: It prevents you from reporting a guess as a finding and makes it easy to revisit untested ideas later.
===MODULE===
TITLE: Choosing Programs: The Power-User Advantage
LEVEL: Intermediate
MINUTES: 40
SUMMARY: NahamSec's core program-selection advice: hunt products you already use deeply, because deep product knowledge beats generic tooling.
OBJECTIVES: inventory your own product experience | shortlist matching programs | plan a knowledge-first start
TAKEAWAYS: use what you know | understand every dashboard option | familiarity is a moat
PRACTICE: Write a "power-user map" for one product you use weekly, listing roles, features, and data flows you could explain without looking.
SOURCES: NahamSec duplicates|https://www.nahamsec.com/posts/why-bug-bounty-hunters-keep-finding-duplicates-and-how-to-stop ; Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners
---
## Core idea
Ben Sadeghipour (NahamSec) says the most consistent hunters focus on products they are already power users of. His example: if you hunt an accommodation platform, understand hosting end to end — listings, automation, payments, and every dashboard option. Hundreds of hunters run the same tools on the same obvious spots and find the same issues within minutes; the differentiator is knowing behaviour that a scanner cannot infer.

Power-user map template for an authorized target:

| Role | Feature | Data it touches | What happens on change |
| --- | --- | --- | --- |
| Owner | Listing edit | Address, price | Updates public view + cache |
| Guest | Booking | Payment token | Triggers confirmation flow |

## Concrete practice
Pick one product you genuinely use. List its user roles, then walk one workflow in your head and write ten questions about it: who can see what, which state changes are asynchronous, which fields are trusted from the client. These questions become your first test hypotheses on an in-scope version of that product, or in a lab clone.

## Common mistakes
Choosing a program purely by reward size; hunting a product you have never opened; skipping the "boring" settings pages where role logic lives; assuming familiarity means you can skip reading the policy.

## Where practitioners disagree
Some hunters prioritize programs with broad scope; NahamSec prioritizes depth of product knowledge even on a smaller scope. Intigriti adds a third factor: the asset types must match your skills.

## Knowledge check
Q: Why is being a power user an advantage against duplicate-heavy hunting? A: Because you can reason about intended behaviour and unusual states that generic tools and casual testers never exercise.
===MODULE===
TITLE: Matching Targets to Your Current Skills
LEVEL: Beginner
MINUTES: 30
SUMMARY: Intigriti's advice to align program asset types with what you can actually test — web, API, mobile, desktop, or recon-heavy wildcard scopes.
OBJECTIVES: inventory your skills | read asset lists | choose a fitting target
TAKEAWAYS: fit beats ambition | asset type decides method | grow into new stacks
PRACTICE: Make a two-column skill-to-asset table for three programs and mark the one you could meaningfully test on day one.
SOURCES: Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners ; Snyk 7 tips|https://dev.to/snyk/7-tips-to-become-a-successful-bug-bounty-hunter-529e ; PortSwigger Academy|https://portswigger.net/web-security
---
## Core idea
Intigriti's beginner guide is explicit: web and API skills fit programs listing web/API assets; recon skills fit wildcard scopes; mobile and desktop skills fit programs that provide apps. Snyk's "find your niche" advice complements it — choose a vulnerability class or tech stack you genuinely like, and accept that you will be weaker elsewhere. A good match means you can explain the asset's architecture before you start, which makes every observation more meaningful.

Skill-to-asset decision table:

| Your current strength | Program asset to seek | First exercise |
| --- | --- | --- |
| HTTP forms, cookies | Web app with login | Map auth flow in proxy |
| API calls, JSON | Documented API scope | Inventory endpoints and auth headers |
| Mobile reverse basics | Program supplying an APK/IPA | OWASP MASTG checklist in your lab |

## Concrete practice
Write three rows like the table above for programs you are considering. In the last column, describe one action you can perform *today* without new tooling. Pick the row where that action is most concrete.

## Common mistakes
Joining a mobile-only program without a device or emulator; taking a wildcard scope as a reason to scan everything; choosing by program age rather than asset fit; ignoring that "API" may mean a completely different architecture than your lab.

## Where practitioners disagree
Snyk suggests deliberately going outside your comfort zone and pivoting when bored; Intigriti warns against target-hopping. Both can be true if you keep a stable primary target and use lab time for the new skill.

## Knowledge check
Q: You know HTTP well but have never reversed an app. Which program fits today? A: One with explicit web/API assets; study mobile with OWASP MASTG in your own lab first.
===MODULE===
TITLE: Reading a Program Page Like a Contract
LEVEL: Intermediate
MINUTES: 35
SUMMARY: A line-by-line method for program pages: scope, exclusions, safe harbour, data handling, SLAs, and disclosure terms.
OBJECTIVES: extract binding rules | spot hidden constraints | write a scope brief
TAKEAWAYS: read before testing | exclusions outrank curiosity | document interpretations
PRACTICE: Produce a one-page program brief for a lab program you write yourself, including a safe-harbour clause and an exclusion list.
SOURCES: HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work ; HackerOne triage|https://www.hackerone.com/blog/view-other-side-security-analysts-perspective-bug-bounty-triage ; Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners
---
## Core idea
HackerOne's Adam Bacchus advises checking the rules page and scope before doing any work, and checking response expectations so you do not ping daily. Treat the program page as a contract with seven clauses: in-scope assets, out-of-scope assets, prohibited techniques, safe harbour language, data handling rules, submission format, and response SLA. Rewrite each clause in plain language in your own brief; where the page is silent, mark "unknown — ask," not "allowed."

Program brief skeleton:

| Clause | Program wording | My plain-language reading | Status |
| --- | --- | --- | --- |
| Scope | `*.example.test` | Named hosts only | Confirmed |
| Techniques | "No automated scanning" | Manual requests only | Confirmed |
| SLA | "First response up to X days" | Do not chase weekly | Confirmed |

## Concrete practice
Draft a mock program page for your lab app with one deliberately vague clause. Write the brief, flag the vagueness, and compose the clarification question you would send. Never fill ambiguity with assumptions.

## Common mistakes
Reading only the reward table; ignoring "out of scope" footnotes; assuming safe harbour covers prohibited techniques; skipping the disclosure terms until after a report closes.

## Where practitioners disagree
Hunters argue about how literally to read "any subdomain" language. HackerOne's guidance favours asking first; the conservative interpretation is the only one that keeps you authorized.

## Knowledge check
Q: The page gives no timeline for responses. How should you behave? A: Do not ping repeatedly; follow general etiquette, allow a reasonable gap (roughly two weeks), and use the program's official channels.
===MODULE===
TITLE: Program Scoring: Saturation, Scope, and Response
LEVEL: Intermediate
MINUTES: 40
SUMMARY: A repeatable scoring rubric for deciding which authorized program deserves your next month, balancing crowding, breadth, and triage quality.
OBJECTIVES: score programs consistently | weigh saturation | avoid hype-driven choices
TAKEAWAYS: crowded programs breed dupes | response quality matters | choose for learning
PRACTICE: Score three lab-crafted program profiles with your rubric and justify the winner in a paragraph.
SOURCES: NahamSec duplicates|https://www.nahamsec.com/posts/why-bug-bounty-hunters-keep-finding-duplicates-and-how-to-stop ; PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community ; Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners
---
## Core idea
NahamSec describes the duplicates trap: popular public programs are worked by hundreds of hunters using the same tools, so obvious issues are gone within hours or minutes. PortSwigger's community offers a counter-signal: @sh1yo_ suggests an older private program with smaller rewards, and James Kettle notes that lower payouts often mean a softer target. Score programs on factors you can observe without guessing.

Scoring rubric (1–5 each):

| Factor | Question |
| --- | --- |
| Saturation | Is this program famous, or quiet and older? |
| Asset fit | Does it list what I already understand? |
| Scope clarity | Are exclusions and safe harbour explicit? |
| Response quality | Does triage engage with detail? |
| Learning value | Will I understand more in a month? |

## Concrete practice
Create three fictional program profiles in your notes — one famous web program, one quiet older program, one VDP. Score each across the five factors, total them, and write one paragraph explaining why the winner fits *your* skills, not the theoretical best target.

## Common mistakes
Weighting reward size above everything; choosing by social-media chatter; ignoring that your own knowledge is part of the score; re-scoring every time a new program launches.

## Where practitioners disagree
Some hunters deliberately target the newest programs to catch easy bugs before crowds arrive; others prefer old quiet programs. Both are bets on low competition; the rubric forces you to state which bet you are making and why.

## Knowledge check
Q: A famous program has a huge scope and instant duplicates; a quiet program matches your stack. Which scores better for a beginner? A: Usually the quiet, well-matched one — depth beats crowd competition.
===MODULE===
TITLE: Your First Week on a Program: A No-Payload Plan
LEVEL: Beginner
MINUTES: 35
SUMMARY: A concrete first-seven-days plan that builds understanding before any offensive action, all within declared scope and policy.
OBJECTIVES: plan a week of reading | map features | produce hypotheses
TAKEAWAYS: read first | map before testing | finish the week with questions
PRACTICE: Run the seven-day plan against a deliberately vulnerable app you own, producing a feature map and ten testable hypotheses.
SOURCES: Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners ; HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work ; PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community
---
## Core idea
Intigriti recommends persistent time on one target because it builds target knowledge; the first week should therefore be mostly observation. HackerOne's advice to know the audience means reading the policy and rules before spending effort. The goal of week one is not a finding — it is a map you can reason from.

Seven-day plan (authorized target or your own lab):

| Day | Activity | Output |
| --- | --- | --- |
| 1 | Read policy, write scope brief | One-page brief |
| 2–3 | Walk every user-visible feature | Feature inventory |
| 4 | Record requests/responses in proxy | Parameter and endpoint list |
| 5 | Read docs, RFCs, error messages | "How it works" notes |
| 6 | List unusual states and roles | Ten hypotheses |
| 7 | Review and prioritize hypotheses | Ranked test queue |

## Concrete practice
Execute the plan on your lab app. For each hypothesis, write the expected behaviour and the observation that would disprove it. This turns vague curiosity into a checklist you can revisit.

## Common mistakes
Starting with payload lists; skipping the read-only days; touching assets outside the brief; treating a quiet week as wasted time rather than accumulated context.

## Where practitioners disagree
PortSwigger's @Troll_13 favours quick, understandable wins, which can look like skipping straight to testing. That is fine in a lab; on a real program, the week-one reading habit protects scope and reduces duplicates.

## Knowledge check
Q: What is the intended output of week one? A: A scope brief, feature map, and ranked hypotheses — not necessarily a submitted report.
===MODULE===
TITLE: Deep Product Onboarding: Roles, Workflows, State
LEVEL: Intermediate
MINUTES: 40
SUMMARY: A structured way to learn an application so thoroughly that unusual states and role boundaries become obvious test ideas.
OBJECTIVES: enumerate roles | trace state transitions | find trust boundaries
TAKEAWAYS: list roles before requests | state changes are where logic breaks | document assumptions
PRACTICE: On a lab app you own, draw a state diagram for password reset including expired, reused, and cross-user tokens.
SOURCES: NahamSec duplicates|https://www.nahamsec.com/posts/why-bug-bounty-hunters-keep-finding-duplicates-and-how-to-stop ; PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community
---
## Core idea
Ben Sadeghipour's power-user advice is about depth, not speed. Before testing, write down every role, every workflow, and every state transition you can observe on an authorized target or lab. Logic flaws live in the gaps between these states: a token that works after use, a step skipped by direct navigation, a role boundary enforced only in the browser.

Onboarding table for your notes:

| Element | What to record | Example question |
| --- | --- | --- |
| Roles | Who can see and change what | Can a viewer reach an admin action? |
| Workflows | Ordered steps and alternates | Can step 3 be called before step 2? |
| State | What changes after each step | Is a reset token invalidated after use? |
| Trust | Which values come from the client | Is a role or price accepted from the request? |

## Concrete practice
Pick one multi-step flow in your lab app — password reset, checkout, or invite. Draw boxes for each state and arrows for transitions. For each arrow, write one question beginning "What if this happens twice / out of order / by a different user?" These become hypotheses, not attacks.

## Common mistakes
Only browsing the happy path; trusting the UI to enforce authorization; skipping secondary roles such as "pending" or "suspended"; treating onboarding as a one-time task instead of updating it as you learn.

## Where practitioners disagree
Some hunters prefer to start from the request log and work backwards; @atul_hax argues for understanding how things work first. His approach makes the request log a confirmation tool rather than the source of ideas.

## Knowledge check
Q: Why enumerate roles before testing? A: Because authorization logic and state transitions are where deep product knowledge turns into hypotheses that scanners cannot generate.
===MODULE===
TITLE: From Program Choice to a Hypothesis Backlog
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Turning program research into an ordered queue of testable ideas you can work through across weeks instead of improvising each session.
OBJECTIVES: convert notes to hypotheses | rank by value | maintain a living backlog
TAKEAWAYS: one hypothesis per row | rank by impact and novelty | revisit unanswered ideas
PRACTICE: Create a 15-row hypothesis backlog for a lab app with columns for feature, expected behaviour, disproof, and status.
SOURCES: Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners ; PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community
---
## Core idea
Intigriti's advice to stay on a target for weeks only works if you have a queue to return to. A hypothesis backlog converts vague interest into a work list: each row names a feature, a belief about how it should behave, the observation that would disprove it, and a status. Rank rows by two factors — potential impact and how little others are likely to test it. This is the practical bridge between choosing a program and the focus loop.

Backlog example (lab app):

| Feature | Hypothesis | Disproof | Rank |
| --- | --- | --- | --- |
| Invite flow | Token may survive acceptance | Using it twice is rejected | High |
| Search | Filters may be client-only | Server omits hidden fields | Medium |
| Avatar upload | Type checks may be by filename | Server rejects mismatched type | Medium |

## Concrete practice
Write fifteen rows like the example for your own lab app. Status values: `untested`, `disproved`, `needs evidence`, `converted to report`. End each session by updating exactly one status — this keeps momentum across days.

## Common mistakes
Writing payloads instead of hypotheses; ranking purely by "coolness"; never marking rows disproved, so the queue never shrinks; losing the queue when a target changes.

## Where practitioners disagree
@Troll_13's easy-first approach would prioritize the simplest rows; NahamSec prioritizes rows that benefit from product knowledge. Use easy rows to warm up, deep rows for the main session.

## Knowledge check
Q: What belongs in a hypothesis row besides the feature? A: An expected behaviour, the observation that would disprove it, and a status — so you can resume work without re-deriving context.
===MODULE===
TITLE: The Focus Loop: One Bug Class at a Time
LEVEL: Intermediate
MINUTES: 40
SUMMARY: PortSwigger community member @0x1ntegral's repeatable loop: choose one class, read about it, hunt it on one target, then switch classes.
OBJECTIVES: run a class-focused cycle | avoid random testing | know when to rotate
TAKEAWAYS: depth per class | writeups feed the search | rotation is deliberate
PRACTICE: On your lab app, run one complete class-focused loop on access control and document each of its four steps.
SOURCES: PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community ; NahamSec duplicates|https://www.nahamsec.com/posts/why-bug-bounty-hunters-keep-finding-duplicates-and-how-to-stop
---
## Core idea
In PortSwigger's community tips, @0x1ntegral describes a simple but powerful loop: focus on ONE vulnerability type, read writeups about it, search for that class on your target, and when you find one, switch to the next class and repeat. The value is concentration — for a week your brain has one pattern to recognize, so subtle variants become visible. Ben Sadeghipour's warning about duplicates reinforces it: broad, shallow sweeps hit only what everyone else hits.

The four-step loop:

| Step | Action | Exit condition |
| --- | --- | --- |
| 1 | Pick one class (e.g., IDOR) | You can explain its root cause |
| 2 | Read three writeups | You can list their variants |
| 3 | Search one authorized target | You find and document a case, or exhaust hypotheses |
| 4 | Rotate to the next class | Notes and evidence saved |

## Concrete practice
Choose access control in your lab. Read three writeups, list their variants, then walk your lab's object references with a second role's context. Record what you tried even if nothing was found; the record prevents repeating the same sweep next month.

## Common mistakes
Rotating classes mid-session; collecting writeups without extracting variants; hunting a class you cannot explain; treating "no finding" as a reason to abandon the class entirely.

## Where practitioners disagree
Some hunters run several classes at once to maximize coverage; @0x1ntegral and NahamSec both argue for depth first. Coverage is what automated tools are for; reasoning is what the human loop is for.

## Knowledge check
Q: When should you rotate to the next class in @0x1ntegral's loop? A: After you have found an instance of the class or exhausted your written hypotheses on that target — not when you get bored.
===MODULE===
TITLE: Vulnerability Expert, Not Payload Collector
LEVEL: Intermediate
MINUTES: 40
SUMMARY: NahamSec's distinction between memorizing payloads and understanding a vulnerability class from input validation through hidden APIs.
OBJECTIVES: explain root cause | trace a class across layers | build variant lists
TAKEAWAYS: payloads are outputs of understanding | trace where input is trusted | labs are for why, not what
PRACTICE: Using PortSwigger Academy labs, reproduce one XSS class and write a page explaining why each payload works.
SOURCES: NahamSec duplicates|https://www.nahamsec.com/posts/why-bug-bounty-hunters-keep-finding-duplicates-and-how-to-stop ; PortSwigger Academy|https://portswigger.net/web-security
---
## Core idea
Ben Sadeghipour argues that the differentiator is becoming a vulnerability expert. For XSS, that means understanding input validation, devtools tracking, DOM sinks, and postMessage behaviour — not saving a list of strings. For IDOR, it means following the evolution from integer IDs to UUIDs, then to headers, cookies, organization structure, and hidden backend APIs. A payload is the last five percent of the work.

Expertise ladder example:

| Level | XSS question you can answer |
| --- | --- |
| Collector | Which string pops an alert? |
| Practitioner | Where does the value enter and render? |
| Expert | Which sanitizer, context, and sink interact, and why does this bypass them? |

## Concrete practice
Open a PortSwigger Academy lab on DOM XSS. Before using any payload, write the source, the sink, and the transformation between them. Then test one payload and explain each character's role. If you cannot explain it, reproduce the writeup from scratch in your lab.

## Common mistakes
Copy-pasting payloads from writeups without reproducing the setup; equating an alert box with demonstrated impact; memorizing bypasses for a version you cannot identify; skipping the server-side half of a client-side bug.

## Where practitioners disagree
Some hunters defend payload lists as efficient; NahamSec calls them a trap because the same list is used by everyone, and because understanding is what finds unique bugs. Use lists as prompts to study mechanisms, not as scripts.

## Knowledge check
Q: You got a DOM XSS alert from a copied payload. What must you still do? A: Identify the source, sink, and transformation, and explain why the payload works — then demonstrate real-world impact in an authorized context.
===MODULE===
TITLE: Finding Your Niche
LEVEL: Beginner
MINUTES: 30
SUMMARY: Snyk's advice to pick a vulnerability class or tech stack you genuinely like, and to keep learning as presentations evolve.
OBJECTIVES: choose a sustainable niche | accept trade-offs | refresh knowledge
TAKEAWAYS: genuine interest sustains depth | root causes repeat | niches can change
PRACTICE: Write a niche charter: one class, one stack, three resources, and a 30-day study cadence.
SOURCES: Snyk 7 tips|https://dev.to/snyk/7-tips-to-become-a-successful-bug-bounty-hunter-529e ; NahamSec duplicates|https://www.nahamsec.com/posts/why-bug-bounty-hunters-keep-finding-duplicates-and-how-to-stop
---
## Core idea
Snyk advises finding a niche — a vulnerability class or technology you genuinely like. Its author likes XSS, SSRF, and IDOR and deliberately avoids .NET applications. The point is not to narrow forever; it is to give your study a centre of gravity. Snyk also says never to stop learning: root causes repeat, but their presentation changes as frameworks and defenses evolve.

Niche charter template:

| Field | Entry |
| --- | --- |
| Class | Server-side request forgery |
| Stack | Node/Express apps the author can read |
| Study cadence | One writeup + one lab each week |
| Adjacent class | Open redirect (learn next quarter) |

## Concrete practice
Fill the charter for yourself, choosing a class you are curious about rather than one that looks lucrative. Schedule four weekly study blocks and one lab reproduction. After 30 days, write what changed in your understanding of that class.

## Common mistakes
Choosing a niche by perceived payout; switching niches before the first study block ends; treating "I like this class" as permission to ignore impact framing; never adding an adjacent class.

## Where practitioners disagree
Snyk also recommends going outside your comfort zone and pivoting when bored, which sits uneasily with "stay in your niche." Resolve it by keeping a stable main niche while using lab time for exploration.

## Knowledge check
Q: Why does Snyk say root causes repeat even as technology changes? A: Because the same trust mistakes recur in new frameworks; studying the mechanism transfers, memorizing one presentation does not.
===MODULE===
TITLE: Reading Writeups Actively and Reproducing Them
LEVEL: Intermediate
MINUTES: 45
SUMMARY: A method for extracting mechanisms from writeups instead of skimming for payloads, with a reproduction checklist for your own lab.
OBJECTIVES: deconstruct a writeup | reproduce in a lab | extract reusable patterns
TAKEAWAYS: rewrite the story as steps | reproduce before generalizing | record what failed
PRACTICE: Pick one public writeup, reproduce its core idea in a local lab app, and write a "what I had to change" note.
SOURCES: NahamSec duplicates|https://www.nahamsec.com/posts/why-bug-bounty-hunters-keep-finding-duplicates-and-how-to-stop ; PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community
---
## Core idea
Ben Sadeghipour advises reproducing writeups in your own lab and understanding why a payload works rather than copying it. PortSwigger's community stories make the same point indirectly: community members describe finding first bugs after understanding an application's design, not after downloading a payload list. An active read converts a narrative into a checklist.

Writeup extraction template:

| Question | Your notes |
| --- | --- |
| What was the trust boundary? | Client value accepted as authoritative |
| What was the root cause? | Missing server-side check on role |
| What made it unusual? | Only triggered after state change |
| What would disprove it? | Server rejects the modified value |
| What can I reuse? | Test after every state transition |

## Concrete practice
Choose a writeup, fill the table, then build the smallest lab reproduction you can. Write a short note on every difference between the original and your setup — those differences are where understanding shows up.

## Common mistakes
Reading for the final payload; assuming your target has the same framework; skipping reproduction because the writeup "makes sense"; treating a writeup's impact statement as automatically transferable.

## Where practitioners disagree
Some hunters read many writeups for breadth; NahamSec prefers fewer, reproduced deeply. PortSwigger's @0x1ntegral uses writeups as fuel for a single-class focus loop — reading three before searching.

## Knowledge check
Q: What is the main output of an active writeup read? A: A reusable mechanism and disproof condition, verified in a lab — not a saved payload.
===MODULE===
TITLE: Product Knowledge in Practice: Explain It Backwards
LEVEL: Intermediate
MINUTES: 40
SUMMARY: A test of real product depth: can you explain an in-scope system's data flows and trust decisions without looking at your notes?
OBJECTIVES: verify product depth | find knowledge gaps | turn gaps into study tasks
TAKEAWAYS: explanation exposes gaps | flows matter more than features | gaps become hypotheses
PRACTICE: Explain a lab app's authentication and authorization flow out loud from memory, then check your notes and list the gaps.
SOURCES: NahamSec duplicates|https://www.nahamsec.com/posts/why-bug-bounty-hunters-keep-finding-duplicates-and-how-to-stop ; PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community
---
## Core idea
NahamSec's claim that the most consistent hunters are power users of their targets is a testable claim: if you truly know a product, you can explain it backwards. Pick a flow — login, invite, payment — and narrate it from the database outwards: which records exist, which endpoints expose them, which roles can change them, and what the browser is trusted to decide. James Kettle's advice in the PortSwigger community echoes this: do not move on until you understand a complex site inside out.

Explanation scorecard:

| Question | Can I answer without notes? |
| --- | --- |
| Which values does the server trust from the client? | Yes / No |
| What changes after each step of the flow? | Yes / No |
| Which role boundary is enforced where? | Yes / No |
| What does a failed request look like? | Yes / No |

## Concrete practice
On your lab app, record a two-minute explanation of one flow. Replay it against your notes and mark every "No" as a study task. Those tasks are more valuable than another tool run.

## Common mistakes
Confusing familiarity with understanding; relying on memory of the UI rather than observed requests; skipping failure paths; treating scorecard "Yes" answers as permanent.

## Where practitioners disagree
@atul_hax would add RFCs to this list — understanding the protocol behind the feature. Others prioritize hands-on request inspection. Do both: protocol first for why, proxy for what actually happens.

## Knowledge check
Q: What is the purpose of explaining a flow from memory? A: It reveals the specific gaps in your mental model, which then become targeted study and test hypotheses.
===MODULE===
TITLE: One Class, Many Features: Depth Before Breadth
LEVEL: Intermediate
MINUTES: 40
SUMMARY: How to apply a single bug class across an entire application and learn its local variants before widening your scope.
OBJECTIVES: enumerate class surfaces | test variants systematically | build a local pattern catalogue
TAKEAWAYS: one app teaches many variants | patterns beat payloads | depth delays duplicates
PRACTICE: In your lab app, catalog every place an object identifier appears and record how authorization is checked at each.
SOURCES: PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community ; NahamSec duplicates|https://www.nahamsec.com/posts/why-bug-bounty-hunters-keep-finding-duplicates-and-how-to-stop
---
## Core idea
@0x1ntegral's loop says search for one class on your target; Ben Sadeghipour says become an expert in that class. Combine them by cataloguing every surface where the class could appear — endpoints, parameters, headers, file names, websockets — and testing each variant with the same reasoning. On an authorized app, this produces a *local* pattern catalogue: which features trust identifiers, which normalize input, which use helper functions.

Local catalogue example for access control:

| Surface | Identifier form | Check observed | Variant note |
| --- | --- | --- | --- |
| Profile view | Integer | Server-side ownership check | Consistent |
| Export job | UUID | No ownership check on queue | Different path |
| Attachment | File name | Check delegated to storage | Third-party boundary |

## Concrete practice
Pick one class and build a catalogue of ten surfaces in your lab app. For each, note the identifier format and where the authorization decision happens. Rank the surfaces whose checks differ — those are your hypotheses.

## Common mistakes
Testing one endpoint and concluding the class is absent; equating format change (UUID vs integer) with safety; ignoring asynchronous jobs and exports; copying the same payload everywhere.

## Where practitioners disagree
Some hunters prefer to rotate targets quickly to catch fresh bugs; NahamSec and Kettle argue that staying put lets you see unusual paths others skip. Depth-first is slower but less duplicate-prone.

## Knowledge check
Q: Why rank surfaces whose checks *differ*? A: Because inconsistent enforcement is where logic bugs usually live; uniform checks across surfaces are less likely to hide a novel issue.
===MODULE===
TITLE: When to Switch Classes: Exit Criteria
LEVEL: Intermediate
MINUTES: 30
SUMMARY: Concrete criteria for rotating your focus, so you neither burn out on one class nor skim past it too early.
OBJECTIVES: define exit conditions | avoid endless digging | preserve notes
TAKEAWAYS: rotate after evidence or exhaustion | keep a handoff note | rotation is not failure
PRACTICE: Write exit criteria for a lab class you are studying and a handoff note summarizing what remains unanswered.
SOURCES: PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community ; Snyk 7 tips|https://dev.to/snyk/7-tips-to-become-a-successful-bug-bounty-hunter-529e
---
## Core idea
@0x1ntegral's loop ends a class when you find an instance; Intigriti's guidance to stay with a target for weeks supplies the other end — time and accumulated knowledge. Good exit criteria prevent both premature switching and endless grinding. Use three signals: you found and documented an instance; you exhausted your written hypotheses with disproof notes; or a fixed time box ended with a clear handoff note. Snyk's "pivot when bored" is acceptable inside this structure if the pivot is scheduled, not impulsive.

Exit decision table:

| Signal | Action |
| --- | --- |
| Instance found + reported | Rotate; save the variant catalogue |
| All hypotheses disproved | Rotate; keep the disproof list |
| Time box ended with open questions | Rotate with a handoff note, revisit next cycle |
| Boredom after one session | Keep going until the time box ends |

## Concrete practice
Set a two-week time box for one class in your lab. Write the three exit criteria before starting, and finish with a handoff note listing what you tried, what you ruled out, and the first three questions for next time.

## Common mistakes
Switching the moment a session feels hard; never writing down why a hypothesis failed; rotating because a new writeup appeared; losing a month of context with no handoff.

## Where practitioners disagree
Snyk encourages pivoting out of comfort zones; @0x1ntegral emphasizes finishing a class first. Schedule exploration time separately so both advice streams can coexist.

## Knowledge check
Q: Your time box ended with unanswered questions and no finding. What should you do? A: Rotate as planned, but leave a handoff note and disproof list so the next cycle starts from knowledge rather than zero.
===MODULE===
TITLE: Scheduling Your Hunting Time
LEVEL: Beginner
MINUTES: 30
SUMMARY: Intigriti's consistency advice turned into a weekly calendar you can actually keep.
OBJECTIVES: pick a fixed slot | protect it | measure attendance not luck
TAKEAWAYS: an hour a day or a few hours at weekend | persistence builds knowledge | short slots beat sporadic marathons
PRACTICE: Block three one-hour sessions in your calendar for an authorized target or lab and write an agenda for each.
SOURCES: Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners ; Snyk 7 tips|https://dev.to/snyk/7-tips-to-become-a-successful-bug-bounty-hunter-529e
---
## Core idea
Intigriti recommends a fixed slot — an hour a day or a few hours at the weekend — because persistent time on one target builds target knowledge. Snyk's "stay consistent" advice points the same way. The schedule is not about hours logged for their own sake; it is about keeping the mental model warm between sessions so each hour starts where the last one ended.

Weekly template:

| Slot | Focus | Deliverable |
| --- | --- | --- |
| Mon 1h | Read policy + one writeup | Five notes |
| Wed 1h | Reopen hypothesis backlog | One status update |
| Sat 2h | Deep session on one flow | One evidence note |

## Concrete practice
Put these slots in your calendar for the next four weeks. For each, write a single-sentence agenda before it starts and a three-line recap after. If a slot is missed, reschedule — do not double the next one.

## Common mistakes
Waiting for motivation instead of the calendar; long irregular sessions that destroy continuity; blocking every evening and burning out in week two; changing targets between slots.

## Where practitioners disagree
Some hunters prefer intense multi-day bursts; Intigriti explicitly warns against quick target switching and favours steady time. NahamSec's "marathon, not a sprint" supports the steady model.

## Knowledge check
Q: Why is a fixed slot more valuable than the same total hours in random bursts? A: Because continuity preserves target knowledge; each session starts from an existing model instead of rebuilding it.
===MODULE===
TITLE: Controllable Goals, Not Bug Quotas
LEVEL: Beginner
MINUTES: 30
SUMMARY: How Intigriti's "12 hours on program X" and "2 new vuln types this month" goals prevent burnout and measure what you control.
OBJECTIVES: rewrite outcome goals as input goals | track them | review without self-blame
TAKEAWAYS: effort is controllable | discoveries are not | quotas cause burnout
PRACTICE: Convert three vague goals ("find bugs", "get good at XSS", "win a bounty") into measurable input goals for a lab month.
SOURCES: Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners ; Snyk 7 tips|https://dev.to/snyk/7-tips-to-become-a-successful-bug-bounty-hunter-529e
---
## Core idea
Intigriti's example goals are revealing: "12 hours on program X this week" and "2 new vuln types this month," not "find 5 bugs." Discovery depends on target state, timing, and other hunters; effort and study do not. Snyk adds that dry spells are normal and should trigger strategy review, not quitting. Input goals make that review possible because you have data on what you actually did.

Goal conversion table:

| Vague goal | Controllable version | Evidence of completion |
| --- | --- | --- |
| Find bugs | 6 scheduled hours, 10 hypotheses | Calendar + backlog |
| Get good at XSS | 3 labs reproduced, 1 writeup table | Lab notes |
| Get a bounty | Submit 2 complete reports in lab | Report drafts |

## Concrete practice
Write three input goals for the next month using the table. Each must name a number, a target, and an artefact you can point to. Review every Sunday: done, not done, or changed — with a one-line reason.

## Common mistakes
Keeping "find a bug" as the only success condition; setting goals that depend on someone else's reply; increasing the quota after a good week; treating a missed input goal as proof of low ability.

## Where practitioners disagree
Some hunters use bug counts as motivation; Intigriti and Snyk both argue this is demoralizing because discovery is partly luck. Use counts only to describe what happened, never as a target.

## Knowledge check
Q: Which is an input goal: "submit two complete lab reports" or "get two valid reports"? A: The first — submission is under your control; validity is decided by the program.
===MODULE===
TITLE: Surviving the Dry Spell
LEVEL: Beginner
MINUTES: 30
SUMMARY: Snyk's advice for long stretches with no findings: re-evaluate strategy, return to learning, and keep the schedule intact.
OBJECTIVES: diagnose a dry spell | rotate strategy | keep morale steady
TAKEAWAYS: silence is normal | change one variable at a time | learning is progress
PRACTICE: Build a "dry spell decision card" for your lab: five checks to run before deciding whether to change target, class, or technique.
SOURCES: Snyk 7 tips|https://dev.to/snyk/7-tips-to-become-a-successful-bug-bounty-hunter-529e ; Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners ; NahamSec duplicates|https://www.nahamsec.com/posts/why-bug-bounty-hunters-keep-finding-duplicates-and-how-to-stop
---
## Core idea
Snyk says dry spells are normal: stay consistent, re-evaluate your strategy, and do not quit. Ben Sadeghipour's duplicate analysis explains one cause — you may be hunting an obvious surface everyone else already checked. Intigriti's "stay a few weeks" advice explains another: you may be leaving just before the point where deep knowledge pays off. Diagnose before reacting.

Dry spell decision card:

| Check | If failing | Change |
| --- | --- | --- |
| Am I following my schedule? | No | Restore slots before changing target |
| Are hypotheses written? | No | Rebuild backlog, not target |
| Is the class too common here? | Yes | Rotate class, keep target |
| Have I been here 4+ weeks? | No | Stay; depth takes time |
| Am I learning new mechanics? | No | Add labs/writeups |

## Concrete practice
In your lab, write this card and run it against a two-week stretch where you found nothing. Record which single check failed and what one change you made. Avoid changing target, class, and tools in the same week.

## Common mistakes
Blaming luck after one quiet week; switching everything at once; hunting while exhausted; measuring a dry spell by other people's posts.

## Where practitioners disagree
Snyk says pivot when bored; Intigriti says stay on one target for weeks. The card resolves it: pivot the *class* or study focus while keeping the *target*, unless the card says the target itself is the problem.

## Knowledge check
Q: First action in a dry spell according to the card? A: Check whether the schedule and hypothesis backlog still exist — restore process before changing targets.
===MODULE===
TITLE: Taking Breaks Without Losing Momentum
LEVEL: Beginner
MINUTES: 25
SUMMARY: Snyk's reminder that rest improves problem solving, and how to structure a break so returning is easy.
OBJECTIVES: plan a break safely | capture state | return without cold-start
TAKEAWAYS: rest is a tool | handoff notes prevent cold starts | success is addictive
PRACTICE: Write a one-page break handoff for your lab target: current hypothesis, what was ruled out, and the first task on return.
SOURCES: Snyk 7 tips|https://dev.to/snyk/7-tips-to-become-a-successful-bug-bounty-hunter-529e ; Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners
---
## Core idea
Snyk's final tip is to take breaks: success is addictive and rest improves problem solving. A break is not the absence of discipline; unplanned exhaustion is. Because Intigriti's model depends on accumulated target knowledge, the trick is to freeze that knowledge so a week away does not reset you to zero.

Break handoff template:

| Field | Entry |
| --- | --- |
| Target and scope brief | Which assets were authorized |
| Current hypothesis | One sentence |
| Ruled out | Three bullet points |
| Evidence location | Where notes and captures live |
| First task on return | A single, small action |

## Concrete practice
Take a planned three-day break from your lab work. Before stopping, fill the template and leave your notes in a consistent place. On return, perform only the "first task" — do not try to reconstruct the entire project at once.

## Common mistakes
Stopping mid-session without notes; treating a break as failure; returning by re-running everything from scratch; using "rest" as a way to avoid an unpleasant but necessary task.

## Where practitioners disagree
Some hunters push through long streaks to keep momentum; Snyk explicitly warns this degrades problem solving. The compromise is scheduled breaks with a handoff, not random disappearing acts.

## Knowledge check
Q: What makes a break safe for a long-running target? A: A written handoff of scope, hypothesis, ruled-out items, and a first task — so context survives the gap.
===MODULE===
TITLE: Collaboration, Communities, and Mentors
LEVEL: Beginner
MINUTES: 30
SUMMARY: Snyk and NahamSec on learning with others while keeping your own methodology — and how to be a good collaborator.
OBJECTIVES: evaluate communities | find a mentor | collaborate without copying
TAKEAWAYS: choose learning-focused spaces | credit collaborators | your method stays yours
PRACTICE: Write a "collaboration charter" for a lab study pair: what you share, what you keep, and how you credit each other.
SOURCES: Snyk 7 tips|https://dev.to/snyk/7-tips-to-become-a-successful-bug-bounty-hunter-529e ; NahamSec duplicates|https://www.nahamsec.com/posts/why-bug-bounty-hunters-keep-finding-duplicates-and-how-to-stop ; PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community
---
## Core idea
Snyk recommends collaborating and joining communities — Twitter, Discord, local conferences — to observe how others approach the same problem. Ben Sadeghipour is more selective: community is valuable, but prefer learning-focused Discords, find a mentor or become one, and do not make collaboration an excuse to copy someone else's methodology. The PortSwigger community article is itself an example of this: many hunters explain *how they think*, not just what they found. A useful test of any group is whether members explain mechanisms or merely trade strings.

Collaboration charter example:

| Share | Keep personal | Credit rule |
| --- | --- | --- |
| Mechanism notes, disproofs | Target backlog, scoring rubric | Name who explained a concept |
| Lab reproduction steps | Your hypothesis ranking | Link the original writeup |

## Concrete practice
Pair with a study partner on a lab app. Each explains one flow to the other, then both write independent hypothesis lists. Compare only after both are finished; note what each person noticed that the other missed.

## Common mistakes
Joining payload-drop channels; hunting the same target with someone else's exact workflow; sharing unpublished findings before program permission; treating a mentor as an answer service.

## Where practitioners disagree
Snyk is broadly enthusiastic about communities; NahamSec warns about low-quality groups. Test a community by asking "why?" — if answers are mechanisms, stay; if answers are strings, leave.

## Knowledge check
Q: What distinguishes good collaboration from harmful copying? A: Sharing reasoning and mechanisms while keeping your own target method and crediting sources.
===MODULE===
TITLE: Automating the Boring Parts
LEVEL: Beginner
MINUTES: 35
SUMMARY: Snyk's "automate boring tasks" paired with the warning not to let tools replace understanding.
OBJECTIVES: identify repetitive work | script safely | keep understanding central
TAKEAWAYS: automate aliases and notes | never automate beyond scope | tools do not think for you
PRACTICE: Create three aliases or small scripts for lab-only tasks and write one paragraph on what each still requires you to decide.
SOURCES: Snyk 7 tips|https://dev.to/snyk/7-tips-to-become-a-successful-bug-bounty-hunter-529e ; Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners ; PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community
---
## Core idea
Snyk recommends automating boring tasks — aliases, scripts, shortcuts — while never replacing understanding with tools. Intigriti warns that tools can be outdated, miss classes, produce false positives, and are already run by everyone else. @atul_hax goes further: "recon != hacking [automate this]," meaning collection can be automated but interpretation is human work.

Automation suitability table:

| Task | Automate? | Why |
| --- | --- | --- |
| Note template creation | Yes | Pure repetition |
| Scope list formatting | Yes | Deterministic |
| Judging whether behaviour is a bug | No | Requires model of intent |
| Deciding impact for an organization | No | Requires business context |

## Concrete practice
In your lab, write three small helpers: a command alias to start your proxy, a template generator for session notes, and a script that formats your hypothesis backlog. For each, write one sentence on the judgement it does *not* make for you.

## Common mistakes
Automating beyond the declared scope; trusting a tool's "vulnerable" label; never reading the raw response; spending more time configuring scripts than studying the app.

## Where practitioners disagree
Some hunters build large pipelines; Snyk and Intigriti both caution that tooling is a commodity when everyone runs it. Automate your *record-keeping*, not your *thinking*.

## Knowledge check
Q: Which task should stay manual: formatting a scope table or deciding whether a behaviour is a security impact? A: The latter — impact needs context that tools cannot infer.
===MODULE===
TITLE: Recon Is Not Hacking
LEVEL: Intermediate
MINUTES: 40
SUMMARY: @atul_hax's maxim understood properly: enumeration is a map-building phase, not the act of finding bugs, and it should be bounded.
OBJECTIVES: separate discovery from testing | build a map first | respect rate limits
TAKEAWAYS: recon builds context | tools produce lists, not insight | how things work beats one-liners
PRACTICE: On a lab target, produce a passive-only map from public information and your own app behaviour, with zero active probes.
SOURCES: PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community ; Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners
---
## Core idea
In PortSwigger's community tips, @atul_hax says to get intimately familiar with the app and tech stack, focus on *how things work* — reading RFCs rather than running tools and one-liners — and summarizes: "recon != hacking [automate this]." The point is that collecting names of hosts and paths is not the same as understanding a system. Recon produces a map; hacking is the hypothesis-driven work that follows. On real programs, recon must also stay inside declared scope and permitted techniques.

Recon-to-hacking handoff:

| Phase | Output | Human question |
| --- | --- | --- |
| Recon | Host and feature inventory | What is this asset for? |
| Recon | Parameters and roles observed | Who is trusted where? |
| Hacking | Hypothesis with disproof | What happens if that trust is wrong? |

## Concrete practice
Using only information from an app you own and its documentation, write a passive map: assets, features, roles, and data types. Mark every item you cannot explain. Those gaps become the day's study goals — not a target list to probe automatically.

## Common mistakes
Equating a long host list with progress; running enumeration tools before reading the policy; never converting discoveries into hypotheses; treating every discovered path as in scope.

## Where practitioners disagree
Many hunters love fast enumeration; @atul_hax calls for RFC-level understanding first. A middle path: automate the list, then spend the majority of time explaining the list.

## Knowledge check
Q: According to @atul_hax, what should be automated? A: Recon and repetitive collection — not the reasoning about how the application actually works.
===MODULE===
TITLE: Content Discovery: Dorks, Directories, Forgotten Paths
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Community first-bug stories turned into a disciplined, authorized content-discovery workflow and an evidence checklist.
OBJECTIVES: find forgotten surfaces safely | document purpose | avoid noisy scanning
TAKEAWAYS: dorks and brute-force both have roles | old paths need context | discovery is not a finding
PRACTICE: In your lab app, create a list of five forgotten paths from documentation and dork-style searches, and write the purpose of each.
SOURCES: PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community ; Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners
---
## Core idea
PortSwigger's community stories include a first bug found through Google dorks and a stored XSS found after directory brute-force. Those are real paths to a first result, but they only work when the discovered surface is in scope and you understand it. @iagox88's "dusty old corners" hint — old logos and fonts as a clue to forgotten areas — fits the same pattern: find the odd surface, then ask why it exists.

Discovery log for an authorized/lab target:

| Source | Discovery | Purpose hypothesis | In scope? | Next step |
| --- | --- | --- | --- | --- |
| Documentation | `/legacy/admin` | Old admin panel | Yes | Read-only visit |
| Search index | Public PDF with API host | Partner integration | Unclear | Ask program |

## Concrete practice
On your own lab app, compile five discovered paths from documentation, comments, and search-style queries. For each, write a purpose hypothesis *before* sending any request, and mark it out-of-scope if uncertain.

## Common mistakes
High-rate brute-force on real targets; treating a discovered path as a vulnerability; skipping the purpose step; assuming old assets are abandoned and unmonitored.

## Where practitioners disagree
Some hunters treat content discovery as the core skill; @atul_hax treats it as automation that should free time for understanding. Both agree the value comes after discovery, in interpretation.

## Knowledge check
Q: You discover an in-scope legacy path. What is the first thing to record? A: Its suspected purpose and scope status — not a payload. Understanding what it does precedes testing it.
===MODULE===
TITLE: Understanding How Things Work: RFCs and Tech Stacks
LEVEL: Intermediate
MINUTES: 40
SUMMARY: @atul_hax's advice to read RFCs and documentation so you can reason about intended behaviour instead of firing one-liners.
OBJECTIVES: read the protocol behind a feature | identify intended behaviour | find assumption gaps
TAKEAWAYS: specs define intent | deviations are test ideas | knowledge is free
PRACTICE: Read the relevant RFC section for one lab feature (e.g., redirects or auth headers) and write five "what if" questions about it.
SOURCES: PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community ; PortSwigger Academy|https://portswigger.net/web-security
---
## Core idea
@atul_hax's most durable line is that knowledge and curiosity are free. Reading the RFC or framework docs for the protocol behind a feature gives you a model of intended behaviour; without that model, a strange response is just noise. PortSwigger Web Security Academy supplies the same model for vulnerability classes. On an authorized target, spec knowledge tells you which implementation choices are surprising enough to investigate.

Spec-to-hypothesis table:

| Spec concept | Intended behaviour | "What if" question |
| --- | --- | --- |
| Redirect status codes | Client follows a location | What if location is user-controlled after login? |
| Auth header semantics | Bearer token scopes access | What if the token is accepted on another origin? |
| Cache directives | Response freshness controlled | What if a private response is cached publicly? |

## Concrete practice
Pick one feature in your lab app and one relevant specification section. Write five "what if" questions, then check which ones the app's behaviour actually answers. Record the answers as observations, not findings.

## Common mistakes
Reading specs without connecting them to observed traffic; assuming the spec equals implementation; skipping error cases; treating documentation as authoritative for a custom protocol.

## Where practitioners disagree
Tool-first hunters learn by fuzzing and observing; @atul_hax learns by reading first. Combine them: read to form a question, then use the proxy to answer it.

## Knowledge check
Q: Why does reading an RFC help find bugs? A: It gives you intended behaviour, so you can recognize deviations that a generic scanner cannot interpret.
===MODULE===
TITLE: Automation's Limits: Why Everyone Runs the Same Tools
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Intigriti's warning that tools are outdated, miss classes, produce false positives, and are already run by every other hunter.
OBJECTIVES: audit your tool reliance | spot false positives | reclaim thinking time
TAKEAWAYS: tools are a baseline | unique bugs need unique reasoning | verify every output
PRACTICE: In your lab, take one tool finding and either confirm it manually or label it a false positive with the raw response as evidence.
SOURCES: Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners ; PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community ; Snyk 7 tips|https://dev.to/snyk/7-tips-to-become-a-successful-bug-bounty-hunter-529e
---
## Core idea
Intigriti warns against relying fully on automation: tools can be outdated, miss entire classes, generate false positives, and — most importantly — are already run by everyone else. Snyk agrees that automation should handle boring tasks, not replace understanding. @atul_hax's "recon != hacking" adds the same boundary from the other direction. A tool result is a *question*, never a report.

Tool-output audit table:

| Tool claim | Manual check | Verdict |
| --- | --- | --- |
| "Possible injection" | Read the raw response, vary one input | Confirmed / false positive |
| "Missing header" | Check whether another layer supplies it | Not a finding / context-dependent |
| "N hosts found" | Are all hosts in scope and meaningful? | Map only |

## Concrete practice
Run one scanner against your own lab app, then audit its top three claims by hand. For each, write the raw evidence that confirms or refutes it. Delete any claim you cannot verify — this trains the habit of not reporting tool noise.

## Common mistakes
Copying scanner output into a report; treating a missing header as impact; never updating signatures; assuming "not found by tool" means "not vulnerable."

## Where practitioners disagree
Some hunters build impressive pipelines and win on volume; Intigriti and NahamSec argue that shared tooling produces shared, duplicate findings. The reconciliation: automate collection and recording; reserve interpretation for humans.

## Knowledge check
Q: What is the correct status of an unverified tool finding? A: A hypothesis requiring manual confirmation against the raw response — never a report.
===MODULE===
TITLE: Avoiding Aggressive Scanning and Staying in Bounds
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Practical rate, timing, and technique limits that keep authorized work authorized and preserve access to a program.
OBJECTIVES: read technique prohibitions | choose gentle methods | stop when uncertain
TAKEAWAYS: policy outranks convenience | noisy tests risk access | ask before unusual techniques
PRACTICE: Write a "technique gate" checklist for your lab: five questions to answer before any automated request.
SOURCES: HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work ; Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners ; HackerOne learn to hack|https://www.hackerone.com/hackers/how-to-start-hacking
---
## Core idea
Every offensive action in this track is limited to an authorized, in-scope target or a lab you own. Even there, build restraint. HackerOne's guidance says to read the rules first; those rules often ban or limit automated scanning, denial-of-service style tests, social engineering, and touching third-party systems. A technique gate prevents "I was curious" from becoming a policy breach.

Technique gate before any automated run:

| Question | If no | Action |
| --- | --- | --- |
| Is the host explicitly in scope? | Stop | Ask the program |
| Does the policy permit this technique? | Stop | Use manual methods or lab |
| Is the rate gentle for a production service? | Stop | Reduce or use your lab |
| Could this modify or delete data? | Stop | Redesign the test |
| Have I recorded what I will stop at? | Stop | Write the limit first |

## Concrete practice
Apply the gate to a planned directory check on your lab app. Write the exact word list size, request rate, and stop condition before running it, then confirm it only touches localhost.

## Common mistakes
Assuming "in scope" means "any technique"; running defaults with high concurrency; testing third-party hosts linked from the page; continuing after an unusual response.

## Where practitioners disagree
Some hunters argue aggressive recon is necessary on wide scopes; Intigriti and HackerOne both favour reading the asset list and the rules. When in doubt, the lab is always available.

## Knowledge check
Q: The policy is silent on fuzzing. What now? A: Ask the program before running it; do equivalent fuzzing in your own lab in the meantime.
===MODULE===
TITLE: The Manual Deep-Dive Method
LEVEL: Advanced
MINUTES: 50
SUMMARY: @codingo_'s advice: skip shallow tips, develop deep web application knowledge, then deep-dive one application for bespoke flaws.
OBJECTIVES: plan a multi-week deep dive | examine bespoke logic | resist shortcut tips
TAKEAWAYS: depth beats breadth | bespoke bugs need bespoke thinking | weeks, not hours
PRACTICE: Run a two-week lab deep dive on one application, producing a daily log of assumptions you tested.
SOURCES: PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community ; NahamSec duplicates|https://www.nahamsec.com/posts/why-bug-bounty-hunters-keep-finding-duplicates-and-how-to-stop
---
## Core idea
In PortSwigger's community tips, @codingo_ says to avoid most bite-sized tips because many do not apply or are already duplicated. His method is deep knowledge of web applications generally, followed by a deep dive into *one* application to find bespoke flaws. Ben Sadeghipour's duplicate analysis supplies the reason: tools and tips are shared, application-specific understanding is not.

Deep-dive structure for an authorized target or lab:

| Week | Focus | Artefact |
| --- | --- | --- |
| 1 | Read every feature, docs, error messages | Assumption list |
| 2 | Follow two flows end to end with a proxy | State map + hypotheses |
| 3 | Examine unusual roles and asynchronous jobs | Variant catalogue |
| 4 | Consolidate and write reports | Evidence pack |

## Concrete practice
Choose one lab application and schedule four sessions. Each session, add at least three assumptions the app makes — about identity, ordering, or trust — and one way you could check them. Keep a running "surprise log" of behaviours that contradicted your model.

## Common mistakes
Treating a deep dive as a single long session; abandoning it when the first hypotheses fail; borrowing another hunter's checklist; ignoring boring features where bespoke logic hides.

## Where practitioners disagree
Shortcut tips are popular because they produce quick wins; @codingo_ considers most N/A or duplicate-prone. Use tips to generate questions, never as a substitute for the application model.

## Knowledge check
Q: What distinguishes a bespoke flaw from a duplicated one? A: It arises from this application's specific design and assumptions, not from a generic pattern everyone tests.
===MODULE===
TITLE: Bite-Sized Tips vs Bespoke Flaws
LEVEL: Advanced
MINUTES: 35
SUMMARY: How to evaluate a tip before acting on it — applicability, duplicate risk, and whether it teaches a mechanism.
OBJECTIVES: filter tips | assess duplicate risk | convert tips into questions
TAKEAWAYS: most tips are context-specific | shared tips mean shared findings | mechanisms transfer
PRACTICE: Take three popular tips and write an applicability-and-duplication score for a lab app of your choice.
SOURCES: PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community ; Snyk 7 tips|https://dev.to/snyk/7-tips-to-become-a-successful-bug-bounty-hunter-529e
---
## Core idea
@codingo_'s blunt claim is that most bite-sized tips are not applicable or are duplicate-prone. Snyk's "find your niche" and NahamSec's "become an expert" point the same way: a tip only helps when you understand the conditions that make it work. Score every tip before spending time on it.

Tip filter:

| Question | Score 1–5 |
| --- | --- |
| Does this stack actually use the mentioned mechanism? | Applicability |
| How many hunters likely run this exact check? | Duplication risk |
| Can I explain the root cause without the tip? | Understanding |
| Does it suggest a new hypothesis for my app? | Value |

## Concrete practice
Pick three widely shared tips. For each, fill the table for your lab app and write one sentence: "This teaches me to ask ___." Discard tips that teach nothing about mechanism and score high on duplication.

## Common mistakes
Running tips on autopilot; treating a tip as proof of a bug; collecting tips instead of studying classes; ignoring that a tip may target a version you never identified.

## Where practitioners disagree
Tip culture thrives because it lowers the entry barrier; @codingo_ warns it creates a crowd doing identical work. Snyk's answer is a niche; NahamSec's is deep expertise.

## Knowledge check
Q: A tip scores high on applicability but also high on duplication risk. What should you do? A: Use it to understand the mechanism and derive a less obvious variant on your target — not to run the identical check.
===MODULE===
TITLE: Non-Obvious, Out-of-Limit, Misplaced Inputs
LEVEL: Advanced
MINUTES: 45
SUMMARY: @regilero's practical testing categories for finding flaws where developers did not expect input to arrive.
OBJECTIVES: test boundary positions | try displaced parameters | document expected vs observed
TAKEAWAYS: inputs appear in surprising places | limits reveal assumptions | order matters
PRACTICE: In your lab app, list ten inputs and test three positional variations each, recording only observations in a table.
SOURCES: PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community ; PortSwigger Academy|https://portswigger.net/web-security
---
## Core idea
PortSwigger's community tips attribute to @regilero a method centred on reading code and unit tests to find obvious, implicit, and assumed data or behaviour, then testing non-obvious, out-of-limit, and misplaced inputs. The three categories are a useful checklist: put a value where it should not be, put an extreme value where a small one is expected, and put a value in the wrong *position* — a different parameter, a different request step, a different role's context.

Variation matrix (use only on authorized targets/labs):

| Input | Obvious place | Out-of-limit | Misplaced |
| --- | --- | --- | --- |
| Quantity | Cart form | Negative / huge | Query string on confirmation |
| Role flag | Profile update | Unexpected value | Header on admin action |
| Reference ID | View endpoint | Other object's ID | Export job parameter |

## Concrete practice
Build the matrix for three inputs in your lab app. For each test, write the expected behaviour first, then the observation. Stop as soon as a test would change real data for another user — use sandboxed accounts only.

## Common mistakes
Testing only the documented parameter; using extreme values that cause denial of service on production; skipping the "expected behaviour" column; treating all deviations as vulnerabilities.

## Where practitioners disagree
Some hunters rely on fuzzing dictionaries; @regilero's approach is model-driven — decide which assumptions matter, then choose values. Both find bugs, but only the second explains them.

## Knowledge check
Q: Which is a "misplaced" input test? A: Sending a value in a different parameter, step, or role context than the application expects — not merely sending a big value.
===MODULE===
TITLE: Implicit and Assumed Behaviour
LEVEL: Advanced
MINUTES: 40
SUMMARY: How to spot what a developer assumed without checking — the quiet source of logic bugs in otherwise well-tested code.
OBJECTIVES: identify implicit assumptions | read tests as documentation | turn assumptions into checks
TAKEAWAYS: unchecked assumptions are the bug | tests reveal intent | absence of a check is evidence
PRACTICE: Read a small open-source lab app's tests and list five assumptions the code makes, then design a lab check for each.
SOURCES: PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community ; OWASP MASTG|https://mas.owasp.org/MASTG/
---
## Core idea
@regilero's advice to read code and unit tests is about recovering the developer's mental model. Tests document what the author considered normal: one item per order, one role per user, one step per request. Anything outside that set may be implicitly trusted rather than validated. OWASP's mobile testing guidance makes the same point in another domain — know what the app expects before testing what it tolerates.

Assumption ledger example:

| Source | Assumption | What is unchecked? | Lab check |
| --- | --- | --- | --- |
| Unit test | "Quantity is 1–10" | Upper bound at another endpoint | Submit 11 in draft only |
| Test fixture | "One active token" | Old token reuse | Try token twice |
| Code comment | "Only owners reach here" | Server-side role check | Use second role |

## Concrete practice
Open the source or tests of a deliberately vulnerable app you own. Fill a ledger with five assumptions and write one safe check per row. Mark each check with the expected result if the assumption holds.

## Common mistakes
Assuming good tests mean no missing checks; reading only production code, not tests; treating implicit behaviour as documented behaviour; testing assumptions without a stop condition.

## Where practitioners disagree
Black-box hunters work without source by choice; @regilero says reading code and tests is the fastest route to hidden assumptions. On real programs, source is rarely available — so practise the skill in your own repos.

## Knowledge check
Q: Why are unit tests useful to a hunter? A: They show which cases the developer considered, making unconsidered cases visible as assumptions worth testing in a lab.
===MODULE===
TITLE: Dusty Corners and Old Assets
LEVEL: Advanced
MINUTES: 35
SUMMARY: @iagox88's Google-derived hint: old logos, fonts, and forgotten directories point to code nobody maintains or reviews.
OBJECTIVES: spot stale surfaces | prioritize neglected code | test carefully in scope
TAKEAWAYS: stale assets are clues | neglect causes missing checks | confirm ownership first
PRACTICE: In your lab app, create a small "legacy" area and write a checklist for assessing it: owner, purpose, data touched, and current protection.
SOURCES: PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community ; HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work
---
## Core idea
In the PortSwigger community article, @iagox88 shares a lesson from Google: look for "dusty old corners" developers forgot — old logos and fonts are a hint that an area predates current review. HackerOne's report guide adds the essential caveat: confirm the asset is in scope before investing time. A stale surface is valuable because its protections were never updated, not because it is automatically vulnerable.

Legacy surface checklist:

| Question | Why it matters |
| --- | --- |
| Is it explicitly in scope? | Permission precedes curiosity |
| When was it last designed? | Older design may miss current checks |
| Does it touch live data? | Determines safe test depth |
| Is it still linked internally? | Indicates whether anyone maintains it |

## Concrete practice
In your lab, add an old static folder with a forgotten form. Assess it with the checklist and write a short note on which assumptions from the main app do *not* hold there. Test only in your lab; on a real program, ask first.

## Common mistakes
Treating an old asset as abandoned and unmonitored; assuming an out-of-date subdomain is in scope; skipping the "live data" question; ignoring that legacy code can be the most business-critical.

## Where practitioners disagree
Some hunters avoid old assets as low impact; @iagox88 treats them as high-probability. Probability and impact are separate decisions — check both.

## Knowledge check
Q: What makes a dusty corner interesting? A: It likely escaped the security updates applied to newer code — provided it is in scope and you can show real impact.
===MODULE===
TITLE: Complex Functionality and Softer Targets
LEVEL: Advanced
MINUTES: 45
SUMMARY: James Kettle's advice: get lab experience, then pick a site with complex functionality and lower payouts, and understand it inside out.
OBJECTIVES: choose complexity over glamour | persist for months | explain design before reporting
TAKEAWAYS: complexity hides bugs | lower profiles mean less competition | understanding is the work
PRACTICE: Pick a complex lab workflow (multi-user, multi-step) and write a design explanation before testing anything.
SOURCES: PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community ; NahamSec duplicates|https://www.nahamsec.com/posts/why-bug-bounty-hunters-keep-finding-duplicates-and-how-to-stop
---
## Core idea
James Kettle's final advice in the PortSwigger community article is to get practical lab experience, then pick a site with complex functionality — noting that lower payouts mean a softer target — and not move on until you understand it inside out. His own first paid bug was an accidental stored XSS in YouTube; he then spent time understanding Blogger's "crazy design" and found a batch of bugs over months. That is the model: one surprising design, many findings.

Complexity checklist for a lab or in-scope target:

| Complexity source | Question |
| --- | --- |
| Multiple roles | Who can act on whose objects? |
| Asynchronous jobs | What state exists between request and result? |
| Import/export | Where does data cross a trust boundary? |
| Integrations | Which external system's rules are assumed? |

## Concrete practice
Choose one complex workflow in your lab and write a two-page explanation of its design: components, states, and trust boundaries. Keep it updated for a month. Every finding should be traceable to something in that explanation.

## Common mistakes
Choosing a target because it is famous; leaving before the design makes sense; chasing one bug class when the architecture is the real source; ignoring "boring" queues and background jobs.

## Where practitioners disagree
Some hunters maximize payout per hour; Kettle argues a quieter complex target yields more findings over months. NahamSec's power-user advice supports the same trade-off.

## Knowledge check
Q: Why does Kettle recommend understanding a site inside out before moving on? A: Because complex designs generate multiple distinct bugs once their unusual interactions are understood.
===MODULE===
TITLE: Report Craft: The Three Must-Cover Topics
LEVEL: Intermediate
MINUTES: 40
SUMMARY: HackerOne's core rule: every report must cover reproduction steps, exploitability, and impact — with a reusable skeleton.
OBJECTIVES: structure a report | cover all three topics | avoid ambiguity
TAKEAWAYS: reproduction first | exploitability is proof | impact is organizational
PRACTICE: Write a three-section report in your lab for a flaw you found, then have a partner follow only your steps.
SOURCES: HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work ; HackerOne triage|https://www.hackerone.com/blog/view-other-side-security-analysts-perspective-bug-bounty-triage
---
## Core idea
Adam Bacchus's HackerOne guide names three topics every report must cover: reproduction steps, exploitability, and impact. Shreya Pohekar, a HackerOne triage analyst, adds that analysts aim to be objective and want valid reports rewarded — so your job is to make their review easy. A report is not a story about your effort; it is a short, verifiable argument. Write for a reader who has never seen your session and owes you no benefit of the doubt.

Report skeleton:

| Section | Contents |
| --- | --- |
| Summary | One sentence: what is wrong, where |
| Steps | Numbered, from a clean state, with exact URLs |
| Exploitability | What you demonstrated, with evidence |
| Impact | Who is affected and how, in org terms |
| Scope note | Which authorized asset and policy clause |

## Concrete practice
Take one lab finding and fill the skeleton in under 400 words. Remove every sentence that does not help a stranger reproduce or judge it. Then ask a partner to follow only the steps; if they get stuck, rewrite them.

## Common mistakes
Leading with a long tool dump; omitting the starting state; claiming impact without a path to it; leaving out the affected asset; writing "trust me, it's critical."

## Where practitioners disagree
Some hunters write minimal reports to save time; HackerOne's guidance favours completeness, especially for complex multi-step issues — missing setup details cause "Needs More Info" responses.

## Knowledge check
Q: Which three topics must every report cover? A: Reproduction steps, exploitability, and impact.
===MODULE===
TITLE: Writing Reproduction Steps That Triage Can Follow
LEVEL: Intermediate
MINUTES: 35
SUMMARY: How to write steps a stranger can repeat exactly — clean state, plain-text navigation links, and no hidden setup.
OBJECTIVES: write deterministic steps | include setup | reduce back-and-forth
TAKEAWAYS: start from a clean state | links in plain text | every precondition stated
PRACTICE: Write a six-step reproduction for a lab flaw, then deliberately remove one detail and observe where a partner fails.
SOURCES: HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work ; HackerOne triage|https://www.hackerone.com/blog/view-other-side-security-analysts-perspective-bug-bounty-triage
---
## Core idea
HackerOne's triage analyst recommends navigation links in plain text, including the sign-in URL, rather than screenshots, to reduce "Needs More Info" responses. For complex or multi-step reports, include all setup details — test accounts, roles, and any state created beforehand. Reproduction is a recipe: a stranger must reach the same observation without guessing. If a step depends on an earlier request, say so explicitly instead of assuming the reader remembers it.

Step-writing checklist:

| Element | Example |
| --- | --- |
| Starting state | Fresh session, user role, clean test account |
| Navigation | `https://app.example.test/login` (plain text) |
| Action | Edit profile, change field X to value Y |
| Observation | Server response shows another user's record |
| Cleanup | No persistent changes left behind |

## Concrete practice
Write steps for your lab finding using the checklist. Then give them to a partner who has not seen the app. Where they hesitate, add the missing precondition. Repeat until they reproduce it unassisted.

## Common mistakes
Assuming the reader knows your test account; embedding links in screenshots; omitting which role performs each step; relying on "as before"; describing what you did instead of what they should do.

## Where practitioners disagree
Some hunters prefer terse steps to avoid leakage; HackerOne's guidance prioritizes reproducibility, while warnings about over-sharing apply to data, not to navigation paths in an authorized report.

## Knowledge check
Q: Why put the sign-in URL in plain text? A: It removes ambiguity about entry point and is directly usable by triage, reducing follow-up questions.
===MODULE===
TITLE: Exploitability: Proving It Works, Not Just Theoretically
LEVEL: Intermediate
MINUTES: 40
SUMMARY: HackerOne triage's distinction between a theoretical statement and a practically demonstrated exploit.
OBJECTIVES: demonstrate exploitability | avoid theoretical claims | record proof
TAKEAWAYS: theory is not proof | show the working path | keep evidence
PRACTICE: In your lab, take a theoretical flaw and build the smallest working proof, then write what changed between claim and evidence.
SOURCES: HackerOne triage|https://www.hackerone.com/blog/view-other-side-security-analysts-perspective-bug-bounty-triage ; HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work
---
## Core idea
Shreya Pohekar's HackerOne triage article states that "a theoretically possible statement may not be practically exploitable," and asks reporters to explain CVSS reasoning with real-world impact. The gap between a claim and a demonstration is where many reports become Informative. Exploitability evidence should be minimal but complete: the precondition, the action, and the observed result on an authorized target or lab.

Claim-to-proof table:

| Theoretical claim | Missing element | Practical proof |
| --- | --- | --- |
| "This parameter might allow injection" | Does the server interpret it? | Show a controlled, safe difference in response |
| "This token might be reusable" | Is reuse accepted? | Use it twice in your own sandbox accounts |
| "This page could be framed" | Any action to protect? | Show an actual state-changing click |

## Concrete practice
Pick one theoretical statement from your lab notes. Define the smallest demonstration that would convince a stranger, capture it, and write a two-sentence explanation of why the demonstration establishes what the claim did not.

## Common mistakes
Describing a payload without showing its effect; relying on tool labels; demonstrating in a context different from the vulnerable one; saying "an attacker could" without showing the step.

## Where practitioners disagree
Some hunters report theoretical issues early to claim priority; HackerOne's triage perspective favours demonstrated exploitability, because analysts must judge reward and severity objectively.

## Knowledge check
Q: Which is stronger: "this value is unvalidated, so injection may be possible" or a captured response showing controlled interpretation? A: The second — it converts a theoretical statement into practical evidence.
===MODULE===
TITLE: Impact Framing and CVSS Reasoning
LEVEL: Intermediate
MINUTES: 40
SUMMARY: How HackerOne's report guide and triage analyst expect impact to be explained in terms of the affected organization.
OBJECTIVES: frame impact organizationally | justify severity | compare contexts
TAKEAWAYS: context changes value | explain your score | avoid generic severity labels
PRACTICE: Write two impact paragraphs for the same lab flaw — one for a static marketing site, one for a session-bearing app — and explain the difference.
SOURCES: HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work ; HackerOne triage|https://www.hackerone.com/blog/view-other-side-security-analysts-perspective-bug-bounty-triage
---
## Core idea
Adam Bacchus gives the canonical example: XSS on a session-bearing domain is worth far more than clickjacking on a static page. Impact must be described in terms of the affected organization — healthcare means patient data; PCI environments mean card data. Shreya Pohekar adds that reporters should explain CVSS reasoning instead of merely asserting a score.

Impact context table:

| Finding | Context | Why severity changes |
| --- | --- | --- |
| Stored XSS | Session-bearing app | Session actions available to the victim |
| Stored XSS | Static, no-auth page | Little privileged state to abuse |
| Data exposure | Healthcare app | Patient records, regulatory impact |
| Data exposure | PCI scope | Cardholder data obligations |

## Concrete practice
For one lab finding, write two versions of the impact section using the table. Under each, list the facts you relied on (auth state, data type, who can act). If a fact is unknown, label it unknown rather than assuming the worst.

## Common mistakes
Assigning "Critical" without a rationale; using CVSS as decoration; ignoring the affected data's nature; extrapolating from a lab to production impact without evidence.

## Where practitioners disagree
Hunters often argue severity from technical maximalism; triage analysts judge practically demonstrable harm. Present both your score and your reasoning, and let the program decide.

## Knowledge check
Q: Why does the same XSS differ in value across two sites? A: Because available sessions, data, and privileged actions determine real impact — the bug class alone does not.
===MODULE===
TITLE: Evidence Hygiene: Links, Snips, and Video PoCs
LEVEL: Intermediate
MINUTES: 35
SUMMARY: HackerOne's practical formatting guidance for evidence that triage can read quickly and replay reliably.
OBJECTIVES: format evidence cleanly | use supported video formats | keep reports readable
TAKEAWAYS: plain-text links | snip long dumps | video is an offer, not a requirement
PRACTICE: Take one lab report with a 300-line output dump and cut it to first lines, `[snip]`, and last lines without losing proof.
SOURCES: HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work ; HackerOne triage|https://www.hackerone.com/blog/view-other-side-security-analysts-perspective-bug-bounty-triage
---
## Core idea
HackerOne's guidance says screenshots help, while videos are hit-or-miss — offer them, and use supported formats (.mp4, .mov, .webm). The triage analyst recommends plain-text navigation links and snipping long command/output dumps: keep the beginning and end, mark `[snip]` between. Evidence hygiene is respect for a reviewer's attention. Clean evidence lets a reviewer confirm your claim in seconds instead of asking for another round of information.

Evidence checklist:

| Item | Good practice |
| --- | --- |
| Navigation links | Plain text, including sign-in URL |
| Screenshots | Annotated, showing the relevant state |
| Long output | First lines, `[snip]`, last lines |
| Video | Short, supported format, offered as extra |
| Setup details | Accounts, roles, preconditions included |

## Concrete practice
Rewrite one lab report using the checklist. Cut your longest output block to a ten-line excerpt with a `[snip]` marker, and add a plain-text navigation list. Keep the full capture in your notes, not in the report body.

## Common mistakes
Pasting entire terminal scrollbacks; relying only on screenshots for URLs; uploading unsupported video types; making a ten-minute video for a two-step bug.

## Where practitioners disagree
Some hunters prefer video-only reports for complex setups; HackerOne treats video as useful but inconsistent — text steps remain the primary record.

## Knowledge check
Q: How should a 300-line output dump appear in a report? A: As the first few lines, a `[snip]` marker, and the last few lines — with full evidence retained on your side.
===MODULE===
TITLE: Honesty: Not Overstating Impact
LEVEL: Intermediate
MINUTES: 30
SUMMARY: HackerOne's advice to never stretch a finding, to submit and ask when unsure, and to keep disagreements professional.
OBJECTIVES: state limits plainly | ask for clarification | avoid repeated resubmission
TAKEAWAYS: honesty builds reputation | uncertainty is acceptable | one polite follow-up
PRACTICE: Rewrite an exaggerated lab impact paragraph into an honest one that states both what you proved and what you did not.
SOURCES: HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work ; HackerOne triage|https://www.hackerone.com/blog/view-other-side-security-analysts-perspective-bug-bounty-triage
---
## Core idea
Adam Bacchus is direct: do not stretch or lie about impact; if unsure, submit and ask. If a team still says no, request mediation or public disclosure — but do not resubmit the same finding repeatedly. Shreya Pohekar adds that courtesy helps both sides and that analysts want valid reports rewarded. Honesty is also practical: an inflated claim that fails destroys credibility for future reports. An honest 'I could not verify this part' is stronger than an exaggerated claim a reviewer can dismantle in one sentence.

Honest impact template:

| Statement | Example |
| --- | --- |
| Proved | "With two test accounts, I read another account's record." |
| Not proved | "I did not test whether this affects production data." |
| Asked | "Could you clarify whether this record type is considered sensitive?" |

## Concrete practice
Take one exaggerated lab report and split its impact section into "proved / not proved / question for the program." Submit the version with all three sections to a study partner for review.

## Common mistakes
Claiming data access you did not demonstrate; labelling an issue by worst-case scenario; arguing with a triage verdict; resubmitting with slightly different wording.

## Where practitioners disagree
Some hunters deliberately overstate to influence severity; HackerOne's guidance and triage perspective both favour accuracy and a single polite clarification request.

## Knowledge check
Q: The program says your report is expected behaviour and you disagree. What is the right next step? A: Ask politely for clarification; if the answer stands, use official mediation or disclosure routes — do not resubmit repeatedly.
===MODULE===
TITLE: Duplicates Principle 1: Touch the Code, Pay the Bug
LEVEL: Advanced
MINUTES: 40
SUMMARY: Bugcrowd's first duplicate principle and its SQLi example: rewards follow the number of distinct fixes, not the number of URLs.
OBJECTIVES: apply the code-change test | count distinct fixes | recognize WAF non-fixes
TAKEAWAYS: separate fixes mean separate bugs | same fix means duplicate | a WAF rule is not remediation
PRACTICE: In your lab, catalogue ten SQL injection points by underlying query and write which would need distinct code changes.
SOURCES: Bugcrowd duplicates|https://www.bugcrowd.com/blog/the-three-principles-of-bug-bounty-duplicates/ ; HackerOne triage|https://www.hackerone.com/blog/view-other-side-security-analysts-perspective-bug-bounty-triage
---
## Core idea
Grant McCracken's Bugcrowd article gives three principles; the first is "touch the code (or make a change), pay the bug." Its SQLi example: ten injections in different queries or resources often require ten separate fixes, so they are not one payout. Conversely, if one change fixes every instance, they are the same finding. A WAF rule does not count as a fix — remediation is judged at the codebase layer.

Code-change test table:

| Findings | What must change | Verdict |
| --- | --- | --- |
| 10 SQLi in 10 different queries | Ten query fixes | Ten unique |
| 10 SQLi via one shared helper | One helper fix | One systemic |
| SQLi blocked by WAF only | No code change | Not remediated |

## Concrete practice
In a lab app you control, list ten injection surfaces and group them by the code path that would need modification. Write a one-line justification for each group. Treat WAF-style blocks as noise, not remediation.

## Common mistakes
Counting URLs instead of code paths; assuming a filter equals a fix; reporting every instance as separate without tracing shared functions; losing nuance when many findings look identical.

## Where practitioners disagree
Hunters often expect one reward per observed endpoint; Bugcrowd judges by remediation effort. When the mapping is unclear, ask with evidence rather than arguing.

## Knowledge check
Q: Ten SQLi findings all flow through one shared query builder. How many fixes are likely? A: One — under "touch the code, pay the bug," that is a single systemic finding.
===MODULE===
TITLE: Principles 2 and 3: Similar ≠ Same, Many ≠ Systemic
LEVEL: Advanced
MINUTES: 45
SUMMARY: Bugcrowd's XSS and CSRF examples showing why surface counts mislead duplicate decisions.
OBJECTIVES: group XSS by parameter | judge CSRF by token coverage | avoid false systemic claims
TAKEAWAYS: similar is not same | many is not automatically systemic | context decides
PRACTICE: For a lab app, build a table of fifteen reflected XSS instances grouped by underlying parameter, then write the duplicate verdict.
SOURCES: Bugcrowd duplicates|https://www.bugcrowd.com/blog/the-three-principles-of-bug-bounty-duplicates/
---
## Core idea
Bugcrowd's second principle is "similar is not same": a similar-looking finding that needs a separate change is unique. Third: "many is not systemic" — frequency alone does not prove one root cause. In the XSS example, fifteen reflected instances across pages but only three underlying parameters typically produce three findings; if one shared rendering function renders the URL everywhere, it may be one systemic issue. In the CSRF example, fifty findings when no anti-CSRF exists anywhere may be one systemic issue; if 45 have tokens and 5 do not, those five are unique.

Decision table (lab analysis):

| Pattern | Root cause | Verdict |
| --- | --- | --- |
| 15 XSS, 3 parameters | Three encoders to fix | Three findings |
| 15 XSS, one renderer | One shared renderer | One finding |
| 50 CSRF, no tokens anywhere | Framework-level gap | One finding |
| 50 CSRF, 5 missing tokens | Five specific fixes | Five findings |

## Concrete practice
Build the XSS table for a deliberately vulnerable lab app: instance, page, parameter, function rendering it. Group by function, then write the verdict using the principles. Repeat with a token-coverage table for CSRF.

## Common mistakes
Counting pages as bugs; assuming "many" means one report; assuming "similar" means duplicate; forgetting that context and nuance always matter.

## Where practitioners disagree
Hunters often want maximum distinct findings; programs think in code changes. Bugcrowd's advice when uncertain is simply to ask.

## Knowledge check
Q: Fifteen reflected XSS instances share one rendering function. How many findings? A: Likely one systemic finding — one code change fixes them all.
===MODULE===
TITLE: Duplicate Triage in Practice: CSRF, Context, and Asking
LEVEL: Advanced
MINUTES: 40
SUMMARY: Applying all three duplicate principles to a messy real-world CSRF case and learning how to present nuanced evidence.
OBJECTIVES: combine the principles | present code-path evidence | ask without arguing
TAKEAWAYS: map coverage before claiming | exceptions are often unique | ask when in doubt
PRACTICE: Write a duplicate appeal for a lab case where 45 of 50 forms have tokens and five do not, using the three principles.
SOURCES: Bugcrowd duplicates|https://www.bugcrowd.com/blog/the-three-principles-of-bug-bounty-duplicates/ ; HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work
---
## Core idea
Grant McCracken's CSRF example is the best exercise in nuance: fifty findings may be one systemic issue if no anti-CSRF exists anywhere, but if most forms have tokens and five do not, those five need separate fixes and are unique. Combine this with principle two — a similar POST endpoint without tokens may still be distinct — and principle three — the count of fifty proves nothing by itself. HackerOne's guidance adds the presentation rule: ask for clarification politely and provide evidence.

Appeal structure for an authorized report:

| Element | What to include |
| --- | --- |
| Observation | "45/50 forms include a token; 5 do not." |
| Code-path evidence | "These five use a different handler." |
| Principle | "Similar is not same; each needs its own fix." |
| Request | "Could you confirm whether these are distinct?" |

## Concrete practice
Using your lab app, build the 50-form token coverage sheet and identify the five exceptions. Write the appeal above in under 200 words, with no accusatory language and no repeated submission.

## Common mistakes
Assuming a mass finding is automatically one payout; appealing with counts only; resubmitting the same report with new wording; ignoring a program's existing duplicate decision.

## Where practitioners disagree
Some hunters treat every duplicate verdict as final; Bugcrowd emphasizes nuance and says to ask. HackerOne adds mediation or disclosure if the team still disagrees.

## Knowledge check
Q: What single fact most changes a 50-CSRF duplicate decision? A: Whether the missing tokens share one framework-level fix or represent specific exceptions needing separate changes.
===MODULE===
TITLE: The Triage Conversation: Timing, Mediation, Statuses
LEVEL: Beginner
MINUTES: 30
SUMMARY: HackerOne's etiquette: about a two-week gap between updates, mediation rather than spam, and why "pending review" is not triaged.
OBJECTIVES: pace follow-ups | read statuses correctly | escalate appropriately
TAKEAWAYS: two to three pings a week do not help | mediation exists | pending review can still close informative
PRACTICE: Draft a polite two-week follow-up and a mediation request for a lab-simulated report status history.
SOURCES: HackerOne triage|https://www.hackerone.com/blog/view-other-side-security-analysts-perspective-bug-bounty-triage ; HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work
---
## Core idea
Shreya Pohekar's rule is concrete: asking two or three times a week does not prioritise a report and may breach the Code of Conduct; the ideal gap is roughly two weeks, after which a hunter can request Hacker Mediation. She also notes that "pending program review" is not the same as triaged — a report can still close as Informative. Keep proof of your PoC: if a bug is fixed before triage, evidence lets analysts check with the program.

Status interpretation table:

| Status | What it means | Your move |
| --- | --- | --- |
| Triaged | Validated for the program | Wait for resolution |
| Pending program review | Awaiting program decision | Do not celebrate yet |
| Needs more info | Missing evidence | Reply with the specific detail |
| Informative / Duplicate | Closed by triage | Learn, ask once if unclear |

## Concrete practice
Simulate a report timeline in your notes. Write the two-week follow-up message (one paragraph, no demands) and, for a stalled case, the mediation request that states dates and facts only.

## Common mistakes
Daily status checks; treating "pending" as acceptance; discarding PoC evidence after submission; emotional follow-ups; skipping the official mediation route.

## Where practitioners disagree
Some hunters chase aggressively to get attention; HackerOne's triage analyst says courtesy and patience stand out more and spam can harm your standing.

## Knowledge check
Q: What is the recommended gap before following up? A: Roughly two weeks; if there is still no progress, Hacker Mediation is the proper route.
===MODULE===
TITLE: Dev vs Production Severity, Reputation, Private Invites
LEVEL: Intermediate
MINUTES: 35
SUMMARY: How environment changes severity, how reputation drives private invitations, and why early XSS/SQLi/CSRF findings are normal.
OBJECTIVES: check production impact | understand reputation | plan long-term access
TAKEAWAYS: stage bugs usually rate lower | production context can raise severity | reputation compounds
PRACTICE: Write two severity ratings for the same lab flaw — dev environment and production — with a one-sentence rationale each.
SOURCES: HackerOne triage|https://www.hackerone.com/blog/view-other-side-security-analysts-perspective-bug-bounty-triage ; HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work ; NahamSec duplicates|https://www.nahamsec.com/posts/why-bug-bounty-hunters-keep-finding-duplicates-and-how-to-stop
---
## Core idea
HackerOne's triage analyst notes that dev/stage findings are usually lower severity, while the same issue in production can be High or Critical — PII exposure and cache poisoning are her examples. She advises checking production before submitting. The same article notes that everyone starts with XSS, SQLi, and CSRF, that duplicates mean you are heading in the right direction, and that reputation drives private invites. Ben Sadeghipour adds the marathon framing: deep expertise and deep product knowledge are what last.

Severity-by-environment table:

| Finding | Dev/stage | Production |
| --- | --- | --- |
| Data exposure | Synthetic data, lower | PII, potentially High/Critical |
| Cache poisoning | Limited users | Many users, higher |
| XSS | Test session | Session-bearing real users |

## Concrete practice
For one lab flaw, write both ratings and the reasoning. Then draft a three-line note explaining how a clean, honest report builds reputation — and how that reputation leads to private program invitations over time.

## Common mistakes
Assuming staging severity transfers to production; testing production beyond policy permission; equating duplicates with inability; chasing invites as a primary goal.

## Where practitioners disagree
Some hunters focus on public leaderboards; HackerOne's triage view and NahamSec both emphasize steady reputation and skill as the durable path.

## Knowledge check
Q: Why can the same flaw be lower severity in staging? A: Because the affected data, users, and cache behaviour differ; severity follows real-world impact, not just the bug class.
===MODULE===
TITLE: Capstone: A Sustainable Career and Your 30-Day Field Plan
LEVEL: Advanced
MINUTES: 60
SUMMARY: A capstone that combines sourcing, focus loops, evidence craft, and ethics into one honest, repeatable 30-day plan.
OBJECTIVES: synthesize the track | run a 30-day field plan | define sustainable habits
TAKEAWAYS: authorized work only | depth over volume | learning and reporting are both progress
PRACTICE: Execute the 30-day plan against an owned lab app or an explicitly authorized VDP, producing a scope brief, backlog, one report, and a review.
SOURCES: Snyk 7 tips|https://dev.to/snyk/7-tips-to-become-a-successful-bug-bounty-hunter-529e ; Intigriti beginners|https://www.intigriti.com/researchers/blog/hacking-tools/7-tips-for-bug-bounty-beginners ; PortSwigger community tips|https://portswigger.net/blog/finding-your-first-bug-bounty-hunting-tips-from-the-burp-suite-community ; HackerOne reports|https://www.hackerone.com/blog/bug-bounty-reports-how-do-they-work ; Bugcrowd duplicates|https://www.bugcrowd.com/blog/the-three-principles-of-bug-bounty-duplicates/
---
## Core idea
This capstone turns the track into a routine. Snyk's themes — consistency, niche, learning, collaboration, automation, breaks — combine with Intigriti's controllable goals and target persistence, @0x1ntegral's focus loop, and HackerOne's report structure. The ethical rule is fixed: every action stays inside an owned lab or an explicitly authorized, in-scope program.

30-day plan:

| Days | Work | Artefact |
| --- | --- | --- |
| 1–3 | Read policy; build scope brief; choose niche class | Brief + charter |
| 4–10 | Read writeups; reproduce two in lab | Extraction tables |
| 11–20 | Focus loop on one flow; update backlog daily | State map + hypotheses |
| 21–25 | Build one authorized finding and evidence pack | Draft report with three topics |
| 26–28 | Apply duplicate principles to your own findings | Duplicate decision table |
| 29–30 | Review, take planned break, write handoff | Retro + next 30-day input goals |

## Concrete practice
Execute the table. Your final review must answer: what did I learn, what was disproved, what remains untested, and what is my next controllable goal? Count submitted reports and written hypotheses, not payouts.

## Common mistakes
Treating the plan as a race; skipping the break and handoff; abandoning the niche on day twelve; measuring yourself against other hunters' posts.

## Where practitioners disagree
Quick-win hunters and deep-dive hunters disagree on pace. This plan resolves it: stable target, rotating class, scheduled rest, and honest reporting — the sustainable middle.

## Knowledge check
Q: What is the capstone's definition of success? A: Completed, authorized work with artefacts and learning — not a reward amount or a leaderboard position.
