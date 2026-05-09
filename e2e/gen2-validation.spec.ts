/**
 * E2E validation against the Gen 2 hosting URLs (botchat-gen2 / dr03gq88jj3a1).
 *
 * Run with the env var GEN2_URL pointing at one of:
 *   dev:  https://claude-gen2-deployment.dr03gq88jj3a1.amplifyapp.com
 *   main: https://claude-gen2-main.dr03gq88jj3a1.amplifyapp.com
 *
 * Usage:
 *   GEN2_URL=https://claude-gen2-main.dr03gq88jj3a1.amplifyapp.com \
 *     npx playwright test e2e/gen2-validation.spec.ts --project=chromium
 *
 * Validates the full Gen 2 user flow: login → see existing data → submit a
 * topic → bot replies appear → personality edit → avatar regenerates.
 *
 * Skips the saved-auth fixture from auth.setup.ts because that storage state
 * was captured against localhost; this spec re-logs in fresh against the
 * Gen 2 origin.
 */
import { test, expect } from '@playwright/test';

const GEN2_URL = process.env.GEN2_URL;
if (!GEN2_URL) {
  throw new Error('GEN2_URL must be set (e.g. https://claude-gen2-main.dr03gq88jj3a1.amplifyapp.com)');
}

const EMAIL = process.env.TEST_USER_EMAIL!;
const PASSWORD = process.env.TEST_USER_PASSWORD!;
if (!EMAIL || !PASSWORD) {
  throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set');
}

// Override baseURL for this spec only (config defaults to localhost).
test.use({ baseURL: GEN2_URL, storageState: undefined });

async function login(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Sign In' }).click();
  await page.getByPlaceholder('Enter your Email').fill(EMAIL);
  await page.getByPlaceholder('Enter your Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('button', { name: /sign\s*out/i })).toBeVisible({ timeout: 30_000 });
}

test('Gen 2: login + see existing data', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  // Past-login UI shows the personality controls and chat actions.
  await expect(page.getByRole('button', { name: 'Delete Chats' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Update Personalities' })).toBeVisible();
});

test('Gen 2: chat → bot reply appears in UI', async ({ page }) => {
  test.setTimeout(180_000);
  await login(page);

  // Clean slate
  await page.getByRole('button', { name: 'Delete Chats' }).click();
  await expect(page.getByText('Add a topic in the box above')).toBeVisible({ timeout: 60_000 });

  // Submit a topic
  const input = page.locator('#search');
  await input.fill('Gen 2 e2e test: who would win a foot race?');
  await input.press('Enter');
  await expect(input).toHaveValue('');

  // User message appears
  await expect(page.getByText('You', { exact: true }).first()).toBeVisible({ timeout: 60_000 });

  // At least 2 bot replies appear (Jim + Mark equivalent)
  const chatMessages = page.locator('div[class*="ring-gray-200"][class*="my-2"]');
  await expect(chatMessages.nth(2)).toBeVisible({ timeout: 90_000 });

  const count = await chatMessages.count();
  expect(count).toBeGreaterThanOrEqual(3);
});

test('Gen 2: personality edit → fresh avatar appears', async ({ page }) => {
  test.setTimeout(240_000);
  await login(page);

  // Make sure a chat with the bots exists, so an <img> for at least one
  // personality is mounted before the edit. (The avatar belongs to a chat
  // speaker row, not to the personality form itself.)
  const chatMessages = page.locator('div[class*="ring-gray-200"][class*="my-2"]');
  if ((await chatMessages.count()) === 0) {
    await page.locator('#search').fill(`avatar setup ${Date.now()}`);
    await page.locator('#search').press('Enter');
    await expect(chatMessages.nth(2)).toBeVisible({ timeout: 90_000 });
  }

  // Snapshot the FIRST avatar img's src — we'll wait for that specific
  // <img> to change. Polling "any new URL" is too lenient: a stale
  // background avatar generation from a prior run can satisfy it without
  // this test's edit ever taking effect.
  const firstAvatar = page.locator('img[src*="botchat-avatars-"]').first();
  await expect(firstAvatar).toBeVisible({ timeout: 30_000 });
  const beforeSrc = await firstAvatar.getAttribute('src');
  expect(beforeSrc).toMatch(/botchat-avatars-/);

  // Edit personality_1 with a unique token so the trigger Lambda's
  // "no change → skip" guard doesn't fire. The PersonalitiesUpdateForm
  // is always-mounted in a sidebar (no separate "open form" step). Its
  // Submit button is rendered with override text "Update Personalities"
  // (see src/app/page.js).
  const personality1 = page.getByLabel(/personality 1/i);
  const current = await personality1.inputValue();
  const token = `e2e-${Date.now()}`;
  await personality1.fill(`${current} ${token}`);
  await page.getByRole('button', { name: 'Update Personalities' }).click();

  // Wait for the first avatar's src to change. Avatar generation is
  // ~20-30s (Llama prompt + DALL-E + S3 + AppSync write + subscription).
  await expect.poll(
    async () => firstAvatar.getAttribute('src'),
    { timeout: 120_000, intervals: [2_000] },
  ).not.toBe(beforeSrc);
});
