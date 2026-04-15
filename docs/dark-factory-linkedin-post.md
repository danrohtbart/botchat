# A Simple Dark Factory: Go Ahead and Scale It From Here

*How I gave an AI agent autonomous merge privileges — and why the real engineering is in the guardrails, not the code.*

---

## The Setup

I run a side project called BotChat — a Next.js app backed by AWS Amplify, Cognito, DynamoDB, Lambda, and Bedrock. Nothing exotic. The kind of stack a solo founder builds on a weekend and then maintains alongside a day job.

What's unusual is how I maintain it. For the past several months, an AI coding agent (Claude, via Claude Code) has been operating in what I call **"yolo mode"** — fully autonomous development cycles where the bot branches from `dev`, writes failing tests, implements features, pushes code, waits for CI to build a preview environment, verifies the preview, and merges its own PRs. No human in the loop until the code is ready for production.

This is a dark factory. A small one. And if you squint at it the right way, you can see how it scales — and exactly where it breaks.

---

## What's Already Running

Here's what the autonomous pipeline looks like today:

### The Git Flow

```
feature branch (from dev)  ←  bot creates this
       │
       │  PR → dev          ←  bot opens this
       ▼
      dev                   ←  bot merges this (yolo mode)
       │
       │  PR → main         ←  bot opens this, human merges
       ▼
      main (production)     ←  human-only zone
```

Three environments — `dev`, `main`, and ephemeral PR previews — each with its own Amplify build, its own backend stack, its own Cognito user pool. Every PR gets a live preview URL at `https://pr-{N}.d3bo8xtge7s7fh.amplifyapp.com`, built against the dev backend. The bot can see its own work running in a real browser before merging anything.

### The CI Pipeline (Amplify)

Every build runs through a gauntlet:

1. **TruffleHog secret scanning** — verified-only mode, fails the build on any real credential leak. Also runs as a local pre-commit hook. You can't disable it; the CLAUDE.md says so, and the bot follows instructions.
2. **No-skip test enforcement** — a shell script (`check-no-disabled-tests.sh`) greps for `test.skip`, `xit`, `xdescribe`, and every other variant. If you skip a test, the build fails. The bot is explicitly forbidden from deleting or disabling prior tests to make new ones pass.
3. **Jest unit tests** — fully mocked AWS dependencies, no credentials needed.
4. **Playwright E2E tests** — three browser engines (Chromium, Firefox, WebKit), running against the live preview with real Cognito authentication.

### Test-Driven Development as a Constraint, Not a Suggestion

The bot doesn't just run tests — it writes them first. The workflow is enforced in the instructions:

1. Write a failing test. Commit it. (Red.)
2. Write the minimum implementation to make it pass. Commit it. (Green.)
3. Run the full suite. Push only if everything passes.

This isn't aspirational. It's a hard constraint baked into the operating instructions. The commit history shows alternating red/green commits. TDD isn't just a development practice here — it's an **audit trail**. Every feature has a provable moment where the test existed before the code did.

### The Hard Rule

One line in the instructions is non-negotiable: **"Never merge a PR to `main` — only Dan promotes to production."**

That's me. I'm the human gate between dev and production. The bot can go as fast as it wants on the dev side, but production deploys require a human decision.

---

## Where It Breaks: The Dan Problem

Here's what keeps me up at night. Look at all the hats I'm wearing:

- **Dan the repo owner** — full GitHub admin privileges
- **Dan the code reviewer** — the only person who approves PRs to main
- **Dan the AWS admin** — runs `amplify push`, manages IAM roles, re-attaches Cognito triggers
- **Dan the yolo-mode activator** — decides when the bot operates autonomously
- **Dan the production gatekeeper** — the sole merger to main

That's five distinct roles collapsed into one GitHub identity. It works when I'm the only human on the project. It does not scale.

The deeper problem: **my bot's constraints are enforced by a markdown file, not by the platform.** Every branch in the repo — including `main` — shows `protected: false` on GitHub. The only thing stopping the bot from merging directly to production is a paragraph in CLAUDE.md that says "don't do that." The bot follows those instructions faithfully. But "faithfully following a markdown file" is not a security architecture. It's a gentleman's agreement with a language model.

---

## The Scaling Blueprint: What Needs to Change

If I were handing this pattern to a team — or running multiple bots with different privilege levels — here's what I'd build:

### 1. Enforce Branch Protection at the Platform Level

**GitHub branch protection rules must do the heavy lifting, not CLAUDE.md:**

- **`main` branch**: Require pull request reviews (minimum 1 human approval). Restrict who can push — only the repo owner or a `production-deployers` team. Require status checks to pass (Amplify build, TruffleHog, Jest, Playwright). Disable force pushes. Disable deletion.
- **`dev` branch**: Require status checks to pass (all CI must be green). Allow bot accounts to merge without human review. Disable force pushes.

This way, even if a bot's instructions are malformed or a prompt injection attempt tells it to "merge to main," GitHub itself blocks the action. Defense in depth.

### 2. Separate Bot Identity from Human Identity

Right now, the bot commits and pushes under whatever Git credentials are available in the session. There's no way to distinguish a bot-authored merge from a human-authored merge in the audit log. That's a problem.

**What this looks like in practice:**

