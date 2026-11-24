===MODULE===
TITLE: The Bug Bounty Ecosystem
LEVEL: Beginner
MINUTES: 30
SUMMARY: Understand how organizations, platforms, triage teams, and researchers interact in a modern bounty program.
OBJECTIVES: identify the main actors in a bounty program | distinguish internal and public programs | explain how value flows between parties
TAKEAWAYS: programs are authorized, scoped engagements | platforms provide rules, triage, and payment | researchers trade time for reputation and rewards
PRACTICE: Map the actors and data flow of a public program using only its public program page.
SOURCES: None
---
## Core idea
A bug bounty program is a structured arrangement in which an organization invites external researchers to find security flaws in exchange for recognition and compensation. The ecosystem has four actors: the asset owner (the company), the platform (HackerOne, Bugcrowd, Intigriti, or a self-hosted portal), the researcher (you), and the triage team that validates submissions. Unlike a penetration test, which is commissioned and scheduled, a public bounty is continuously open and self-selected: you choose when and what to test within the published scope. This flexibility is powerful but creates a hard obligation — authorization is conditional on following the program's rules. Every action must stay inside the stated scope, respect the rate limits, and avoid touching real user data. Programs succeed because they convert adversarial curiosity into a measurable security control; researchers succeed by treating the engagement as a professional service, not a scavenger hunt. Understand the flow: the platform publishes scope and rules, you probe only in-scope assets, you submit evidence, triage reproduces, the owner fixes, and reward plus reputation flow back to you.

### Method
When evaluating any ecosystem participant, record: (1) who owns the asset, (2) which platform mediates, (3) whether the program is public, private, or VDP, (4) how triage and payment work, and (5) what safe-harbor language exists. Build a one-page map before spending a minute testing.

```bash
# Illustrative: fetch a public program page for reading only
curl -sS -A "research-notes/1.0" https://hackerone.com/<LAB_HOST>/program
# -sS: silent with errors; -A: identify your client honestly
# Parse only public text; never automate logins or crawling
```

### Checklist
- [ ] Asset owner identified
- [ ] Platform and triage model noted
- [ ] Program type (public/private/VDP) recorded
- [ ] Safe-harbor statement located

### Common mistakes
- Assuming "public" means "unrestricted" — scope still binds you.
- Testing before reading the rules.
- Treating the platform as the asset owner.

### Safety & scope
Read only public pages unless you hold explicit credentials. Never test assets you do not own or that lack a published invitation.

### Knowledge check
Q: Who validates a finding in a typical platform program?
A: The platform's triage team and the asset owner — not the researcher.

===MODULE===
TITLE: How Bounty Platforms Work
LEVEL: Beginner
MINUTES: 30
SUMMARY: Learn the lifecycle, interfaces, and incentives that make platforms the operating system of bug bounty.
OBJECTIVES: describe the submission lifecycle | explain triage and duplicate detection | use platform reputation correctly
TAKEAWAYS: platforms mediate rules and payment | triage validates before the owner fixes | reputation reflects report quality
PRACTICE: Walk the public UI of a training platform and note each report status without submitting anything.
SOURCES: None
---
## Core idea
Platforms are the operating system of modern bug bounty. They provide the program page, scope, submission workflow, triage, bounty payments, duplicate detection, and reputation scores. Understanding their mechanics helps you work within the system rather than against it. Most platforms share a common lifecycle: a researcher submits a report, automated checks may enrich it, a triage analyst validates severity and duplicates, the customer confirms, a fix is deployed, and the researcher is rewarded and ranked. Private programs invite named researchers; public programs are open to all registered users. Platforms also mediate disclosure: they set embargo periods and coordinate public disclosure timelines. As a researcher you should treat the platform's UI as the source of truth for what is in scope, what counts as a duplicate, and how rewards are calculated. Never rely on third-party rumors about a program's rules.

### Method
For each platform you use, document: submission fields, severity matrix, duplicate policy, disclosure setting, and payment terms. Learn how status flows (new → triaged → resolved). Keep your profile professional.

```bash
# Read-only: inspect a public program's published policy where offered
curl -sS https://hackerone.com/<LAB_HOST>/policy.json | head -40
# -sS quiet with errors; head limits output for note-taking
```

### Checklist
- [ ] Submission fields understood
- [ ] Severity matrix saved
- [ ] Duplicate policy noted
- [ ] Disclosure setting recorded

### Common mistakes
- Assuming all platforms share the same rules.
- Ignoring the duplicate policy before testing.
- Treating reputation as a popularity contest.

### Safety & scope
Use only official program channels. Do not scrape private data or bypass platform access controls.

### Knowledge check
Q: Who sets the final severity of a submitted report?
A: Triage and the asset owner, using the program's matrix.

===MODULE===
TITLE: VDP vs Bounty Programs
LEVEL: Beginner
MINUTES: 25
SUMMARY: Distinguish vulnerability disclosure policies from paid bounty programs and set correct expectations.
OBJECTIVES: define a VDP | compare VDPs and bounties | choose the right program type for a goal
TAKEAWAYS: VDPs promise non-retaliation, not payment | bounties add rewards and triage | both require rule compliance
PRACTICE: Classify three public programs as VDP, bounty, or hybrid using only their policy pages.
SOURCES: None
---
## Core idea
A Vulnerability Disclosure Policy (VDP) and a bug bounty program are related but distinct. A VDP is a published promise: the organization invites reports and pledges not to pursue legal action against good-faith researchers who follow the policy, but it typically offers no guaranteed payment. A bounty program adds a reward table and a triage/payment pipeline. Some programs are hybrids. Knowing the difference sets expectations about compensation, response time, and disclosure formalities. VDPs are often broader in scope because the organization wants maximum visibility; bounties are narrower and more tightly managed. Many companies start with a VDP and mature into a bounty. As a researcher, a VDP is an excellent place to build skills and reputation, but you should never assume a reward. Always confirm whether safe-harbor language exists and whether the policy permits public disclosure after a fix.

### Method
Classify every program into one of three buckets — VDP-only, bounty-only, or hybrid — and record the reward range, response SLA, and disclosure terms. Prioritize bounties for compensated work and VDPs for learning.

```bash
# Save a public VDP/bounty file for careful offline reading
curl -sS -L https://<LAB_HOST>/.well-known/security.txt -o security_txt_notes.txt
# -L follows redirects; output is a note file, not a scanner
cat security_txt_notes.txt
```

### Checklist
- [ ] Program type classified
- [ ] Reward terms recorded
- [ ] Response SLA noted
- [ ] Disclosure terms checked

### Common mistakes
- Expecting payment from a VDP.
- Assuming disclosure is always allowed.
- Ignoring the response SLA.

### Safety & scope
A VDP is still authorization with conditions. Never exceed its stated scope.

### Knowledge check
Q: Does a VDP guarantee a financial reward?
A: No. It promises good-faith handling and often safe harbor, not payment.

===MODULE===
TITLE: Ethics and Authorization
LEVEL: Beginner
MINUTES: 30
SUMMARY: Establish the ethical baseline that separates authorized research from unlawful activity.
OBJECTIVES: define authorization | apply data minimization | recognize ethical boundaries
TAKEAWAYS: permission must be explicit and documented | minimum-necessary interaction is the norm | reputation depends on ethics
PRACTICE: Write an authorization ledger entry for a lab target before touching it.
SOURCES: None
---
## Core idea
Ethics is the boundary that separates security research from crime. Authorization means you have explicit, documented permission to test a specific asset under specific conditions. A public program page is an invitation, but it is also a contract: testing outside its scope, using stolen credentials, or touching production user data breaks that contract instantly. The professional norm is "minimum necessary" — interact with a system only as much as needed to demonstrate a flaw. Treat every target as if a real person's data is behind it, because often there is. Ethical researchers avoid social engineering employees, avoid denial-of-service, avoid modifying or deleting data, and stop immediately when they suspect they have crossed a line. They also disclose responsibly through the official channel rather than threatening publicity. Reputation in this field is everything; one unethical act can end a career.

### Method
Before any test, write down: who authorized it, which hosts are named, what techniques are banned, and what data you will avoid. If any answer is unclear, pause and ask the program owner.

```bash
# Keep an authorization ledger entry before touching a target
cat >> engagement_notes.md <<'NOTE'
Target: <LAB_HOST>
Authorization: published program dated YYYY-MM-DD
In-scope: listed hosts only
Avoid: user data, DoS, social engineering
NOTE
```

### Checklist
- [ ] Authorization source recorded
- [ ] Named hosts listed
- [ ] Banned techniques noted
- [ ] Data avoidance stated

### Common mistakes
- Treating an invitation as unlimited permission.
- "Just looking" at out-of-scope data.
- Using real credentials found online.

### Safety & scope
When in doubt, do not test. Ask the program owner for clarification instead.

### Knowledge check
Q: What is the correct response when a test touches real user data?
A: Stop immediately and report the situation through the official channel.

===MODULE===
TITLE: Safe Harbor and Legal Boundaries
LEVEL: Beginner
MINUTES: 35
SUMMARY: Understand what safe harbor protects and where computer misuse and data laws still apply.
OBJECTIVES: define safe harbor | identify legal limits | apply data-protection care
TAKEAWAYS: safe harbor is contractual, not absolute | jurisdiction still matters | personal data is off-limits
PRACTICE: Quote and annotate the safe-harbor clause of a lab program policy.
SOURCES: None
---
## Core idea
Safe harbor is a legal commitment by an organization that it will not sue or press charges against researchers who conduct good-faith security research within the program's rules. It does not make any action legal by itself — laws such as the U.S. Computer Fraud and Abuse Act, the UK Computer Misuse Act, and EU cybercrime rules still define what is permitted. Safe harbor works as a contract: if you follow scope and rules, the owner promises restraint. If you exceed them, protection evaporates. Researchers should understand the difference between civil and criminal exposure and recognize that jurisdiction matters. Many programs publish safe-harbor language on their policy page; some rely on platform-wide terms. When in doubt, assume nothing is protected and stay strictly inside scope. Data protection law also matters: never download or expose real personal data.

### Method
Locate and quote the safe-harbor clause in your notes. Note its exact conditions (good faith, no data exfiltration, timely reporting). If absent, treat the engagement as higher risk.

```bash
# Extract safe-harbor wording from a local copy of a policy
grep -i -n "safe harbor\|good faith\|will not.*prosecute" policy_notes.txt
# -i case-insensitive; -n shows line numbers for citation
```

### Checklist
- [ ] Safe-harbor clause located
- [ ] Conditions recorded
- [ ] Jurisdiction noted
- [ ] Data limits understood

### Common mistakes
- Believing safe harbor covers any action.
- Ignoring data-protection obligations.
- Testing before confirming the clause.

### Safety & scope
Safe harbor is conditional. Stay inside scope to keep the protection intact.

### Knowledge check
Q: Does safe harbor override computer misuse law?
A: No. It is a promise of restraint by the owner, not a legal shield.

===MODULE===
TITLE: Program Rules and Codes of Conduct
LEVEL: Beginner
MINUTES: 30
SUMMARY: Treat published program rules as the precise contract that defines your authorization.
OBJECTIVES: extract key rules | apply banned-technique lists | maintain a rules digest
TAKEAWAYS: rules convert invitations into precise authorization | re-read them every session | violations have real consequences
PRACTICE: Create a one-page rules digest for a lab program from its public policy.
SOURCES: None
---
## Core idea
Every program publishes rules — sometimes called a policy, terms, or code of conduct. These convert a vague invitation into a precise authorization. Rules typically define in-scope assets, prohibited techniques (DoS, social engineering, physical attacks, automated mass scanning), disclosure expectations, and reward eligibility. They may also set a "one root cause per report" rule and define duplicates. Reading rules is not a formality: it is the single most important step before testing. Rules change over time, so re-read them at the start of every session. Violating a rule can get you banned from the platform, forfeit a reward, or expose you legally. A disciplined researcher keeps a timestamped local copy.

