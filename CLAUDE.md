# Claude Code Instructions for botchat

These instructions apply to every Claude Code session in this repository. Follow them without exception unless Dan explicitly overrides a rule in the current conversation.

---

## Environments at a glance

| Environment | Git branch | Amplify backend | Cognito pool | URL |
|-------------|------------|-----------------|--------------|-----|
| Production  | `main`     | `main` (stack `amplify-botchat-main-223437`) | `us-east-1_N9z5Z5X2w` | https://www.botchatapp.com |
| Development | `dev`      | `dev` (stack `amplify-botchat-dev-135408`)   | `us-east-1_AYMzkIGAz` | https://dev.d3bo8xtge7s7fh.amplifyapp.com |
| PR preview  | `pr-{N}`   | `dev` (via `PREVIEW_*` env vars)             | `us-east-1_AYMzkIGAz` | https://pr-{N}.d3bo8xtge7s7fh.amplifyapp.com |

**PR previews always use the `dev` backend.** Feature branches must target `dev`, not `main` — this ensures the PR preview is validated against the same backend that will receive the change.

---

## Git flow

```
feature branch (from dev)
       │
       │  PR → dev
       ▼
      dev  ──── Amplify builds → dev backend
       │         https://dev.d3bo8xtge7s7fh.amplifyapp.com
       │
       │  PR → main  (when dev is stable / sprint complete)
       ▼
      main ──── Amplify builds → main backend (production)
                https://www.botchatapp.com
```

### Step-by-step for every change

1. **Branch from `dev`** — never from `main`.
   ```bash
   git fetch origin
   git checkout -b claude/short-description-XXXX origin/dev
   ```