| Actor | GitHub Identity | Privileges | How Authenticated |
|-------|----------------|------------|-------------------|
| Dan (human) | `danrohtbart` | Full admin. Can merge to `main` and `dev`. Can modify branch protection rules. Can run `amplify push`. | Personal access token or SSH key with full repo scope |
| Claude (dev bot) | `botchat-claude-dev` | Can create branches, open PRs, merge to `dev` only. Cannot modify repo settings. Cannot merge to `main`. | Fine-grained PAT scoped to: contents (write), pull requests (write), limited to `dev` branch pattern |
| Dependabot | `dependabot[bot]` | Can open PRs for dependency updates. Cannot merge anything. | GitHub-managed bot token |
| Future: CI bot | `botchat-ci` | Can trigger deployments, run `amplify push`. Cannot modify code. Cannot merge PRs. | OIDC-federated IAM role, no long-lived credentials |

The key insight: **each actor gets its own GitHub identity with the minimum privileges needed for its role.** The bot doesn't need admin access. It doesn't need to manage branch protection. It doesn't need to touch production. Give it a fine-grained personal access token that literally cannot do what it shouldn't do.

### 3. Formalize the Licensing Model

When you operate a dark factory, every autonomous actor needs a "license" — a formal, auditable grant of specific privileges. This is how I think about it:

**License tiers:**

- **L1 — Code Author**: Can create branches, write code, push commits. Cannot open PRs. (Useful for experimental or untrusted bots.)
- **L2 — Dev Contributor**: Everything in L1, plus can open PRs targeting `dev` and merge them after CI passes. This is what Claude has today in yolo mode.
- **L3 — Production Promoter**: Everything in L2, plus can open PRs targeting `main`. Cannot merge them — only flags them for human review. (This is also what Claude does today, but it should be a distinct, deliberately granted privilege.)
- **L4 — Human Operator**: Can merge to `main`. Can modify infrastructure. Can change branch protection rules. Can grant and revoke licenses. **Humans only.**

The current system has two tiers: "bot" and "Dan." That's not enough. Dependabot should be L1 (it opens PRs but shouldn't merge). Claude should be L2 in yolo mode, L3 when preparing production promotions. A future staging-validation bot might be L3. Dan — or any human engineer joining the team — is L4.

### 4. Make the Audit Trail Machine-Readable

Today, the evidence that TDD was followed lives in commit messages and the order of commits. That's fine for a human reading `git log`. It's not fine for automated compliance.

**What I'd add:**

- **Conventional commits** with a `bot:` or `human:` scope prefix, enforced by a commit-msg hook.
- **Signed commits** — the bot's GPG key is different from Dan's. You can cryptographically verify who authored what.
- **A merge-gate GitHub Action** that checks: was this PR opened by a bot identity? If yes, is it targeting `dev`? If it's targeting `main`, does it have a human approval from an L4 actor? Reject if not.

### 5. Separate AWS Admin from Code Deployer

Right now, the same person who merges code also runs `amplify push`, re-attaches Cognito triggers, and verifies IAM policies. These are infrastructure operations with blast radius well beyond a single PR.

**The split:**

- **Code path**: Git → GitHub → Amplify CI → automatic deploy. No AWS credentials needed by the bot or developer.
- **Infrastructure path**: Amplify CLI → CloudFormation → manual verification. Requires IAM role assumption with MFA. Separate from the deploy pipeline. Ideally triggered by a chatops command (`/infra push dev`) that requires L4 approval and logs every action.

The known pitfalls — Cognito triggers getting silently cleared, IAM policies getting stripped on `amplify push` — are exactly the kind of thing that should be caught by automated post-deploy verification, not by a human remembering to check.

---

## The Punchline

Building a dark factory is easy. You give an AI agent a set of instructions, a CI pipeline, and merge permissions. It works. It's shockingly productive. My bot has shipped features, resolved Dependabot alerts, fixed CI failures, and deployed to dev — all while I was doing other things.

But "works for one person on a side project" is not the same as "works." The real engineering isn't in the AI agent or the CI pipeline. It's in the **permission architecture** — the formal, platform-enforced, auditable separation of who can do what, and the guarantee that "who" is a verified identity and not just a paragraph in a markdown file.

Here's what I'd tell any engineering leader thinking about autonomous AI agents in their pipeline:

1. **TDD is non-negotiable.** It's not just a quality practice — it's the audit trail that proves the bot tested before it built. Without it, you're trusting the agent's output on faith.
2. **Secret scanning is non-negotiable.** An autonomous agent that can push code can push credentials. TruffleHog (or equivalent) in both pre-commit hooks and CI is table stakes.
3. **Platform enforcement over prompt enforcement.** Your bot's markdown instructions are the seatbelt. Branch protection rules are the guardrail. You need both, but only one stops the car from going off a cliff.
4. **One identity per actor.** If you can't distinguish a bot merge from a human merge in your audit log, you don't have an audit log.
5. **License your bots like you license your engineers.** Different bots get different privileges. Promotion to production always requires a human. The privilege to merge is granted, scoped, and revocable — not implicit.

The dark factory is simple. Scaling it is a security engineering problem. And that's the interesting part.

---

*Dan Rohtbart builds AI-powered applications and thinks too much about permission architectures. He has never once regretted making a bot write tests first.*
