import { test, expect } from '@playwright/test';
import path from 'path';

// Use the auth state saved by auth.setup.ts — skips the login flow.
test.use({ storageState: path.join(__dirname, '.auth/user.json') });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Delete Chats' })).toBeVisible({ timeout: 15_000 });
});

test('delete chats clears the chat list', async ({ page }) => {
  // Budget extra time for WebKit cold-start AppSync latency in CI.
  test.setTimeout(90_000);

  await page.getByRole('button', { name: 'Delete Chats' }).click();
  // While the API call runs, the button's accessible name changes to "Deleting..."
  // (via isLoading/loadingText), so querying it by "Delete Chats" returns nothing.
  // Wait for the empty-state text instead — it only appears after deletion completes.
  await expect(page.getByText('Add a topic in the box above')).toBeVisible({ timeout: 60_000 });
  // Button should be back in its default state once deletion is done.
  await expect(page.getByRole('button', { name: 'Delete Chats' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete Chats' })).not.toBeDisabled();
});

test('submit a topic: input clears and bot responses appear', async ({ page }) => {
  // Lambda + Bedrock can take >30s on a cold start in CI; budget extra time for
  // the full flow: delete (30s) + user message (60s) + two bot responses (60s)
  test.setTimeout(150_000);

  // Start clean
  await page.getByRole('button', { name: 'Delete Chats' }).click();
  await expect(page.getByRole('button', { name: 'Delete Chats' })).not.toBeDisabled();
  await expect(page.getByText('Add a topic in the box above')).toBeVisible({ timeout: 30_000 });

  // Type a topic and submit
  const input = page.locator('#search');
  await input.fill('Who is the greatest Eagles player of all time?');
  await input.press('Enter');

  // Input should clear immediately
  await expect(input).toHaveValue('');

  // User message appears — .first() avoids strict mode violation when chat history
  // contains multiple prior "You" speaker labels
  await expect(page.getByText('You', { exact: true }).first()).toBeVisible({ timeout: 60_000 });

  // Wait for at least two bot responses (Jim + Mark minimum)
  // Lambda → Bedrock round trips can take up to 60 seconds on a cold start
  const chatMessages = page.locator('div[class*="ring-gray-200"][class*="my-2"]');
  await expect(chatMessages.nth(2)).toBeVisible({ timeout: 60_000 });

  // Confirm the right number of messages
  const count = await chatMessages.count();
  expect(count).toBeGreaterThanOrEqual(3); // 1 user + 2 bot minimum
});

test('personality edit produces a fresh avatar', async ({ page }) => {
  // Must run before the sign-out test. Cognito revokes the session's refresh
  // token on sign-out, which leaves the saved storageState's tokens server-
  // side invalid; subsequent tests in the same spec then can't make
  // authenticated AppSync calls, so the Personalities mutation silently fails.
  //
  // Full pipeline: form Submit → AppSync update → DDB write → stream → trigger
  // Lambda → Llama prompt → DALL-E → S3 upload → AppSync update of image_1 →
  // onUpdatePersonalities subscription → React state replace → <img> re-renders.
  // ~20-30s end-to-end.
  test.setTimeout(180_000);

  // Need at least one chat row so an avatar <img> is mounted.
  const chatMessages = page.locator('div[class*="ring-gray-200"][class*="my-2"]');
  if ((await chatMessages.count()) === 0) {
    await page.locator('#search').fill(`avatar setup ${Date.now()}`);
    await page.locator('#search').press('Enter');
    await expect(chatMessages.nth(2)).toBeVisible({ timeout: 90_000 });
  }

  // Snapshot the FIRST avatar's src so we can detect a CHANGE — polling for
  // "any new URL" lets stale background generations from earlier runs satisfy
  // the assertion before the test's own edit takes effect.
  const firstAvatar = page.locator('img[src*="botchat-avatars-"]').first();
  await expect(firstAvatar).toBeVisible({ timeout: 30_000 });
  const beforeSrc = await firstAvatar.getAttribute('src');
  expect(beforeSrc).toMatch(/botchat-avatars-/);

  // Replace personality_1 with a fresh canonical value + unique token so
  // (a) the trigger Lambda's "no change → skip" guard doesn't fire and
  // (b) the prompt fed to DALL-E stays clean. Appending across runs bloats
  // the field and eventually trips OpenAI's content-policy safety filter.
  // PersonalitiesUpdateForm's submit button is rendered with override text
  // "Update Personalities" (see src/app/page.js).
  const personality1 = page.getByLabel(/personality 1/i);
  await personality1.fill(`You are Tom Brady, a calm and focused quarterback. e2e-${Date.now()}`);
  await page.getByRole('button', { name: 'Update Personalities' }).click();

  // Wait for the first avatar's src to change.
  await expect.poll(
    async () => firstAvatar.getAttribute('src'),
    { timeout: 120_000, intervals: [2_000] },
  ).not.toBe(beforeSrc);
});

test('auth persists across page reload', async ({ page }) => {
  // Reload the page — verifies Next.js + Amplify correctly rehydrate auth state
  // without sending the user back to the login screen.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete Chats' })).toBeVisible();
});

test('sign out returns to login screen', async ({ page }) => {
  await page.getByRole('button', { name: 'Sign out' }).click();
  // Amplify Authenticator shows the sign-in tab after sign-out
  await expect(page.getByRole('tab', { name: 'Sign In' })).toBeVisible();
});
