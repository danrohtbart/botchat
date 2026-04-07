# Claude Code Instructions for botchat

These instructions apply to every Claude Code session in this repository. Follow them without exception unless Dan explicitly overrides a rule in the current conversation.

---

## Operating modes

Claude operates in one of two modes, selected by Dan at the start of a session:

### Default mode (approval required)
Dan approves every PR before it is merged. Claude opens PRs and waits. See [Pull request process](#pull-request-process) and [Amplify build loop](#amplify-build-loop) below.

### Yolo mode (fully autonomous)
Dan activates this by saying **"yolo mode"** (or equivalent) at the start of a session.

In yolo mode Claude operates without approval gates:

1. Write a failing test (red). Commit it.
2. Write the minimum implementation to make it pass (green). Commit it.
3. Run `npm test` locally to confirm all tests pass.
4. Push the branch and open a PR.
5. **Merge the PR immediately** once CI is green — do not wait for Dan.
6. Watch the Amplify build at https://us-east-1.console.aws.amazon.com/amplify/apps
7. If the build fails: diagnose, create a new fix branch, open a PR, merge it, watch again.
8. Loop steps 6–7 until the Amplify build succeeds and https://www.botchatapp.com is working.
9. **Notify Dan after every failed Amplify build attempt**, regardless of whether a fix is ready.

Constraints that apply in both modes (never override):
- Never commit secrets or credentials to GitHub (see [Security](#security-never-commit-secrets)).
- Never delete, skip, or disable a test from a prior PR to make a new test pass.
- Never disable or work around TruffleHog.

---

## Identity & ownership

- This is **Dan Rohtbart's** project.
- In **default mode**, Dan is the sole approver for all pull requests. Never merge without his explicit approval.
- In **yolo mode**, Claude may merge PRs autonomously once CI is green.
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

1. Create a feature branch with a descriptive name (e.g. `claude/short-description-XXXX`).
2. Keep PRs focused — one logical change per PR.
3. Write a clear PR description explaining *what* changed and *why*.
4. Push and open the PR.
   - **Default mode:** Do not merge. Wait for Dan's explicit approval.
   - **Yolo mode:** Merge immediately once CI is green.
5. If CI fails after you open the PR, fix the failure in a new commit on the same branch, push, and repeat.

---

## Amplify build loop

After a PR is merged, watch the Amplify build at:
https://us-east-1.console.aws.amazon.com/amplify/apps

If the build fails:
1. Diagnose the failure from the Amplify build log.
2. **Notify Dan** immediately.
3. Fix it in a new branch and open a PR.
   - **Default mode:** Wait for Dan's approval before merging.
   - **Yolo mode:** Merge once CI is green, then watch the next build.
4. Repeat until the build succeeds.

The production site is https://www.botchatapp.com. Confirm it is working after each successful Amplify deployment.

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
Store them in `.env.test` (gitignored). Start the app first:
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

- **aws-exports.js** is generated by `amplify push` and is gitignored. Tests must use the `__mocks__/aws-exports.js` stub — do not commit the real file or add it to `.gitignore` changes.
- **Playwright version** must be consistent in three places: `package.json`, the Docker image tag in `amplify.yml`, and the `npm install @playwright/test@X.Y.Z` line. They must all match. Current version: **1.58.2**.
- **TruffleHog in CI** uses `--only-verified --fail`. Only verified secrets cause failures. Do not disable this flag or skip the TruffleHog step to unblock a build.
- **Lambda node_modules**: the Lambda function has its own `node_modules/`. When writing Jest tests for Lambda code, force resolution through the project root via `moduleNameMapper` so mocks work correctly.
- **Selenium** is no longer used in CI (replaced by Playwright). Do not add Selenium back to the CI pipeline.

---

## Amplify backend changes

After any backend change (`amplify push`), verify:
1. The IAM role `botchatLambdaRole*` has `AmazonBedrockFullAccess` attached.
2. If the allow-list is active, the Cognito pre-signup Lambda trigger is still configured.

---

## Resolving Dependabot alerts

1. Check out the PR branch.
2. Run `npm install` and update `package-lock.json`.
3. Run `amplify upgrade` if Amplify itself has an upgrade.
4. Run `amplify push --yes` to push backend changes.
5. Run `npm run dev` and manually test at http://localhost:3000.
6. Commit, push, and open a PR. Merge per the active operating mode.
7. Watch the Amplify build.
