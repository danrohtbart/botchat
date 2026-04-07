# Claude Code Instructions for BotChat

These instructions apply to all Claude Code sessions in this repository. Follow them exactly.

---

## Project Overview

BotChat is a Next.js 15 / React 18 web app deployed on AWS Amplify. Key stack:

- **Frontend:** Next.js 15, React 18, Tailwind CSS, `src/` directory with `@/` alias
- **Auth/DB:** AWS Cognito + DynamoDB via Amplify
- **AI:** AWS Bedrock (Claude model), called through AWS Lambda
- **Lambda functions:** `amplify/backend/function/botchatpresignup/` and `amplify/backend/function/botchattriggerjs/`
- **Unit tests:** Jest 30 + @testing-library/react — files in `__tests__/`, run with `npm test`
- **E2E tests:** Playwright 1.58.2 — files in `e2e/`, run via Docker in Amplify CI
- **CI/CD:** AWS Amplify only (no GitHub Actions). Build config in `amplify.yml`.
- **Secret scanning:** TruffleHog — runs as a pre-commit hook locally and in Amplify CI preTest phase.

---

## Non-Negotiable Rules

### 1. Never commit credentials or secrets to GitHub

**Never** commit API keys, passwords, tokens, private keys, AWS credentials, or any secret value to the repository.

- `.env*.local` and `.env.test` are gitignored — use them for local secrets.
- AWS credentials are injected by Amplify at build time as environment variables — never hardcode them.
- The TruffleHog pre-commit hook (`.pre-commit-config.yaml`) and Amplify CI preTest scan both enforce this automatically. If either blocks a commit, fix the cause — do not bypass the hook.
- To check locally before committing: `npm run check:secrets`

### 2. Use red/green TDD for all new functionality

For every feature or bug fix:

1. **Write a failing test first** (red). Commit or stage the failing test before writing implementation.
2. **Write the minimum implementation to make the test pass** (green).
3. **Refactor if needed**, keeping tests green throughout.

Unit tests live in `__tests__/` and follow the pattern `<subject>.test.js`. E2E tests live in `e2e/` and follow the pattern `<subject>.spec.ts`.

### 3. Never delete tests from prior PRs

You may not delete or disable existing tests to make a build pass or to resolve a test conflict. If a prior test is failing due to your changes, fix your implementation or fix the test while preserving its intent. Removing test coverage to unblock yourself is not acceptable.

### 4. Autonomous development loop: TDD → PR → Amplify → repeat

When working autonomously on a ticket, follow this loop exactly:

```
write failing test
↓
implement until tests pass (npm test)
↓
open PR on GitHub
↓
merge the PR (after Dan approves, or autonomously if pre-authorized)
↓
watch the Amplify build
↓
if build FAILS → notify Dan → fix → open new PR → merge → watch Amplify → repeat
if build PASSES → notify Dan → done
```

**How to watch the Amplify build:**

```bash
# Get the app ID and branch
aws amplify list-apps
aws amplify list-branches --app-id <APP_ID>

# Poll for build completion
aws amplify list-jobs --app-id <APP_ID> --branch-name <BRANCH> --max-results 1
aws amplify get-job --app-id <APP_ID> --branch-name <BRANCH> --job-id <JOB_ID>
```

The build is complete when `status` is `SUCCEED` or `FAILED`. If `FAILED`, read the step logs to identify the cause before fixing.

### 5. Notify Dan after each failed Amplify build

After any Amplify build failure, send Dan a notification via ClickUp or the agreed channel. Include:
- Which PR/commit triggered the build
- The Amplify build number and the step that failed
- What you diagnosed as the root cause
- What fix you are attempting

Do not silently retry without notifying.

---

## PR Conventions