### Method
Create a rules digest: scope, banned techniques, rate limits, disclosure terms, reward rules, and contact. Check each technique you plan against the banned list before using it.

```bash
# Snapshot the rules page with a timestamp for your records
curl -sS -L https://<LAB_HOST>/policy -o "policy_$(date +%F).html"
# Store locally; do not redistribute private program rules
```

### Checklist
- [ ] Scope captured
- [ ] Banned techniques listed
- [ ] Rate limits noted
- [ ] Disclosure terms saved

### Common mistakes
- Reading rules once and never again.
- Skimming the banned-technique list.
- Assuming verbal permission is enough.

### Safety & scope
If the rules are silent on a technique, ask before acting rather than assuming it is allowed.

### Knowledge check
Q: Why must rules be re-read at each session?
A: Because they change, and authorization depends on the current version.

===MODULE===
TITLE: Program Selection Strategy
LEVEL: Beginner
MINUTES: 30
SUMMARY: Choose programs strategically by scoring scope, fit, triage speed, rewards, and competition.
OBJECTIVES: score candidate programs | match targets to skills | avoid wasted effort
TAKEAWAYS: selection is a strategic decision | competition and triage speed matter | rotate targets to avoid burnout
PRACTICE: Build a scored shortlist of three lab programs using a 1-5 matrix.
SOURCES: None
---
## Core idea
Not all programs reward effort equally. Selecting the right program is a strategic decision based on your skills, time budget, and goals. Beginners often do better on programs with broad scope, fast triage, and lower competition; specialists may target programs whose tech stack matches their expertise. Consider the reward table (are low-severity bugs paid?), the program's age (new programs have more low-hanging fruit), the response SLA, and the duplicate rate. Public programs are open to everyone, so common bugs are often already found. Private invitations reduce competition. A smart selection process tracks a shortlist and rotates targets to avoid burnout. Remember that every hour spent on an out-of-scope or stale program is an hour not spent learning.

### Method
Score each candidate program 1-5 on: scope breadth, fit with your skills, triage speed, reward clarity, and competition level. Pick the highest scorer you can access.

```bash
# Maintain a simple selection matrix in a CSV
cat >> programs.csv <<'CSV'
<LAB_HOST>,scope:4,skill_fit:5,triage:3,reward:4,competition:2
CSV
```

### Checklist
- [ ] Scope breadth scored
- [ ] Skill fit scored
- [ ] Triage speed scored
- [ ] Competition estimated

### Common mistakes
- Chasing only the largest bounties.
- Ignoring the duplicate rate.
- Sticking with one stale program.

### Safety & scope
A high score never overrides scope rules; eligibility comes first.

Public disclosure of a private program's rules is a policy breach; keep your notes local and share only what the policy permits.

### Knowledge check
Q: Which factor most reduces duplicate risk?
A: Lower competition, e.g., a private or lightly tested program.

===MODULE===
TITLE: Reading Scope Statements
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Parse scope tables precisely so you test only authorized hosts and assets.
OBJECTIVES: interpret wildcards | build allowlists and denylists | verify ownership
TAKEAWAYS: scope is authoritative | wildcards have strict meanings | third parties are usually excluded
PRACTICE: Convert a lab program's scope table into allowlist and denylist files.
SOURCES: None
---
## Core idea
The scope statement is the authoritative list of what you may test. It usually appears as a table of domains, IP ranges, applications, or mobile apps, each labeled with eligibility. Some assets are "in scope" (eligible for bounty), "in scope but bounty excluded" (you may test but will not be paid), or "out of scope." Wildcards matter: `*.example.com` covers subdomains but not the apex or unrelated domains. Third-party services (CDNs, payment processors) are almost always excluded because the owner cannot authorize testing them. Static assets and marketing sites often carry lower priority. Reading scope carefully prevents the most common failure — testing a host that looks related but is not authorized.

### Method
Parse the scope into an allowlist and denylist before testing. Resolve each in-scope hostname to confirm it is live and owned by the program, then record it in your inventory.

```bash
# Resolve an in-scope host to confirm ownership before testing
dig +short A <LAB_HOST>
dig +short CNAME <LAB_HOST>
# Compare against the scope table; stop if it does not match
```

### Checklist
- [ ] Allowlist written
- [ ] Denylist written
- [ ] Wildcards interpreted
- [ ] Hostnames resolved

### Common mistakes
- Treating `*.domain` as covering the apex domain.
- Testing a CDN or third-party host.
- Assuming "related" means "in scope."

### Safety & scope
If a hostname does not appear explicitly in scope, do not test it.

### Knowledge check
Q: Does `*.example.com` include `example.com`?
A: No. Wildcard subdomain entries exclude the bare apex domain.

===MODULE===
TITLE: Rules of Engagement in Practice
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Translate scope and policy into operational constraints that protect availability and data.
OBJECTIVES: build a RoE checklist | respect rate limits | define stop conditions
TAKEAWAYS: RoE governs how you test | availability and data are the key concerns | silence means ask first
PRACTICE: Write a RoE checklist for a lab target including rate limits and stop conditions.
SOURCES: None
---
## Core idea
Rules of Engagement (RoE) translate scope into operational constraints: which techniques are allowed, what windows apply, which accounts to use, and how to avoid disruption. A RoE may permit automated scanning on staging but forbid it on production. It may require test accounts, forbid certain HTTP methods, or cap request rates. The RoE exists to protect availability and data — the two things program owners fear most. Ignoring it can turn a valid finding into a policy violation. Researchers should internalize the RoE as a checklist applied at every step, not a document read once. When the RoE is silent on a technique, ask before acting.

### Method
Reduce the RoE to a per-target checklist: allowed techniques, forbidden techniques, rate limits, test-account rules, and stop conditions. Validate every planned tool against it.

```bash
# Example: respectful, rate-limited check within permitted scope
ffuf -u https://<LAB_HOST>/FUZZ -w words.txt -rate 5 -recursion 0
# -rate caps requests/second; -recursion 0 avoids runaway crawling
```

### Checklist
- [ ] Allowed techniques listed
- [ ] Forbidden techniques listed
- [ ] Rate limits set
- [ ] Stop conditions defined

### Common mistakes
- Using default tool speeds on production.
- Enabling aggressive recursion or scripts.
- Assuming staging rules apply to production.

### Safety & scope
Stop at the first sign of service degradation, regardless of what the RoE permits.

### Knowledge check
Q: What should you do when the RoE does not mention a technique?
A: Ask the program owner before using it.

===MODULE===
TITLE: Out-of-Scope Assets and Exclusions
LEVEL: Intermediate
MINUTES: 30
SUMMARY: Enforce the denylist that keeps every engagement legal, safe, and within authorization.
OBJECTIVES: identify common exclusions | handle redirects and gray zones | enforce the denylist
TAKEAWAYS: the denylist is as important as the allowlist | third parties and user data are excluded | stop when boundaries blur
PRACTICE: Build an allowlist/denylist/gray-zone table for a lab program.
SOURCES: None
---
## Core idea
Out-of-scope assets are the boundaries that keep a bounty legal and safe. Common exclusions include third-party services, partner-owned subdomains, production data, physical premises, social engineering of staff, and denial-of-service testing. Some programs exclude entire categories like DoS, spam, or brute force. These exclusions are not suggestions. They exist because the owner cannot authorize what it does not control, or because the harm risk outweighs the learning value. A disciplined researcher treats the denylist as more important than the allowlist. Before each test, check the target against the denylist. If an in-scope host redirects to an out-of-scope one, stop. If a parameter returns real user data, stop and report through the proper channel.

### Method
Build a two-column boundary table: allowlist from scope, denylist from exclusions. Add a "gray zone" column for ambiguous assets and resolve each with the program owner.

```bash
# Follow redirects only to verify they stay inside scope, then stop
curl -sS -I -L https://<LAB_HOST>/ | grep -i '^location:'
# -I headers only; review each hop against the scope table
```

### Checklist
- [ ] Denylist recorded
- [ ] Redirects checked
- [ ] Gray zones flagged
- [ ] Third parties identified

### Common mistakes
- Following a redirect into a third-party host.
- Testing excluded vulnerability categories.
- Assuming exclusions are optional.

### Safety & scope
When an asset's status is unclear, treat it as out of scope until confirmed.

### Knowledge check
Q: An in-scope host redirects to a partner domain. What now?
A: Stop — the destination is outside your authorization.

===MODULE===
TITLE: Bounty Tables and Reward Logic
LEVEL: Intermediate
MINUTES: 30
SUMMARY: Read severity-to-reward tables to prioritize effort where impact and payment align.
OBJECTIVES: interpret severity tiers | spot non-eligible categories | align effort with reward
TAKEAWAYS: tables map impact to payment | final severity is set by triage | use the table for planning only
PRACTICE: Transcribe a lab program's bounty table and tag three hypothetical findings with tiers.
SOURCES: None
---
## Core idea
A bounty table maps vulnerability severity to reward. Most programs use tiers such as low, medium, high, and critical, sometimes with an "informational" or "none" row. Severity is usually driven by impact and exploitability, not by how clever the bug is. Understanding the table helps you prioritize: a critical RCE may pay many times a low-severity header issue. Tables often include bonuses, for example extra for a novel technique or a chain. They may also list "not eligible" categories such as self-XSS or missing security headers. Read the table before testing so you invest effort where it counts. Remember that the table is the owner's policy, not a guarantee — final severity is set by triage. Use it as a planning tool, not a promise.

### Method
For each program, copy the bounty table into your notes with severity criteria. Tag each candidate finding with an expected tier before writing the report.

```bash
# Store a local copy of reward-table text for reference
curl -sS https://<LAB_HOST>/bounties | sed -n '1,80p' > reward_table_notes.txt
# Review tiers and "not eligible" rows before prioritizing
```

### Checklist
- [ ] Tiers recorded
- [ ] Criteria captured
- [ ] Non-eligible categories noted
- [ ] Bonuses noted

### Common mistakes
- Chasing informational issues for pay.
- Assuming the table guarantees a reward.
- Ignoring the "not eligible" list.

### Safety & scope
Reward expectations never justify exceeding scope; eligibility always comes first.

### Knowledge check
Q: What primarily drives a severity tier?
A: Impact and exploitability, as defined by the program's criteria.

===MODULE===
TITLE: Duplicates, Program State, and Triage Queues
LEVEL: Intermediate
MINUTES: 30
SUMMARY: Understand duplicates, program states, and queues so you avoid wasted effort and collisions.
OBJECTIVES: define duplicates | read program state | use disclosed reports
TAKEAWAYS: duplicates are normal and usually unpaid | program state controls eligibility | disclosed reports reveal tested ground
PRACTICE: Review the public hacktivity of a lab program and list already-fixed issue types.
SOURCES: None
---
## Core idea
A duplicate is a report describing a vulnerability already reported by someone else. Duplicates are normal in mature programs and usually pay nothing, though some platforms give a small bonus. Program state refers to whether a program is accepting reports, paused, or only taking specific issue types. Triage queues are the operational reality: reports wait in line, and response time varies. Understanding these dynamics prevents wasted effort. Check recent activity and known fixes before hunting; many platforms show which report types have already been addressed. Focus on novel vectors, deeper chains, and less-explored assets to avoid collisions. If you discover a duplicate, respond professionally, seek the original report link where allowed, and move on.

### Method
Before testing, scan the program's disclosed reports and recent fixes. Maintain a personal "already reported" list per target to avoid rework.

```bash
# Read publicly disclosed reports to learn what has been found
curl -sS https://hackerone.com/<LAB_HOST>/hacktivity | grep -i 'disclosed\|resolved' | head -20
# Informational only; never rely on scraped data as authoritative
```

### Checklist
- [ ] Program state checked
- [ ] Recent fixes reviewed
- [ ] Duplicate policy noted
- [ ] Personal "already reported" list started

### Common mistakes
- Ignoring a paused program's state.
- Retesting widely known issues.
- Complaining about a duplicate publicly.

### Safety & scope
Disclosed reports are guidance; always verify current scope yourself.

