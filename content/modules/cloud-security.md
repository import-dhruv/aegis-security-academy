===MODULE===
TITLE: Cloud Computing Models and the Shared Responsibility Model
LEVEL: Beginner
MINUTES: 30
SUMMARY: Learn how IaaS, PaaS, and SaaS divide ownership between provider and customer, and why the shared responsibility model is the foundation of every cloud security decision.
OBJECTIVES: distinguish IaaS, PaaS, and SaaS | map controls to provider or customer ownership | identify where cloud misconfigurations occur
TAKEAWAYS: the provider secures the cloud, the customer secures data in the cloud | responsibility shifts with service model | configuration is the dominant customer risk
PRACTICE: In your own lab account, list every service you use and label each control as provider- or customer-owned in a one-page shared responsibility matrix.
SOURCES: None
---
## Core idea

Think of the cloud as a leased apartment building. The landlord owns the structure, the front-door locks, and the fire suppression. You own what you bring inside: who gets a key, what you store, and whether you leave a window open. The shared responsibility model makes that split explicit, and the dividing line moves with what you rent.

With Infrastructure as a Service (IaaS) — virtual machines, networks, raw storage — you manage guest OS patching, runtime configuration, identity, data, and network rules. With Platform as a Service (PaaS) — managed databases, function runtimes — the provider patches the OS and runtime, but you still manage identity, data classification, and access policy. With Software as a Service (SaaS), the provider runs nearly everything, yet you still own user provisioning, MFA, and data governance. The constant: **you never outsource accountability for your data or your identities.**

Use the "who can change what, who is liable" test. For any asset ask: can the provider change it without my approval? Can I change it? Who is accountable if it leaks? If the answer to the last question is you, it is your responsibility regardless of the marketing slide.

## Method

1. Inventory services in `<LAB_ACCOUNT>` via the billing or resource-list API.
2. Classify each as IaaS, PaaS, or SaaS.
3. Draw a two-column table of provider controls versus customer controls.
4. Flag customer controls with no named owner, no ticket queue, and no alert.

| Control | IaaS | PaaS | SaaS |
|---|---|---|---|
| Physical security | Provider | Provider | Provider |
| OS patching | Customer | Provider | Provider |
| Network rules | Customer | Shared | Provider |
| Identity and MFA | Customer | Customer | Customer |
| Data classification | Customer | Customer | Customer |

## Common mistakes

Assuming "managed" means "secure by default" is the top error. Managed services remove undifferentiated heavy lifting, not configuration decisions. Second, treating a provider compliance badge as your own: their attestation covers their control plane, not your bucket policy. Third, leaving customer-side controls unowned so drift accumulates silently.

## Defense and verification

Quarterly, export your resource inventory, attach an owner tag to every resource, and confirm each customer-side control has a test. In `<LAB_ACCOUNT>`, enable the provider audit trail and confirm events land in your log sink as proof of visibility.

## Knowledge check

**Q:** You move from self-hosted databases to a managed database service. What changes?

**A:** OS and engine patching shift to the provider. Schema access control, network exposure, backup settings, customer-supplied keys, and data classification remain yours. Identity and data are never fully outsourced.
===MODULE===
TITLE: Regions, Availability Zones, and the Cloud Control Plane
LEVEL: Beginner
MINUTES: 30
SUMMARY: Understand the geographic and logical structure of a cloud provider so you can reason about data residency, blast radius, and where control-plane events are recorded.
OBJECTIVES: explain regions and availability zones | distinguish control plane from data plane | apply data-residency reasoning
TAKEAWAYS: regions are isolation boundaries | availability zones are fault domains within a region | the global control plane is a privilege target
PRACTICE: Map every resource in your lab account to its region and label which ones hold sensitive data, then enable audit logs in all active regions.
SOURCES: None
---
## Core idea

A cloud is a set of geographically isolated **regions**, each composed of multiple **availability zones (AZs)** — distinct datacenters with independent power and networking, connected by low-latency links. A region is your primary isolation and residency boundary: data placed in `eu-west-1` generally stays there unless you copy it. An AZ is a fault domain: spreading copies across AZs survives a single building failure.

The second mental model is **control plane versus data plane**. The control plane is the API that creates, deletes, and reconfigures resources (IAM changes, bucket policy edits, instance launches). The data plane is the actual traffic to your application or object. Security-critical actions almost always happen on the control plane, so control-plane audit logs are your primary forensic record. If an attacker can call the control plane, they can rewire everything.

Global services (identity, DNS, edge, billing) often have a single control-plane endpoint regardless of region. That makes identity configuration a high-value target and means a single misconfiguration can have global reach.

## Method

1. List active regions in `<LAB_ACCOUNT>` using the provider's region-list API; ignore regions you do not use.
2. For each active region, enumerate resources and record their AZ.
3. Mark resources containing regulated or sensitive data; verify their region matches policy.
4. Enable the control-plane audit trail (e.g., CloudTrail-style logging) in **all** active regions, not just your home region.

A sample CLI pattern:
```bash
cloudctl regions list --account <LAB_ACCOUNT>
cloudctl audit enable --account <LAB_ACCOUNT> --region all --sink <LAB_LOG_BUCKET>
```

| Concept | Scope | Security relevance |
|---|---|---|
| Region | Geographic area | Residency and legal jurisdiction |
| AZ | Datacenter cluster | Fault tolerance |
| Control plane | Global or regional API | Where changes and privilege are exercised |
| Data plane | Runtime traffic | Where data flows |

## Common mistakes

Assuming audit logging is global when it is region-scoped; attackers exploit unlogged regions. Assuming multi-AZ implies multi-region resilience — it does not. Placing data in a cheap region without checking residency obligations.

## Defense and verification

Deny unused regions with an organization policy, and alert on `region-enable` events. Verify by attempting a resource creation in a disabled region from a test principal; it should fail.

## Knowledge check

**Q:** Why enable audit logs in every region, not just your primary one?

**A:** Many control-plane logs are region-scoped. An attacker who enables a service in an unlogged region can act invisibly; all-region logging closes that blind spot.
===MODULE===
TITLE: Cloud Accounts, Organizations, and Multi-Account Strategy
LEVEL: Beginner
MINUTES: 35
SUMMARY: Learn why serious cloud deployments use multiple accounts under an organization, and how boundaries limit blast radius and simplify governance.
OBJECTIVES: explain the single-account blast radius problem | describe organization units and service control policies | design a basic multi-account layout
TAKEAWAYS: accounts are hard security boundaries | organizations centralize policy and billing | separate workloads, environments, and security tooling
PRACTICE: In your lab organization, create three accounts (sandbox, workload, security) and apply a deny-by-default service control policy to the sandbox.
SOURCES: None
---
## Core idea

An account is the hardest isolation boundary most clouds offer: identities, policies, quotas, and audit trails do not automatically cross it. Putting development, production, and security tooling in one account means one over-privileged role can touch everything. Multi-account architecture turns a single catastrophic misconfiguration into a contained incident.

An **organization** is a parent that groups accounts into a hierarchy of organizational units (OUs). It gives you centralized billing, delegated administration, and — critically — **service control policies (SCPs)**. An SCP is a guardrail applied to all members: even an account administrator cannot grant a permission the SCP forbids. SCPs are a ceiling, not a grant; you still need identity permissions inside the account.

A common layout: a management account (billing and identity), a security account (logs, detection, forensics), shared-services accounts (DNS, CI/CD), and per-environment workload accounts (dev, staging, prod), optionally per application.

## Method

1. Define boundaries: environment (dev/prod), business unit, and compliance scope.
2. Create OUs mirroring those boundaries in `<LAB_ORG>`.
3. Attach guardrails: deny leaving the approved regions, deny disabling audit logging, deny root account usage.
4. Route all audit logs to a dedicated, write-once security account that workload admins cannot delete from.

Example guardrail (conceptual SCP):
```json
{
  "Effect": "Deny",
  "Action": "cloud:LeaveOrganization",
  "Resource": "*",
  "Condition": {"StringNotEquals": {"cloud:PrincipalTag": "breakglass"}}
}
```

| Model | Blast radius | Governance |
|---|---|---|
| Single account | Whole estate | Ad hoc |
| Multi-account + org | Per account | Central guardrails |
| Org + SCPs | Per account, policy-bounded | Enforced ceiling |

## Common mistakes

Treating SCPs as permission grants (they are maximums). Giving workload accounts write access to the central log bucket, allowing log destruction. Creating so many accounts that governance collapses — start small and split when boundaries are needed.

## Defense and verification

Test each SCP with a non-production principal in the sandbox: attempt a denied action and confirm it fails. Verify log immutability by checking the security account's bucket policy denies `DeleteObject` from all principals.

## Knowledge check

**Q:** An account administrator attaches an admin policy to a user. The OU has an SCP denying a region. Can the user operate there?

**A:** No. SCPs set the maximum effective permission for every principal in the account, including administrators. Identity policy and SCP must both allow.
===MODULE===
TITLE: Identity Fundamentals: Users, Groups, and Cloud Principals
LEVEL: Beginner
MINUTES: 30
SUMMARY: Build a precise vocabulary for cloud identity — principals, users, groups, service accounts, and roles — and learn why identity is the primary security perimeter.
OBJECTIVES: define principal, user, group, and role | distinguish human and workload identities | enumerate identities in a lab account
TAKEAWAYS: everything in a cloud is a principal | groups simplify grants but hide individual access | workload identities need the same rigor as humans
PRACTICE: In your lab account, inventory all human users, groups, and service principals; flag shared accounts and unused identities for removal.
SOURCES: None
---
## Core idea

In the cloud, **identity is the perimeter**. A "principal" is any entity that can be authenticated and authorized: a human user, a group, a role, a service account, or an application. Every API call is evaluated against a principal. Firewalls still matter, but a valid credential with the right policy often bypasses network controls entirely because the control plane is public by design.

Humans are typically **users** belonging to **groups**. Groups are convenient for granting permissions to teams, but they obscure who actually holds access — an nested or stale group membership becomes invisible privilege. **Roles** are assumable identities with temporary credentials, intended for workloads and for humans needing elevated access. **Service principals** represent applications and automations; unlike users they cannot do interactive MFA, so their credential hygiene is critical.

The key mental model: identity is a chain. A session token is issued to a principal, that principal carries policies, and the evaluation engine combines them at request time. Break any link — stolen token, over-broad group, orphaned service principal — and the whole authorization story fails.

## Method

1. Enumerate principals in `<LAB_ACCOUNT>` with the IAM/identity list APIs.
2. Classify each as human, workload, or break-glass.
3. Build a matrix of principal → groups → attached policies.
4. Flag: shared credentials, users with console access but no MFA, service principals older than 90 days, and any human with a long-lived access key.

Example query:
```bash
cloudctl iam users list --account <LAB_ACCOUNT> --fields name,mfaEnabled,accessKeys
cloudctl iam groups list --account <LAB_ACCOUNT>
```

| Principal type | Authenticates how | Typical risk |
|---|---|---|
| User | Password + MFA | Phishing, credential reuse |
| Group | Membership only | Stale membership |
| Role | Assumed via STS | Over-broad trust |
| Service principal | Client secret / certificate | Leaked secret |

## Common mistakes

Using a shared user account for a service instead of a role/service principal. Granting permissions directly to users rather than groups, creating unmanageable snowflakes. Ignoring service principals in access reviews because "they aren't people."

## Defense and verification

Require MFA for all console users, disable long-lived keys for humans, and give each workload a unique principal. Verify by querying for users with `mfaEnabled=false` and keys older than 90 days; the list should be empty.

## Knowledge check

**Q:** Why is a role preferred over an access key for a workload?

**A:** Roles provide short-lived, automatically rotated credentials via STS, remove static secrets from config, and leave clearer audit attribution of which workload assumed them.
===MODULE===
TITLE: Authentication, MFA, and Passwordless in the Cloud
LEVEL: Beginner
MINUTES: 30
SUMMARY: Learn how cloud providers verify identity, why MFA is non-negotiable for interactive access, and how modern passwordless and phishing-resistant methods change the threat model.
OBJECTIVES: compare password, MFA, and passwordless flows | explain phishing-resistant authentication | configure MFA enforcement in a lab
TAKEAWAYS: passwords alone are insufficient | phishing-resistant MFA (WebAuthn/FIDO2) beats SMS | legacy protocols undermine MFA gains
PRACTICE: In your lab account, enforce MFA for all console users, disable legacy authentication protocols, and register a FIDO2 key for break-glass access.
SOURCES: None
---
## Core idea

Authentication answers "who are you?"; authorization answers "what may you do?" Cloud identity providers issue a signed token after a successful authentication, and that token is what downstream APIs trust. The weakest link is usually the initial proof of identity.

Passwords fail because they are reusable, phishable, and often recycled. **MFA** adds a second factor, but not all factors are equal: SMS and voice are vulnerable to SIM swapping and interception; TOTP codes can be phished in real time by an attacker-controlled proxy. **Phishing-resistant** methods — FIDO2/WebAuthn security keys and certificate-based smart cards — bind the credential to the legitimate relying party origin, so a fake login page cannot harvest a usable assertion.

Another critical concept: **legacy protocols**. Old protocols (basic auth, IMAP, older API auth flows) often do not honor MFA. Leaving them enabled gives attackers a side door that bypasses your MFA policy entirely.

## Method

1. Inventory all interactive users in `<LAB_ACCOUNT>` and record their MFA method.
2. Enforce MFA at the organization or tenant level, not per user.
3. Migrate SMS/TOTP users to WebAuthn where possible; keep TOTP as a floor.
4. Disable legacy/basic authentication protocols and block them with policy.
5. Register at least two break-glass keys stored in separate physical locations.

Example policy enforcement:
```bash
cloudctl org policy set --account <LAB_ACCOUNT> \
  --require-mfa true --block-legacy-auth true --allowed-methods webauthn,totp
```

| Method | Phishing resistant? | Notes |
|---|---|---|
| Password only | No | Unacceptable for interactive access |
| SMS / voice | No | SIM swap, interception |
| TOTP app | Partially | Real-time relay phishing possible |
| FIDO2 / WebAuthn | Yes | Origin-bound, strongest |

## Common mistakes

Allowing an exception for "one admin account" that becomes the breach path. Treating MFA as set-and-forget without auditing registrations. Forgetting service accounts and automation secrets in the MFA review — those need their own controls (see workload identity modules).

## Defense and verification

Run a sign-in log review: filter for legacy protocol logins, MFA failures, and impossible-travel events. Verify by attempting a basic-auth login from a test client; it must be denied. Confirm break-glass accounts are excluded from normal use and monitored.

## Knowledge check

**Q:** Why is a FIDO2 key stronger than a TOTP app against a live phishing proxy?

**A:** WebAuthn binds the assertion to the legitimate origin; the browser will not release a credential for the attacker's domain, so a relayed login cannot succeed.
===MODULE===
TITLE: IAM Policy Grammar: Statements, Effects, Actions, and Resources
LEVEL: Beginner
MINUTES: 35
SUMMARY: Learn the JSON grammar that expresses cloud permissions so you can read, write, and debug policies with confidence.
OBJECTIVES: parse an IAM policy statement | use Action, Resource, Effect, Condition, and Principal correctly | avoid wildcard overreach
TAKEAWAYS: policies are explicit allow/deny statements | wildcards widen access dramatically | conditions are the precision tool
PRACTICE: In your lab account, write a read-only policy for a single bucket, attach it to a test role, and verify it denies writes.
SOURCES: None
---
## Core idea

Most clouds express authorization as JSON documents. A **policy** is a list of statements. Each statement has an **Effect** (`Allow` or `Deny`), one or more **Actions** (API operations), a **Resource** (what the action applies to), optional **Conditions**, and — in resource-based policies — a **Principal** (who). Identity-based policies attach to principals; resource-based policies attach to resources and can grant cross-account access.

The mental model: a policy is a contract that says "under these conditions, this principal may call these actions on these resources." Every adjective matters. `Action: "s3:*"` with `Resource: "*"` is not "broadly useful" — it is administrator-equivalent for that service.

**Conditions** are where precision lives. You can require MFA, restrict source IP, require a tag, or limit the session duration. A well-written policy is a narrow Allow plus explicit Deny guardrails, not a wide Allow with hope.

## Method

1. Start from zero permissions and add the exact API actions the workload needs.
2. Scope `Resource` to specific ARNs, not `*`.
3. Add conditions: require MFA for humans, restrict `aws:SourceIp` or equivalent where appropriate, require resource tags.
4. Simulate the policy before attaching it.