- **One PR per logical change.** Do not bundle unrelated fixes.
- **Branch naming:** `claude/<short-description>-<ticket-id>` for ticket work, or a descriptive name for other work (e.g. `fix-delete-chats-webkit-e2e`).
- **PR title:** Short, imperative, under 70 characters.
- **PR body:** Explain the *why*, reference the Amplify build number if fixing a CI failure (e.g. "Fixes build #193").
- **Co-authorship:** All Claude commits must include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` in the commit message.
- **Do not merge without Dan's approval** unless you have been explicitly pre-authorized for a specific PR or ticket.

---

## Testing Conventions

### Jest (unit tests)

- Run: `npm test`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage`
- Test files: `__tests__/*.test.js`
- Module aliases: `@/` maps to `./src/`. AWS mock stubs are in `__mocks__/`.
- `aws-exports.js` is gitignored (Amplify-generated). The stub at `__mocks__/aws-exports.js` is committed and mapped in `jest.config.js` — do not break this mapping.
- Lambda functions have their own `node_modules`. When writing tests for Lambda code, add `moduleNameMapper` entries in `jest.config.js` to force imports through the project root so `jest.mock()` calls take effect (see existing entries for `aws-amplify` and `@aws-sdk/client-bedrock-runtime`).

### Playwright (E2E tests)

- Tests run in Amplify CI inside a Docker container (`mcr.microsoft.com/playwright:v1.58.2-jammy`).
- Browsers: Chromium, Firefox, WebKit — all three must pass.
- Auth setup: `e2e/auth.setup.ts` runs before all specs. Auth state is stored in `e2e/.auth/` (gitignored).
- Credentials: `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are injected as Amplify environment variables. They are never committed.
- Cold Lambda + Bedrock calls can take up to 90 seconds. Set test timeouts accordingly (see `playwright.config.js`).
- Cross-browser gotchas from prior fixes:
  - WebKit processes DOM faster — use `waitFor` on stable post-action state rather than querying immediately after a click.
  - Firefox strict mode: use `.first()` when a locator may match multiple elements.
  - Use `retries: 2` in CI (already configured) to handle transient flakiness.

---

## Code Conventions

- Module alias `@/` maps to `./src/` (configured in `jsconfig.json`).
- ESLint: `next/core-web-vitals` preset. Run `npm run lint` before opening a PR.
- Tailwind CSS for all styling.
- Keep `amplify/` backend config in sync with frontend changes. Lambda functions are in `amplify/backend/function/`.
- Do not modify `amplify/#current-cloud-backend/` — it is gitignored and managed by Amplify CLI.

---

## Security

- **Secrets scanning:** TruffleHog runs on every commit (pre-commit hook) and every Amplify build (preTest phase). Both use `--only-verified --fail`. Never disable or work around these checks.
- **Pre-commit setup:** The `.pre-commit-config.yaml` hook requires the `pre-commit` Python package. First-time setup: `pip install pre-commit && pre-commit install`. Run manually: `pre-commit run --all-files`.
- **Manual scan:** `npm run check:secrets` — runs TruffleHog against the full git history.
- **Gitignore:** `.env*.local`, `.env.test`, `aws-exports.js`, `e2e/.auth/`, `amplify/backend/amplify-meta.json`, and all `amplify-*.json` config files are gitignored. Never force-add them.

---

## Dependency Management

- After any `npm install`, commit the updated `package-lock.json`.
- Both the root `package.json` and `amplify/backend/function/botchattriggerjs/src/package.json` may need updates when adding AWS SDK dependencies used by Lambda.
- Run `npm audit` after upgrades. Address high/critical vulnerabilities. Low-severity items with no available fix may be left with a note in the commit message.

---

## What Requires Dan's Approval

- Merging any PR (unless explicitly pre-authorized for a specific ticket)
- Deleting branches on `main`
- Modifying `.pre-commit-config.yaml` or the TruffleHog CI configuration in `amplify.yml`
- Any change to Amplify environment variables or backend infrastructure
- Adding new npm dependencies that are not dev-only