### Knowledge check
Q: Why do duplicates happen even to careful researchers?
A: Many researchers test the same in-scope assets at the same time.

===MODULE===
TITLE: Passive Reconnaissance Fundamentals
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Build an attack-surface map from public data without sending traffic to the target.
OBJECTIVES: define passive recon | use third-party sources | record findings in an inventory
TAKEAWAYS: passive recon leaves no direct footprint | it is the safest starting point | it narrows later active work
PRACTICE: Perform a passive-only enumeration of a lab domain and list every artifact found.
SOURCES: None
---
## Core idea
Passive reconnaissance gathers information without sending traffic to the target. It uses third-party data sources — search engines, certificate logs, DNS caches, archives, and code repositories — so the target cannot easily detect you. Passive recon is the safest starting point for any authorized engagement because it carries virtually no risk of disruption and leaves no direct footprint. The goal is to enumerate the attack surface: hostnames, IP ranges, technologies, employee names, and leaked secrets. Everything you learn passively narrows the active testing that follows. Think of it as building a map before entering the building. Because it uses public data, passive recon is a low-risk first step — but still follow the program's rules about what you may collect and retain.

### Method
Run a passive-only enumeration pass and record every artifact in a structured inventory. Correlate hostnames, IPs, and technologies; flag anything interesting for active validation.

```bash
# Passive subdomain enumeration with a public data source
subfinder -d <LAB_HOST> -silent -o passive_subs.txt
# -silent reduces noise; output feeds your inventory
wc -l passive_subs.txt
```

### Checklist
- [ ] Data sources chosen
- [ ] Artifacts captured
- [ ] Inventory updated
- [ ] Leads flagged

### Common mistakes
- Treating passive data as verified fact.
- Collecting more data than needed.
- Skipping scope checks on discovered names.

### Safety & scope
Passive data may include out-of-scope assets; filter before any active step.

### Knowledge check
Q: Why start with passive recon?
A: It maps the surface safely, without touching the target or risking disruption.

===MODULE===
TITLE: Certificate Transparency Logs
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Mine public certificate logs to discover forgotten subdomains and hidden entry points.
OBJECTIVES: explain CT logs | query log aggregators | validate discovered names
TAKEAWAYS: CT logs record every public certificate | SANs reveal many hostnames | results are noisy and need validation
PRACTICE: Query CT logs for a lab domain and deduplicate the hostnames found.
SOURCES: None
---
## Core idea
Certificate Transparency (CT) logs are public ledgers of TLS certificates issued by certificate authorities. Because every publicly trusted certificate must be logged, CT logs are a goldmine for discovering subdomains — including internal or forgotten hosts that were never meant to be public. Querying CT logs is passive and safe. Tools like crt.sh or certspotter aggregate this data. A single certificate can reveal dozens of hostnames via Subject Alternative Names (SANs). The catch is that CT data is noisy: it contains expired, parked, and third-party domains. Always validate findings against the scope before testing. CT recon often surfaces dev, staging, and VPN endpoints that become high-value targets. Treat each discovered name as a lead, not a verified asset.

### Method
Query CT logs for your authorized domain, extract unique hostnames, and deduplicate. Cross-check each against the scope table; discard out-of-scope names.

```bash
# Query a public CT log aggregator for hostnames
curl -sS "https://crt.sh/?q=%.<LAB_HOST>&output=json" | jq -r '.[].name_value' | sort -u
# %.<LAB_HOST> matches subdomains; jq extracts names; sort -u dedupes
```

### Checklist
- [ ] CT query run
- [ ] SANs extracted
- [ ] Duplicates removed
- [ ] Scope checked per name

### Common mistakes
- Testing every CT result without validation.
- Ignoring expired or parked entries.
- Forgetting third-party hosts in SANs.

### Safety & scope
A hostname in a certificate is not proof of ownership or scope; verify it.

### Knowledge check
Q: What makes CT logs valuable for recon?
A: They publicly record certificates, exposing subdomains through SAN fields.

===MODULE===
TITLE: DNS Reconnaissance
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Enumerate DNS record types to map infrastructure and identify in-scope assets.
OBJECTIVES: interpret common record types | trace CNAME chains | use DNS history safely
TAKEAWAYS: records reveal ownership and services | CNAMEs often expose third parties | avoid unauthorized zone transfers
PRACTICE: Collect A, CNAME, MX, NS, and TXT records for a lab domain.
SOURCES: None
---
## Core idea
DNS reconnaissance maps names to addresses and reveals infrastructure relationships. Record types tell different stories: A records map hostnames to IPv4, AAAA to IPv6, CNAME to aliases (often exposing third-party services), MX to mail servers, NS to name servers, and TXT to verification tokens and SPF policies. DNS is a low-risk source when queried against public resolvers. Zone transfers (AXFR) are a special case — they can dump an entire zone but are almost always restricted and, if attempted without permission, may violate policy. Stick to standard lookups. DNS history services can reveal old IPs that still serve content. The output feeds your inventory and helps identify which subdomains are alive.

### Method
Collect multiple record types for each host, resolve CNAME chains, and note third-party dependencies (which may be out of scope). Use DNS history to find stale-but-live assets.

```bash
# Enumerate common DNS records for an in-scope domain
for t in A AAAA CNAME MX NS TXT; do echo "--- $t"; dig +short $t <LAB_HOST>; done
# +short gives concise answers for note-taking
```

### Checklist
- [ ] A/AAAA collected
- [ ] CNAME chains traced
- [ ] MX/NS/TXT noted
- [ ] Third parties flagged

### Common mistakes
- Attempting zone transfers without permission.
- Ignoring CNAME targets that are out of scope.
- Trusting stale DNS history blindly.

### Safety & scope
Standard lookups are fine; never attempt unauthorized zone transfers.

### Knowledge check
Q: What does a CNAME record often reveal?
A: An alias to another host, frequently a third-party service that may be out of scope.

===MODULE===
TITLE: Search Engine Dorking
LEVEL: Intermediate
MINUTES: 30
SUMMARY: Use advanced search operators to surface indexed pages, files, and exposed interfaces.
OBJECTIVES: apply search operators | generate hypotheses | avoid over-scanning
TAKEAWAYS: dorking is passive and public | it produces leads, not proof | most results are false positives
PRACTICE: Build a dork library for a lab domain covering panels, files, and parameters.
SOURCES: None
---
## Core idea
Search engine dorking uses advanced query syntax to surface indexed pages, files, and misconfigurations that are publicly visible but hard to find by browsing. Operators like `site:`, `inurl:`, `filetype:`, `intitle:`, and `ext:` let you filter results precisely. Dorking is passive and can reveal admin panels, exposed documents, directory listings, parameter-heavy URLs, and subdomains. Because search engines crawl continuously, they may have indexed content removed from navigation. The technique is powerful but noisy; most results are false positives. Use dorking to generate hypotheses for active validation, not as proof of a vulnerability. Respect the search engine's terms and avoid automated scraping that violates them.

### Method
Build a dork library grouped by goal — panels, files, params, subdomains — and run them against your authorized domain. Save candidate URLs for manual review.

```bash
# Example dorks (run manually in a browser); kept as text for notes
# site:<LAB_HOST> inurl:admin
# site:<LAB_HOST> ext:pdf OR ext:xlsx
# site:<LAB_HOST> inurl:"?id="
echo "Dorks prepared for manual search on <LAB_HOST>"
```

### Checklist
- [ ] Dork library written
- [ ] Panels searched
- [ ] Files searched
- [ ] Candidates saved

### Common mistakes
- Treating a dork result as a confirmed bug.
- Automated scraping that breaks terms of service.
- Forgetting to check scope on each URL.

### Safety & scope
Dork results may point to out-of-scope or third-party hosts; verify before visiting.

### Knowledge check
Q: What is the role of a dork result?
A: A lead or hypothesis that must be validated, not proof of a flaw.

===MODULE===
TITLE: GitHub and Code Search Reconnaissance
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Find exposed secrets, hostnames, and configuration details in public code repositories.
OBJECTIVES: search public code safely | triage leaked secrets | report exposures without using them
TAKEAWAYS: public repos often leak credentials | never use found secrets against production | redact and minimize captured data
PRACTICE: Search public code for a lab domain and document one exposure without using the credential.
SOURCES: None
---
## Core idea
Public code repositories and code-search engines frequently expose secrets, internal hostnames, API keys, and configuration details related to an authorized target. Developers accidentally commit credentials, `.env` files, or CI/CD configs. GitHub search and alternatives let you query for strings like the target domain, API tokens, or distinctive project names. This is passive recon: you are reading public data. However, if you find live credentials, do not use them against production — that would exceed authorization and access data you are not permitted to touch. Instead, report the exposure through the program channel. Data minimization is critical: capture only enough to prove the leak, redact secrets in your notes, and never exfiltrate repository contents.

### Method
Search for the target's domain and known project names in public code; look for config and key files. Triage results by relevance and report exposures without using the credentials.

```bash
# Search public code via a CLI helper (read-only)
gh api search/code -f q='"in-scope-label" <LAB_HOST>' --jq '.items[].html_url' | head -20
# Review URLs manually; do not clone or download private data
```

### Checklist
- [ ] Domain searched
- [ ] Config files reviewed
- [ ] Exposures logged
- [ ] Secrets redacted

### Common mistakes
- Using a leaked key to "verify" it.
- Downloading entire repositories.
- Including real secrets in notes.

### Safety & scope
Never authenticate with found credentials; reporting the exposure is the authorized action.

### Knowledge check
Q: What should you do with a live API key found in public code?
A: Redact it and report the exposure through the official program channel.

===MODULE===
TITLE: Active Discovery and Probing
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Confirm which discovered hosts are live using gentle, authorized, low-volume requests.
OBJECTIVES: validate passive inventory | probe respectfully | record responses
TAKEAWAYS: active probing leaves logs on the target | keep volume low | stop on scope violations
PRACTICE: Probe a small list of lab hostnames and record status codes and titles.
SOURCES: None
---
## Core idea
Active discovery involves sending traffic to the target to confirm what is live. Unlike passive recon, it leaves logs on the target, so it must be authorized and carefully controlled. The goal is to validate the passive inventory: which hostnames resolve, which respond over HTTP/HTTPS, and which are truly in scope. Active probing should be gentle — normal requests, low concurrency, no fuzzing yet. Rate limits matter: a flood of requests can resemble an attack and disrupt service. Use HEAD or GET requests to check status codes and titles. Record responses in your inventory. Stop immediately if you touch an out-of-scope host or see signs of production data. Active discovery bridges the map and the test; it should be deliberate, not automated chaos.

### Method
Take your passive hostname list and probe each with a single lightweight request. Record status code, title, and redirect target; mark live/dead and in/out of scope.

```bash
# Gentle liveness check across a small host list
while read -r h; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "https://$h" 2>/dev/null)
  echo "$h $code"
done < passive_subs.txt
# One request per host; adjust only within RoE rate limits
```

### Checklist
- [ ] Host list loaded
- [ ] One request per host
- [ ] Status codes recorded
- [ ] Out-of-scope removed

### Common mistakes
- Running parallel mass requests.
- Fuzzing during the discovery phase.
- Ignoring redirect destinations.

### Safety & scope
Keep concurrency at one and respect rate limits; stop if service seems affected.

### Knowledge check
Q: Why is active probing riskier than passive recon?
A: It sends traffic to the target and leaves detectable logs.

===MODULE===
TITLE: Subdomain Validation
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Confirm that discovered subdomains are real, live, and authorized before testing them.
OBJECTIVES: filter false positives | combine validation signals | enforce scope
TAKEAWAYS: enumeration lists are noisy | validate with multiple signals | wildcards can mislead
PRACTICE: Validate a list of lab subdomains and keep only confirmed in-scope hosts.
SOURCES: None
---
## Core idea
Subdomain validation is the discipline of confirming that a discovered name is real, live, and authorized before you test it. Subdomain enumeration tools produce many false positives: dangling CNAMEs, expired domains, and parked pages. Validation separates genuine assets from noise. Techniques include DNS resolution, HTTP status checks, TLS certificate inspection, and content fingerprinting. A subdomain that resolves but returns a default hosting page may be out of scope or third-party. Wildcard DNS can make every query resolve, so verify with content, not just an IP. Validation protects you from accidentally testing infrastructure you do not own. It also improves efficiency: you focus on assets that actually respond.

