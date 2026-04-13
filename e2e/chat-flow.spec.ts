import { test, expect } from '@playwright/test';
import path from 'path';

// Use the auth state saved by auth.setup.ts — skips the login flow.
test.use({ storageState: path.join(__dirname, '.auth/user.json') });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Delete Chats' })).toBeVisible({ timeout: 15_000 });
});

test('delete chats clears the chat list', async ({ page }) => {
  await page.getByRole('button', { name: 'Delete Chats' }).click();
  // While the API call runs, the button's accessible name changes to "Deleting..."
  // (via isLoading/loadingText), so querying it by "Delete Chats" returns nothing.
  // Wait for the empty-state text instead — it only appears after deletion completes.
  await expect(page.getByText('Add a topic in the box above')).toBeVisible({ timeout: 30_000 });
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
