# CLAUDE.md — Botchat Repo Instructions for Claude Code

This file contains permanent instructions for Claude Code to enable fully autonomous development in this repository. These instructions apply to every session and every task.

---

## Stack Overview

- **Frontend**: Next.js 15 (App Router, `src/app/`), React 18, Tailwind CSS
- **Backend**: AWS Amplify — AppSync GraphQL API, Cognito Auth, Lambda functions
- **AI**: AWS Bedrock (Claude via `@aws-sdk/client-bedrock-runtime`)
- **Unit tests**: Jest 30 + Testing Library (`__tests__/` directory)
- **E2E tests**: Playwright 1.58 (`e2e/` directory)
- **CI/CD**: AWS Amplify only (no GitHub Actions) — App ID `d3bo8xtge7s7fh`, region `us-east-1`
- **Environments**: `main` (production), `dev`, `amplifyenv`

---

## Security: Never Commit Credentials

**Never commit secrets, credentials, or sensitive data to GitHub.** This is non-negotiable. This includes:

- AWS access keys, secret access keys, or session tokens
- Any API keys or bearer tokens
- Passwords or passphrases (hardcoded or in config files)
- Private keys or certificates (PEM/DER files)
- `.env` files with real values (`.env*.local`, `.env.test` are git-ignored — keep it that way)
- Amplify resource IDs or ARNs that are not already tracked in `amplify/team-provider-info.json`

If code needs a secret at runtime, use environment variables. Validate that `.gitignore` covers the file before staging it.

### Credential Scanning

Three layers of protection are in place:

1. **Local pre-commit (grep-based)** — `.githooks/pre-commit` scans staged diffs for credential patterns. Activate on a fresh clone with:
   ```bash
   git config core.hooksPath .githooks
   ```

2. **Local pre-commit (TruffleHog)** — `.pre-commit-config.yaml` uses TruffleHog v3.88.27. Activate with:
   ```bash
   pip install pre-commit && pre-commit install
   ```

3. **Amplify CI** — `amplify.yml` runs TruffleHog (`--only-verified --fail`) on every build before tests execute. A TruffleHog failure blocks the entire build.

If a pre-commit hook flags a false positive, investigate before bypassing. Document any `--no-verify` usage in the PR description with justification.

---

## Development Workflow: Red/Green TDD

Always follow the red/green TDD cycle. No exceptions.

1. **Write a failing test first** that precisely captures the intended behavior
2. **Run `npm test`** and confirm the new test fails (red)
3. **Write the minimum production code** needed to make the test pass
4. **Run `npm test`** again and confirm the test passes (green)
5. **Refactor** if needed — keep all tests green throughout

Unit tests go in `__tests__/`. Lambda function tests mock AWS SDK clients at the constructor level inside the test file (see `__tests__/botchattriggerjs.test.js` for the established pattern). E2E tests in `e2e/` require live AWS credentials and only run in Amplify CI.

### Never Delete Tests

**Never delete or weaken tests from prior PRs to make new tests pass.** Existing tests document real, previously-validated behavior. If a new change breaks an old test, fix the implementation — do not touch the test unless the behavior is intentionally changing, and if it is, document that clearly in the PR.

---

## PR Workflow

1. Branch off `main` with a descriptive branch name
2. Write failing tests first (TDD — see above)
3. Implement the feature or fix
4. Run `npm test` — **all tests must pass** before opening a PR
5. Run `npm run lint` — no ESLint errors
6. Open a PR with a description explaining what changes and why
7. **Do not merge your own PR** — wait for CI to pass and for review

---

## After a PR Merges: Watch Amplify CI

After any PR merges to `main`, monitor the Amplify build:

**Build console**: AWS Amplify Console → App `d3bo8xtge7s7fh` → `main` branch

The Amplify build runs in this order:
1. TruffleHog secret scan (blocks everything if secrets found)
2. `npm test` (Jest unit tests)
3. Playwright E2E tests (in Docker)
4. `npm run build` (Next.js production build)

If the build **passes**: done.

If the build **fails**:
1. Read the Amplify build logs to identify the root cause
2. Fix the issue in a new branch (following TDD if code changes are needed)
3. Open a new PR with the fix
4. Merge it and monitor Amplify again
5. **Notify Dan** after every failed Amplify build attempt — include what failed and what fix was applied
6. Repeat until the build is green

---

## Lambda Functions

Lambda source is under `amplify/backend/function/`:

- `botchatpresignup/src/` — Cognito pre-signup trigger; implements an optional email allow-list
- `botchattriggerjs/src/` — Main message processing trigger; calls Bedrock and writes to AppSync

Lambda tests (`__tests__/botchatpresignup.test.js`, `__tests__/botchattriggerjs.test.js`) use real local `node_modules` — do **not** hoist AWS SDK mocks to the module level in a way that bypasses `node_modules`. The `jest.config.js` `moduleNameMapper` is carefully tuned; do not change it without understanding the implications.

---

## Testing Conventions

| Test type | Location | Run command | Run in CI |
|-----------|----------|-------------|-----------|
| Jest unit | `__tests__/` | `npm test` | Yes (Amplify) |
| Playwright E2E | `e2e/` | `npx playwright test` | Yes (Amplify, Docker) |
| Selenium | `selenium/` | (legacy, not run in CI) | No |

- Test reports output to `reports/` (git-ignored); `jest-junit` produces `reports/jest-junit.xml`
- `__mocks__/aws-amplify.js` and `__mocks__/aws-exports.js` are module-level mocks used by Jest — do not delete them
- Do not add new tests to `selenium/`; it is legacy and not integrated into CI
- When writing new component tests, follow the patterns in `__tests__/home.test.js` and `__tests__/authentication.test.js`

---

## Code Conventions

- **Routing**: Next.js App Router only (`src/app/`). Do not create a `pages/` directory.
- **Styling**: Tailwind CSS. Do not introduce additional CSS frameworks.
- **GraphQL**: Operations live in `src/graphql/`. Do not hand-edit `src/models/` (Amplify-generated).
- **Linting**: ESLint with `next/core-web-vitals`. Run `npm run lint` before opening a PR.
- **Node**: Use the version compatible with the Amplify build image (Amazon Linux 2023 / Node 18+).
- **Secrets in tests**: Use environment variables (e.g. `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` in Playwright). Never hardcode test credentials.
- **package-lock.json**: Always commit `package-lock.json` updates when adding or upgrading packages.