### Method
For each candidate subdomain, record: resolves? HTTP status? title/server? matches scope? Combine signals to accept or reject.

```bash
# Validate a list of subdomains with httpx-style probing
httpx -l passive_subs.txt -status-code -title -server -o validated.txt
# Review validated.txt; keep only rows that match the scope table
```

### Checklist
- [ ] DNS resolution checked
- [ ] HTTP status recorded
- [ ] Content fingerprinted
- [ ] Scope matched

### Common mistakes
- Trusting a resolving name as "live."
- Falling for wildcard DNS.
- Ignoring default hosting pages.

### Safety & scope
A validated but out-of-scope host stays out of scope; never test it.

Revalidate periodically: a host that is dead today may be repointed tomorrow, so refresh your list before each session.

### Knowledge check
Q: Why check content and not just DNS resolution?
A: Wildcard DNS and parked domains can resolve without hosting a real service.

===MODULE===
TITLE: Port Scanning and Service Discovery
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Discover exposed services only where the RoE permits, with minimal, controlled scans.
OBJECTIVES: confirm scanning permission | scan gently | interpret service banners
TAKEAWAYS: most bounty value is on web ports | scanning is often restricted | a single open port can be high value
PRACTICE: Run one gentle, limited scan against a lab host and record open ports and banners.
SOURCES: None
---
## Core idea
Port scanning identifies which services are exposed on a host. For bug bounty, the vast majority of findings come from web services on ports 80/443, so heavy scanning is rarely necessary and often prohibited. Many programs explicitly ban port scanning or limit it to in-scope IPs. When permitted, keep it minimal: scan only in-scope hosts, use low intensity, avoid aggressive scripts that can crash services. The value is in discovering forgotten services — admin panels, APIs, dev servers — that may be vulnerable. Service discovery adds version and banner information to prioritize. Always cross-check against the RoE before scanning; if the program forbids it, rely on passive data instead. A single unexpected open port can be high-value, but an outage caused by aggressive scanning can end your engagement.

### Method
Confirm scanning is permitted, then run a limited connect scan on in-scope hosts only. Capture open ports and banners, and stop at the first sign of disruption.

```bash
# Lab/authorized-only: gentle service scan of a single in-scope host
nmap -sT -Pn --top-ports 20 --open <LAB_HOST>
# -sT connect scan; --top-ports limits load; expand only if RoE allows
```

### Checklist
- [ ] RoE permission confirmed
- [ ] Only in-scope IPs targeted
- [ ] Low intensity used
- [ ] Banners recorded

### Common mistakes
- Running default intense scans on production.
- Using aggressive NSE scripts without permission.
- Scanning out-of-scope IPs "just in case."

### Safety & scope
If scanning is not explicitly allowed, do not scan; use passive sources only.

### Knowledge check
Q: What is the safest default for port scanning in bounty?
A: Do not scan unless the RoE explicitly permits it; keep it minimal if allowed.

===MODULE===
TITLE: Technology Fingerprinting
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Identify frameworks, servers, and libraries to choose relevant, efficient test cases.
OBJECTIVES: collect fingerprint signals | verify automated guesses | map tech to tests
TAKEAWAYS: headers and HTML reveal the stack | manual confirmation beats blind tool trust | versions can be reportable
PRACTICE: Fingerprint a lab target and list three relevant test classes for its stack.
SOURCES: None
---
## Core idea
Technology fingerprinting identifies the frameworks, servers, and libraries behind an application. Knowing that a site runs a particular CMS, framework, or CDN helps you select relevant tests — a WordPress site invites plugin checks, while a React single-page app invites API-focused testing. Fingerprints come from response headers, cookies, HTML patterns, file extensions, error pages, and JavaScript bundles. Tools automate signature matching, but manual observation is often more accurate. Fingerprinting is low-risk when done through normal requests. The output is a technology profile per host that guides your testing playbook. Be careful not to over-trust automated guesses; verify against multiple signals. Publicly exposed technology versions can themselves be reportable if severely outdated.

### Method
Collect headers and page source for each live host, run a fingerprinting tool, and confirm results manually. Map each technology to a short list of relevant tests.

```bash
# Fingerprint a lab target from headers and HTML
whatweb https://<LAB_HOST> --color=never
# Correlate with: curl -sS -I https://<LAB_HOST>
```

### Checklist
- [ ] Headers collected
- [ ] Tool fingerprint run
- [ ] Results manually confirmed
- [ ] Tests mapped to stack

### Common mistakes
- Trusting a single tool's guess.
- Ignoring version-bearing headers.
- Testing irrelevant bug classes.

### Safety & scope
Fingerprinting through normal requests is fine; never use intrusive probes outside RoE.

Record the evidence behind each fingerprint so you can defend it later if triage questions your test selection.

### Knowledge check
Q: Why verify fingerprinting results manually?
A: Automated signatures can misidentify or miss customized stacks.

===MODULE===
TITLE: Endpoint and Parameter Mining
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Discover the URLs, API routes, and input parameters that form the real test surface.
OBJECTIVES: crawl and extract routes | mine JavaScript and archives | build an endpoint inventory
TAKEAWAYS: endpoints and parameters are the test surface | JS bundles hide many routes | deduplicate and group by function
PRACTICE: Extract historical URLs for a lab domain and build a route/parameter table.
SOURCES: None
---
## Core idea
Endpoint and parameter mining discovers the URLs, API routes, and input parameters that an application exposes. These are the actual test surfaces. Sources include crawling the site, reading JavaScript bundles, extracting links from archives, and observing traffic in a proxy. Each parameter is a potential injection point; each endpoint is a potential access-control boundary. Mining should be exhaustive but respectful: crawl at modest depth and rate. Deduplicate routes and group them by function (auth, search, upload, admin). Parameters hidden in JS or POST bodies are often missed by shallow crawls. The output is a structured endpoint and parameter inventory that feeds systematic testing.

### Method
Combine passive URL sources with a gentle crawl, then extract parameters from each request. Store a table of method, path, parameters, and notes.

```bash
# Collect historical URLs for a lab target
echo "<LAB_HOST>" | waybackurls | sort -u > urls.txt
# Review; feed interesting paths to manual testing, not mass fuzzing
```

### Checklist
- [ ] Archive URLs collected
- [ ] Routes deduplicated
- [ ] Parameters extracted
- [ ] Grouped by function

### Common mistakes
- Crawling too aggressively.
- Ignoring POST-body parameters.
- Fuzzing every URL without triage.

### Safety & scope
Only mine assets that appear in the allowlist; exclude third-party routes.

Group routes by privilege level as well, since elevated endpoints deserve deeper and more careful testing.

### Knowledge check
Q: Why read JavaScript bundles during mining?
A: They often reference API routes and parameters not visible in the HTML.

===MODULE===
TITLE: Attack Surface Mapping
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Consolidate recon into a layered map that reveals entry points and coverage gaps.
OBJECTIVES: build a layered map | identify trust boundaries | spot untested areas
TAKEAWAYS: a map integrates all recon | diagrams reveal relationships | every node must be in scope
PRACTICE: Draw a four-layer attack surface map for a lab application.
SOURCES: None
---
## Core idea
Attack surface mapping consolidates everything you have learned into a coherent picture of the target: hosts, endpoints, parameters, technologies, and trust boundaries. It answers "where can I attack?" A good map highlights entry points — login forms, file uploads, API gates, webhooks — and the data flows between them. Visual maps often reveal relationships that lists hide. The map is a living document updated as you discover new assets. It also exposes gaps: areas you have not examined. In bug bounty, a complete map is a competitive advantage because most researchers test only the obvious paths. Keep the map scoped: every node should be justified by the scope table.

### Method
Build a map with four layers: network (hosts/ports), application (routes/params), identity (auth flows), and data (stores/flows). Annotate each node with in/out-of-scope status.

```bash
# Generate a simple text map skeleton from your inventory files
cat hosts.txt endpoints.txt params.txt | sort -u > attack_surface.txt
# Review and organize into the four layers manually
```

### Checklist
- [ ] Network layer mapped
- [ ] Application layer mapped
- [ ] Identity layer mapped
- [ ] Data layer mapped

### Common mistakes
- Mapping only the main website.
- Ignoring data flows between components.
- Letting out-of-scope nodes creep in.

### Safety & scope
Only nodes justified by the scope table belong in the map.

Update the map whenever a new asset is confirmed so it stays a reliable picture of the target.

### Knowledge check
Q: What does the identity layer capture?
A: Authentication and session flows, including login, logout, and reset.

===MODULE===
TITLE: Asset Inventory and Data Models
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Maintain a structured, queryable inventory that tracks coverage and prevents retesting.
OBJECTIVES: define an inventory schema | normalize observations | keep raw data separate from interpretation
TAKEAWAYS: structured records beat ad-hoc notes | unique IDs and timestamps help | the inventory drives planning
PRACTICE: Create a CSV inventory with at least five lab assets and standardized fields.
SOURCES: None
---
## Core idea
An asset inventory is a structured, queryable record of every in-scope asset and what you know about it. Ad-hoc notes fail at scale; a disciplined inventory lets you avoid retesting, track coverage, and spot patterns. Useful fields include hostname, IP, status, technology, endpoints, owner, scope status, and findings. Data models help: keep raw observations separate from interpretations so you can revisit evidence. A simple CSV or spreadsheet is enough. The inventory becomes the backbone of your workflow — every tool's output should land in it. Good inventory hygiene is what separates professionals from hobbyists.

### Method
Define a schema, then append normalized records from each recon step. Use unique IDs and timestamps. Review the inventory before each session to plan next steps.

```bash
# Append a normalized asset record
cat >> inventory.csv <<'CSV'
id,host,ip,status,tech,scope,notes
A001,<LAB_HOST>,192.0.2.10,live,nginx,in,candidate-admin
CSV
```

### Checklist
- [ ] Schema defined
- [ ] Unique IDs used
- [ ] Raw vs interpreted separated
- [ ] Coverage reviewed

### Common mistakes
- Dumping raw tool output with no structure.
- Losing track of tested assets.
- Mixing guesses with facts.

### Safety & scope
Mark scope status for every record so out-of-scope assets are never tested.

Review the inventory before closing a session so nothing is left unrecorded. A stale inventory is worse than none, because it creates false confidence about what has already been covered. Schedule a short cleanup at the end of every engagement.

### Knowledge check
Q: Why keep raw observations separate from interpretations?
A: So you can re-examine evidence without bias from earlier conclusions.

===MODULE===
TITLE: Note-Taking Systems
LEVEL: Intermediate
MINUTES: 30
SUMMARY: Build a searchable, template-driven note system that preserves evidence and decisions.
OBJECTIVES: design a note structure | capture commands and outputs | separate facts from guesses
TAKEAWAYS: write things down immediately | link evidence to conclusions | timestamps create a timeline
PRACTICE: Set up a three-tier note structure for a lab engagement using templates.
SOURCES: None
---
## Core idea
Note-taking is the memory of your engagement. A good system captures observations, commands, outputs, hypotheses, and decisions so you can search them later. Many researchers use a wiki-style tool with a consistent template per target and per finding. The key principles are: write things down immediately, keep evidence linked to conclusions, and separate facts from guesses. Timestamped entries create a timeline that helps with reporting and with proving authorized behavior. Notes also support knowledge checks — revisiting why a hypothesis failed reinforces learning. Avoid dumping raw tool output without commentary; annotate what mattered.

### Method
Adopt a three-tier note structure: target page, asset inventory, and finding drafts. Use templates so every important question gets answered.

```bash
# Create a dated session note from a template
cp templates/session.md "notes/$(date +%F)-<LAB_HOST>.md"
# Fill in: goals, commands run, observations, next steps
```