Example (read-only bucket):
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:ListBucket"],
    "Resource": [
      "arn:aws:s3:::<LAB_ACCOUNT>-reports",
      "arn:aws:s3:::<LAB_ACCOUNT>-reports/*"
    ],
    "Condition": {"Bool": {"aws:MultiFactorAuthPresent": "true"}}
  }]
}
```

| Element | Purpose | Overreach risk |
|---|---|---|
| Action | API operations | Wildcards grant whole services |
| Resource | Target ARNs | `*` spans all resources |
| Condition | Context constraints | Missing MFA/IP checks |
| Principal | Who (resource policies) | Cross-account trust |

## Common mistakes

Using `NotAction`/`NotResource` carelessly — they invert logic and surprise auditors. Assuming `ListBucket` and `GetObject` are the same action (they target bucket vs object ARNs). Forgetting that resource-based policies can grant access without an identity-policy Allow.

## Defense and verification

Use the provider policy simulator with representative requests: allow the intended call, deny a write, deny a different bucket. Verify in `<LAB_ACCOUNT>` by assuming the test role and running `get-object` and `put-object`; the second must fail.

## Knowledge check

**Q:** Why does a read-only bucket policy need two resource ARNs?

**A:** `ListBucket` applies to the bucket ARN, while `GetObject` applies to object ARNs beneath it. Missing the bucket ARN breaks listing.
===MODULE===
TITLE: Principals, Resources, ARNs, and Reading an IAM Statement
LEVEL: Beginner
MINUTES: 30
SUMMARY: Learn to decode cloud resource names and identify which side of a policy each element belongs to, a prerequisite for debugging access and spotting over-privilege.
OBJECTIVES: decode an ARN | distinguish identity-based and resource-based policies | trace a request through policy evaluation inputs
TAKEAWAYS: ARNs uniquely name resources and encode account, region, and service | principal placement reveals policy type | context keys drive conditions
PRACTICE: In your lab account, take five ARNs from a policy, decode each field, and annotate which policy type can grant each access path.
SOURCES: None
---
## Core idea

An **ARN** (Amazon Resource Name, or provider equivalent) is a structured identifier: it tells you the partition, service, region, account, resource type, and resource path. Being able to read one at a glance is a superpower — you immediately see whether a policy targets one bucket, all buckets, or a role in another account.

A generic shape is:
```
arn:<partition>:<service>:<region>:<account-id>:<resource-type>/<path>/<name>
```
For example `arn:aws:s3:::<LAB_ACCOUNT>-logs/app/2026/*` means objects under a prefix in a specific bucket; an empty region field often means a global service.

Policies come in two flavors. **Identity-based** policies attach to a principal and are written without a `Principal` element — the principal is implicit. **Resource-based** policies attach to a resource (bucket, key, queue) and include a `Principal`, which may be another account. Cross-account access generally needs both sides to align: the resource policy grants and the identity policy allows (with some exceptions).

Requests carry **context**: principal identity, MFA state, source IP, time, tags, TLS state. Conditions evaluate these context keys. Understanding context explains why a policy that looks correct still denies — e.g., a condition requiring MFA fails for a role session.

## Method

1. Copy an ARN from your policy and split it on `:`.
2. Label each field: partition, service, region, account, resource.
3. Check for a `Principal` element; if present, it is resource-based.
4. List the context keys your conditions reference and verify the caller supplies them.

| Element | Identity policy | Resource policy |
|---|---|---|
| `Principal` | Not allowed | Required |
| `Action` | Required | Required |
| `Resource` | Required | Implied by attachment |

## Common mistakes

Using a bucket ARN where an object ARN is required (or vice versa). Assuming a resource policy alone is enough for same-account access — identity policies still apply. Forgetting that wildcards in the resource path include future objects and prefixes.

## Defense and verification

In `<LAB_ACCOUNT>`, run a policy simulation for a principal with and without MFA; confirm the conditional statement behaves differently. Verify that a foreign-account principal is denied until both sides grant access.

## Knowledge check

**Q:** A statement in a role's policy has no `Principal`. What type is it?

**A:** Identity-based. The principal is the role itself, so specifying `Principal` would be invalid; resource-based policies are the ones that require it.
===MODULE===
TITLE: Cloud Console Tour and Building a Safe First Lab Account
LEVEL: Beginner
MINUTES: 40
SUMMARY: Set up an isolated, owned lab account with billing guards, audit logging, and a naming convention so every later exercise is safe and reproducible.
OBJECTIVES: create an isolated lab account safely | enable audit logging and billing alerts | establish tags and naming conventions
TAKEAWAYS: isolation prevents accidental real-world impact | logging first makes every later lab auditable | tags enable ownership and cleanup
PRACTICE: Create a fresh lab account with a hard billing cap, all-region audit logging, mandatory tags, and a documented cleanup procedure.
SOURCES: None
---
## Core idea

Before practicing any security technique, you need a safe place to practice. A **lab account** is a dedicated, clearly isolated account used only for exercises. It should be disposable, cheap, instrumented, and impossible to confuse with production or anyone else's environment. Never practice against accounts you do not own or programs that have not explicitly authorized you.

Three guardrails make a lab safe. First, **financial**: set billing alarms and hard caps so a runaway resource cannot cost real money. Second, **observability**: enable control-plane audit logging in all regions from minute one, so every change you make is recorded and you learn to read the logs. Third, **identity hygiene**: use a dedicated lab user with MFA, avoid root, and never copy credentials from another environment.

A naming and tagging convention (`env=lab`, `owner=<you>`, `expires=<date>`) lets you find and delete resources later. Orphaned lab resources are a common source of both cost and accidental exposure.

## Method

1. Create a new account under your own organization (or a standalone free-tier account you own).
2. Enable MFA on the root user, then create an admin user with MFA and stop using root.
3. Set a billing alarm at a small threshold and a spend cap if supported.
4. Enable audit logs to a dedicated log bucket in all regions.
5. Tag every resource with `env=lab` and an expiry date.

Example setup commands:
```bash
cloudctl account create --name <LAB_ACCOUNT> --org <LAB_ORG>
cloudctl billing alarm set --account <LAB_ACCOUNT> --threshold-usd 5
cloudctl audit enable --account <LAB_ACCOUNT> --region all --sink <LAB_LOG_BUCKET>
cloudctl tags require --account <LAB_ACCOUNT> --keys env,owner,expires
```

| Guardrail | What it prevents |
|---|---|
| Billing cap | Cost surprises |
| All-region logging | Blind spots |
| Mandatory tags | Orphaned resources |
| No root use | Catastrophic changes |

## Common mistakes

Reusing a personal or production account "just for a quick test." Skipping logging because it seems like overhead. Forgetting to delete resources, leaving a public lab bucket live for months.

## Defense and verification

Run a weekly cleanup check: list resources where `env=lab` and `expires` is past, delete them, and confirm billing returns to baseline. Verify audit logging by making a harmless change and finding it in the log.

## Knowledge check

**Q:** Why enable audit logging before running your first lab exercise?

**A:** So every subsequent action is recorded from the start, letting you verify what happened, learn log structure, and detect anything unexpected — including your own mistakes.
===MODULE===
TITLE: Policy Evaluation Logic: Explicit Deny Wins
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn the exact order a cloud uses to decide allow or deny, including explicit denies, SCP ceilings, session policies, and resource-based grants.
OBJECTIVES: recite the evaluation order | explain why explicit deny always wins | debug a denial using evaluation logic
TAKEAWAYS: default is deny | an explicit deny overrides every allow | permissions from multiple policy types are unioned, then constrained
PRACTICE: In your lab account, create a policy with an allow and an explicit deny for the same action, attach it to a test role, and confirm denial.
SOURCES: None
---
## Core idea

When a principal calls an API, the provider runs a deterministic evaluation. The single most important rule: **default deny**, and **an explicit Deny beats every Allow**, no matter where the Allow came from. The practical model is a funnel.

For a same-account request, the funnel is roughly: gather all applicable identity policies (managed, inline) and union their Allows; add any resource-based policy grants; apply permission boundaries and SCP ceilings; apply session policies for assumed roles; then scan for any explicit `Deny` at any layer. If no Allow survives, or if any Deny matches, the call fails.

Cross-account adds a handshake: the resource account's resource-based policy must allow the principal, and the principal's identity policy in its home account must also allow the call. Both sides must agree (with a few narrow exceptions). This is why "I added a bucket policy but the role still can't read" happens — the identity side is missing.

Conditions are evaluated during matching: a statement with a condition only applies if the request context satisfies it. An `aws:PrincipalTag` condition that cannot find the tag simply does not match, which can silently remove the Allow.

## Method

1. Start debugging from the result: is it a denial or an unexpected allow?
2. List every policy type in scope: identity, resource, SCP, boundary, session.
3. Search for explicit `Deny` statements first — they explain most hard failures.
4. Check conditions and context keys (MFA, tags, IP) for silent non-matches.
5. For cross-account, confirm both sides grant.

Example debug query:
```bash
cloudctl iam simulate --account <LAB_ACCOUNT> \
  --principal <TEST_ROLE> --action s3:GetObject \
  --resource <LAB_BUCKET_ARN> --context MFA=true
```

| Layer | Role in evaluation |
|---|---|
| SCP | Maximum ceiling for the account |
| Permission boundary | Maximum for the principal |
| Identity/resource policies | Grants that are unioned |
| Session policy | Further narrows a role session |
| Explicit Deny | Veto at any layer |

## Common mistakes

Assuming adding another Allow can override a Deny — it cannot. Forgetting that a permission boundary limits even an attached admin policy. Overlooking session policies when debugging `AssumeRole` results.

## Defense and verification

Use the simulator with matched and unmatched context to prove each layer's effect. In `<LAB_ACCOUNT>`, add a conditional MFA deny, then call with and without MFA to observe both outcomes.

## Knowledge check

**Q:** A user has an Allow from an attached policy and a matching Deny in an SCP. What is the result and why?

**A:** Denied. Explicit Deny is absolute at every layer; an SCP Deny overrides all Allows including administrative ones.
===MODULE===
TITLE: Managed Policies, Inline Policies, and Permission Boundaries
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Compare the three ways policies attach to principals and learn how permission boundaries safely delegate administration without granting unlimited power.
OBJECTIVES: contrast managed and inline policies | apply a permission boundary | explain the union-plus-boundary model
TAKEAWAYS: managed policies are reusable and versioned | inline policies are tightly coupled | boundaries cap delegated admins
PRACTICE: In your lab account, create a developer role with a permission boundary that permits only S3 and Lambda, then verify EC2 creation fails.
SOURCES: None
---
## Core idea

Policies attach to principals in three ways. **Managed policies** are standalone, reusable documents (provider-managed or customer-managed) that can be attached to many principals and versioned — ideal for standard access levels. **Inline policies** are embedded in exactly one principal; they die with it and are useful for tightly scoped, one-off grants but hard to audit at scale. **Permission boundaries** are a special policy that does not grant anything — it sets the maximum permissions a principal can ever have.

The crucial model: a principal's effective permissions are the **union of its identity policies, intersected with its permission boundary**. If a developer attaches an admin policy to a role but the boundary allows only S3 and Lambda, the role can use only S3 and Lambda. This lets you delegate "you may create roles and attach policies" without delegating "you may become all-powerful."

Boundaries also interact with SCPs: the effective ceiling is the narrower of the boundary and the SCP. Resource-based policy grants to a role are still limited by the boundary for the role's own actions.

## Method

1. Standardize common access levels as customer-managed policies (read-only, deploy, admin-with-boundary).
2. Use inline policies only for grants that must not outlive a single principal.
3. Write a boundary that lists the maximum services and actions a delegated admin may use.
4. Attach the boundary when creating the role; test that an over-broad attached policy is still constrained.

Example boundary snippet:
```json
{
  "Effect": "Allow",
  "Action": ["s3:*", "lambda:*", "iam:PassRole"],
  "Resource": "*"
}
```

| Policy type | Reusable | Grants access | Sets ceiling |
|---|---|---|---|
| Managed | Yes | Yes | No |
| Inline | No | Yes | No |
| Boundary | Attach to many | No | Yes |

## Common mistakes

Assuming a boundary grants permissions — it does not; you still need an identity policy. Forgetting to include `iam:PassRole` in a boundary for roles that pass service roles, breaking legitimate deployments. Using inline policies for everything and losing central visibility.

## Defense and verification

Run the policy simulator against the developer role for an allowed and a disallowed action. In `<LAB_ACCOUNT>`, have a delegated admin attempt to create an EC2 instance with the S3/Lambda boundary attached; confirm failure and that a CloudTrail event records the attempt.

## Knowledge check

**Q:** A role has `AdministratorAccess` and a boundary allowing only S3. Can it read S3? Can it create EC2?

**A:** Yes for S3 (admin allow intersected with boundary allow). No for EC2 — the boundary caps the union, so the admin policy cannot exceed it.
===MODULE===
TITLE: IAM Roles and Trust Policies
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn how roles differ from users, how trust policies decide who may assume a role, and how to prevent confused-deputy and wildcard-trust mistakes.
OBJECTIVES: explain role assumption and trust policies | write a scoped trust policy | identify confused-deputy risks
TAKEAWAYS: roles have no static credentials | trust policy is the inbound gate | external ID and principal scoping prevent confused deputy
PRACTICE: In your lab account, create a role trusted only by a specific lab principal, assume it, then test that an unrelated principal is denied.
SOURCES: None
---
## Core idea

A role is an identity with **no long-lived credentials of its own**. Instead, a principal calls the STS `AssumeRole` API, presents its own credentials, and receives temporary session credentials with an expiration. This design removes static secrets from config files and gives every session an auditable actor.

The inbound gate is the **trust policy** (resource-based policy on the role). It names which principals may assume it and under what conditions. The trust policy plus the caller's identity to assume must both allow; the caller also needs `sts:AssumeRole`. A trust policy with `Principal: {"AWS": "*"}` is catastrophic — anyone with any cloud account can attempt assumption, and if any identity policy in that account allows it, access follows.

**Confused deputy** is the classic role flaw: a trusted service or third party is tricked into using its privileged role on an attacker's behalf. Defenses include scoping the `Principal` to a specific account or principal ARN, requiring an **external ID** (a secret shared between account owners that the third party must present), and adding conditions like `aws:SourceArn` or `aws:SourceAccount` so only requests originating from your resources qualify.

## Method

1. Create the role and write a trust policy naming exact principal ARNs.
2. Add conditions: `StringEquals` on `sts:ExternalId` for third parties; source ARN/account for service-triggered roles.
3. Attach the minimum permissions policy the role needs.
4. Test assumption from the intended principal and from an unauthorized one.

Example trust statement:
```json
{
  "Effect": "Allow",
  "Principal": {"AWS": "arn:aws:iam::<LAB_ACCOUNT>:root"},
  "Action": "sts:AssumeRole",
  "Condition": {"StringEquals": {"sts:ExternalId": "<LAB_EXTERNAL_ID>"}}
}
```

| Trust setting | Risk |
|---|---|
| `Principal: *` | Anyone can attempt assumption |
| No external ID | Confused deputy possible |
| No source condition | Cross-account resource spoofing |

## Common mistakes

Using `root` as principal without an external ID for third-party access. Trusting an entire account when one role would do. Forgetting that the caller also needs `sts:AssumeRole` on its own identity policy.

## Defense and verification

Review all role trust policies for wildcards and missing conditions. In `<LAB_ACCOUNT>`, attempt assumption from a second test account without the external ID; confirm denial and that the failed attempt appears in audit logs.

## Knowledge check

**Q:** What does an external ID prevent?

**A:** The confused-deputy problem: a third party holding a generic role cannot be tricked into acting for a different customer because it must present the unique ID only your account knows.
===MODULE===
TITLE: Assuming Roles with STS and Temporary Credentials
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Master the STS AssumeRole flow, session duration, session policies, and credential lifecycle so workload access is short-lived and auditable.
OBJECTIVES: describe the AssumeRole request and response | configure session duration and session policies | handle temporary credential refresh safely
TAKEAWAYS: STS issues short-lived credentials | session policies narrow permissions further | every assumption is an auditable event
PRACTICE: In your lab account, assume a test role via the CLI, inspect the returned credentials and identity, then call an API and verify the audit log attributes the action to the session.
SOURCES: None
---
## Core idea

The Security Token Service (STS) is the credential mint. `AssumeRole` takes the caller's credentials plus the role ARN and a optional session name, checks the trust policy, and returns three things: an access key ID, a secret, and a **session token**. Those credentials work for a limited lifetime — commonly 15 minutes to 12 hours — and expire automatically.

The mental model is a badge issued at a front desk. Your original identity proves who you are; the badge (session) says what you can do while wearing it, and it is time-limited. The `RoleSessionName` is written into audit logs, which is why you should make it meaningful — e.g., `ci-deploy-<pipeline-id>` rather than `session-1`.

A **session policy** is an inline policy passed at assumption time that further filters permissions; it can narrow but never widen the role's attached policies. This is useful for multi-tenant systems where one role serves many customers: pass a session policy that scopes access to the current tenant's resources.

Tokens must be refreshed before expiry and never written to disk or source code. SDKs handle this automatically when configured for role assumption; hand-rolled scripts often do it badly.

## Method

1. Call `AssumeRole` with the role ARN and a unique session name.
2. Capture access key, secret, and session token as environment variables in memory only.
3. Make API calls with those credentials; let the SDK refresh them.
4. Read the caller identity to confirm the assumed identity and account.

Example:
```bash
CREDS=$(cloudctl sts assume-role --role-arn <LAB_ROLE_ARN> \
  --role-session-name lab-session --duration-seconds 3600)
export CLOUD_ACCESS_KEY_ID=$(echo "$CREDS" | jq -r .AccessKeyId)
export CLOUD_SECRET=$(echo "$CREDS" | jq -r .SecretAccessKey)
export CLOUD_SESSION_TOKEN=$(echo "$CREDS" | jq -r .SessionToken)
cloudctl sts get-caller-identity --account <LAB_ACCOUNT>
```

| Field | Purpose |
|---|---|
| RoleSessionName | Audit attribution |
| DurationSeconds | Limits exposure window |
| Session policy | Per-session narrowing |
| Session token | Required with temporary keys |

## Common mistakes

Hard-coding temporary keys or forgetting the session token, causing confusing `InvalidClientTokenId` errors. Using a 12-hour duration for routine work. Reusing one session name across all jobs, destroying log attribution.

## Defense and verification

Keep durations at the minimum practical, scope session policies per tenant, and alert on `AssumeRole` from unexpected principals. Verify in `<LAB_ACCOUNT>` that an action appears in the audit log with `userIdentity.sessionContext.sessionIssuer` set to the role and the right session name.

## Knowledge check

**Q:** Can a session policy grant a permission the role's attached policies do not have?

**A:** No. Session policies intersect with the role's identity policies; they can only reduce the maximum available permissions.
===MODULE===
TITLE: Federation with SAML and OIDC
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn how workforce and workload federation exchange an external identity assertion for cloud credentials, eliminating long-lived IAM users and static keys.
OBJECTIVES: explain SAML and OIDC federation flows | configure a trust relationship with an external IdP | map assertions to roles and attributes
TAKEAWAYS: federation removes permanent cloud credentials | SAML suits workforce SSO, OIDC suits workloads | audience and issuer validation are critical
PRACTICE: In your lab account, configure an OIDC identity provider for a fictional CI system, create a role trusting the correct subject and audience, and test assumption with a signed test JWT.
SOURCES: None
---
## Core idea

Federation lets an external identity provider (IdP) vouch for a user or workload, and the cloud exchanges that proof for temporary credentials. The cloud trusts the IdP; the IdP owns authentication. This removes the need for cloud-native passwords and static access keys.

Two protocols dominate. **SAML 2.0** is XML-based and typical for human workforce SSO: a user authenticates at the corporate IdP, receives a signed SAML assertion, and the cloud's STS exchanges it via `AssumeRoleWithSAML`. **OIDC** is JSON/JWT-based and common for workloads and modern apps: a token from an issuer (e.g., a CI platform or an identity service) is exchanged via `AssumeRoleWithWebIdentity`.

The critical trust controls are in the provider's OIDC/SAML configuration: the **issuer URL**, the **audience** (client ID / relying party), and the thumbprint of the IdP's signing certificate. In the role's trust policy, constrain `sub` (subject) and `aud` (audience) with exact or tightly scoped values. Trusting an issuer without constraining the subject means any token from that IdP — including one minted for a different project — could assume your role.

## Method

1. Register the external IdP in `<LAB_ACCOUNT>` with issuer, audience, and signing certificate thumbprint.
2. Create a role whose trust policy specifies the provider, exact `aud`, and expected `sub` pattern.
3. Attach least-privilege permissions to the role.
4. Have the workload obtain a signed token and call `AssumeRoleWithWebIdentity`.

Example trust condition:
```json
"Condition": {
  "StringEquals": {
    "<OIDC_PROVIDER>:aud": "<LAB_CLIENT_ID>",
    "<OIDC_PROVIDER>:sub": "repo:<LAB_ORG>/<LAB_REPO>:ref:refs/heads/main"
  }
}
```

| Protocol | Token | Typical use |
|---|---|---|
| SAML 2.0 | XML assertion | Human SSO to console |
| OIDC | JWT | CI/CD, workloads, mobile |

## Common mistakes

Using `StringLike` with a wildcard `sub` that matches unintended branches or repositories. Forgetting to rotate a signing certificate thumbprint. Trusting a shared IdP audience meant for many tenants.

## Defense and verification

Pin exact subject values where possible and review them quarterly. Verify in `<LAB_ACCOUNT>` that a token for the wrong subject or audience is rejected, and that successful federation produces an audit event with `federatedUser` identity type.

## Knowledge check

**Q:** Why must a trust policy constrain both `aud` and `sub`, not just the issuer?

**A:** The issuer only proves which IdP signed the token. Without audience and subject constraints, any token from that IdP — including one for another team or repo — could satisfy the trust policy.
===MODULE===
TITLE: Instance Profiles and Workload Identity Attachment
LEVEL: Intermediate
MINUTES: 30
SUMMARY: Learn how cloud workloads receive identity without embedded keys — instance profiles, workload identities, and service-account bindings — and how to scope them safely.
OBJECTIVES: attach a role to a compute instance or pod | explain how the credential is delivered | scope a workload identity to one function or service
TAKEAWAYS: workload identities replace static keys | attachment mechanism varies by compute type | one identity per workload limits blast radius
PRACTICE: In your lab account, launch a test instance with an instance profile that allows only read access to one bucket, then verify a write attempt fails and an unauthorized bucket read fails.
SOURCES: None
---
## Core idea

Applications running on cloud compute need credentials to call APIs. The safe pattern is to attach an identity to the workload rather than embedding keys in code or config. The platform then makes temporary credentials available to the process through a local endpoint or injected token — no secret in source control.

The mechanism has different names: an **instance profile** on virtual machines, a **workload identity** or **service account binding** on Kubernetes, a **task role** on container services, and an **execution role** on serverless functions. Despite the names, the model is identical: the workload presents proof of its own identity (a signed token from the platform) to STS and gets short-lived credentials for the attached role.

The crucial design decision is **granularity**. One shared role across an entire fleet means a compromise anywhere grants access everywhere. Prefer per-application or per-environment roles, and use resource conditions and tags to narrow further. The attached role's permissions are the blast radius of a compromised process.

## Method

1. Create a role with only the permissions the workload needs and a trust policy allowing the compute service principal.
2. Attach it as the instance profile / task role / function role at deployment.
3. Confirm the application reads credentials from the platform-provided source, not a file.
4. Remove any legacy static keys from environment variables and config.

Example launch pattern:
```bash
cloudctl ec2 run-instances --account <LAB_ACCOUNT> \
  --iam-instance-profile Name=<LAB_WORKLOAD_PROFILE> \
  --image-id <LAB_AMI> --subnet <LAB_SUBNET>
```

| Compute | Identity attachment |
|---|---|
| Virtual machine | Instance profile |
| Container task | Task/execution role |
| Kubernetes pod | Service account / IRSA-style binding |
| Function | Execution role |

## Common mistakes

Attaching a broad role "temporarily" and never reducing it. Leaving an old access key on the instance alongside the role, so the key still works. Using the same role for production and staging.

## Defense and verification

List instances and functions without an attached role; investigate or remediate. In `<LAB_ACCOUNT>`, read the instance's identity from its metadata endpoint, confirm the role ARN, and verify that a `PutObject` call to a non-allowed bucket fails and appears in logs.

## Knowledge check

**Q:** Why is an attached role safer than an access key stored in an environment variable?

**A:** The role provides rotating short-lived credentials, is attributable to a specific workload, and never persists as a reusable secret that can be copied out of the environment.
===MODULE===
TITLE: Least Privilege in Practice: From Over-Permissive to Scoped
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Turn the principle of least privilege into a repeatable workflow using access data, policy simulation, and staged restriction rather than guesswork.
OBJECTIVES: derive permissions from observed access | scope actions, resources, and conditions | roll out restrictions without breaking workloads
TAKEAWAYS: least privilege is a loop, not a one-time task | usage data beats intuition | stage restrictions with simulation and staging first
PRACTICE: In your lab account, take a role with broad S3 access, review 30 days of access logs, replace its policy with a scoped version, and verify all lab workflows still pass.
SOURCES: None
---
## Core idea

Least privilege means granting only the permissions required for a legitimate task, for only as long as needed. In practice most teams start broad — often `Action: "*"` on `Resource: "*"` — because narrowing feels risky. The way out is data: your audit logs already record which API actions each role actually calls.

The mental model is a **fitting process**. Observe a role in use for a representative period, extract the set of `eventName` values and resource ARNs it touched, convert those into an allowlist, then test and deploy. You repeat the loop whenever the workload changes. Guesswork produces policies that are either too tight (outages) or too loose (risk).

Scope along three axes. **Action**: exact API names, not service wildcards. **Resource**: specific ARNs, not `*`, including prefixes for object stores. **Condition**: constrain source IP, required tags, MFA for humans, or session duration. Each axis you tighten shrinks the blast radius of a stolen session.

Layering helps: a permission boundary as a safety net, an SCP as an account-wide ceiling, and resource-based policies that deny public access regardless of identity grants.

## Method

1. Pull 30–90 days of control-plane events for the principal.
2. List distinct actions and resources actually used; include periodic jobs.
3. Draft a policy with exact actions and scoped ARNs plus conditions.
4. Simulate the new policy against historical and expected calls.
5. Deploy in staging, monitor denials, then roll to production.

Example analysis query:
```bash
cloudctl audit query --account <LAB_ACCOUNT> --principal <LAB_ROLE> \
  --last-days 30 --group-by eventName,resourceArn
```

| Axis | Broad | Scoped |
|---|---|---|
| Action | `s3:*` | `s3:GetObject` |
| Resource | `*` | `arn:...:<LAB_BUCKET>/*` |
| Condition | none | tag/IP/MFA requirement |

## Common mistakes

Narrowing from a short window and missing quarterly jobs. Forgetting read actions needed for discovery (`ListBucket`, `Describe*`) and causing silent failures. Declaring victory without a monitoring period for new denials.

## Defense and verification

After rollout, alert on `AccessDenied` events for the role and review weekly. Verify in `<LAB_ACCOUNT>` that the scoped role still completes its lab workflow and that a previously allowed but now unneeded action is denied.

## Knowledge check

**Q:** Why use 30–90 days of access data instead of one week?

**A:** To capture monthly/quarterly jobs and seasonal workflows; a short window under-reports required permissions and causes outages when the policy is tightened.
===MODULE===
TITLE: Access Reviews, Access Analyzer, and Permission Creep
LEVEL: Intermediate
MINUTES: 30
SUMMARY: Learn how permissions accumulate over time and how to build a sustainable access-review cadence with tooling that finds unused and external grants.
OBJECTIVES: explain permission creep | run an access review with the right evidence | use analyzers to find unused and public grants
TAKEAWAYS: access decays into over-privilege without reviews | data-driven reviews beat checkbox reviews | external and unused grants are high-value findings
PRACTICE: In your lab account, run an access analyzer, review its findings for unused roles and external access, and remediate or document each one.
SOURCES: None
---
## Core idea

Permissions rarely shrink on their own. People change teams, projects end, scripts are repurposed, and emergency grants are forgotten. This accumulation is **permission creep**. An access review is the scheduled process that pulls that tide back.

Effective reviews are evidence-driven. Instead of asking "does this person still need access?", show the reviewer the last time each permission was used, the resources it touches, and the owner. Cloud providers offer **access analyzers** that inspect policies and produce findings: a role with unused permissions, a bucket policy granting access to an external account, a public snapshot, or a trust policy open to all principals.

Focus review effort where risk concentrates: privileged roles, cross-account grants, public resource policies, long-lived keys, and service accounts with broad scopes. For each finding, choose one of three outcomes: revoke, narrow, or explicitly accept with an owner and expiry date.

The review is a control, not a report. It must have a named owner, a defined cadence, and evidence of remediation. Regulators and auditors care about the closure trail.

## Method

1. Enable the access analyzer and/or IAM access advisor in `<LAB_ACCOUNT>`.
2. Export findings and join with resource owners and last-used timestamps.
3. Triage: external/public grants first, then unused admins, then broad scopes.
4. Revoke or narrow; document accepted risk with an expiry.
5. Track findings to closure in a ticket queue.

Example:
```bash
cloudctl access-analyzer findings list --account <LAB_ACCOUNT> \
  --status ACTIVE --type EXTERNAL_ACCESS,UNUSED_ACCESS
```

| Finding | Risk | Default action |
|---|---|---|
| External account grant | Data exfiltration | Revoke unless justified |
| Unused admin role | Stale privilege | Remove or narrow |
| Public resource policy | Anyone on internet | Block immediately |

## Common mistakes

Reviewing only human users while ignoring roles and service principals. Accepting findings without an expiry, so "temporary" grants persist forever. Treating a clean report as success instead of verifying remediation.

## Defense and verification

Set a quarterly review with an owner and require evidence links for closure. Verify in `<LAB_ACCOUNT>` that a deliberately created external grant appears as a finding and disappears after remediation.

## Knowledge check

**Q:** Why are unused grants still a risk even if no attacker is currently using them?

**A:** They enlarge the blast radius of any future compromise — a stolen session or compromised workload can suddenly use permissions nobody remembers granting.
===MODULE===
TITLE: Instance Metadata Service: IMDSv1 vs IMDSv2
LEVEL: Intermediate
MINUTES: 30
SUMMARY: Understand how virtual machines retrieve their identity and configuration from the metadata service, and why session-oriented IMDSv2 closes a major SSRF path.
OBJECTIVES: describe IMDS endpoints and credential retrieval | compare IMDSv1 and IMDSv2 | explain hop-limit protections
TAKEAWAYS: IMDSv1 is a simple GET that SSRF can abuse | IMDSv2 requires a PUT-issued token | hop limit blocks proxied requests
PRACTICE: In your lab account, query the metadata endpoint from a test instance using both methods, then enforce IMDSv2-only and confirm the v1 style call fails.
SOURCES: None
---
## Core idea

Cloud virtual machines need a way to learn their own identity, region, and temporary credentials. The **instance metadata service (IMDS)** provides a link-local HTTP endpoint reachable only from the instance itself, typically at `169.254.169.254`. A workload's attached role exposes credentials through a path like `/latest/meta-data/iam/security-credentials/<ROLE_NAME>`.

The problem: **IMDSv1** serves those credentials to a plain `GET` with no authentication. If an application has an SSRF flaw — a URL fetcher, PDF renderer, or webhook proxy — an attacker can make the server request that URL and return the credentials. This turns a "read-only" SSRF into full role compromise.

**IMDSv2** adds a session-oriented flow. The caller first sends a `PUT` to obtain a token with a header like `X-aws-ec2-metadata-token-ttl-seconds`, then includes that token in subsequent `GET` requests. A simple SSRF that can only issue `GET` cannot mint a token. Additionally, IMDSv2 sets a **hop limit** (commonly 1) on responses, so requests forwarded through a proxy or container bridge cannot reach the metadata IP.

## Method

1. From a test instance in `<LAB_ACCOUNT>`, attempt the IMDSv1 GET pattern and record the response.
2. Issue the v2 PUT to obtain a token, then use it in a GET.
3. Enforce IMDSv2 at instance launch or via a modification command.
4. Re-run the v1-style call and confirm it is rejected.

Example:
```bash
TOKEN=$(curl -sX PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/iam/security-credentials/
cloudctl ec2 modify-instance-metadata-options --account <LAB_ACCOUNT> \
  --instance-id <LAB_INSTANCE> --http-tokens required --http-put-response-hop-limit 1
```

| Property | IMDSv1 | IMDSv2 |
|---|---|---|
| Credential request | GET only | PUT token, then GET |
| SSRF exploitable | Easily | Hard |
| Hop limit | None | Configurable |

## Common mistakes

Leaving IMDSv1 enabled as a fallback "for compatibility." Setting a high hop limit, allowing proxied access. Assuming network security groups protect IMDS — the endpoint is link-local and bypasses them.

## Defense and verification

Enforce `--http-tokens required` on all new and existing instances and monitor for v1 usage. Verify in `<LAB_ACCOUNT>` that a v1-style GET returns 401 and that a container in a bridge network cannot reach the metadata IP.

## Knowledge check

**Q:** Why does a PUT-based token stop a typical SSRF?

**A:** Most SSRF flaws issue only GET requests. Without the ability to make the required PUT and receive its response, the attacker cannot obtain the token needed to retrieve credentials.
===MODULE===
TITLE: SSRF to Cloud Credentials: The Metadata Attack Chain
LEVEL: Advanced
MINUTES: 45
SUMMARY: Walk through the full authorized-lab attack chain from an SSRF primitive to role credentials and lateral movement, so you can recognize and break each link.
OBJECTIVES: describe the SSRF-to-credentials chain | identify exploitable URL-fetch patterns | map each step to a corresponding defense
TAKEAWAYS: SSRF plus IMDSv1 yields credentials | the role's permissions define impact | egress controls and IMDSv2 break the chain
PRACTICE: In your own isolated lab, stand up a deliberately vulnerable URL-preview service, use SSRF to read the metadata endpoint, and document every step and the fix that blocks it.
SOURCES: None
---
## Core idea

SSRF (Server-Side Request Forgery) happens when an application fetches a URL supplied by a user without validating the destination. On cloud compute, the impact escalates because the server sits next to a powerful local service: the metadata endpoint. The chain is a sequence of links, and breaking any one of them stops the attack.

The chain in an authorized lab: (1) find a parameter that makes the server issue an HTTP request — image fetchers, webhooks, PDF generators, import-from-URL features; (2) point it at `http://169.254.169.254/...`; (3) if IMDSv1 is allowed, the response contains the instance's role name; (4) request the role's credential path to obtain temporary keys and token; (5) use those credentials from your own machine to call APIs allowed by the role — read buckets, create snapshots, or enumerate further. The impact is exactly the role's permissions, no more.

Variations include DNS rebinding or redirects that bypass naive blocklists, and chained access to internal services (databases, admin APIs) reachable from the instance. Cloud workloads often trust their instance role implicitly, so the stolen credentials look legitimate.

## Method (lab only)

1. Build a vulnerable app in `<LAB_ACCOUNT>` with a `?url=` fetch parameter.
2. Submit a request to the metadata IP and observe the response body.
3. If credentials are returned, decode the role and list its permissions.
4. Demonstrate impact by reading a lab bucket the role can access.
5. Apply fixes and re-test each step.

Example probe:
```http
GET /preview?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/ HTTP/1.1
Host: <LAB_APP_HOST>
```

| Link | Defense |
|---|---|
| User-controlled URL | Allowlist destinations; block link-local ranges |
| IMDSv1 GET | Require IMDSv2 tokens |
| Credential exposure | Hop limit 1, egress deny to 169.254.169.254 |
| Role over-privilege | Least privilege; session conditions |

## Common mistakes

Blocklisting only the literal `169.254.169.254` string while allowing redirects, alternate encodings, or DNS names resolving to that IP. Assuming a private subnet makes SSRF harmless. Using an over-privileged instance role that turns a small bug into a large breach.

## Defense and verification

Validate URLs against an allowlist, resolve DNS and block private/link-local ranges, disable redirects, enforce IMDSv2, and restrict egress. Verify in `<LAB_ACCOUNT>` that a metadata fetch returns an error and a suspicious egress alert fires.

## Knowledge check

**Q:** What determines the maximum impact of a successful SSRF-to-IMDS attack?

**A:** The permissions of the instance role whose credentials are returned. A read-only role limits damage; an admin role makes it catastrophic.
===MODULE===
TITLE: IMDS Hardening and SSRF Defenses
LEVEL: Advanced
MINUTES: 35
SUMMARY: Build defense in depth against metadata abuse with IMDSv2 enforcement, hop limits, egress rules, and application-level URL validation.
OBJECTIVES: enforce IMDSv2 across a fleet | configure hop limits and egress denials | implement robust URL validation in applications
TAKEAWAYS: multiple independent layers beat one blocklist | IMDSv2 plus hop limit is the core fix | application validation stops the initial request
PRACTICE: In your lab account, enforce IMDSv2 on all test instances, add an egress rule denying link-local access, and patch the vulnerable app with an allowlist; re-run the SSRF test.
SOURCES: None
---
## Core idea

Defending the metadata service is a layered problem because SSRF comes in many shapes. A single control — say, blocking the string `169.254.169.254` — is fragile: attackers use decimal or hex IP encodings, redirects, DNS names, or IPv6 equivalents. The robust approach puts independent barriers at the platform, network, and application layers.

**Platform layer:** enforce IMDSv2-only (`HttpTokens: required`) and set the PUT response hop limit to 1. The hop limit ensures the metadata response cannot traverse a router or container bridge, so a request forwarded by a proxy dies. This is the single highest-value fix.

**Network layer:** apply egress rules that deny traffic to link-local ranges (`169.254.0.0/16`) and to metadata DNS names from application subnets. This catches workloads that do not need metadata at all or where a proxy could forward requests.

**Application layer:** never accept arbitrary URLs. Use an allowlist of schemes, hosts, and ports; resolve hostnames and reject private, loopback, link-local, and metadata addresses; disable automatic redirects; and prefer fetching by identifier rather than raw URL.

## Method

1. Enumerate all instances and set `http-tokens=required`, hop limit 1.
2. Add egress deny rules for link-local destinations in security groups or firewalls.
3. Patch URL-fetching code with DNS resolution + allowlist validation.
4. Re-run your authorized SSRF test and confirm every path fails.

Example validation sketch (pseudo-code):
```python
def safe_fetch(url):
    host = parse(url).hostname
    ip = resolve(host)
    if is_private_or_link_local(ip): raise Blocked()
    if host not in ALLOWED_HOSTS: raise Blocked()
    return fetch(url, allow_redirects=False)
```

| Layer | Control | Stops |
|---|---|---|
| Platform | IMDSv2 + hop limit | Token-less GET, proxied replies |
| Network | Egress deny link-local | Direct metadata calls |
| Application | Allowlist + no redirects | The original SSRF |

## Common mistakes

Forgetting legacy instances during enforcement. Setting hop limit above 1, re-enabling proxied responses. Allowing `http://` when only `https://` is needed, widening the attack surface.

## Defense and verification

Audit fleet-wide metadata options and egress rules monthly. Verify in `<LAB_ACCOUNT>` that IMDSv1 calls return 401, the egress rule logs a deny for link-local attempts, and the patched app rejects a metadata URL.

## Knowledge check

**Q:** Why keep application-level validation even after enabling IMDSv2?

**A:** SSRF also targets internal services and can use other tricks; validating URLs removes the primitive itself and provides a layer independent of platform configuration.
===MODULE===
TITLE: Object Storage Exposure: Public Buckets and Enumeration
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn why object storage is the most common source of cloud data leaks, how public access happens, and how to assess your own buckets safely.
OBJECTIVES: explain public vs private storage access paths | enumerate your own buckets safely | identify exposure indicators
TAKEAWAYS: storage is private by default but easily made public | bucket names can be discoverable | ACLs, policies, and account settings all matter
PRACTICE: In your lab account, create a bucket, attempt to make it public, observe the block-public-access control, and then deliberately expose it in an isolated test to confirm your detection alert fires.
SOURCES: None
---
## Core idea

Object storage holds the data most attackers want: backups, exports, logs, documents, and source archives. It is private by default, but a single ACL change, policy statement, or overly broad role can expose it. Because buckets have globally unique names and predictable URL patterns, exposed data is easily discovered by crawlers and search engines — leaks are often found by outsiders before owners notice.

Three mechanisms control access. **IAM policies** (identity side) grant principals access. **Bucket policies** (resource side) can grant or deny, including to other accounts or the public. **ACLs** are a legacy, coarse-grained mechanism; modern guidance is to disable them. On top of these, **account-level block public access** settings act as a safety net that overrides grants making a bucket public.

Public exposure typically arises from: a bucket policy with `Principal: "*"`, an ACL granting `AllUsers` read, a misconfigured static website setting, or a CDN origin that bypasses private restrictions. Enumeration against your **own** assets means listing buckets via the API, checking each bucket's public-access block status, policy, and ACL, and attempting an unauthenticated `GET` against a known object in an isolated lab.

## Method

1. List all buckets in `<LAB_ACCOUNT>` across regions.
2. For each, query public-access-block settings, bucket policy, and ACL status.
3. Flag any `Principal: "*"` or `AllUsers` grant and any bucket without block-public-access.
4. In a dedicated lab bucket, verify an unauthenticated GET succeeds when exposed and fails when blocked.

Example check:
```bash
cloudctl s3 list-buckets --account <LAB_ACCOUNT>
cloudctl s3 get-public-access-block --bucket <LAB_ACCOUNT>-test
curl -s -o /dev/null -w "%{http_code}" https://<LAB_BUCKET>.s3.<REGION>.amazonaws.com/<LAB_OBJECT>
```

| Control | Scope | Risk if wrong |
|---|---|---|
| Block public access | Account or bucket | Overrides all public grants |
| Bucket policy | Resource | Can grant to `*`/other accounts |
| ACL | Object/bucket | Legacy, coarse |

## Common mistakes

Assuming no one knows the bucket name — names leak in source code, logs, and DNS. Disabling block-public-access account-wide for one website. Ignoring replication targets, which can be public even when the source is not.

## Defense and verification

Enable block public access at the account level and use IAM conditions requiring encryption. Verify in `<LAB_ACCOUNT>` that an unauthenticated GET to a private object returns 403 and triggers an access-denied log entry.

## Knowledge check

**Q:** Why is block-public-access valuable even if no bucket policy currently grants public access?

**A:** It is a guardrail: a future mistake in a policy or ACL cannot make data public because the account-level setting overrides the grant.
===MODULE===
TITLE: Storage Policies, ACLs, and Block Public Access
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn to write storage bucket policies that enforce encryption, require trusted principals, and explicitly deny public access regardless of other grants.
OBJECTIVES: write a bucket policy with deny guardrails | disable ACLs safely | verify public access is impossible
TAKEAWAYS: explicit deny is a powerful guardrail | disable ACLs where supported | require encryption and trusted principals in policy
PRACTICE: In your lab account, attach a bucket policy that denies all requests not using TLS and denies public principals, then verify HTTP requests fail and a public grant is neutralized.
SOURCES: None
---
## Core idea

A storage bucket policy is a resource-based policy that can both grant and deny access. Its most valuable use is often **denial guardrails**: statements that hold true no matter what identity policies say. Because explicit deny wins globally, a bucket policy that denies public principals cannot be overridden by a later permissive grant.

A strong baseline bucket policy contains three kinds of statements: require secure transport (deny when `aws:SecureTransport` is false), require server-side encryption (deny when the encryption header is missing), and deny principals outside your organization or account where appropriate. Optionally deny specific actions from unexpected IP ranges.

ACLs are the older access mechanism and are now disabled by default in most clouds; re-enabling them reintroduces a parallel, hard-to-audit permission path. Prefer policies for everything and explicitly set object ownership to "bucket owner enforced," which disables ACLs.

Block public access settings operate at account and bucket level. When all four flags are on (block public ACLs, block public policies, ignore public ACLs, restrict public buckets), even a mistakenly added public grant has no effect. Treat these as non-negotiable for data buckets.

## Method

1. Set object ownership to bucket-owner-enforced to disable ACLs.
2. Enable all block-public-access flags at the account level.
3. Attach a bucket policy with TLS, encryption, and principal-scope denies.
4. Test with a public grant attempt and an HTTP (non-TLS) request.

Example deny guardrail:
```json
{
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:*",
  "Resource": ["arn:aws:s3:::<LAB_ACCOUNT>-data", "arn:aws:s3:::<LAB_ACCOUNT>-data/*"],
  "Condition": {"Bool": {"aws:SecureTransport": "false"}}
}
```

| Setting | Effect |
|---|---|
| Bucket-owner enforced | ACLs disabled |
| Block public policies | Public bucket policy grants ignored |
| TLS deny | Rejects unencrypted transport |
| Encryption deny | Requires SSE headers |

## Common mistakes

Writing an Allow for your account but forgetting a Deny that covers misconfigurations. Leaving one block-public-access flag off "temporarily." Applying policies to the bucket ARN only and not `/*`, leaving objects unprotected.

## Defense and verification

Use the policy simulator to confirm a public principal is denied even if a permissive inline grant exists. Verify in `<LAB_ACCOUNT>` that an unauthenticated GET and an HTTP request both return 403 and generate deny events in logs.

## Knowledge check

**Q:** Why apply guardrails as Deny statements instead of only allowing trusted principals?

**A:** Deny is absolute across all policy layers, so it survives future mistakes in identity policies or ACLs; an Allow-only design fails open when something new is added.
===MODULE===
TITLE: VPC Fundamentals: Subnets, Route Tables, and Network Boundaries
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn the building blocks of cloud networks — VPCs, subnets, and route tables — so you can reason about reachability and segmentation.
OBJECTIVES: explain VPC, subnet, and route table relationships | design public and private subnets | trace a packet's path
TAKEAWAYS: a VPC is your private network slice | route tables decide where traffic goes | subnet tier reflects trust level
PRACTICE: In your lab account, build a VPC with one public and one private subnet, attach an internet gateway only to the public route table, and verify a private instance cannot be reached directly.
SOURCES: None
---
## Core idea

A Virtual Private Cloud (VPC) is a logically isolated network within the cloud where you place resources. Inside it, **subnets** divide the address space. A subnet is "public" if its route table has a path to an internet gateway; it is "private" if it does not. This distinction is about routing, not a magic security label — a private subnet still needs firewall rules and identity controls.

A **route table** is a set of rules: destination CIDR → target (internet gateway, NAT gateway, peering connection, or local). Every subnet is associated with exactly one route table at a time, and changing that association changes reachability instantly. The mental model: the VPC is a building, subnets are floors, and route tables are the directory telling traffic which elevator to take.

Security follows the topology. Public subnets host load balancers and bastions; private subnets host application servers and databases. A database should have no route to the internet and should accept connections only from the application tier. When you trace a connection, consider both directions: outbound routes and inbound rules in security groups and NACLs.

## Method

1. Create a VPC with a CIDR block (e.g., `10.20.0.0/16`) in `<LAB_ACCOUNT>`.
2. Create public and private subnets in different AZs.
3. Attach an internet gateway; add `0.0.0.0/0 → IGW` only to the public route table.
4. Place a test instance in the private subnet and confirm no public IP is assigned.

Example route table entry:
```
Destination       Target
10.20.0.0/16      local
0.0.0.0/0         igw-<LAB_IGW_ID>   # public subnet only
```

| Subnet type | Route to internet | Typical contents |
|---|---|---|
| Public | Yes via IGW | Load balancer, NAT, bastion |
| Private | No direct route | App servers, containers |
| Isolated | No route at all | Databases, key stores |

## Common mistakes

Assuming a private subnet is unreachable without checking peering or transit gateways. Assigning public IPs to instances in private subnets. Using overlapping CIDRs that break later peering or VPN connectivity.

## Defense and verification

Regularly audit route tables for unexpected `0.0.0.0/0` entries and subnets associated with the wrong table. Verify in `<LAB_ACCOUNT>` that a private instance has no route to the internet and that a direct connection attempt times out.

## Knowledge check

**Q:** What makes a subnet "public"?

**A:** Its route table contains a default route to an internet gateway. The label is routing behavior, not an inherent security property.
===MODULE===
TITLE: Security Groups, NACLs, and Network Segmentation
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Compare stateful security groups with stateless network ACLs and learn to layer them into practical segmentation for cloud workloads.
OBJECTIVES: explain stateful vs stateless filtering | write scoped security group rules | layer NACLs as coarse subnet guards
TAKEAWAYS: security groups are stateful and instance-level | NACLs are stateless and subnet-level | reference other groups instead of CIDRs where possible
PRACTICE: In your lab account, create a web tier and a database tier, allow the database to accept 3306/tcp only from the web security group, and verify other instances are blocked.
SOURCES: None
---
## Core idea

Cloud firewalls come in two layers. **Security groups (SGs)** are stateful, attached to network interfaces: if you allow an inbound connection, the return traffic is automatically permitted. **Network ACLs (NACLs)** are stateless, attached to subnets: you must explicitly allow both inbound and outbound directions, and rules are evaluated in numbered order with an implicit deny at the end.

The mental model: NACLs are the building's perimeter guard checking everyone at the lobby (coarse, per subnet), while security groups are the lock on each office door (fine, per instance). Use NACLs for broad subnet-level rules — e.g., block known bad ranges — and security groups for precise application rules.

Best practice is to reference another security group as the source rather than a CIDR block. If the web tier's SG is the allowed source on the database's port, only instances carrying that SG can connect, even if their IPs change. This creates a self-documenting, resilient segmentation model.

Rules should be minimal: specific ports, specific sources, no `0.0.0.0/0` on management ports. Management access (SSH/RDP) should come from a bastion or a zero-trust access proxy, never from the entire internet.

## Method

1. Map application tiers and the ports each needs.
2. Create one SG per tier with least-privilege inbound rules.
3. Use SG-to-SG references for internal traffic.
4. Add NACL rules as a coarse extra layer if compliance requires it.
5. Test connectivity between tiers and from an unauthorized source.

Example database SG rule:
```
Type: MySQL/Aurora (3306), Protocol: TCP, Source: sg-<LAB_WEB_SG>  (not 0.0.0.0/0)
```

| Property | Security group | NACL |
|---|---|---|
| Scope | Instance/ENI | Subnet |
| State | Stateful | Stateless |
| Rules | Allow only | Allow and Deny |
| Evaluation | All rules | Ordered by number |

## Common mistakes

Opening SSH to `0.0.0.0/0` for convenience. Forgetting the outbound rule on a stateless NACL. Using wide CIDRs instead of SG references, causing segmentation to break when IPs change.

## Defense and verification

Audit SGs for world-open management ports and `0.0.0.0/0` on non-web services. Verify in `<LAB_ACCOUNT>` that a test instance without the web SG cannot connect to the database port and that the attempt is logged as a flow log reject.

## Knowledge check

**Q:** Why can an SG-to-SG reference be safer than a CIDR-based rule?

**A:** It ties access to an identity (the security group) rather than an address, so only workloads deliberately assigned that group can connect, even as IPs change.
===MODULE===
TITLE: Load Balancers, NAT, and Egress Controls
LEVEL: Intermediate
MINUTES: 30
SUMMARY: Learn how traffic enters and leaves cloud networks, and how load balancers, NAT gateways, and egress policies affect the attack surface.
OBJECTIVES: describe ingress and egress paths | configure NAT for private subnets | restrict outbound traffic to approved destinations
TAKEAWAYS: load balancers are public entry points | NAT enables outbound without inbound exposure | egress filtering limits data exfiltration and C2
PRACTICE: In your lab account, route a private subnet's outbound traffic through a NAT gateway, then add an egress deny for an unapproved destination and verify the connection fails.
SOURCES: None
---
## Core idea

Understanding traffic flow is essential to cloud defense. **Ingress** reaches applications through a load balancer: a managed service that terminates client connections and distributes them to healthy backends. Because it is the public face, it is where TLS policy, WAF rules, and rate limiting belong. Backends should accept traffic only from the load balancer's security group, not from the internet.

**Egress** from private subnets typically flows through a NAT gateway, which lets instances reach the internet without having public IPs or accepting inbound connections. NAT is convenient but also a path for data exfiltration and command-and-control traffic if unrestricted.

Modern cloud firewalls and egress policies let you allowlist destinations by domain, IP, or service. Restricting egress is one of the highest-value controls: it blocks malware callback, limits SSRF pivoting, and prevents large data uploads to unknown endpoints. DNS-layer filtering can stop a surprising amount of malicious activity cheaply.

The mental model: ingress is the front door (guard it with WAF and TLS), egress is the loading dock (guard it with allowlists and monitoring). Most breaches involve both — an inbound exploit, then an outbound transfer.

## Method

1. Place public-facing services behind a load balancer; terminate TLS there.
2. Restrict backend SGs to accept traffic only from the LB SG.
3. Send private-subnet egress through NAT and apply an allowlist policy.
4. Log flow logs for both public and private subnets.

Example egress rule:
```
Deny  0.0.0.0/0  tcp/443  unless destination in <LAB_APPROVED_DOMAINS>
Allow 10.20.0.0/16  any  (internal)
```

| Component | Direction | Security role |
|---|---|---|
| Load balancer | Ingress | TLS, WAF, distribution |
| NAT gateway | Egress | Outbound without inbound exposure |
| Egress policy | Egress | Exfiltration and C2 control |

## Common mistakes

Leaving backend instances directly reachable, bypassing the LB. Allowing unrestricted `0.0.0.0/0` egress with no logging. Forgetting flow logs on private subnets, losing visibility into lateral movement.

## Defense and verification

Review egress rules quarterly and alert on connections to new destinations. Verify in `<LAB_ACCOUNT>` that a private instance can reach an approved endpoint, cannot reach an unapproved one, and that both attempts appear in flow logs.

## Knowledge check

**Q:** Why restrict egress when the attacker is already inside?

**A:** Egress controls break the later stages of an attack — C2 callbacks, tool downloads, and data exfiltration — and generate high-signal alerts for anomalous destinations.
===MODULE===
TITLE: Container Fundamentals: Namespaces, cgroups, and Images
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Understand what a container actually is — isolated processes with layered images — so you can reason about its real security boundaries.
OBJECTIVES: explain namespaces and cgroups | describe image layers and the union filesystem | distinguish containers from virtual machines
TAKEAWAYS: containers are processes, not miniature VMs | namespaces isolate views, cgroups limit resources | images are layered and often shared
PRACTICE: In a local lab, run a container, inspect its namespaces and cgroup limits, and compare its process list with the host's to see the isolation boundary.
SOURCES: None
---
## Core idea

A container is not a small virtual machine. It is a normal process on the host whose view of the system has been restricted using kernel features. **Namespaces** give it a private view of PIDs, mounts, network interfaces, users, and hostnames. **Control groups (cgroups)** cap how much CPU, memory, and I/O it can consume. Together they create the illusion of an isolated machine — but the container and host share one kernel.

This shared kernel is the key security fact. A kernel vulnerability can allow container escape, and a misconfigured container with host mounts or elevated privileges can directly affect the host. Isolation is strong for ordinary workloads but weaker than a VM boundary.

**Images** are layered templates. Each Dockerfile instruction creates a read-only layer; a container adds a thin writable layer on top. Layers are cached and shared, which makes builds fast but means a secret added in one layer persists in image history even if a later layer deletes the file.

The mental model: a container is a process in a sandbox made of kernel guardrails, launched from a layered recipe. Security depends on how tight those guardrails are and what the recipe contains.

## Method

1. Run a test container and inspect its namespaces with `lsns` or `/proc`.
2. Check cgroup limits for memory and CPU.
3. Build a tiny image and inspect each layer with `docker history`.
4. Compare the container's process namespace with the host's.

Example:
```bash
docker run -d --name <LAB_CONTAINER> alpine sleep 3600
docker inspect <LAB_CONTAINER> --format '{{.HostConfig.Privileged}} {{.HostConfig.Memory}}'
docker history <LAB_IMAGE>
lsns -p $(docker inspect -f '{{.State.Pid}}' <LAB_CONTAINER>)
```

| Feature | Container | VM |
|---|---|---|
| Kernel | Shared with host | Separate guest kernel |
| Isolation | Namespaces + cgroups | Hypervisor |
| Startup | Seconds | Tens of seconds |
| Escape impact | Can reach host via kernel flaws | Requires hypervisor escape |

## Common mistakes

Treating containers as a security boundary against determined attackers. Assuming `rm /secret` in a later layer removes it from the image. Ignoring cgroup limits and allowing one container to exhaust host memory.

## Defense and verification

Run containers as non-root, apply resource limits, and scan images for embedded secrets. Verify in your lab that a container's `/proc` view is namespaced and that a memory limit causes an OOM kill rather than host impact.

## Knowledge check

**Q:** Why does deleting a secret file in a later Dockerfile layer not remove it?

**A:** Layers are additive; the earlier layer still contains the file in image history, and anyone with the image can extract it.
===MODULE===
TITLE: Building Images Safely: Base Images and Supply Chain
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn how to build container images that are small, reproducible, and free of embedded secrets, and why the build supply chain is a security control.
OBJECTIVES: choose and pin secure base images | write a minimal Dockerfile | avoid secrets and stale packages in layers
TAKEAWAYS: smaller images have fewer vulnerabilities | pin versions and verify digests | build secrets must never enter image layers
PRACTICE: In a local lab, rebuild an image using a pinned minimal base, multi-stage build, and BuildKit secrets; scan the result and compare vulnerability counts to the original.
SOURCES: None
---
## Core idea

Your image is part of your attack surface. Every package, library, and tool in it is code that can contain vulnerabilities. A sensible baseline is a minimal, pinned base image — ideally `distroless` or a slim runtime — with only what the application needs to run.

Two practices matter most. **Multi-stage builds** separate build tooling from the final image: compile in a full builder stage, then copy only the binary into a minimal runtime stage. **Pinning** means using an exact version or content digest rather than a floating `latest` tag, so a rebuild cannot silently pull different code.

Secrets are a particular hazard. `COPY <LAB_SECRET_FILE> .` or `ENV API_KEY=<LAB_VALUE>` bakes the secret into a layer that anyone who can pull the image can recover. Use BuildKit secrets or build args that are not persisted, and inject runtime secrets through the orchestrator's secret mechanism instead.

Also consider metadata: add a non-root `USER`, drop shell tools where possible, and use a read-only root filesystem at runtime. A reproducible build with a recorded digest lets you prove that what you deployed is what you scanned.

## Method

1. Select a minimal base and pin it by digest.
2. Structure the Dockerfile in two stages: build and runtime.
3. Pass build secrets via `--secret`, never `COPY` or `ENV`.
4. Add `USER 10001` and scan the final image.

Example:
```dockerfile
FROM golang:1.22 AS build
WORKDIR /src
COPY . .
RUN go build -o /app ./cmd/server

FROM gcr.io/distroless/static:nonroot
COPY --from=build /app /app
USER 65532:65532
ENTRYPOINT ["/app"]
```

| Practice | Risk reduced |
|---|---|
| Minimal base | Fewer CVEs |
| Pinned digest | Supply-chain substitution |
| Multi-stage | Build tools excluded |
| BuildKit secrets | Credential leakage |

## Common mistakes

Using `latest` tags in production. Installing curl, bash, and package managers "just in case." Assuming a private registry makes embedded secrets safe — anyone with pull access can read layers.

## Defense and verification

Scan images in CI and fail builds on high-severity findings. Verify in your lab that `docker history` shows no secret values and that the running container has no shell and runs as non-root.

## Knowledge check

**Q:** Why pin a base image by digest rather than tag?

**A:** A tag can be moved to different content; a digest points to an exact immutable layer, ensuring the image you scanned is the one you deploy.
===MODULE===
TITLE: Docker Security: Privileged Containers and Capabilities
LEVEL: Advanced
MINUTES: 40
SUMMARY: Learn how Linux capabilities, privileged mode, and host mounts determine whether a container is a mild inconvenience or a host compromise.
OBJECTIVES: explain capabilities and privileged mode | audit dangerous mounts and flags | apply least-privilege runtime options
TAKEAWAYS: privileged mode nearly equals root on the host | drop capabilities by default | host mounts and Docker socket access are escape paths
PRACTICE: In a local lab, launch one privileged container and one hardened container, compare their capabilities and device access, then verify a restricted container cannot access the host filesystem.
SOURCES: None
---
## Core idea

Root inside a container is not the same as root on the host — but the gap is smaller than most people think. Linux divides root's powers into **capabilities** such as `CAP_SYS_ADMIN`, `CAP_NET_RAW`, and `CAP_SYS_PTRACE`. Docker grants a default set and strips the most dangerous ones. `--privileged` removes the restrictions almost entirely, effectively giving the container root-level access to the host kernel and devices.

Several runtime choices are especially dangerous. Mounting the **Docker socket** (`/var/run/docker.sock`) lets a container talk to the host daemon and launch new privileged containers — a common full-compromise path. Mounting host paths with write access lets a container modify host files. Sharing the host PID or network namespace erodes isolation. Running as root with a writable root filesystem increases the impact of any code execution.

The mental model is a set of dials. Every flag you add (`--privileged`, `--cap-add`, host mounts, host namespaces) turns an isolation dial toward "host." Good container security means leaving as many dials at the restrictive default as possible.

## Method

1. Audit running containers for `Privileged=true`, `PidMode=host`, `NetworkMode=host`, and host path mounts.
2. Drop all capabilities, then add back only what is required.
3. Run as a non-root user with a read-only root filesystem.
4. Never mount the Docker socket into application containers.

Example hardened run:
```bash
docker run --rm -d --name <LAB_CONTAINER> \
  --user 10001:10001 --read-only \
  --cap-drop ALL --security-opt no-new-privileges \
  --memory 256m --pids-limit 100 \
  <LAB_IMAGE>
```

| Flag | Effect | Recommendation |
|---|---|---|
| `--privileged` | Nearly full host access | Never in production |
| `-v /var/run/docker.sock` | Control of host daemon | Never for apps |
| `--cap-drop ALL` | Removes capabilities | Default practice |
| `--user 10001` | Non-root process | Default practice |

## Common mistakes

Using `--privileged` to "fix" a permission error instead of diagnosing it. Mounting the Docker socket into a monitoring sidecar. Assuming a container escaping to the host is impossible because namespaces exist.

## Defense and verification

Use admission policy or CI checks to reject privileged containers and socket mounts. Verify in `<LAB_ACCOUNT>` or your lab host that a hardened container cannot read `/etc/shadow` from a host mount and that `no-new-privileges` blocks setuid escalation.

## Knowledge check

**Q:** Why is mounting the Docker socket so dangerous?

**A:** It exposes the host's container daemon API; a process in the container can create a new privileged container with the host filesystem mounted, achieving host compromise.
===MODULE===
TITLE: Runtime Isolation: Seccomp, AppArmor, and User Namespaces
LEVEL: Advanced
MINUTES: 35
SUMMARY: Learn the kernel-level controls that restrict what a container process can do even if it runs as root, and how to apply them consistently.
OBJECTIVES: explain seccomp syscall filtering | describe AppArmor/SELinux profiles | use user namespaces to map root to an unprivileged host user
TAKEAWAYS: seccomp limits dangerous syscalls | MAC profiles confine file and network access | user namespaces reduce host impact of container root
PRACTICE: In a local lab, run a container with a custom seccomp profile blocking a syscall, confirm the call fails, and compare with the default profile.
SOURCES: None
---
## Core idea

Even after dropping capabilities, a container can still call thousands of kernel syscalls. **Seccomp** (secure computing mode) filters which syscalls a process may invoke; a violation terminates the process. Docker's default seccomp profile already blocks many dangerous calls, but custom profiles can tighten further — for example, denying `ptrace`, `mount`, or `bpf`.

**AppArmor** and **SELinux** are mandatory access control (MAC) systems that confine processes based on profiles, restricting file paths, network operations, and capabilities beyond ordinary Unix permissions. Applying a profile to a container adds a second, independent barrier.

**User namespaces** remap user IDs: root inside the container maps to a high-numbered, unprivileged user on the host. This means that even if a process gains root inside the container, it has no root privileges on the host. Not every runtime or platform supports this transparently, but where available it is a strong defense.

The mental model: layered guardrails. Capabilities decide which privileged operations exist; seccomp decides which syscalls can be invoked; MAC profiles decide which files and resources can be touched; user namespaces decide what "root" means on the host. No single layer is sufficient, but together they make escape far harder.

## Method

1. Confirm the runtime's default seccomp and MAC profile are active.
2. Profile a legitimate workload to learn which syscalls it needs.
3. Write a custom seccomp profile that allowlists those calls.
4. Enable user namespace remapping at the daemon level where supported.

Example profile fragment:
```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "syscalls": [
    {"names": ["read", "write", "exit_group", "openat"], "action": "SCMP_ACT_ALLOW"}
  ]
}
```

| Control | Restricts | Layer |
|---|---|---|
| Seccomp | System calls | Kernel syscall boundary |
| AppArmor/SELinux | Files, network, capabilities | Mandatory access control |
| User namespaces | UID mapping | Privilege translation |

## Common mistakes

Applying an overly strict profile without profiling, causing runtime failures. Disabling seccomp to fix a single blocked syscall. Assuming users namespaces are enabled by default on all hosts.

## Defense and verification

Audit that every container runs with a seccomp and MAC profile. Verify in your lab that a call to a blocked syscall fails with `EPERM` and that a process reporting UID 0 in the container maps to a non-zero host UID.

## Knowledge check

**Q:** If a container process is root, why might it still be harmless on the host?

**A:** With user namespace remapping, container UID 0 maps to an unprivileged host UID, so the process has no host root privileges even if it escapes the container's namespace view.
===MODULE===
TITLE: Secrets in Containers: Env Vars, Mounts, and Leak Paths
LEVEL: Advanced
MINUTES: 35
SUMMARY: Learn where container secrets go wrong — environment variables, image layers, logs, and mounted files — and how to inject them safely at runtime.
OBJECTIVES: identify common secret leak paths | use orchestrator secret mounts | rotate and scope container credentials
TAKEAWAYS: env vars are visible via inspect and crashes | secret files should be mounted, not baked | each workload gets its own short-lived identity
PRACTICE: In a local lab, run a container with a secret in an env var and one with a mounted secret file; inspect both from the host and document which is exposed.
SOURCES: None
---
## Core idea

Secrets — API keys, database passwords, tokens — are among the most valuable things in a container environment, and containers create many ways to leak them. An **environment variable** is convenient but visible to anyone who can run `docker inspect`, read process environment via `/proc`, or access orchestrator metadata. A secret baked into an image persists in layers. A secret printed to logs ends up in your logging system, often with broader access than the application itself.

The safe pattern is runtime injection with least exposure. Orchestrators (Kubernetes, ECS, etc.) can mount secrets as files in a tmpfs or inject them at process start, with access controlled by the workload's identity. Better still, avoid static secrets entirely: use the workload identity (instance profile / IRSA-style binding) to obtain short-lived credentials from STS, as covered earlier.

Scope matters. One shared secret across all replicas means rotating it requires a coordinated rollout and a compromise of one pod exposes all. Per-workload identities and short-lived tokens contain the blast radius.

The mental model: every place a secret is copied is a place it can be read. Minimize copies, keep them in memory or tmpfs, control who can read them via identity policy, and make them expire.

## Method

1. Inventory secrets in your images and deployment manifests.
2. Replace `ENV SECRET=...` with a secret mount or identity-based token.
3. Ensure logging libraries redact secret fields.
4. Scope each secret to one workload and set a rotation schedule.

Example deployment pattern:
```yaml
env:
  - name: DB_PASSWORD_FILE
    value: /run/secrets/db_password
volumes:
  - name: secret-vol
    secret:
      secretName: <LAB_DB_SECRET>
```

| Location | Exposure risk | Recommendation |
|---|---|---|
| Image layer | Anyone with pull access | Never |
| Env var | Inspect, /proc, orchestrator UI | Avoid |
| Mounted tmpfs file | Process and host admins | Preferred |
| STS token | Short-lived, in memory | Best |

## Common mistakes

Committing `.env` files to source control. Logging configuration at startup, which prints secrets. Giving every microservice the same database credential.

## Defense and verification

Scan images and manifests for secret patterns and fail CI on findings. Verify in your lab that `docker inspect` reveals no secret value, that logs contain none, and that a mounted secret is readable only by the service account that needs it.

## Knowledge check

**Q:** Why is a mounted tmpfs secret safer than an environment variable?

**A:** It is not exposed in process environment listings or `docker inspect`, lives only in memory, and access can be governed by the orchestrator's identity and mount policy.
===MODULE===
TITLE: Docker Networking and Lateral Movement Boundaries
LEVEL: Advanced
MINUTES: 35
SUMMARY: Learn how container networks work and how flat, default bridges create lateral movement paths between services that should be isolated.
OBJECTIVES: explain Docker bridge networking | segment containers into networks | limit lateral movement between tiers
TAKEAWAYS: default bridges allow broad container-to-container access | user-defined networks provide isolation | published ports expand exposure
PRACTICE: In a local lab, create two user-defined networks, place a frontend and backend on separate ones, and verify the backend is unreachable from an unrelated container.
SOURCES: None
---
## Core idea

By default, Docker connects containers to a bridge network that lets them reach each other by IP or name with few restrictions. This is convenient for development and dangerous in production: a compromise of one container often means direct network access to every other container on the same bridge — databases, caches, admin interfaces.

**User-defined bridge networks** give you isolation. Containers attached to different networks cannot communicate unless you explicitly connect a container to both or route through a firewall. This maps naturally to tiers: a frontend network, an application network, and a data network, with only the necessary containers straddling boundaries.

Another exposure path is published ports. `-p 0.0.0.0:8080:80` exposes a container port on every host interface; binding to `127.0.0.1` or an internal interface limits reachability. Overlay networks in clustered deployments add another layer where encryption and access controls matter.

The mental model: a network is a trust zone. Every container on the same zone can talk unless something says otherwise. Design zones around trust boundaries, not convenience, and assume any single container can be compromised.

## Method

1. Inventory which containers can reach which others on the default bridge.
2. Define user-defined networks per tier and attach containers deliberately.
3. Avoid publishing ports broadly; bind to specific interfaces.
4. Test reachability between tiers and from a compromised-position container.

Example:
```bash
docker network create <LAB_FRONT_NET>
docker network create <LAB_DATA_NET>
docker run -d --net <LAB_FRONT_NET> --name <LAB_FRONTEND> <LAB_IMAGE>
docker run -d --net <LAB_DATA_NET> --name <LAB_DATABASE> <LAB_DB_IMAGE>
docker exec <LAB_FRONTEND> nc -zv <LAB_DATABASE> 5432   # should fail if separated
```

| Network model | Isolation | Use |
|---|---|---|
| Default bridge | Weak | Local experiments only |
| User-defined bridge | Per-network | Production tiering |
| Host network | None | Avoid except for specific agents |
| Overlay | Cluster-wide, configurable | Orchestrated deployments |

## Common mistakes

Leaving everything on the default bridge. Publishing management ports to `0.0.0.0`. Connecting a container to all networks "to make things work," which collapses the segmentation you designed.

## Defense and verification

Audit network attachments and published ports regularly. Verify in your lab that an unrelated container cannot reach the database port and that the frontend reaches only the services it needs.

## Knowledge check

**Q:** Why does a user-defined bridge improve security over the default bridge?

**A:** Containers on separate user-defined networks are isolated from each other by default, so a compromised container cannot freely scan and connect to every other container.
===MODULE===
TITLE: Hardening the Container Host and Runtime
LEVEL: Advanced
MINUTES: 40
SUMMARY: Learn how to protect the host that runs containers — daemon access, runtime privileges, patching, and audit — because a host compromise defeats all container isolation.
OBJECTIVES: secure the container daemon API | minimize host attack surface | audit container runtime activity
TAKEAWAYS: control of the daemon equals control of the host | host and kernel patching are non-negotiable | runtime auditing provides detection
PRACTICE: In a lab host, restrict daemon socket access to a Unix group, enable audit rules for containercreation events, and verify an unprivileged user cannot control the daemon.
SOURCES: None
---
## Core idea

Container isolation ultimately rests on the host. If an attacker controls the container daemon or the host kernel, every container on that host is theirs. The daemon (e.g., `dockerd`) is a high-value target: anyone who can talk to its socket can launch privileged containers, mount the host filesystem, and read all images and secrets.

The API socket should never be exposed over an unauthenticated TCP port. Use a local Unix socket with strict filesystem permissions, and grant access only to a dedicated group or via a TLS-authenticated endpoint if remote access is unavoidable. CI runners that mount the Docker socket are effectively host-root — treat their credentials accordingly.

Host hardening follows standard server practice with container-specific additions: keep the kernel and runtime patched (kernel exploits enable escape), minimize installed packages, disable unnecessary services, enforce disk quota and cgroup limits, and mount filesystems with appropriate flags. Run a security audit tool such as a CIS benchmark check for the container runtime.

**Runtime detection** is the final layer. Audit rules on container creation, exec, and socket access generate high-signal events. Monitoring for unexpected privileged containers or new images is a practical way to catch post-compromise activity.

## Method

1. Verify the daemon socket is a local Unix socket with restrictive group ownership.
2. Patch the host kernel and runtime on a defined cadence.
3. Apply a CIS-style hardening benchmark and record exceptions.
4. Enable audit rules for container lifecycle events and ship logs centrally.

Example audit rule:
```
-w /var/run/docker.sock -k docker_socket_access
-w /usr/bin/docker -k docker_cli
```

| Asset | Control |
|---|---|
| Daemon socket | Unix socket, restricted group |
| Kernel | Regular patching |
| Runtime config | CIS benchmark |
| Lifecycle events | Audit rules + central logs |

## Common mistakes

Exposing the daemon TCP socket without TLS and authentication. Letting CI jobs mount the socket "because builds need it." Deferring kernel patches, leaving known escape vulnerabilities exploitable.

## Defense and verification

Review daemon configuration and socket permissions monthly. Verify in your lab that an unprivileged user gets a permission error accessing the socket and that a privileged container launch produces an audit event.

## Knowledge check

**Q:** Why is a CI job with the Docker socket mounted effectively all-powerful?

**A:** It can instruct the daemon to start a privileged container with the host root filesystem mounted, bypassing all container isolation and gaining host control.
===MODULE===
TITLE: Container Image Scanning and Runtime Detection
LEVEL: Advanced
MINUTES: 35
SUMMARY: Learn how to scan images for known vulnerabilities and detect suspicious behavior at runtime, completing the container security lifecycle before moving to orchestration.
OBJECTIVES: implement image scanning in CI | triage vulnerability findings by exposure | add runtime detection for containers
TAKEAWAYS: scanning shifts discovery left in the lifecycle | severity alone is a poor prioritizer | runtime detection catches what static analysis misses
PRACTICE: In your local lab, scan an image, triage one high-severity finding by checking whether the vulnerable package is actually reachable, then add a runtime rule that alerts on an unexpected shell inside a container.
SOURCES: None
---
## Core idea

Container security spans two moments: before the image runs and while it runs. **Image scanning** inspects layers for known CVEs, embedded secrets, and dangerous configuration before deployment. **Runtime detection** watches running containers for behavior that indicates compromise — a shell spawned in a web container, a crypto-mining process, an outbound connection to a known-bad address, or a write to a sensitive path.

The mental model is a security funnel with two nets. Static scanning catches known problems cheaply at build time. Runtime detection catches the problems that only appear in execution: zero-days, compromised dependencies that passed scanning, and attacker behavior that no CVE database describes. Neither replaces the other.

Scanning produces noise. A high-severity CVE in an unused library may be less urgent than a medium-severity flaw in an internet-facing parser. Triage by **exploitability and exposure**: is the component reachable from untrusted input? Is the container internet-facing? Is a fix available?

Runtime detection works best with a behavioral baseline. Alert on deviations — a shell under a service that never used one, a new listening port, or an unexpected destination — rather than enumerating every malicious action.

## Method

1. Add an image scanner to CI that fails builds on unfixed critical findings.
2. Triage findings by reachability and exposure, documenting accepted risks with an expiry.
3. Deploy a runtime agent or eBPF-style sensor that observes process and network events.
4. Write baseline-based rules and test them with benign simulations.

Example CI scan:
```bash
image-scan scan <LAB_IMAGE>:<LAB_TAG> \
  --fail-on CRITICAL --output json > <LAB_SCAN_REPORT>
runtime-rule add --name unexpected-shell \
  --when 'process.parent in <LAB_SERVICE_PROCESSES> and comm in ["sh","bash"]'
```

| Stage | Tool type | Catches |
|---|---|---|
| Build | Vulnerability scanner | Known CVEs, secrets |
| Deploy | Admission policy | Privileged or unsigned images |
| Runtime | Behavioral sensor | Shell spawn, anomalies |

## Common mistakes

Blocking every CVE regardless of context and training teams to ignore scanner output. Scanning only at build time, never re-scanning when new advisories appear. Alerting on raw process names without a baseline, producing unusable noise.

## Defense and verification

Re-scan deployed images weekly against fresh advisories and review runtime alerts with owners. Verify in your lab that a build with a critical unfixed CVE fails, that a triaged exception has an owner and expiry, and that spawning a shell in the test container produces a runtime alert.

## Knowledge check

**Q:** Why is a high-severity CVE not automatically the top priority?

**A:** Prioritization depends on reachability and exposure — a flaw in an unused library is lower risk than a moderate flaw in an internet-facing component that attackers can actually reach.
===MODULE===
TITLE: Kubernetes Architecture and the Control Plane
LEVEL: Beginner
MINUTES: 35
SUMMARY: Learn the components of a Kubernetes cluster and which of them are security-critical, so you can reason about trust boundaries and attack paths.
OBJECTIVES: name core control-plane and node components | explain the API server's central role | describe how workloads are scheduled
TAKEAWAYS: the API server is the cluster's front door | etcd holds cluster state and secrets | nodes run workloads via the kubelet
PRACTICE: In your own lab cluster, inspect the control-plane components, list API server endpoints, and verify anonymous API access is disabled.
SOURCES: None
---
## Core idea

Kubernetes is a control loop: you declare desired state, and controllers work to make reality match. The **control plane** holds that state and makes decisions. Its heart is the **API server**, which authenticates and authorizes every request and is the only component that talks to **etcd**, the cluster's persistent store. **etcd** contains all objects including Secrets, so its protection is paramount.

Other control-plane pieces include the **scheduler** (places pods on nodes), the **controller manager** (runs reconciliation loops), and **cloud controllers** (integrate with the cloud provider). On each worker node, the **kubelet** is the agent that starts pods and reports status, and the **kube-proxy** handles network rules.

The security model follows from this architecture. Everything goes through the API server, so authentication, authorization, and admission are enforced there. Any compromise of the API server or etcd is a full-cluster compromise. Node compromise (e.g., via a vulnerable workload) threatens workloads on that node and may yield service-account tokens.

Managed Kubernetes services hide most control-plane operations from you, but you still own: cluster access configuration (RBAC), API server public/private setting, etcd encryption at rest, and node hardening.

## Method

1. Map your cluster's components and identify which are managed vs customer-operated.
2. Confirm the API server endpoint is private or IP-restricted.
3. Verify anonymous authentication is disabled and audit logging is on.
4. Confirm etcd encryption at rest for Secrets.

Example checks:
```bash
kubectl config view --minify
kubectl get --raw /api/v1 | head -c 200
kubectl get pods -A -o wide | head
```

| Component | Role | Security note |
|---|---|---|
| API server | Front door for all operations | Central authz point |
| etcd | Cluster state store | Encrypt; restrict access |
| Scheduler | Places pods | Compromise affects placement |
| Kubelet | Runs pods on node | Node-level privilege |

## Common mistakes

Exposing the API server publicly with weak authentication. Assuming a managed control plane means you own no security configuration. Disabling audit logging to save cost.

## Defense and verification

Keep the API endpoint private, enable audit logs, and restrict who can use `kubectl`. Verify in `<LAB_CLUSTER>` that anonymous requests are denied and that etcd encryption is enabled for secrets.

## Knowledge check

**Q:** Why is etcd a high-value target?

**A:** It stores the entire cluster state, including Secrets and configuration; an attacker who reads it obtains credentials and can potentially alter desired state.
===MODULE===
TITLE: Kubernetes RBAC: Roles, RoleBindings, and ServiceAccounts
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn Kubernetes authorization so you can grant humans and workloads only the permissions they need, and understand how service-account tokens become attack targets.
OBJECTIVES: distinguish Role, ClusterRole, and their bindings | scope permissions by namespace | audit overly broad RBAC
TAKEAWAYS: RBAC is allow-only and deny by default | bindings connect identities to roles | service-account tokens are bearer credentials
PRACTICE: In your lab cluster, create a namespace-scoped Role for reading pods, bind it to a test ServiceAccount, and verify it cannot read Secrets or cluster-wide resources.
SOURCES: None
---
## Core idea

Kubernetes uses **RBAC** for authorization. A **Role** is a set of rules (API groups, resources, verbs) scoped to a namespace; a **ClusterRole** applies cluster-wide or to resources that are not namespaced. A **RoleBinding** grants a Role to subjects (users, groups, service accounts) within a namespace; a **ClusterRoleBinding** grants cluster-wide.

The mental model: a role is a job description, a binding is the appointment letter, and the service account is the employee badge. Permissions are additive — there is no explicit deny in RBAC — so careful granting matters. The built-in `cluster-admin` role is effectively root; granting it widely is the most common serious RBAC mistake.

Pods run with a **ServiceAccount** identity. By default, the default service account is mounted into every pod and its token is placed at a predictable path. Any process in the pod can read that token and call the API server with the account's permissions. If a broadly privileged service account is mounted into a workload that gets compromised, the attacker inherits those permissions.

Key hardening: set `automountServiceAccountToken: false` for pods that do not need API access, create a dedicated service account per workload, and scope RoleBindings to a single namespace. Audit bindings for `cluster-admin`, wildcard verbs/resources, and service accounts bound across namespaces.

## Method

1. List all ClusterRoleBindings and Roles; flag wildcards and `cluster-admin`.
2. For each workload, determine whether it needs API access at all.
3. Create namespace-scoped Roles with exact verbs (e.g., `get`, `list` on `pods`).
4. Disable token automount for workloads that do not need it.

Example:
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: <LAB_POD_READER>
  namespace: <LAB_NAMESPACE>
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]
```

| Object | Scope | Grants |
|---|---|---|
| Role | Namespace | Namespaced resources |
| ClusterRole | Cluster | Cluster-wide or non-namespaced |
| RoleBinding | Namespace | Binds a subject to a Role |
| ServiceAccount | Namespace | Pod identity and token |

## Common mistakes

Binding `cluster-admin` for convenience during debugging and leaving it. Using the default service account for everything. Assuming RBAC can express a deny — it cannot.

## Defense and verification

Audit RBAC quarterly and alert on new ClusterRoleBindings. Verify in `<LAB_CLUSTER>` that the test service account can list pods but gets `Forbidden` for Secrets and for cluster-scoped resources.

## Knowledge check

**Q:** Why should a pod that never calls the Kubernetes API have token automount disabled?

**A:** An attacker who compromises that pod would otherwise find a mounted bearer token and could use its permissions; disabling automount removes the credential entirely.
===MODULE===
TITLE: Pod Security, Admission Control, and Security Contexts
LEVEL: Advanced
MINUTES: 40
SUMMARY: Learn how to prevent risky pods from being admitted and how to set per-container security contexts that reduce escape and privilege impact.
OBJECTIVES: explain admission controllers and Pod Security Standards | write a restrictive securityContext | block privileged and host-namespace pods
TAKEAWAYS: admission control prevents bad pods at creation | restricted profile blocks common escape paths | securityContext is defense in depth
PRACTICE: In your lab cluster, enforce the restricted Pod Security Standard on a namespace, attempt to deploy a privileged pod, and confirm the API server rejects it.
SOURCES: None
---
## Core idea

Preventing a dangerous pod from starting is far better than detecting it later. **Admission controllers** intercept API requests before objects are persisted. Kubernetes' **Pod Security Standards** define three profiles — `privileged` (unrestricted), `baseline` (blocks the most dangerous escapes), and `restricted` (strongly hardened) — enforced per namespace via labels such as `pod-security.kubernetes.io/enforce: restricted`.

A pod's **securityContext** sets the runtime posture: run as non-root, drop capabilities, read-only root filesystem, disable privilege escalation, and set seccomp. Container-level settings override pod-level ones, so both should be explicit. These settings map directly to the Docker hardening concepts from earlier modules but are enforced by the cluster.

The mental model: admission is the gate, securityContext is the seatbelt. A gate that rejects privileged pods stops the worst cases; a seatbelt limits harm if a permitted pod is compromised. Use both.

Restricted-profile requirements commonly include: `runAsNonRoot: true`, `allowPrivilegeEscalation: false`, `capabilities.drop: ["ALL"]`, `seccompProfile.type: RuntimeDefault`, and no host namespaces or hostPath mounts. Some workloads genuinely need exceptions; handle them in a dedicated namespace with documented justification and extra monitoring.

## Method

1. Label namespaces with the enforce/audit Pod Security level.
2. Add securityContext to every workload manifest.
3. Use a validation policy (e.g., policy-as-code) in CI to catch violations early.
4. Test rejected pods and review audit warnings for near-misses.

Example:
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 10001
  seccompProfile:
    type: RuntimeDefault
containers:
  - name: <LAB_APP>
    securityContext:
      allowPrivilegeEscalation: false
      capabilities:
        drop: ["ALL"]
      readOnlyRootFilesystem: true
```

| Setting | Blocks |
|---|---|
| `privileged: false` | Host-level capabilities |
| `hostPID: false` | Visibility into host processes |
| `readOnlyRootFilesystem` | Persistence and tampering |
| `runAsNonRoot` | Root-equivalent access |

## Common mistakes

Enforcing only in `audit` mode and assuming it blocks anything. Forgetting that container-level settings override pod-level ones. Granting exceptions cluster-wide instead of in one restricted namespace.

## Defense and verification

Check that namespaces have enforcement labels and that workloads declare security contexts. Verify in `<LAB_CLUSTER>` that a privileged pod is rejected with a policy violation message and that a compliant pod starts.

## Knowledge check

**Q:** What is the difference between `audit` and `enforce` modes for Pod Security?

**A:** `audit` records violations in audit logs but still admits the pod; `enforce` rejects non-compliant pods. Only `enforce` prevents risky workloads from running.
===MODULE===
TITLE: Kubernetes Secrets, ConfigMaps, and etcd Protection
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn how Kubernetes stores and delivers configuration and secrets, and why etcd encryption and RBAC are essential to keeping credentials safe.
OBJECTIVES: distinguish Secret from ConfigMap | explain how secrets are mounted and exposed | enable etcd encryption at rest
TAKEAWAYS: Secrets are base64-encoded, not encrypted by default | anyone who can read Secrets or etcd gets credentials | use external secret stores where possible
PRACTICE: In your lab cluster, create a Secret, confirm its base64 encoding is trivially decodable, enable encryption at rest, and test that RBAC limits who can read it.
SOURCES: None
---
## Core idea

Kubernetes separates configuration from code. A **ConfigMap** holds non-sensitive settings; a **Secret** holds credentials, tokens, and keys. The confusing part is that a Secret's data is merely **base64-encoded** — encoding, not encryption. Anyone with `get secrets` permission, or with access to etcd, can read the plaintext.

Secrets reach pods either as environment variables or mounted files. Environment variables are visible in the pod spec and to any process in the container; files in a tmpfs are somewhat safer but still readable by the container. Because the API server stores Secrets in etcd, protecting etcd is part of protecting secrets. Managed clusters often enable encryption at rest, but you should verify it.

Stronger approaches use external secret managers: the cluster stores only a reference, and a controller or the workload fetches the real value at runtime using a workload identity. This keeps the secret out of etcd and out of manifests (which are often committed to Git).

RBAC is the immediate control: restrict `get`/`list` on Secrets to the few principals that need it, and avoid giving developers cluster-wide read. Auditing access to Secrets is valuable because legitimate need is rare.

## Method

1. Inventory Secrets and identify what each contains.
2. Confirm etcd encryption at rest is enabled.
3. Restrict `get secrets` via RBAC and audit access.
4. Migrate high-value secrets to an external manager with workload identity.

Example:
```bash
kubectl create secret generic <LAB_APP_SECRET> --from-literal=password=<LAB_VALUE>
kubectl get secret <LAB_APP_SECRET> -o jsonpath='{.data.password}' | base64 -d
kubectl auth can-i get secrets --as=system:serviceaccount:<LAB_NAMESPACE>:<LAB_SA>
```

| Storage | Protection |
|---|---|
| Manifest in Git | None — avoid for secrets |
| Kubernetes Secret | Base64 + RBAC; encrypt etcd |
| External secret manager | Identity-based access, rotation |

## Common mistakes

Committing Secret YAML to source control. Giving developers broad `get secrets` "for debugging." Assuming encryption at rest is on without verifying.

## Defense and verification

Scan Git repositories for secret-like literals and alert on `get secrets` calls. Verify in `<LAB_CLUSTER>` that an unauthorized service account is denied, and confirm etcd encryption configuration is present.

## Knowledge check

**Q:** Why is a Kubernetes Secret not sufficient protection by itself?

**A:** Its data is only base64-encoded; it is readable by anyone with API access or etcd access. You need RBAC, etcd encryption, and ideally an external secret store.
===MODULE===
TITLE: Kubernetes Network Policies and Service Mesh
LEVEL: Advanced
MINUTES: 40
SUMMARY: Learn how to restrict pod-to-pod traffic with NetworkPolicies and how a service mesh adds identity-aware, encrypted communication between services.
OBJECTIVES: write default-deny NetworkPolicies | allow only required flows | explain service-mesh mTLS and authorization
TAKEAWAYS: by default all pods can reach all pods | NetworkPolicies provide segmentation at L3/L4 | service mesh adds mutual TLS and L7 policy
PRACTICE: In your lab cluster, apply a default-deny ingress NetworkPolicy to a namespace, add a narrow allow from the frontend to the API, and verify other pods are blocked.
SOURCES: None
---
## Core idea

In a default Kubernetes cluster, every pod can communicate with every other pod, across namespaces. That flat network is a lateral-movement dream for an attacker. **NetworkPolicies** are namespace-scoped firewall rules for pods: they select pods and define allowed ingress and egress flows based on labels, namespaces, ports, and protocols. Crucially, once a NetworkPolicy selects a pod, all traffic not explicitly allowed is denied for that direction.

The recommended baseline is a **default-deny** policy per namespace, followed by narrow allows for the flows the application needs. For example, a database pod accepts connections only from pods labeled `app=api` on port 5432. Because policies use labels, they survive pod restarts and scaling.

A **service mesh** (e.g., Istio-style) goes further: a sidecar proxy intercepts traffic and issues mutual TLS certificates tied to workload identities. It provides encrypted service-to-service communication, strong workload identity, and L7 authorization rules (e.g., allow `GET /orders` from a specific service account). This is powerful but adds complexity and must be deployed carefully.

The mental model: NetworkPolicies are the network-level fences; a service mesh is an identity-aware security layer on top. Start with default-deny NetworkPolicies, then consider a mesh when you need mTLS and fine-grained service identity.

## Method

1. Map legitimate service-to-service flows.
2. Apply default-deny ingress and egress policies to each namespace.
3. Add label-based allows for required flows only.
4. Optionally deploy a mesh with mTLS in permissive mode, then enforce.

Example default-deny:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: <LAB_DEFAULT_DENY>
  namespace: <LAB_NAMESPACE>
spec:
  podSelector: {}
  policyTypes: ["Ingress", "Egress"]
```

| Layer | Control | Granularity |
|---|---|---|
| NetworkPolicy | L3/L4 allow/deny | Pods, namespaces, ports |
| Service mesh | mTLS + L7 authz | Workload identity, HTTP methods |

## Common mistakes

Believing NetworkPolicies are enforced when the CNI plugin does not support them. Writing only ingress policies and leaving egress open. Using broad `namespaceSelector: {}` that effectively allows everything.

## Defense and verification

Verify your CNI supports NetworkPolicies and test from an unrelated pod. Verify in `<LAB_CLUSTER>` that a curl from a non-allowed pod times out while an allowed pod succeeds, and that denied flows appear in logs if flow logging is enabled.

## Knowledge check

**Q:** What happens to a pod's traffic once any NetworkPolicy selects it?

**A:** Unspecified traffic is denied for the directions covered by that policy. A selected pod with only an ingress allow for one source will reject all other ingress.
===MODULE===
TITLE: Serverless Fundamentals: Functions and Event Sources
LEVEL: Beginner
MINUTES: 30
SUMMARY: Learn the serverless execution model — short-lived functions triggered by events — and how that changes the security perimeter and visibility.
OBJECTIVES: describe function lifecycle and event sources | explain ephemeral execution and statelessness | identify new attack surfaces
TAKEAWAYS: functions are event-driven and short-lived | the trigger is part of the attack surface | traditional host controls do not apply
PRACTICE: In your lab account, deploy a simple HTTP-triggered function, invoke it, and inspect its logs and configuration to see how identity and events connect.
SOURCES: None
---
## Core idea

Serverless (Functions as a Service) runs code in response to events without you managing servers. A function is deployed with a handler, a runtime, memory/timeout settings, and an **execution role**. Event sources — HTTP gateways, queues, object uploads, database changes, schedules — invoke it. The platform provisions the environment, runs the function, and tears it down.

This changes security in several ways. There is no host to patch or SSH into, but also no host-based agent for detection. Execution is ephemeral, so forensics depend on platform logs. Functions are typically stateless, though the runtime container may be reused across invocations — which can leak data between requests if you store secrets in global variables incorrectly.

The trigger is the new perimeter. A public HTTP endpoint, a queue anyone can publish to, or a bucket anyone can write to all become ways to invoke your code. Every event source must be treated as untrusted input: validate and authenticate, even for "internal" events.

Visibility comes from platform logging and tracing. Enable them before deploying anything real, because reconstructing an incident later is otherwise impossible.

## Method

1. Deploy a minimal function in `<LAB_ACCOUNT>` with an HTTP trigger.
2. Invoke it and inspect the execution role used and the logs produced.
3. Identify every event source that can invoke your functions and who can trigger them.
4. Validate input in the handler as if the event were hostile.

Example deployment:
```bash
cloudctl function deploy --account <LAB_ACCOUNT> --name <LAB_FUNC> \
  --runtime python3.12 --role <LAB_EXEC_ROLE> --trigger http
cloudctl function invoke --name <LAB_FUNC> --payload '{"id":"<LAB_ID>"}'
```

| Aspect | Traditional server | Serverless function |
|---|---|---|
| Host management | You | Provider |
| Runtime lifetime | Long | Short, possibly reused |
| Detection | Host + network agents | Platform logs and tracing |
| Entry points | Network ports | Event sources |

## Common mistakes

Assuming an internal queue is trustworthy. Leaving debug endpoints public. Not enabling logs, then discovering there is no forensic trail. Storing per-request data in global state that persists across invocations.

## Defense and verification

Enable logging and tracing for every function and alert on errors and unusual invocation rates. Verify in `<LAB_ACCOUNT>` that an unauthenticated trigger is rejected and that each invocation produces a log entry with a request ID.

## Knowledge check

**Q:** Why must you validate events from "internal" sources like queues?

**A:** Anyone who can publish to that queue controls the event; treating it as trusted allows injection attacks through a path that looks internal.
===MODULE===
TITLE: Serverless IAM and Function Permissions
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn how execution roles govern what functions can do, and how to scope them per function to avoid a single flaw becoming a full-account compromise.
OBJECTIVES: attach a least-privilege execution role | scope permissions to specific resources | avoid shared over-privileged roles
TAKEAWAYS: a function's role defines its blast radius | separate execution and invocation permissions | conditions can narrow by resource tags
PRACTICE: In your lab account, create a function role limited to reading one bucket, then verify a write attempt and a read of another bucket both fail.
SOURCES: None
---
## Core idea

A serverless function's **execution role** is the identity it assumes at runtime. Every API call it makes is authorized against that role. If the role is over-privileged, any code-injection or dependency flaw in the function inherits all those permissions — often account-wide. This is why serverless breaches frequently escalate far beyond the vulnerable function.

Two permission types matter and are often confused. **Execution permissions** are what the function's role can do (read a bucket, write a table). **Invocation permissions** are who or what may trigger the function — expressed in the function's resource policy or via the event source. Granting the world `lambda:InvokeFunction` on a sensitive function is its own exposure.

Scope execution roles tightly: exact actions, exact resource ARNs, and conditions where useful. Create a separate role per function, not one shared "serverless-role" across the account. When multiple functions need the same access, a shared *managed policy* is fine — the roles remain distinct and individually auditable.

Use conditions to add context: require a resource tag, restrict source IP/ VPC for functions that should only run in a private network, or require encryption. Avoid wildcard actions like `dynamodb:*` when `GetItem` and `PutItem` suffice.

## Method

1. Inventory functions and their attached roles; flag shared or admin-like roles.
2. Derive required actions from logs and code review.
3. Create per-function roles with scoped resources and conditions.
4. Review who can invoke each function and remove public grants.

Example scoped policy:
```json
{
  "Effect": "Allow",
  "Action": ["s3:GetObject"],
  "Resource": "arn:aws:s3:::<LAB_ACCOUNT>-input/*"
}
```

| Permission | Controls | Common error |
|---|---|---|
| Execution role | What function can do | Account-wide actions |
| Resource policy | Who can invoke | Public invoke grant |
| Event source mapping | What triggers function | Overly broad trigger |

## Common mistakes

Reusing one broad role across all functions. Granting `*:*` "until it works" and never revisiting. Ignoring invocation permissions while focusing only on execution.

## Defense and verification

Alert on new public invoke permissions and on functions with wildcard actions. Verify in `<LAB_ACCOUNT>` that the function reads its allowed bucket, fails on a write, and cannot read a different bucket.

## Knowledge check

**Q:** Why prefer separate roles per function even if they need identical permissions?

**A:** Separate roles contain blast radius and preserve audit attribution; a flaw in one function cannot silently grant an attacker the same access through a shared identity.
===MODULE===
TITLE: Serverless Security: Dependencies, Env Vars, and Invocation
LEVEL: Advanced
MINUTES: 35
SUMMARY: Learn the practical security issues unique to serverless — vulnerable dependencies, environment-variable secrets, event injection, and resource abuse.
OBJECTIVES: scan and pin function dependencies | protect secrets and environment variables | defend against malicious invocation patterns
TAKEAWAYS: package dependencies are part of the attack surface | env vars are visible in configuration | input validation and limits counter abuse
PRACTICE: In your lab account, add a dependency scan to a function build, move a secret from an env var to a secret manager reference, and verify a malicious payload is rejected.
SOURCES: None
---
## Core idea

Serverless shifts infrastructure risk into code and configuration risk. Three areas dominate. **Dependencies**: functions bundle libraries into deployment packages; a vulnerable version is deployed straight into production. Pin versions and scan packages in CI. **Environment variables**: they are a common place to store configuration and secrets, but anyone with permission to view function configuration can read them. Use a secret manager with a reference and a least-privilege role instead.

**Invocation abuse** comes in several forms. A public HTTP endpoint can be flooded, causing cost spikes (denial of wallet). An event with crafted input can exploit injection flaws in the handler. A function that reuses its execution environment may leak data between invocations if global state is misused. Defenses include authentication and rate limiting at the gateway, strict input validation, timeouts and concurrency limits, and stateless handler design.

Cold starts and reuse also matter: initialize clients outside the handler for performance, but never cache per-user data in global variables, because a subsequent invocation in the same container could inherit it.

The mental model: the function is a small, privileged program reachable through an event. Everything that can influence that event is untrusted, and everything bundled into the package is part of your attack surface.

## Method

1. Pin dependency versions and scan the package in CI for known vulnerabilities.
2. Replace secret env vars with secret-manager references.
3. Validate and sanitize every event field; set timeouts and concurrency caps.
4. Add authentication/rate limiting at the HTTP gateway.

Example handler validation (pseudo-code):
```python
def handler(event, context):
    item = event.get("id")
    if not is_valid_id(item): raise ValueError("invalid id")
    return fetch(item)
```

| Risk | Control |
|---|---|
| Vulnerable library | Pin + scan in CI |
| Secret in env var | Secret manager reference |
| Invocation flood | Rate limits + concurrency caps |
| Event injection | Strict input validation |

## Common mistakes

Using `latest` dependency versions. Storing credentials in env vars "temporarily." Skipping input validation because the event comes from an internal service.

## Defense and verification

Monitor invocation rates and costs for anomalies. Verify in `<LAB_ACCOUNT>` that a scan blocks a vulnerable dependency, the function reads a secret from the manager, and a malformed event is rejected with a clear log entry.

## Knowledge check

**Q:** Why can reusing a function's execution environment leak data between invocations?

**A:** Global variables persist in a reused runtime container; if you store per-request or per-user data there, a later invocation in the same container can read it.
===MODULE===
TITLE: CI/CD Pipeline Threat Model
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn how build and deployment pipelines become high-value attack targets and how to threat-model the path from source commit to production.
OBJECTIVES: map the pipeline's trust boundaries | identify injection and supply-chain risks | apply least privilege to pipeline identities
TAKEAWAYS: pipelines hold powerful credentials | build inputs are untrusted data | a compromised pipeline can deploy anything
PRACTICE: In your lab account, map a simple pipeline's stages and identities, identify where untrusted input enters, and document one mitigation per stage.
SOURCES: None
---
## Core idea

A CI/CD pipeline is a privileged automation system: it checks out code, runs scripts, builds artifacts, and deploys them using credentials that can change production. That makes the pipeline a prime target. A compromise at any stage can be amplified into a cloud account compromise.

The mental model is a **chain of trust**. Each stage receives inputs from the previous one and passes outputs forward. Trust boundaries appear where untrusted data enters: a pull request from a fork, a dependency from a public registry, a commit message used in a shell command, or a branch name interpolated into a script. If any of those are executed or evaluated, you have injection.

Common pipeline risks: (1) **script injection** via branch names, PR titles, or issue comments interpolated into shell commands; (2) **poisoned dependencies** or build scripts; (3) **long-lived secrets** stored in pipeline settings; (4) **over-privileged deploy credentials** that can do more than deploy; (5) **unprotected branches** allowing unreviewed code into production; (6) **self-hosted runners** with broad host access.

Defense starts with treating every input as hostile, using OIDC federation instead of static keys (next module), isolating build environments, pinning actions/dependencies, requiring review and signed commits, and scoping deploy roles to exactly the resources the pipeline touches.

## Method

1. Draw the pipeline: trigger → checkout → build → test → artifact → deploy.
2. Mark each place external input enters and each credential used.
3. For each input, remove shell interpolation or validate strictly.
4. Replace static cloud credentials with short-lived federated identity.

Example safe pattern:
```yaml
- name: Checkout
  uses: actions/checkout@<PINNED_SHA>
- name: Build
  env:
    PR_TITLE: ${{ github.event.pull_request.title }}  # pass as env, not shell interpolation
  run: ./scripts/build.sh
```

| Stage | Risk | Mitigation |
|---|---|---|
| Trigger | Untrusted PR | Restrict secrets on forks |
| Build | Dependency confusion | Pin and verify packages |
| Deploy | Broad credentials | OIDC + scoped role |

## Common mistakes

Interpolating `${{ github.event.* }}` directly into `run:` scripts. Using a single admin credential for all environments. Allowing self-hosted runners on untrusted PRs.

## Defense and verification

Enable branch protection and reviewed deployments. Verify in `<LAB_ACCOUNT>` that a test PR cannot access deployment secrets and that a crafted PR title does not execute as shell code.

## Knowledge check

**Q:** Why is passing untrusted values through environment variables safer than string interpolation into a shell command?

**A:** Environment variables are data, not parsed shell syntax, so metacharacters in a PR title or branch name cannot inject additional commands.
===MODULE===
TITLE: Secrets Management in CI/CD with OIDC Federation
LEVEL: Advanced
MINUTES: 40
SUMMARY: Learn how to eliminate long-lived cloud keys from pipelines using OIDC federation, and how to handle the remaining secrets safely.
OBJECTIVES: explain OIDC-based pipeline authentication | replace static keys with federated roles | scope and rotate any unavoidable secrets
TAKEAWAYS: pipelines should never store static cloud credentials | OIDC tokens are short-lived and subject-scoped | remaining secrets need a manager and audit
PRACTICE: In your lab account, configure an OIDC trust for a test pipeline role constrained to a specific repository and branch, then verify a token from a different branch is denied.
SOURCES: None
---
## Core idea

The most impactful CI/CD security change is removing long-lived cloud access keys from pipeline settings. With **OIDC federation**, the CI platform signs a short-lived JWT describing the workflow (repository, branch, actor). The cloud's identity provider validates the token's signature and issuer, and the role's trust policy constrains `aud` (audience) and `sub` (subject). On success, STS returns temporary credentials.

The mental model: instead of giving the pipeline a permanent key, the pipeline presents a signed, self-describing "visitor pass" that says exactly which repo and ref it came from. The cloud checks the pass against a guest list before issuing a short-lived badge.

The trust policy is the security control. Constrain `sub` to an exact repository and ref pattern — e.g., `repo:<LAB_ORG>/<LAB_REPO>:ref:refs/heads/main` — so a token from a feature branch or a different repo cannot assume the role. Constrain `aud` to the expected audience value. Avoid wildcards that match all branches or forks.

Some secrets are unavoidable, such as a deploy key for a system that does not support federation. Keep them in a dedicated secret manager, scope them to the specific workflow and environment, rotate them on a schedule, and require approval to use them in production. Never print them in logs.

## Method

1. Register the CI platform as an OIDC provider in `<LAB_ACCOUNT>`.
2. Create a deploy role with a trust policy pinning issuer, audience, and subject.
3. Attach only the permissions the deployment requires.
4. Configure the workflow to request a token and exchange it for credentials.
5. Migrate remaining secrets to a manager with environment-scoped access.

Example trust condition:
```json
"Condition": {
  "StringEquals": {
    "<OIDC_PROVIDER>:aud": "<LAB_AUDIENCE>",
    "<OIDC_PROVIDER>:sub": "repo:<LAB_ORG>/<LAB_REPO>:ref:refs/heads/main"
  }
}
```

| Credential model | Lifetime | Risk |
|---|---|---|
| Static access key in CI | Indefinite | Leak = persistent access |
| OIDC-federated role | Minutes | Narrow, auditable |
| Vault/secret-manager secret | Rotated | Managed, auditable |

## Common mistakes

Using `StringLike` with `repo:<LAB_ORG>/*` so any repository in the org can assume the role. Trusting all branches including untrusted forks. Forgetting to verify the issuer URL and signing certificate.

## Defense and verification

Audit trust policies for wildcard subjects and alert on role assumption from unexpected repos. Verify in `<LAB_ACCOUNT>` that a token for a non-main branch cannot assume the role and that a valid run leaves a federated-user audit record.

## Knowledge check

**Q:** Why pin the `sub` claim to a specific ref rather than just the repository?

**A:** A repository-wide match allows code from any branch or pull request — including untrusted contributions — to obtain production deployment credentials.
===MODULE===
TITLE: Infrastructure as Code Security: Terraform and CloudFormation
LEVEL: Intermediate
MINUTES: 40
SUMMARY: Learn how to keep infrastructure definitions secure — scanning for misconfiguration, preventing drift, and avoiding leaked state and credentials.
OBJECTIVES: scan IaC for risky configurations | protect state files and variables | enforce secure defaults through modules
TAKEAWAYS: IaC is code and must be reviewed and scanned | state files can contain secrets | secure modules beat repeated hand-written resources
PRACTICE: In your lab account, write a small Terraform config that creates a storage bucket, scan it with an IaC linter, fix the findings, and verify the state file is stored encrypted and access-controlled.
SOURCES: None
---
## Core idea

Infrastructure as Code (IaC) makes deployments repeatable, but it also means a single insecure template can replicate a misconfiguration across an entire estate. Common issues include public storage, overly permissive security groups, unencrypted databases, and missing logging — all visible in the template before deployment.

The mental model: IaC is a blueprint that is executed with credentials. Anything wrong in the blueprint becomes reality at scale, and anything exposed in the build artifacts (state files, plan output) becomes a secret leak.

Two IaC-specific risks deserve attention. First, **state files**: Terraform state can contain resource attributes including passwords and keys, so state must be stored in an encrypted, access-controlled backend with versioning and state locking — never committed to Git. Second, **variables and plan output**: sensitive variables must be marked sensitive, and CI logs must not print plan details containing values.

The best control is secure by construction: build reusable, reviewed modules with safe defaults (encryption on, public access blocked, logging enabled) so teams inherit security rather than reimplementing it. Then scan templates in CI with an IaC linter and block merges on high-severity findings.

## Method

1. Store IaC in version control with mandatory review.
2. Configure a remote, encrypted state backend with locking.
3. Run an IaC scanner (e.g., checkov/tfsec-style) in CI.
4. Replace raw resources with hardened modules and scan the plan.

Example scan:
```bash
iac-scan scan --directory ./infra \
  --account <LAB_ACCOUNT> --skip-check LOW
terraform plan -out=<LAB_PLAN_FILE>
```

| Risk | Control |
|---|---|
| Public bucket in template | IaC scanner rule |
| State file with secrets | Encrypted remote backend |
| Repeated insecure resources | Hardened modules |
| Unreviewed changes | Branch protection |

## Common mistakes

Committing `.tfstate` to Git. Marking a variable sensitive only after it appears in logs. Letting each team write its own networking code with inconsistent rules.

## Defense and verification

Block high-severity IaC findings in CI and audit who can read state. Verify in `<LAB_ACCOUNT>` that a template with a public bucket fails the scan and that the corrected plan deploys a private, encrypted, logged resource.

## Knowledge check

**Q:** Why must Terraform state be treated as a secret?

**A:** It records resource attributes, which can include database passwords, keys, and tokens; anyone who reads state may obtain live credentials.
===MODULE===
TITLE: Policy as Code and Drift Detection
LEVEL: Advanced
MINUTES: 35
SUMMARY: Learn how to enforce cloud guardrails automatically and detect when live infrastructure diverges from its approved, secure definition.
OBJECTIVES: apply policy-as-code gates | detect configuration drift | reconcile drift safely
TAKEAWAYS: policy as code turns rules into automated checks | drift detection closes the gap between blueprint and reality | remediation should be reviewable
PRACTICE: In your lab account, write a policy that denies public storage, deploy a compliant resource, then manually change it to public and verify the drift/policy check flags it.
SOURCES: None
---
## Core idea

Documents describing desired security rules are useful only if something enforces them. **Policy as code** expresses rules as machine-checkable statements evaluated in the deployment pipeline or by the cloud platform. Examples: "no public buckets," "all databases encrypted," "all resources tagged with owner," "no security group open to 0.0.0.0/0 on port 22."

Policies run at different points. **Preventive** gates (pre-deployment scanners, organization SCPs, admission controllers) stop bad configurations before they exist. **Detective** controls (config rules, drift detection, CSPM tools) find issues that slipped through or were introduced manually in the console.

**Drift** is any difference between the approved definition (IaC) and the live state. It happens through console changes, emergency fixes, or out-of-band automation. Drift matters because it silently invalidates your security assumptions — the scanned template is not what is running.

A mature process: define baseline in IaC, enforce preventive policy, continuously compare live state to baseline, alert on drift, and remediate through a reviewable change rather than silently overwriting (which can destroy legitimate data or hide an incident).

## Method

1. Translate your top rules into policy-as-code checks.
2. Run them in CI as blocking gates and in the cloud as detective rules.
3. Schedule recurring drift scans across accounts and regions.
4. Triage drift: expected console change, malicious change, or forgotten lab resource.

Example policy fragment:
```rego
deny[msg] {
  input.resource.type == "storage_bucket"
  input.resource.public_access == true
  msg = "public storage is prohibited"
}
```

| Control type | When it acts | Example |
|---|---|---|
| Preventive | Before deploy | Pipeline policy gate, SCP |
| Detective | After deploy | Config rule, drift scan |
| Corrective | On finding | Auto-remediation with approval |

## Common mistakes

Writing policies so strict that teams bypass them entirely. Running detective controls but never triaging findings. Auto-remediating by deleting resources without understanding the cause.

## Defense and verification

Track policy pass/fail rates and drift age. Verify in `<LAB_ACCOUNT>` that a public bucket change is flagged within the scan interval and that remediation restores the approved state with an audit record.

## Knowledge check

**Q:** Why is detective drift detection needed if preventive policy gates exist?

**A:** Console changes, emergency fixes, and compromised credentials can alter live resources outside the pipeline; detective controls catch what prevention missed.
===MODULE===
TITLE: Cloud Logging Foundations: Audit Trails and Log Integrity
LEVEL: Intermediate
MINUTES: 35
SUMMARY: Learn which logs matter in the cloud, how to centralize them, and how to make them tamper-resistant enough to support investigations.
OBJECTIVES: identify control-plane, data-plane, and service logs | centralize logs across accounts and regions | protect logs from deletion
TAKEAWAYS: audit logs record who changed what and when | centralize into a dedicated security account | log integrity is part of detection
PRACTICE: In your lab account, enable control-plane audit logs in all regions, route them to a central log bucket, and verify a test API call appears there with the expected identity fields.
SOURCES: None
---
## Core idea

Cloud security without logs is guesswork. The most important category is **control-plane audit logs**: records of API calls that change resources or identities. They answer who did what, when, from where, and with what credentials. **Data-plane logs** record access to data (object reads, database queries) and application logs record behavior inside your workloads. Service-specific logs (DNS, flow logs, WAF, function logs) fill in the picture.

A common architectural failure is leaving logs in the account where the attacker operates. If a compromised admin can delete the log trail, the evidence disappears. The fix is centralized, immutable logging: forward logs to a separate security account or log archive with a bucket policy that denies deletion, object-lock/retention enabled, and restricted access. Obligate all accounts and all regions to send logs there.

Log **integrity** also means completeness: enable logs before incidents, verify coverage across accounts, and monitor the logging configuration itself. An attacker's first move is often to disable logging; that action must be both denied by policy and alerted on.

Cost is a real concern, so classify logs by retention: keep high-value audit trails longer, archive noisy debug logs briefly.

## Method

1. Enable the provider's audit trail in every account and region.
2. Route logs to a central, access-restricted archive with retention locks.
3. Add data-plane and application logs for critical services.
4. Alert on changes to logging configuration.

Example verification:
```bash
cloudctl audit status --account <LAB_ACCOUNT> --region all
cloudctl audit query --account <LAB_ACCOUNT> \
  --event-name CreateBucket --last-hours 1 --fields userIdentity,sourceIPAddress
```

| Log type | Answers | Priority |
|---|---|---|
| Control-plane audit | Who changed configuration | Highest |
| Data-plane access | Who read/wrote data | High |
| Application logs | What the app did | Medium |
| Flow logs | Network connections | Medium |

## Common mistakes

Logging only the primary region. Giving workload accounts write/delete access to the central log archive. Disabling logs to save money, then having no incident evidence.

## Defense and verification

Audit log coverage monthly and test deletion is denied. Verify in `<LAB_ACCOUNT>` that a test API call appears in the central archive with `userIdentity`, `eventName`, `sourceIPAddress`, and a timestamp.

## Knowledge check

**Q:** Why centralize logs in a separate security account?

**A:** So a compromise of a workload or admin account cannot delete the evidence; the security account is outside the attacker's control and enforces retention.
===MODULE===
TITLE: Detection Engineering: Building High-Signal Cloud Alerts
LEVEL: Advanced
MINUTES: 40
SUMMARY: Learn how to turn cloud logs into useful detections, reduce noise, and verify that alerts fire for realistic attack behavior.
OBJECTIVES: map attacker behaviors to log events | write and tune detection rules | test detections safely
TAKEAWAYS: good detections map to tactics, not raw events | baseline and suppression cut noise | every rule needs a test and a response path
PRACTICE: In your lab account, write a detection for role assumption by a new principal, trigger it with a test action, then tune out a known-good workload and re-test.
SOURCES: None
---
## Core idea

Collecting logs is not detection. Detection engineering converts log events into alerts that correspond to meaningful attacker behavior. The right starting point is a behavior model: what does credential abuse, privilege escalation, defense evasion, or data exfiltration look like in cloud audit logs?

Examples of high-signal behaviors: `AssumeRole` by a principal that never did so before; creation of an access key for a human user; a policy attached granting admin; logging disabled or a trail deleted; a bucket policy made public; `GetObject` volumes far above baseline; a new region activated; a root account login; an instance with an IMDSv1 metadata request.

The mental model: detections are hypotheses about attacker behavior expressed as queries. Every hypothesis needs a test: simulate the behavior in your lab and confirm the alert fires. Every alert needs a response path — a runbook, an owner, and a severity. An alert nobody acts on is worthless.

Noise is the enemy. Establish a baseline over 2–4 weeks, suppress known-good automation with precise exceptions (not broad wildcards), and prioritize by asset criticality. Tune iteratively using true/false-positive feedback.

## Method

1. Choose a behavior (e.g., privilege escalation) and list candidate events.
2. Write a query/threshold with a defined time window.
3. Test it by safely simulating the behavior in `<LAB_ACCOUNT>`.
4. Baseline, tune exceptions, and attach a runbook and owner.

Example detection logic (pseudo-query):
```sql
auditEvents
| where eventName == "AttachUserPolicy"
| where policyArn endswith "AdministratorAccess"
| where userIdentity.type != "AssumedRole" or principal not in <LAB_APPROVED_ADMINS>
| project time, userIdentity, sourceIPAddress, requestParameters
```

| Behavior | Signal |
|---|---|
| Privilege escalation | Admin policy attached |
| Defense evasion | Audit trail deleted/disabled |
| Credential theft | New key, unusual AssumeRole |
| Exfiltration | Abnormal read volume |

## Common mistakes

Alerting on every failed login, producing unusable noise. Writing rules with no test or owner. Using broad suppressions that hide real attacks.

## Defense and verification

Track detection coverage and mean time to triage. Verify in `<LAB_ACCOUNT>` that the simulated role assumption generates an alert with the right identity and that a suppressed known-good call does not.

## Knowledge check

**Q:** Why must each detection have a response path, not just an alert?

**A:** Without a runbook, owner, and severity, alerts go untriaged; detection only reduces risk when someone investigates and acts.
===MODULE===
TITLE: Authorized Cloud Security Assessment Playbook
LEVEL: Advanced
MINUTES: 45
SUMMARY: Learn how to plan and execute a cloud security assessment safely — scope, authorization, rules of engagement, evidence handling, and stop conditions.
OBJECTIVES: define scope and authorization boundaries | follow rules of engagement | handle evidence and stop safely
TAKEAWAYS: authorization precedes every test | lab and owned accounts only unless explicitly in-scope | stop conditions and evidence handling are part of safety
PRACTICE: Draft a one-page assessment plan for your lab account covering scope, allowed techniques, disallowed actions, stop conditions, and evidence storage; execute one benign check from it.
SOURCES: None
---
## Core idea

A cloud security assessment is a structured review, not an ad hoc exploration. The first and most important step is **authorization**: written permission that names the accounts, resources, techniques, and time window in scope. Everything outside that scope is off-limits. Never test systems you do not own or programs that have not explicitly authorized you, and never use real production credentials or third-party data.

Scope should be precise: specific account IDs, regions, services, and environments. Define **rules of engagement**: what techniques are permitted (configuration review, policy simulation, benign enumeration), what is prohibited (denial of service, data destruction, social engineering, accessing real customer data), and who to contact. Define **stop conditions** — e.g., discovery of production data, unexpected impact, or loss of access — and authority to halt immediately.

Evidence handling matters: store findings in an encrypted location, redact secrets and personal data, and record timestamps and the exact commands used so results are reproducible. Distinguish a verified finding from a hypothesis.

The playbook order is: plan and authorize → inventory → review configuration and identity → run safe checks → verify findings → document with remediation → debrief. Throughout, prefer non-invasive methods: read-only API calls, policy simulators, and configuration analysis over active exploitation. In a lab you own, active tests are acceptable; elsewhere they require explicit written authorization.

## Method

1. Obtain and file written authorization with named scope and dates.
2. Build an inventory of in-scope accounts, regions, and resources.
3. Run read-only checks first; record evidence.
4. Verify each finding with a safe confirmation, then stop if conditions trigger.
5. Report with severity, evidence, impact, and a concrete fix.

| Phase | Activity | Safety rule |
|---|---|---|
| Plan | Scope, RoE, contacts | No work without authorization |
| Discover | Inventory, read-only queries | Least-privilege assessor identity |
| Verify | Safe confirmation in lab only | Stop conditions active |
| Report | Evidence + remediation | Redact secrets/PII |

## Common mistakes

"Just looking" at an account without written scope. Using a production admin credential for convenience. Escalating a lab test into real-world targeting.

## Defense and verification

Maintain an authorization register and a findings log with owners. Verify in `<LAB_ACCOUNT>` that your assessor identity has only the read permissions needed and that all actions appear in the audit trail.

## Knowledge check

**Q:** What must exist before any technical assessment step begins?

**A:** Written authorization defining scope, permitted techniques, time window, and contacts — plus stop conditions and a safe evidence-handling plan.
===MODULE===
TITLE: Lab Capstone: End-to-End Cloud Account Audit
LEVEL: Advanced
MINUTES: 60
SUMMARY: Synthesize the full curriculum by auditing your own lab account across identity, storage, network, logging, and workload configuration, then fixing what you find.
OBJECTIVES: run a structured audit across five domains | verify findings with evidence | remediate and re-verify
TAKEAWAYS: real audits connect identity, data, network, and logging findings | verification prevents false positives | remediation without re-testing is incomplete
PRACTICE: Audit your own lab account end to end, produce a findings table with severity and evidence, remediate at least three findings, and re-run the checks to confirm closure.
SOURCES: None
---
## Core idea

This capstone ties the entire path together. You will audit an account you own using the same structure a professional assessment uses, but entirely within your isolated lab. The goal is not to find the most dramatic issue — it is to practice a repeatable, evidence-based process across five domains.

**Identity:** List users, roles, and service principals; check for MFA gaps, long-lived keys, wildcard trust policies, unused admin permissions, and missing boundaries. **Data:** Enumerate storage resources and check public access blocks, policies, encryption, and logging. **Network:** Review route tables, security groups, and egress rules for world-open management ports or flat segmentation. **Logging:** Confirm audit logs are enabled in all regions and centralized with tamper protection. **Workloads:** For containers, functions, and instances, check attached identities, runtime hardening flags, and secret handling.

Each finding needs four elements: a clear title, severity, reproducible evidence (a command output or config snippet), and a concrete remediation. Verification is a two-step discipline: confirm the finding is real with a safe check, then re-run the same check after the fix. Without the second step, you cannot claim closure.

Prioritize by risk: public data exposure and over-privileged identities outrank cosmetic naming issues. Accept residual risk only with an owner and expiry.

## Method

1. Confirm the lab account is in scope and isolated.
2. Run read-only checks per domain and collect evidence.
3. Build a findings table with severity, evidence, and fix.
4. Remediate the top three; re-run the exact checks.
5. Write a short debrief of what the audit missed.

Example evidence-gathering commands:
```bash
cloudctl iam users list --account <LAB_ACCOUNT> --mfa-status
cloudctl storage buckets list --account <LAB_ACCOUNT> --public-access
cloudctl audit status --account <LAB_ACCOUNT> --region all
```

| Domain | Sample check | Severity if failed |
|---|---|---|
| Identity | Access key older than 90 days | High |
| Data | Public bucket | Critical |
| Network | SSH open to 0.0.0.0/0 | High |
| Logging | Audit off in a region | High |

## Common mistakes

Stopping at discovery and never remediating. Reporting a finding without evidence a reviewer can reproduce. Treating lab findings as if they were real-world authorization to test elsewhere.

## Defense and verification

Produce a final closure table showing pre-fix and post-fix results. Verify in `<LAB_ACCOUNT>` that the re-run checks pass and that the audit trail records each remediation.

## Knowledge check

**Q:** Why re-run the exact same check after remediation?

**A:** To prove the fix changed the specific behavior that was flagged; a different or approximate check cannot confirm closure.
===MODULE===
TITLE: Cloud Security Mastery Checklist
LEVEL: Advanced
MINUTES: 30
SUMMARY: Consolidate the curriculum into a reusable checklist covering identity, data, network, workloads, pipeline, logging, and governance for ongoing cloud security work.
OBJECTIVES: recall the core control domains | apply a consistent review checklist | identify gaps in your own posture
TAKEAWAYS: security is a continuous loop across seven domains | identity and data dominate risk | every control needs an owner and evidence
PRACTICE: Turn the checklist into a recurring calendar review for your lab account, assign an owner to each domain, and record the first completed run with dated evidence.
SOURCES: None
---
## Core idea

Mastery is not knowing every service; it is having a reliable mental checklist that catches the important things every time. The seven domains below summarize the entire path. Use them for design reviews, incident readiness, and periodic posture checks.

**1. Identity and access.** MFA everywhere for humans; no long-lived keys; roles and federation for workloads; least privilege derived from usage; permission boundaries; SCP guardrails; quarterly access reviews.

**2. Data and storage.** Block public access account-wide; encryption at rest and in transit; bucket policies with deny guardrails; ACLs disabled; classification and retention defined.

**3. Network.** Private by default; no world-open management ports; tiered security groups using references; egress allowlists; IMDSv2 with hop limit 1; flow logs on.

**4. Workloads.** Non-root containers; dropped capabilities; seccomp/MAC; pinned and scanned images; secrets from a manager or STS; per-workload identities.

**5. Kubernetes and serverless.** RBAC scoped to namespaces; automount disabled where unnecessary; Pod Security enforced; default-deny NetworkPolicies; function roles scoped per function; triggers validated.

**6. Pipeline and IaC.** OIDC federation instead of static keys; pinned dependencies and actions; input injection prevented; IaC scanned; state encrypted; policy as code enforced; drift detected.

**7. Logging, detection, and governance.** All-region audit logs centralized and immutable; high-signal detections with runbooks; named owners for every control; documented authorization for assessments.

The mental model: this is a loop, not a one-time certification. Measure, fix, verify, repeat. Every "yes" on the checklist should be backed by evidence — a setting, a log entry, or a test result.

## Method

1. Turn each domain into 3–5 yes/no questions with an evidence link.
2. Assign an owner and a cadence (weekly for critical, quarterly for the rest).
3. Run the checklist and record gaps with due dates.
4. Reassess after major architectural changes.

| Domain | One key question |
|---|---|
| Identity | Can any human act without MFA? |
| Data | Can any bucket be public? |
| Network | Is any management port world-open? |
| Workloads | Do containers run privileged? |
| Pipeline | Are static cloud keys in CI? |
| Logging | Can an attacker delete the trail? |

## Common mistakes

Treating the checklist as paperwork instead of a test. Letting controls without owners silently decay. Skipping the evidence requirement.

## Defense and verification

Keep a dated evidence folder and require a passing re-check before marking an item closed. Verify in `<LAB_ACCOUNT>` that each domain has at least one recent, reproducible check result.

## Knowledge check

**Q:** Why must every checklist item have an owner?

**A:** Unowned controls decay; an owner ensures the check runs, gaps get remediated, and evidence is maintained over time.
===MODULE===
TITLE: Real-World Cloud Breach Case Patterns
LEVEL: Advanced
MINUTES: 45
SUMMARY: Study recurring cloud incident patterns — leaked keys, exposed storage, SSRF to metadata, over-privileged workloads, and pipeline compromise — and extract transferable defenses.
OBJECTIVES: recognize common breach patterns | map each to failed controls | extract defensive lessons without copying offensive details
TAKEAWAYS: most cloud breaches are configuration and identity failures, not exotic exploits | blast radius is set by privilege and segmentation | detection and response speed matter
PRACTICE: In your lab account, pick one pattern, identify the three controls that would have prevented or contained it, and verify each control is present in your own environment.
SOURCES: None
---
## Core idea

Cloud incidents cluster into a handful of recurring patterns. Studying patterns, not specific victims, builds judgment that transfers across providers. All details here are defensive; do not reproduce them against systems you do not own.

**Pattern 1: leaked keys.** A key committed to a public repository or container image is used to enumerate resources. Failed controls: no static keys, no secret scanning, no anomaly detection. Containment: short-lived federation, least privilege, alerts on unusual API calls.

**Pattern 2: exposed storage.** A bucket is made public by a policy or ACL change and indexed by crawlers. Failed controls: block public access, deny guardrails, monitoring. Containment: account-wide blocks, data classification, alerting on policy changes.

**Pattern 3: SSRF to metadata credentials.** A URL-fetching feature reaches the metadata service and returns instance-role credentials. Failed controls: IMDSv1, no egress filtering, no URL allowlist. Containment: IMDSv2 plus hop limit, egress deny to link-local, application validation, least-privilege instance roles.

**Pattern 4: over-privileged identity.** A compromised pod or function inherits a broad role and moves laterally. Failed controls: shared roles, wildcard permissions, flat networking. Containment: per-workload roles, scoped RBAC, default-deny policies.

**Pattern 5: pipeline compromise.** Untrusted code in a build obtains deployment credentials and alters infrastructure. Failed controls: static CI secrets, script injection, unprotected branches. Containment: OIDC federation, pinned inputs, branch protection, scoped deploy roles.

## Method

1. For each pattern, list the initial access, the escalation step, and the impact.
2. Map each step to the control from this curriculum that would break it.
3. Check your own environment for that control with a reproducible test.
4. Record gaps with owners and due dates.

| Pattern | Primary failure | Key defense |
|---|---|---|
| Leaked key | Static credential | Federation + scanning |
| Public bucket | Missing guardrail | Block public access |
| SSRF → IMDS | IMDSv1 + flat egress | IMDSv2 + allowlists |
| Broad workload role | Over-privilege | Least privilege + segmentation |
| Pipeline compromise | Static CI secrets | OIDC + input hygiene |

## Common mistakes

Focusing only on the exploit and missing the configuration decisions that enabled impact. Assuming a different provider is immune to these patterns. Studying incidents without checking your own controls.

## Defense and verification

Prioritize controls that break multiple patterns: federation, least privilege, block public access, centralized immutable logging. Verify in `<LAB_ACCOUNT>` that at least one test per pattern confirms the relevant control is active.

## Knowledge check

**Q:** What common thread runs through most cloud breach patterns?

**A:** Identity and configuration failures — over-broad permissions, exposed resources, and static credentials — rather than sophisticated software exploits. The highest-value defenses are least privilege, guardrails, and strong logging.