2. Write and commit code (TDD — red then green, see [Development workflow](#development-workflow-redgreen-tdd)).
3. Run `npm test` locally. All tests must pass.
4. Push and open a PR **targeting `dev`** (not `main`).
5. The Amplify PR preview builds automatically and uses the `dev` backend.
6. Assess the preview at `https://pr-{N}.d3bo8xtge7s7fh.amplifyapp.com` — log in with `.env.test` credentials (`TEST_USER_EMAIL` / `TEST_USER_PASSWORD`).
7. Merge to `dev` (in yolo mode) or wait for Dan (in default mode). Amplify builds and deploys to the dev environment.
8. When `dev` is stable and ready for production, open a PR from `dev` → `main`. **Dan reviews and merges — never Claude.**
9. Amplify builds `main` and deploys to production.

### Backend changes (GraphQL schema, Lambda, DynamoDB)

When a PR includes files under `amplify/`:
- The PR preview runs the new frontend against the **current** `dev` backend — the backend change is not yet deployed.
- After Dan merges to `dev`, run `amplify push --env dev` to deploy the backend change to the dev environment. Confirm the dev site works end-to-end before opening the `dev → main` PR.
- After the `dev → main` PR merges, run `amplify push --env main` (or verify Amplify CI handles it) and confirm production.
- Always verify afterwards: IAM role `botchatLambdaRole*` has `AmazonBedrockFullAccess`, and the Cognito pre-signup trigger is still configured.

---

## Operating modes

Claude operates in one of two modes, selected by Dan at the start of a session:

### Default mode (approval required)
Dan approves every PR before it is merged. Claude opens PRs and waits. See [Pull request process](#pull-request-process) and [Amplify build loop](#amplify-build-loop) below.

### Yolo mode (fully autonomous)
Dan activates this by saying **"yolo mode"** (or equivalent) at the start of a session.

In yolo mode Claude operates without approval gates, with one hard constraint: **Claude may merge PRs to `dev`, but must never merge to `main` — only Dan merges to main.**

0. **Read the ClickUp ticket in full before writing any code.** Use `mcp__clickup__clickup_get_task` or `mcp__clickup__clickup_search` to fetch the ticket. Do not skip this step even if the task seems obvious from the session prompt.
1. Branch from `dev` (see [Git flow](#git-flow) above).
2. Write a failing test (red). Commit it.
3. Write the minimum implementation to make it pass (green). Commit it.
4. Run `npm test` locally to confirm all tests pass.
5. Push the branch and open a PR targeting `dev`.
6. **Wait for the Amplify PR preview to build.** Poll with:
   ```bash
   aws amplify list-jobs --app-id d3bo8xtge7s7fh --branch-name pr-{N} --query 'jobSummaries[0].status'
   ```
   The preview URL is `https://pr-{N}.d3bo8xtge7s7fh.amplifyapp.com`.
7. **Assess the PR preview.** Log in using `.env.test` credentials and manually verify the feature works correctly. If broken, push a fix, wait for the preview to rebuild, and re-assess.
8. **Merge to `dev`** once CI is green and the preview assessment passes.
9. Watch the `dev` Amplify build. If it fails, diagnose, fix on the same branch or a new one, and repeat.
10. **Notify Dan** once the feature is live on dev: share the dev URL, what you tested, and any concerns. Dan will decide when to promote to `main`.

Constraints that apply in both modes (never override):
- Never commit secrets or credentials to GitHub (see [Security](#security-never-commit-secrets)).
- Never delete, skip, or disable a test from a prior PR to make a new test pass.
- Never disable or work around TruffleHog.
- **Never merge a PR to `main`** — only Dan promotes to production.

---

## Identity & ownership

- This is **Dan Rohtbart's** project. Claude may merge PRs to `dev` in yolo mode, but **never to `main`** — only Dan promotes to production.
- Notify Dan after each failed Amplify build attempt or any other significant failure.

---

## Security: never commit secrets

- **Never** commit credentials, secrets, API keys, tokens, passwords, or private certificates to GitHub — not even in comments, test fixtures, or example files.
- The repo has TruffleHog running in two places:
  1. **Amplify CI** (`amplify.yml` preTest phase) — scans on every build.
  2. **Local pre-commit hook** (`.pre-commit-config.yaml`) — runs before every commit on developer machines. Install via `pip install pre-commit && pre-commit install`.
- If TruffleHog blocks a commit or CI run, investigate and remove the offending secret. Never disable or work around the scanner.
- Sensitive local values (Playwright credentials, AWS keys) belong in `.env.test` or environment variables — both are gitignored. See the README for the full list.

---

## Development workflow: red/green TDD

1. **Write a failing test first.** Commit it (red). Confirm it fails before adding implementation.
2. **Write the minimum implementation** to make the test pass (green). Commit it.
3. Run the full test suite (`npm test`) locally before pushing.
4. **Never delete, skip, or disable a test from a prior PR** to make a new test pass. If a new change legitimately obsoletes a test, discuss it with Dan before removing it. ESLint enforces this with the `jest/no-disabled-tests` rule.

---

## Pull request process

1. **Always branch from `dev`**, not from `main`. Before branching, run:
   ```bash
   git log origin/dev ^HEAD
   ```
   If commits exist on `dev` that aren't on your branch, start fresh from `origin/dev`.
2. Keep PRs focused — one logical change per PR.
3. Write a clear PR description explaining *what* changed and *why*.
4. Open the PR targeting `dev`. Do not merge — wait for Dan's approval.
5. If CI fails after you open the PR, fix the failure in a new commit on the same branch, push, and repeat.

### Promoting dev → main
When `dev` is stable and ready for production:
1. Open a PR from `dev` → `main`.
2. Dan reviews and merges.
3. Watch the production Amplify build (see [Amplify build loop](#amplify-build-loop)).

---

## Amplify build loop

After Dan merges, the Amplify build runs automatically. Monitor with:
```bash
aws amplify list-jobs --app-id d3bo8xtge7s7fh --branch-name <main|dev>
```

If the build fails:
1. Diagnose from the Amplify build log.
2. **Notify Dan** immediately.
3. Fix on a new feature branch, open a PR to `dev`, and wait for Dan to merge.
4. Repeat until the build succeeds and the site is working.

| Branch | URL after successful build |
|--------|---------------------------|
| `dev`  | https://dev.d3bo8xtge7s7fh.amplifyapp.com |
| `main` | https://www.botchatapp.com |

---

## Testing

### Jest (unit tests)
```bash
npm test
```
No environment variables needed — AWS dependencies are fully mocked. Mock files live in `__mocks__/` and `jest.config.js` maps `aws-exports` to the stub automatically.

### Playwright (E2E tests)
Requires a running app and real Cognito credentials:
```
TEST_USER_EMAIL=...
TEST_USER_PASSWORD=...
```
Store them in `.env.test` (gitignored). The test user must exist in **both** Cognito pools (`us-east-1_AYMzkIGAz` for dev, `us-east-1_N9z5Z5X2w` for main). Start the app first:
```bash
npm start
npx playwright test
```

### Lambda function tests
Run `amplify mock function` from inside the Lambda directory:
```bash
cd amplify/backend/function/botchattriggerjs/
amplify mock function botchattriggerjs --event src/event.json --timeout 60
```

When writing Lambda tests, always import AWS SDK modules from the project root `node_modules/` (not the Lambda's local `node_modules/`) so that `jest.mock()` calls apply correctly. See `jest.config.js` `moduleNameMapper` for the relevant aliases.

---

## Repository structure

| Path | Purpose |
|------|---------|
| `src/app/` | Next.js app (React frontend) |
| `amplify/` | Amplify backend (GraphQL API, Cognito, Lambda, DynamoDB) |
| `amplify/backend/function/botchattriggerjs/` | Main Lambda function |
| `__tests__/` | Jest unit tests |
| `e2e/` | Playwright E2E tests |
| `amplify.yml` | Amplify CI/CD pipeline definition |
| `.pre-commit-config.yaml` | TruffleHog pre-commit secret scanner |
| `__mocks__/aws-exports.js` | Jest stub for the gitignored aws-exports.js |

---

## Common pitfalls (learned from history)

- **Always branch from `dev`, not `main`.** PRs targeting `main` directly skip the dev environment and go straight to production.
- **aws-exports.js** is generated by `amplify push` and is gitignored. Tests must use the `__mocks__/aws-exports.js` stub — do not commit the real file or add it to `.gitignore` changes.
- **Playwright version** must be consistent in three places: `package.json`, the Docker image tag in `amplify.yml`, and the `npm install @playwright/test@X.Y.Z` line. They must all match. Current version: **1.58.2**.
- **TruffleHog in CI** uses `--only-verified --fail`. Only verified secrets cause failures. Do not disable this flag or skip the TruffleHog step to unblock a build.
- **Lambda node_modules**: the Lambda function has its own `node_modules/`. When writing Jest tests for Lambda code, force resolution through the project root via `moduleNameMapper` so mocks work correctly.
- **Selenium** is no longer used in CI (replaced by Playwright). Do not add Selenium back to the CI pipeline.
- **CSS percentage heights cascade** — if you remove an explicit height from a parent div (e.g. `h-1/8`), any child using `height: %` or `maxHeight: %` will resolve to 0 in WebKit (Safari) because percentage heights require a sized parent. Before removing a height class from any container, grep for `h-`, `maxHeight`, and percentage-based sizing in its direct children and descendants, and switch them to viewport-relative units (e.g. `vh`) or fixed values if needed.

---

## Amplify backend changes

After any backend change (`amplify push`), verify:
1. The IAM role `botchatLambdaRole*` has `AmazonBedrockFullAccess` attached.
2. If the allow-list is active, the Cognito pre-signup Lambda trigger is still configured.

---

## Resolving Dependabot alerts

1. Check out the PR branch (from `dev`).
2. Run `npm install` and update `package-lock.json`.
3. Run `amplify upgrade` if Amplify itself has an upgrade.
4. Run `amplify push --yes` to push backend changes.
5. Run `npm run dev` and manually test at http://localhost:3000.
6. Open a PR targeting `dev`. Wait for Dan to merge.
7. Watch the dev Amplify build, then promote to `main`.