### Checklist
- [ ] Target template exists
- [ ] Inventory linked
- [ ] Finding drafts created
- [ ] Entries timestamped

### Common mistakes
- Relying on memory instead of notes.
- Logging output with no commentary.
- Blending facts with assumptions.

### Safety & scope
Notes may contain sensitive output; redact secrets before sharing or publishing.

Good notes also make it easy to hand an engagement to a teammate or resume after a long break. Write for a reader who has never seen the target, and include the reasoning behind each decision. Future you will thank you.

### Knowledge check
Q: Why annotate tool output in notes?
A: Unannotated output loses meaning and cannot support a later report.

===MODULE===
TITLE: Prioritization Frameworks
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Rank mapped assets by likely payoff so limited time goes to the highest-value targets.
OBJECTIVES: score impact and exploitability | weigh novelty and effort | update scores dynamically
TAKEAWAYS: prioritization converts data into a test order | novelty can beat obvious targets | scores are revisable
PRACTICE: Score five lab assets on impact, exploitability, novelty, and effort.
SOURCES: None
---
## Core idea
Prioritization decides what to test first. With limited time, you need a framework that ranks targets by likely payoff. A common approach scores each asset on impact (what a bug would affect), exploitability (how easy to find), likelihood (how likely a bug exists), and effort (time cost). Multiply or weight these to get a priority score. CVSS concepts can be borrowed but are for reporting, not triaging your own time. Another lens is novelty: unexplored assets may hide bigger bugs than well-tested ones. Prioritization is dynamic — update scores as you learn. The goal is to avoid spending hours on low-value targets while high-value ones go untouched.

### Method
Score every mapped asset 1-5 on impact, exploitability, and novelty; divide by effort. Test in descending order, revisiting scores weekly.

```bash
# Compute a simple priority score for a target row
# score = (impact * exploitability * novelty) / effort
echo "Target <LAB_HOST>: (5*3*4)/2 = 30"
```

### Checklist
- [ ] Impact scored
- [ ] Exploitability scored
- [ ] Novelty scored
- [ ] Effort estimated

### Common mistakes
- Testing in discovery order rather than priority order.
- Ignoring how hard a target is to test.
- Never revisiting scores.

### Safety & scope
A high-priority score never overrides scope; filter by authorization first.

Recalculate priority after each new discovery rather than clinging to the first score you assigned.

### Knowledge check
Q: Why include novelty in prioritization?
A: Less-tested assets often hide bugs that others have not found.

===MODULE===
TITLE: Target Selection and Time Budgeting
LEVEL: Intermediate
MINUTES: 30
SUMMARY: Convert strategy into a schedule with timeboxes, deliverables, and stop conditions.
OBJECTIVES: timebox sessions | set stop conditions | track time accurately
TAKEAWAYS: time is the scarce resource | every block should produce a note | reporting is part of the budget
PRACTICE: Plan a 60-minute lab session with three timeboxed blocks and deliverables.
SOURCES: None
---
## Core idea
Time is your scarcest resource. Target selection and time budgeting convert strategy into a schedule. Allocate fixed blocks to recon, testing, and reporting; avoid endless exploration without outputs. Many researchers use timeboxing: for example, 30 minutes of passive recon, 60 minutes of focused testing on the top target, and 20 minutes documenting. Set a stop condition for each block — either a finding, a clear dead end, or time expiry. Rotate targets to prevent fatigue. Track actual time spent per program to calibrate future estimates. Remember that reporting is part of the job; a finding not written is worthless.

### Method
Plan a session with explicit timeboxes and deliverables. Use a timer, and end each block by writing a note — even if it is "no finding."

```bash
# Start a simple timebox note for a 45-minute block
date +"Start %H:%M" > session_timer.txt
echo "Target: <LAB_HOST> | Goal: test auth flows | Stop: 45 min" >> session_timer.txt
```

### Checklist
- [ ] Blocks planned
- [ ] Deliverables defined
- [ ] Stop conditions set
- [ ] Reporting time reserved

### Common mistakes
- Endless recon with no testing.
- Skipping documentation.
- Overrunning blocks without review.

### Safety & scope
Do not let time pressure justify unsafe tests; scope always wins.

Protect this reserved reporting time from being consumed by extra recon; the finding is not finished until it is written.

### Knowledge check
Q: What is a stop condition?
A: A predefined trigger — finding, dead end, or time expiry — that ends a work block.

===MODULE===
TITLE: Risk and Impact Assessment
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Estimate severity through confidentiality, integrity, and availability to guide testing and reports.
OBJECTIVES: apply the CIA triad | assess affected scope | map to bounty tiers
TAKEAWAYS: impact is judged from the owner's view | chains can amplify severity | real data is off-limits during validation
PRACTICE: Write an impact statement for a hypothetical lab finding using CIA terms.
SOURCES: None
---
## Core idea
Risk and impact assessment estimates how serious a vulnerability would be and what harm it could cause. Impact considers confidentiality, integrity, and availability: does the flaw expose data, allow modification, or cause downtime? Risk also weighs likelihood and exposure. In bug bounty, this assessment guides both prioritization and final severity reporting. A bug affecting many users is higher impact than one affecting a single account. Chains of low-severity issues can produce high impact. Practicing impact assessment sharpens your ability to write compelling reports. Always assess from the owner's perspective, not your own excitement. And remember: real user data is off-limits during validation, so assess impact through safe demonstration.

### Method
For each candidate finding, describe the worst plausible outcome using CIA terms and estimate affected scope. Map to a severity tier from the bounty table.

```bash
# Record an impact statement scaffold
cat >> finding_draft.md <<'NOTE'
Finding: <short>
Confidentiality: what data could be exposed
Integrity: what could be changed
Availability: what could be disrupted
Scope: single user / many / all
NOTE
```

### Checklist
- [ ] CIA effects described
- [ ] Affected scope estimated
- [ ] Chain potential noted
- [ ] Tier mapped

### Common mistakes
- Inflating impact without evidence.
- Ignoring the affected user scope.
- Using real data to "prove" impact.

### Safety & scope
Demonstrate impact safely; never access real user records to strengthen a claim.

### Knowledge check
Q: What does the CIA triad stand for?
A: Confidentiality, Integrity, and Availability.

===MODULE===
TITLE: The Manual Testing Loop
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Master the observe-hypothesize-test-evaluate-document rhythm that finds logic and authz bugs.
OBJECTIVES: form testable hypotheses | test one variable at a time | log every outcome
TAKEAWAYS: deliberate iteration beats random fuzzing | manual testing finds logic flaws | dead ends should be documented
PRACTICE: Run three manual hypothesis cycles against a lab endpoint and log each outcome.
SOURCES: None
---
## Core idea
The manual testing loop is the core rhythm of bug bounty: observe, hypothesize, test, evaluate, document, repeat. You start from a mapped attack surface, pick a target endpoint, form a hypothesis about a weakness, send a controlled request, analyze the response, and either confirm, refute, or refine. Each iteration should be deliberate — random fuzzing is inefficient and can violate rate limits. Manual testing beats automated scanning for logic and authorization flaws because it requires understanding intent. Keep requests minimal and reversible. Record each hypothesis and outcome so you do not repeat work. The loop ends when you have a reproducible finding or a well-documented dead end.

### Method
For each endpoint, list plausible vulnerability classes based on context, then test one hypothesis at a time with a proxy. Log each request/response pair with a conclusion.

```bash
# Replay a single controlled request with curl for careful study
curl -sS -i 'https://<LAB_HOST>/api/item?id=1' -H 'Accept: application/json'
# -i shows headers; vary one parameter at a time
```

### Checklist
- [ ] Hypothesis written
- [ ] One variable changed
- [ ] Response analyzed
- [ ] Outcome logged

### Common mistakes
- Changing many variables at once.
- Repeating tests already ruled out.
- Failing to document dead ends.

### Safety & scope
Keep requests minimal and within rate limits; stop if anything looks disruptive.

### Knowledge check
Q: Why vary only one variable at a time?
A: So the response clearly confirms or refutes a single hypothesis.

===MODULE===
TITLE: HTTP Fundamentals for Testers
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Build fluency in methods, status codes, headers, and parameters for precise testing.
OBJECTIVES: read raw requests and responses | interpret status codes | craft minimal requests
TAKEAWAYS: HTTP is the foundation of web testing | parameters live in many places | precision reduces noise
PRACTICE: Inspect the raw request/response of a lab endpoint and annotate every component.
SOURCES: None
---
## Core idea
HTTP fluency is the foundation of web testing. You must understand methods (GET, POST, PUT, DELETE), status codes (2xx success, 3xx redirect, 4xx client error, 5xx server error), headers (Authorization, Content-Type, Cookie), and request/response structure. Parameters can appear in the query string, path, body, or headers. Cookies and tokens maintain state. Understanding how browsers and servers exchange data lets you craft precise tests and interpret responses correctly. Many bugs are simply a matter of sending the right method or content type. Mastery of HTTP also helps you stay respectful: you can craft minimal requests instead of blasting payloads.

### Method
Practice reading raw requests and responses until you can predict status codes. Learn to vary one element at a time and observe how the server reacts.

```bash
# Inspect full request/response for a lab endpoint
curl -sS -v https://<LAB_HOST>/ >/dev/null
# -v prints request and response headers for study
```

### Checklist
- [ ] Methods understood
- [ ] Status codes recognized
- [ ] Headers identified
- [ ] Parameter locations noted

### Common mistakes
- Confusing 4xx and 5xx causes.
- Ignoring Content-Type semantics.
- Overlooking header-based parameters.

### Safety & scope
Use only lab endpoints; never send malformed requests that could disrupt service.

A precise request also produces cleaner evidence, because the response is far easier to interpret. Practising with curl and a proxy builds the intuition needed to spot subtle server behavior quickly. Revisit the basics whenever a result surprises you.

### Knowledge check
Q: What does HTTP 403 indicate?
A: The server understood the request but refused authorization.

===MODULE===
TITLE: Burp Suite Workflows
LEVEL: Intermediate
MINUTES: 50
SUMMARY: Use Burp scope, Proxy, Target, and Repeater for disciplined manual web testing.
OBJECTIVES: configure a tight scope | map via the site map | replay with Repeater
TAKEAWAYS: precision beats volume | Repeater is the main test tool | scope prevents accidental out-of-scope traffic
PRACTICE: Configure Burp scope for a lab target and replay three requests in Repeater.
SOURCES: None
---
## Core idea
Burp Suite is the central workspace for manual web testing. Its Proxy lets you intercept and modify traffic; Target defines scope; Repeater lets you replay and tweak individual requests; Intruder automates controlled parameter variation; Scanner checks for common issues. A disciplined Burp workflow starts with a tight scope (to avoid intercepting out-of-scope traffic), then maps the site via the site map, then moves interesting requests into Repeater for manual hypothesis testing. Use Repeater far more than Intruder — precision beats volume. Configure scope carefully so you never accidentally send requests to excluded hosts. Burp's history becomes a record of your testing, which supports evidence and reporting.

### Method
Set Burp's target scope to your allowlist, browse the app to populate the site map, then send candidate requests to Repeater. Test one variable at a time.

```bash
# Document Burp's configured scope (conceptual)
# In Burp: Target > Scope > include <LAB_HOST>; exclude all others
echo "Scope configured for <LAB_HOST> only" >> engagement_notes.md
```

### Checklist
- [ ] Scope allowlist set
- [ ] Exclusions added
- [ ] Site map reviewed
- [ ] Requests sent to Repeater

### Common mistakes
- Leaving scope wide open.
- Overusing Intruder at high speed.
- Ignoring intercepted out-of-scope traffic.

### Safety & scope
A broad Burp scope can send traffic to excluded hosts; lock it down first.

Review Burp's history periodically to confirm nothing out of scope was hit during an intercept session.

### Knowledge check
Q: Why prefer Repeater over Intruder?
A: Repeater supports careful, one-variable-at-a-time manual testing.

