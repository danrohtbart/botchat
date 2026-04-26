/**
 * @jest-environment node
 *
 * Integration test — verifies that the GitHub branch protection rules on `main`
 * match the intended access-control policy:
 *
 *   - enforce_admins OFF  → Dan (repo owner) can merge without a review
 *   - required_approving_review_count = 1  → everyone else needs an approval
 *
 * The test also verifies that the token currently in use (i.e. Claude's
 * fine-grained PAT) does NOT have repository-admin access, which is the
 * technical guarantee that Claude cannot bypass branch protection.
 *
 * Skipped automatically when `gh` is not installed or not authenticated
 * (e.g. a developer's machine without GitHub CLI set up).
 */

const { execSync } = require('child_process');

function ghApi(path) {
  // stderr is silenced so a failed `gh api` (e.g. unauthenticated CI) does
  // not pollute the test output before we fall back to skipping.
  return JSON.parse(
    execSync(`gh api ${path}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }),
  );
}

// Run synchronously at module load — Jest evaluates the describe blocks (and
// therefore itIfGH) before any beforeAll hook fires, so ghAvailable must be
// settled before the describes run, not inside beforeAll.
let protection;
let repoPermissions;
let ghAvailable = true;

try {
  protection = ghApi('repos/danrohtbart/botchat/branches/main/protection');
  repoPermissions = ghApi('repos/danrohtbart/botchat').permissions;
} catch {
  ghAvailable = false;
}

const itIfGH = (name, fn) =>
  ghAvailable ? test(name, fn) : test.skip(name, fn);

describe('main branch protection settings', () => {
  itIfGH('enforce_admins is off so the repo owner can merge without a review', () => {
    expect(protection.enforce_admins.enabled).toBe(false);
  });

  itIfGH('requires exactly 1 approving review before merge', () => {
    expect(
      protection.required_pull_request_reviews.required_approving_review_count
    ).toBe(1);
  });
});

describe('current GitHub token permissions', () => {
  itIfGH('token does not have repository admin access (confirms fine-grained PAT)', () => {
    // Dan's personal sessions use a full admin token; Claude's fine-grained PAT
    // omits the Administration permission.  This test is expected to PASS when
    // running as Claude and FAIL when running as Dan with a full token — that
    // difference is intentional and documents the boundary.
    //
    // If this fails in CI, the GITHUB_TOKEN env var is probably set to Dan's
    // full token rather than the fine-grained PAT.
    expect(repoPermissions.admin).toBe(false);
  });
});