===MODULE===
TITLE: Authentication Testing
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Test login, session, reset, and MFA flows using only accounts you control.
OBJECTIVES: map the auth flow | test reset and session logic | avoid real accounts
TAKEAWAYS: use lab-provided accounts | focus on logic flaws | never lock out or access real users
PRACTICE: Map and test the login and password-reset flow of a lab application with your own account.
SOURCES: None
---
## Core idea
Authentication verifies identity. Testing it means checking whether the login process can be bypassed or weakened: weak passwords, credential stuffing (usually prohibited), session fixation, predictable tokens, missing rate limits, and flaws in password reset or multi-factor authentication. Because authentication systems guard real accounts, testing must use accounts you own and avoid lockouts of real users. Many programs provide test accounts. Focus on logic: can you reset another account's password by manipulating a token? Does the session invalidate on logout? Are tokens predictable? Always stay within authorized accounts. Authentication flaws are high impact, so they are rewarded well, but the testing must be careful to avoid disrupting service.

### Method
With a test account, map the full auth flow: login, session handling, logout, password reset, and MFA. Test each step for logic flaws using only your own account.

```bash
# Observe a login response for session/token behavior
curl -sS -i -X POST https://<LAB_HOST>/login \
  -d 'user=labuser&pass=labpass' | head -30
# Use only lab-provided credentials
```

### Checklist
- [ ] Own test account used
- [ ] Login flow mapped
- [ ] Reset flow tested
- [ ] Session invalidation checked

### Common mistakes
- Testing against real user accounts.
- Brute-forcing passwords.
- Triggering account lockouts.

### Safety & scope
Never use credentials found elsewhere; only program-issued test accounts.

Document which test account was used for each authentication check so results remain reproducible.

### Knowledge check
Q: Which account should you use for auth testing?
A: Only an account you own or one explicitly provided by the program.

===MODULE===
TITLE: Authorization Testing and IDOR
LEVEL: Advanced
MINUTES: 50
SUMMARY: Detect access-control flaws by comparing access between two accounts you own.
OBJECTIVES: identify object references | test cross-account access | handle data carefully
TAKEAWAYS: IDOR is common and high impact | use two owned accounts | never exfiltrate real records
PRACTICE: Create two lab accounts and safely test object-ID access between them.
SOURCES: None
---
## Core idea
Authorization (authz) ensures users can access only what they are permitted to. Insecure Direct Object References (IDOR) occur when an application exposes internal identifiers — numeric IDs, UUIDs, filenames — without verifying the requester's rights. Testing authz means checking whether a low-privilege account can access another user's data by changing an identifier. This is one of the most common and high-impact bug classes. Because it involves accessing other users' data, authorization testing is sensitive: use two accounts you control, and never exfiltrate real user records. Demonstrate access with a minimal, redacted response. Many programs specifically invite authz testing. Always stay in scope and stop if you encounter real personal data.

### Method
Create two test accounts, capture a request that references an object ID, change the ID to the other account's value, and compare responses. Use only your own objects.

```bash
# Compare access to two lab-owned object IDs
for id in 1001 1002; do
  echo "--- id=$id"
  curl -sS -H "Authorization: Bearer $LAB_TOKEN" "https://<LAB_HOST>/api/order/$id" | head -5
done
# $LAB_TOKEN and IDs belong to your test accounts only
```

### Checklist
- [ ] Two owned accounts ready
- [ ] Object ID located
- [ ] Cross-access compared
- [ ] Real data avoided

### Common mistakes
- Using IDs of other real users.
- Downloading full records as "proof."
- Assuming a UUID cannot be an IDOR.

### Safety & scope
Stop if the response contains real personal data; redact heavily and report minimally.

### Knowledge check
Q: What is the safest way to demonstrate an IDOR?
A: Use a second account you own and show a minimal, redacted response.

===MODULE===
TITLE: Business Logic Flaws
LEVEL: Advanced
MINUTES: 50
SUMMARY: Find design-level bugs by reasoning about intended rules and deviating safely.
OBJECTIVES: document intended workflows | brainstorm deviations | test without fraud
TAKEAWAYS: logic flaws evade scanners | understand the business rule first | test only in lab environments
PRACTICE: In a lab store, test negative quantities and coupon replay against a cart workflow.
SOURCES: None
---
## Core idea
Business logic flaws are design-level bugs that let an application be used in ways developers never intended — bypassing controls that make sense on paper. Examples include negative quantities to get refunds, replaying a coupon, skipping payment steps, or escalating privileges by manipulating a workflow. They are hard to find with scanners because they require understanding the business rules. For bounty hunters, logic flaws are often high-value and low-competition. Testing means thinking like a malicious user: "how do I make the app do something the rules forbid?" Use only your own accounts and test data. Never complete fraudulent transactions against real systems; simulate in a lab or use program-provided test environments.

### Method
Document the intended workflow, then brainstorm deviations: reorder steps, repeat actions, alter hidden fields, and mix roles. Test each deviation safely.

```bash
# Replay a cart request with altered quantity in a lab store
curl -sS -X POST https://<LAB_HOST>/api/cart \
  -H "Authorization: Bearer $LAB_TOKEN" \
  -d '{"item":"lab-sku","qty":-1}'
# Observe whether the app rejects negative values
```

### Checklist
- [ ] Intended workflow written
- [ ] Deviations brainstormed
- [ ] Hidden fields inspected
- [ ] Lab data only used

### Common mistakes
- Testing logic on real transactions.
- Skipping understanding of intended rules.
- Assuming validation happens server-side.

### Safety & scope
Never actually complete a fraudulent purchase or transfer; use lab environments only.

### Knowledge check
Q: Why do scanners miss business logic flaws?
A: They do not understand intended rules or workflow semantics.

===MODULE===
TITLE: Evidence Capture and Screenshots
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Capture clean, authentic evidence that lets triage understand and reproduce a finding.
OBJECTIVES: save raw exchanges | annotate screenshots | redact sensitive data
TAKEAWAYS: evidence proves and reproduces | authenticity is mandatory | organize per finding
PRACTICE: Build an evidence folder for a lab finding with request/response and an annotated screenshot.
SOURCES: None
---
## Core idea
Evidence is what turns a claim into a report. Good evidence proves the vulnerability exists, shows impact, and lets triage reproduce it. Capture raw request/response pairs, screenshots with timestamps, and a concise narrative. Redact sensitive data (tokens, personal info) from shared artifacts. Screenshots should show the relevant UI state with the URL visible. Keep evidence organized per finding in folders. Avoid over-capturing: you do not need gigabytes of traffic. Evidence must be authentic — never fabricate or alter output. Many platforms provide a submission form with fields for steps, impact, and attachments. Prepare evidence before writing the report so you can be precise.

### Method
For each finding, save: (1) a minimal request/response, (2) an annotated screenshot, (3) reproduction steps, and (4) an impact note. Redact secrets.

```bash
# Save a clean HTTP exchange to a finding folder
mkdir -p findings/F001
curl -sS -i 'https://<LAB_HOST>/api/item?id=1' > findings/F001/request_response.txt
# Review and redact any tokens before attaching
```

### Checklist
- [ ] Raw exchange saved
- [ ] Screenshot annotated
- [ ] Steps written
- [ ] Secrets redacted

### Common mistakes
- Attaching huge unfiltered traffic logs.
- Leaving tokens in screenshots.
- Altering evidence to look stronger.

### Safety & scope
Never attach real user data; redact before any share or submission.

Organize folders with consistent IDs so you can assemble a report quickly. Keep the original, unedited capture and a separate redacted copy for submission. Label all timestamps in a single timezone.

### Knowledge check
Q: Why redact evidence?
A: To avoid exposing secrets or personal data while still proving the issue.

===MODULE===
TITLE: Safe Validation Techniques
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Prove vulnerabilities with minimal, reversible demonstrations that cause no harm.
OBJECTIVES: choose harmless payloads | avoid destructive effects | know when to stop
TAKEAWAYS: demonstrate without damaging | use your own accounts | stop if real systems are affected
PRACTICE: Use a harmless marker to test for reflected input on a lab endpoint.
SOURCES: None
---
## Core idea
Validation proves a bug is real while minimizing harm. The key principle: demonstrate impact without causing damage or accessing data you are not authorized to see. For injection flaws, use harmless markers rather than destructive payloads. For authorization flaws, use your own second account. For DoS-style issues, avoid actually taking services down — reason about impact instead or use rate-limited proof. Many programs forbid exploitation that modifies or destroys data. Validation should be just enough to convince triage. If a test starts affecting real users or systems, stop immediately and report what you observed. Think of validation as a controlled experiment, not an attack.

### Method
Before running a payload, ask: could this modify data, expose someone else's data, or disrupt service? If yes, choose a safer demonstration or skip it.

```bash
# Harmless marker for a suspected reflected injection (lab target)
curl -sS 'https://<LAB_HOST>/search?q=AEGIS_MARKER_123' | grep -o 'AEGIS_MARKER_123'
# If reflected unencoded, investigate safely; no destructive payloads
```

### Checklist
- [ ] Harmless marker chosen
- [ ] No destructive payloads
- [ ] Own accounts used
- [ ] Stop condition ready

### Common mistakes
- Using destructive SQL or file payloads.
- Testing DoS by actually crashing a service.
- Escalating after harm begins.

### Safety & scope
Stop immediately if a test affects real users or systems, and report what happened.

A safe validation is still a valid finding when the evidence is clear, so do not over-exploit just to make it dramatic.

### Knowledge check
Q: What is a harmless marker used for?
A: To observe reflection or processing without causing damage.

===MODULE===
TITLE: Common Vulnerability Classes
LEVEL: Intermediate
MINUTES: 45
SUMMARY: Recognize major web bug classes and match safe tests to their input contexts.
OBJECTIVES: list key classes | match tests to context | avoid payload throwing
TAKEAWAYS: classes have characteristic contexts | focus on stack-relevant bugs | know low-value informational issues
PRACTICE: Build a personal matrix mapping three vulnerability classes to safe tests and impacts.
SOURCES: None
---
## Core idea
A working knowledge of common vulnerability classes lets you recognize patterns quickly. Web staples include SQL injection, cross-site scripting (XSS), cross-site request forgery (CSRF), server-side request forgery (SSRF), insecure deserialization, file upload flaws, path traversal, and XML external entity (XXE) injection. Each has characteristic input contexts and telltale responses. Knowing the class helps you pick a test payload and an impact narrative. But avoid "payload throwing" without understanding context. Focus on classes relevant to the technology you fingerprinted. Also know the informational categories that rarely pay — missing headers, version disclosure — so you do not waste time.

### Method
Build a personal matrix mapping each class to: where it appears, a safe test, and an impact statement. Reference it during testing.

```bash
# Quick check for reflected input handling
curl -sS 'https://<LAB_HOST>/?q=%3Ctest%3E' | grep -i '<test>'
# URL-encoded <test>; reflection unencoded warrants safe follow-up
```

### Checklist
- [ ] Class list recorded
- [ ] Input contexts noted
- [ ] Safe tests listed
- [ ] Informational issues deprioritized

### Common mistakes
- Throwing payloads without context.
- Chasing missing-header reports.
- Ignoring stack-specific classes.

### Safety & scope
Use harmless tests on lab targets; never run destructive payloads.

Keep a short glossary of each class's telltale signs — response codes, error text, and reflection behavior. Revisiting it before a session primes your mind to notice relevant patterns. Depth in a few classes beats shallow knowledge of all of them.

### Knowledge check
Q: Why avoid blind payload throwing?
A: Without context, results are meaningless and may cause unintended effects.

===MODULE===
TITLE: Rate Limits, WAFs, and Noise
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Respect rate limits and WAFs as protective signals, not obstacles to defeat.
OBJECTIVES: respond to limits safely | reduce request volume | document blocks
TAKEAWAYS: limits protect availability | evasion may violate RoE | low noise preserves access
PRACTICE: Run a low-volume test loop against a lab endpoint with deliberate pauses.
SOURCES: None
---
## Core idea
Rate limits and Web Application Firewalls (WAFs) protect applications — and they are signals you should respect, not obstacles to defeat. If you hit a rate limit, slow down; the limit exists to protect availability. Aggressive bypass attempts can violate the RoE. WAF blocks may indicate your request looked malicious; refine your test to be precise rather than louder. Noise — excessive scanning — annoys defenders and can get you banned. Professional researchers minimize noise: low request volume, clear user agents, and pauses. If a WAF blocks you, document it; do not try to evade it through prohibited means. Staying quiet and respectful preserves your access and your reputation.

### Method
When you encounter a limit or block, record it, reduce request rate, and simplify the request. Never attempt evasion techniques the RoE forbids.

```bash
# Respectful pause between requests (lab target)
for p in a b c; do
  curl -sS "https://<LAB_HOST>/x?q=$p" -o /dev/null
  sleep 2
done
# sleep keeps volume low; adjust only within RoE
```

### Checklist
- [ ] Limits recorded
- [ ] Volume reduced
- [ ] User agent identified
- [ ] Blocks documented

### Common mistakes
- Trying to bypass WAF aggressively.
- Ignoring 429 responses.
- Running high-volume fuzzing.

### Safety & scope
Do not attempt evasion techniques forbidden by the RoE; slow down instead.

Treat a WAF block as feedback to refine the test, never as a challenge to defeat the defense.

### Knowledge check
Q: What is the right response to an HTTP 429?
A: Slow down or stop; the application is protecting availability.

===MODULE===
TITLE: Report Anatomy
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Write clear, reproducible reports with the sections triage expects.
OBJECTIVES: structure a report | write reproduction steps | state impact and remediation
TAKEAWAYS: clarity beats cleverness | steps must be reproducible | write while details are fresh
PRACTICE: Draft a full report skeleton for a validated lab finding.
SOURCES: None
---
## Core idea
A great report is clear, concise, and reproducible. Standard sections include: title, summary, affected asset, severity, steps to reproduce, proof of concept, impact, and remediation advice. The title should be specific, e.g., "IDOR on /api/order/{id} exposes other users' orders." Steps must be numbered and detailed enough for a stranger to follow. Include exact URLs, parameters, and account setup. Impact explains why it matters to the business. Remediation suggests a fix, which shows professionalism. Avoid filler, arrogance, and demands. Keep sensitive data redacted. Many platforms score report quality, which affects reputation. Write the report as soon as the finding is validated, while details are fresh.

### Method
Draft from a template immediately after validation. Read it as if you were the triage analyst: can you reproduce it from the steps alone?

```bash
# Create a report skeleton
cat > findings/F001/report.md <<'MD'
# IDOR on /api/order/{id}
## Summary
## Affected asset: <LAB_HOST>
## Steps
1.
## PoC
## Impact
## Remediation
MD
```

### Checklist
- [ ] Specific title
- [ ] Numbered steps
- [ ] PoC included
- [ ] Impact and remediation written

### Common mistakes
- Vague titles like "Found a bug."
- Skipping reproduction details.
- Including real user data.

### Safety & scope
Redact secrets and personal data from every report artifact.

Include the exact tool version or browser step if it materially affects whether another person can reproduce the issue.

### Knowledge check
Q: Which section lets triage confirm the issue themselves?
A: The numbered steps to reproduce, supported by a PoC.

===MODULE===
TITLE: CVSS Scoring
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Express severity consistently with CVSS base metrics and vector strings.
OBJECTIVES: compute base scores | write vector strings | argue severity credibly
TAKEAWAYS: CVSS is standardized 0-10 scoring | accuracy beats inflation | use with the program's table
PRACTICE: Compute a CVSS base score and vector for a lab IDOR finding.
SOURCES: None
---
## Core idea
CVSS (Common Vulnerability Scoring System) is a standardized way to express severity with a 0.0-10.0 score. Base metrics cover attack vector, complexity, privileges required, user interaction, scope, and the CIA impacts. Temporal and environmental metrics refine the score with context. In bug bounty, the platform often assigns the final CVSS, but understanding it lets you argue severity credibly and prioritize. A bug requiring no privileges and no user interaction over the network with high CIA impact scores near critical. Self-XSS or issues requiring extensive user interaction score lower. Do not inflate scores; accuracy builds trust. Use CVSS alongside the program's bounty table, which may weigh business context differently.

### Method
Compute a base score for each finding using a CVSS calculator, then adjust with the program's criteria. Record the vector string in your report.

```bash
# Document a CVSS vector string for a finding
echo "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N" >> findings/F001/report.md
# Translate: network, low complexity, low privileges, no UI, high confidentiality
```

### Checklist
- [ ] Base metrics chosen
- [ ] Score computed
- [ ] Vector recorded
- [ ] Table cross-checked

### Common mistakes
- Inflating scores to raise payouts.
- Ignoring required privileges or user interaction.
- Treating CVSS as the final bounty decision.

### Safety & scope
Severity never changes scope; a high score does not authorize unsafe validation.

Keep the vector string in your notes even if the platform ultimately recalculates the score itself.

### Knowledge check
Q: What does "PR:L" mean in a CVSS vector?
A: Low privileges are required to exploit the vulnerability.

===MODULE===
TITLE: CWE and Vulnerability Taxonomy
LEVEL: Intermediate
MINUTES: 30
SUMMARY: Use CWE identifiers to label weaknesses consistently and study related patterns.
OBJECTIVES: map findings to CWEs | distinguish CWE from CVE | use taxonomy for learning
TAKEAWAYS: CWE names weakness types | CVE names specific instances | taxonomy improves communication
PRACTICE: Map three lab findings to their correct CWE IDs and record them.
SOURCES: None
---
## Core idea
CWE (Common Weakness Enumeration) is a catalog of software weakness types, while CVE identifies specific instances of a vulnerability. Mapping a finding to a CWE — for example, CWE-639 for IDOR or CWE-79 for XSS — gives triage a standardized label and helps you study related patterns. Taxonomies improve communication: "CWE-89 SQL injection" is unambiguous. Many report forms ask for a CWE. Understanding the taxonomy also reveals gaps in your knowledge — browse CWE categories you have never tested. Use CWE as a supplement to, not a replacement for, a clear impact narrative. A correct label speeds triage, but the business impact still sells the report.

### Method
After validating a finding, look up the matching CWE and include its ID in your notes. Keep a personal mapping of bug class to CWE.

```bash
# Note the CWE for an IDOR finding
echo "CWE-639: Authorization Bypass Through User-Controlled Key" >> findings/F001/report.md
```

### Checklist
- [ ] CWE identified
- [ ] ID recorded in report
- [ ] Personal mapping updated
- [ ] Narrative still included

### Common mistakes
- Confusing CWE with CVE.
- Using a vague or wrong ID.
- Letting the label replace impact explanation.

### Safety & scope
Taxonomy is descriptive; it does not change scope or severity rules.

Cross-check the chosen CWE against the report's impact statement so the two tell a consistent story.

### Knowledge check
Q: What is the difference between CWE and CVE?
A: CWE is a weakness type; CVE is a specific vulnerability instance.

===MODULE===
TITLE: PoC Hygiene and Reproduction
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Build minimal, safe, reproducible proofs of concept that triage can run cleanly.
OBJECTIVES: minimize PoC steps | remove sensitive data | verify from a clean state
TAKEAWAYS: smaller PoCs reproduce better | use only test accounts | strip real secrets
PRACTICE: Reduce a lab finding to a one-command PoC and test it twice from fresh state.
SOURCES: None
---
## Core idea
A proof of concept (PoC) is the smallest artifact that reliably demonstrates a bug. Good PoC hygiene means it is: minimal, self-contained, reproducible, and safe. Remove unnecessary steps and dependencies. Use your own test accounts and data. Redact secrets. Provide the PoC as clear steps or a short script, not a giant blob. Ensure it works from a clean state so triage can reproduce it. Avoid destructive actions. A clean PoC speeds triage and increases trust. If your PoC requires complex setup, document that setup precisely so the analyst can replicate it.

### Method
Reduce your reproduction to the shortest sequence that works from a fresh session. Test it twice. Strip sensitive values and replace with placeholders.

```bash
# Minimal PoC script skeleton
cat > findings/F001/poc.sh <<'SH'
#!/bin/sh
# Replace TOKEN with a lab test token; do not commit real secrets
curl -sS -H "Authorization: Bearer $LAB_TOKEN" \
  "https://<LAB_HOST>/api/order/1002"
SH
```

### Checklist
- [ ] Steps minimized
- [ ] Clean-state test passed
- [ ] Secrets replaced
- [ ] Setup documented

### Common mistakes
- Including real tokens in the PoC.
- Depending on a dirty session state.
- Adding destructive steps.

### Safety & scope
A PoC must never damage data or expose real users; keep it safe and minimal.

A PoC that depends on hidden setup is not truly minimal; either document that setup clearly or simplify further.

### Knowledge check
Q: What makes a PoC "minimal"?
A: It contains only the steps needed to reproduce the bug from a clean state.

===MODULE===
TITLE: Triage Communication
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Handle analyst questions, severity debates, and status updates professionally.
OBJECTIVES: respond with evidence | handle disputes calmly | keep records on-platform
TAKEAWAYS: prompt, polite answers help | use official channels | good dialogue can change outcomes
PRACTICE: Draft a respectful response to a triage request for more reproduction detail.
SOURCES: None
---
## Core idea
Triage communication is the professional dialogue between researcher and analyst. Expect questions requesting clarification, severity debates, and status updates. Respond promptly, politely, and with evidence. If triage cannot reproduce, offer more detail or a cleaner PoC. If they downgrade severity, ask for their reasoning and present impact respectfully. Avoid adversarial language. Keep all communication on the official platform channel so there is a record. Understand that triage handles many reports and may take time. Good communication can turn a borderline report into an accepted one and builds a long-term reputation.

### Method
For every triage message, acknowledge, answer with specifics, and attach evidence. Track status changes in your notes.

```bash
# Log a triage exchange in your finding folder
cat >> findings/F001/log.md <<'NOTE'
2026-.. Triage asked for reproduction steps with fresh session
Response: provided minimal PoC, redacted token
NOTE
```

### Checklist
- [ ] Acknowledged promptly
- [ ] Evidence attached
- [ ] Tone professional
- [ ] Status logged

### Common mistakes
- Demanding immediate resolution.
- Arguing without evidence.
- Moving the discussion off-platform.

### Safety & scope
Never share private program details in public forums during triage.

Keep a calm, factual tone even when you disagree; analysts are allies, not adversaries. Summarize each exchange in your log with the date, the question asked, and your answer. If a report is closed, ask for feedback and apply it to the next one. Professional conduct during disagreement is remembered far longer than any single report.

### Knowledge check
Q: How should you handle a severity downgrade?
A: Ask for reasoning and present impact evidence respectfully.

===MODULE===
TITLE: Duplicates, Disclosure, and Program Etiquette
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Handle duplicates gracefully and respect disclosure embargoes and program norms.
OBJECTIVES: learn from duplicates | follow disclosure rules | maintain etiquette
TAKEAWAYS: duplicates mean the bug was real | never disclose early | professionalism earns invitations
PRACTICE: Write a duplicate-lesson note and check a lab program's disclosure policy.
SOURCES: None
---
## Core idea
When a report is marked duplicate, accept it gracefully — it means the bug was real and already known. Ask for the original if the platform permits, learn what you missed, and move on. Disclosure is governed by the program's policy: some allow public disclosure after a fix, others require permanent confidentiality. Never disclose before the agreed embargo. Program etiquette includes respecting response times, not spamming triage, and not publicly complaining about a program. Building a reputation for professionalism pays off with private invitations and long-term trust. A single careless public post can damage years of good standing.

### Method
On duplicate, record the root cause in your notes to avoid repeats. Before any public write-up, verify the disclosure policy and confirm the fix is live.

```bash
# Record a duplicate lesson
echo "Duplicate: check disclosed reports for this endpoint pattern" >> lessons.md
```

### Checklist
- [ ] Duplicate accepted calmly
- [ ] Lesson recorded
- [ ] Disclosure policy checked
- [ ] Fix confirmed before publishing

### Common mistakes
- Publicly venting about a duplicate.
- Disclosing before the embargo ends.
- Sharing private program details.

### Safety & scope
Disclosure without permission can breach policy and law; always verify first.

Etiquette also means giving the program reasonable time to respond before following up. Repeated pings and public pressure damage trust and can affect future invitations.

### Knowledge check
Q: Before publishing a write-up, what must you confirm?
A: The program's disclosure policy allows it and the fix is deployed.

===MODULE===
TITLE: Workflow Automation
LEVEL: Advanced
MINUTES: 45
SUMMARY: Automate repetitive, low-risk recon with scope guards and rate limits.
OBJECTIVES: choose good automation targets | add scope guards | avoid irresponsible volume
TAKEAWAYS: automate enumeration, not judgment | scripts must obey RoE | guardrails prevent scope drift
PRACTICE: Write a guarded, rate-limited recon wrapper for a lab-only host list.
SOURCES: None
---
## Core idea
Automation scales repetitive, low-risk tasks so you can focus on creative testing. Good candidates: enumerating subdomains, resolving hosts, capturing screenshots, and organizing outputs. Poor candidates: complex exploit chains and anything that increases request volume irresponsibly. Build small, idempotent scripts with clear inputs and outputs, and cap their rate. Never let automation run unattended against production without guardrails. Respect the RoE: a script that violates scope is still your violation. Use configuration files for scope so the automation cannot wander. Version your scripts and review them before each run.

### Method
Automate one repetitive step at a time. Wrap tools with rate limits and scope checks; log every target touched.

```bash
# A guarded, rate-limited recon wrapper (lab scope only)
while read -r h; do
  case "$h" in
    *.example.lab) curl -sS --max-time 5 "https://$h" -o /dev/null ;;
    *) echo "SKIP out-of-scope: $h" ;;
  esac
  sleep 1
done < hosts.txt
```

### Checklist
- [ ] Repetitive task identified
- [ ] Scope guard added
- [ ] Rate capped
- [ ] Targets logged

### Common mistakes
- Automating destructive actions.
- Letting scripts run without guardrails.
- Forgetting to cap request rate.

### Safety & scope
A script must enforce scope itself; never rely on manual oversight alone.

Review each script's output manually; automation proposes, it does not decide. Keep a changelog so you can reproduce exactly what ran during an engagement.

### Knowledge check
Q: What is a scope guard in automation?
A: Logic that blocks any target not on the allowlist before a request is sent.

===MODULE===
TITLE: Metrics and Measurement
LEVEL: Advanced
MINUTES: 35
SUMMARY: Track outcomes to convert experience into measurable, directed improvement.
OBJECTIVES: define useful metrics | log report outcomes | review trends monthly
TAKEAWAYS: metrics reveal where to focus | avoid vanity numbers | consistency drives growth
PRACTICE: Create a metrics log and record a hypothetical lab report outcome.
SOURCES: None
---
## Core idea
Metrics turn experience into improvement. Track: hours spent, programs worked, reports submitted, acceptance rate, duplicate rate, severity distribution, and time to triage. These numbers reveal where to focus — a high duplicate rate suggests deeper recon or novel vectors; a low acceptance rate suggests report quality issues. Metrics also support career conversations and demonstrate value. Keep data honest and consistent. Avoid vanity metrics like raw subdomain counts. Review monthly and set one improvement goal. Over time, trends show which habits pay off and which waste effort.

### Method
Maintain a simple spreadsheet updated after every report. Review trends monthly and set one improvement goal.

```bash
# Append a report outcome to a metrics log
cat >> metrics.csv <<'CSV'
date,program,hours,severity,status,days_to_triage
2026-..,<LAB_HOST>,6,medium,resolved,4
CSV
```

### Checklist
- [ ] Core metrics defined
- [ ] Log updated per report
- [ ] Monthly review scheduled
- [ ] One goal set

### Common mistakes
- Tracking raw counts instead of outcomes.
- Inconsistent or dishonest logging.
- Never acting on the data.

### Safety & scope
Metrics contain program names; keep them private where required.

Use the metrics to compare quarters, not days, since bounty outcomes are noisy. A spike in duplicates may mean you are hunting in well-tested areas rather than failing. Pair the numbers with short qualitative notes about what you learned. Share progress with a mentor to stay accountable, and celebrate small, consistent improvements.

### Knowledge check
Q: Which metric best signals a report-quality problem?
A: A low acceptance rate relative to reports submitted.

===MODULE===
TITLE: Collaboration and Community
LEVEL: Advanced
MINUTES: 35
SUMMARY: Learn faster through communities, shared write-ups, and clearly scoped team engagements.
OBJECTIVES: join communities | share sanitized knowledge | split scope in teams
TAKEAWAYS: community accelerates learning | confidentiality still applies | define ownership to avoid collisions
PRACTICE: Sanitize a lab write-up for community sharing and define a two-person scope split.
SOURCES: None
---
## Core idea
Bug bounty is often solitary, but community accelerates growth. Forums, chat servers, local meetups, and write-ups let you learn techniques and get feedback. Collaboration tools include shared note templates, severity calibration discussions, and mock engagements. When working in teams, define scope ownership to avoid duplicates among teammates. Respect confidentiality: never share private program details. Give credit generously. Mentoring others reinforces your own knowledge. A supportive network often leads to private invitations and long-term opportunities.

### Method
Join one reputable community, contribute a write-up from a lab exercise, and participate in a mock or team engagement with clear scope splits.

```bash
# Share a sanitized lab write-up (no private program data)
grep -v 'TOKEN\|SECRET' findings/F001/report.md > writeup_public.md
```

### Checklist
- [ ] Community chosen
- [ ] Write-up sanitized
- [ ] Scope split defined
- [ ] Credit given

### Common mistakes
- Sharing private program details.
- Overlapping scope with teammates.
- Copying others' work without credit.

### Safety & scope
Public material must contain only lab or authorized data; redact everything else.

When mentoring, explain not just what you did but why you chose each step. Participate in mock engagements to practise scope negotiation and report writing as a team. Rotate who leads so every member practises communication. Credit collaborators openly in write-ups. A strong network turns isolated effort into shared growth and makes the work sustainable.

### Knowledge check
Q: Why define scope ownership in a team?
A: To prevent teammates from duplicating each other's work and reports.

===MODULE===
TITLE: Career Development in Bug Bounty
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Turn bounty work into a professional portfolio and sustainable career path.
OBJECTIVES: build a portfolio | track reputation | set development goals
TAKEAWAYS: skills transfer to AppSec roles | consistency beats occasional wins | professionalism opens doors
PRACTICE: Create a sanitized portfolio case study from a lab finding.
SOURCES: None
---
## Core idea
Bug bounty can be a side pursuit, a career springboard, or a full-time profession. Skills translate to security engineering, penetration testing, and AppSec roles. Building a reputation through valid reports and public write-ups opens private invitations and jobs. Treat it professionally: maintain a portfolio, a record of achievements, and ethical standards. Income is variable, so diversify. Networking and continuous learning matter. Understand that consistency beats occasional big wins. A steady record of careful, well-documented work is more valuable than a single lucky find.

### Method
Build a portfolio with sanitized case studies, track your reputation scores, and set quarterly goals for skills and submissions.

```bash
# Start a sanitized portfolio entry
cat >> portfolio.md <<'MD'
## Case study: IDOR in lab application
- Class: CWE-639
- Skill demonstrated: authz testing
- Link: (sanitized write-up)
MD
```

### Checklist
- [ ] Portfolio started
- [ ] Reputation tracked
- [ ] Quarterly goals set
- [ ] Ethics maintained

### Common mistakes
- Publishing unsanitized reports.
- Expecting steady income immediately.
- Neglecting documentation of wins.

### Safety & scope
Never use private program findings as public portfolio pieces without permission.

Treat every public interaction as part of your professional record. Keep a concise bio, link to sanitized write-ups, and be clear about your ethics and scope discipline. Income from bounties is variable, so consider complementary security work while building your reputation. Set realistic milestones and review them quarterly rather than chasing trends.

### Knowledge check
Q: What makes a good portfolio case study?
A: A sanitized, well-documented finding that demonstrates a clear skill.

===MODULE===
TITLE: Continuous Learning and Skill Growth
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Build a sustainable study loop of learning, lab practice, testing, and teaching.
OBJECTIVES: use deliberate practice | close knowledge gaps | teach to reinforce learning
TAKEAWAYS: labs provide safe practice | write-ups sharpen judgment | gaps should drive study
PRACTICE: Add one new topic to a learning backlog and schedule a lab practice block.
SOURCES: None
---
## Core idea
The field changes constantly; continuous learning is mandatory. Build a study loop: learn a concept, practice in a lab, test on authorized targets, document, and teach. Use intentionally vulnerable labs to practice without risk. Track knowledge gaps from your engagements and close them deliberately. Read write-ups critically — ask why a technique worked, not just what it did. Celebrate small improvements. A structured loop turns random curiosity into reliable skill growth. Without it, techniques fade and progress stalls.

### Method
Maintain a learning backlog of topics and lab exercises. Schedule weekly practice blocks and record what you learned.

```bash
# Add a topic to your learning backlog
echo "Practice: SSRF via lab.docker" >> learning_backlog.md
```

### Checklist
- [ ] Backlog maintained
- [ ] Weekly practice scheduled
- [ ] Gaps identified
- [ ] Notes from practice written

### Common mistakes
- Only reading, never practicing.
- Practicing outside authorized labs.
- Ignoring gaps revealed by failures.

### Safety & scope
Keep all practice inside owned targets, labs, or explicitly in-scope programs.

Alternate study sources: one write-up, one lab, and one conversation with a peer each week. Record what surprised you, since surprises mark the edge of your knowledge. Revisit old labs and solve them without notes to test real retention. Track gaps that appear in your own engagements and turn each into a practice goal. Mastery is the compound result of many small, deliberate sessions.

### Knowledge check
Q: Why include teaching in the learning loop?
A: Explaining a concept exposes gaps and reinforces understanding.

===MODULE===
TITLE: Capstone Mock Engagement
LEVEL: Advanced
MINUTES: 60
SUMMARY: Integrate the full workflow in one authorized mock engagement from charter to report.
OBJECTIVES: define scope and RoE | execute full recon and testing | deliver a portfolio-ready report
TAKEAWAYS: the process is the deliverable | every phase must be documented | the package proves mastery
PRACTICE: Run a complete mock engagement on an owned target or lab and produce the full report package.
SOURCES: None
---
## Core idea
The capstone integrates the entire workflow in a single mock engagement on a target you own or a dedicated lab. You will define scope, write a RoE, perform passive and active recon, map the attack surface, prioritize, test manually, capture evidence, and produce a full report with CVSS and CWE. This mirrors a real bounty from start to finish. The deliverable is a portfolio-ready package. Work deliberately and document every step, because the process is the point. A polished capstone demonstrates readiness for real programs and reveals any remaining gaps in your method.

### Method
Follow the phases: (1) charter and scope, (2) recon and inventory, (3) mapping and prioritization, (4) manual testing, (5) evidence, (6) report, (7) retrospective. Timebox each.

```bash
# Final deliverable structure
mkdir -p capstone/{scope,recon,inventory,findings,report}
# Populate each folder as you progress; keep everything local to the lab
```

### Checklist
- [ ] Scope and RoE written
- [ ] Recon and inventory complete
- [ ] Testing documented
- [ ] Final report delivered

### Common mistakes
- Skipping the retrospective.
- Testing outside the owned/lab target.
- Submitting an unorganized package.

### Safety & scope
Use only an owned target or dedicated lab; never run a capstone against a third party.

Archive the package with timestamps so you can show how it evolved. Re-read your scope and RoE one last time against everything you actually touched. Use the retrospective to name one strength and one gap to carry forward.

### Knowledge check
Q: Why is the retrospective important?
A: It captures lessons and turns the exercise into lasting skill.
