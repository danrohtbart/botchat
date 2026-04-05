import { test, expect } from '@playwright/test';
import path from 'path';

// Use the auth state saved by auth.setup.ts — skips the login flow.
test.use({ storageState: path.join(__dirname, '.auth/user.json') });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Delete Chats' })).toBeVisible();
});

test('delete chats clears the chat list', async ({ page }) => {
  await page.getByRole('button', { name: 'Delete Chats' }).click();
  // Wait for the loading state to resolve
  await expect(page.getByRole('button', { name: 'Delete Chats' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete Chats' })).not.toBeDisabled();
  // Confirm empty state prompt appears
  await expect(page.getByText('Add a topic in the box above')).toBeVisible();
});

test('submit a topic: input clears and bot responses appear', async ({ page }) => {
  // Lambda + Bedrock can take >30s on a cold start in CI
  test.setTimeout(90_000);

  // Start clean
  await page.getByRole('button', { name: 'Delete Chats' }).click();
  await expect(page.getByText('Add a topic in the box above')).toBeVisible();

  // Type a topic and submit
  const input = page.locator('#search');
  await input.fill('Who is the greatest Eagles player of all time?');
  await input.press('Enter');

  // Input should clear immediately
  await expect(input).toHaveValue('');

  // User message appears
  await expect(page.getByText('You')).toBeVisible();

  // Wait for at least two bot responses (Jim + Mark minimum)
  // Lambda → Bedrock round trips can take up to 60 seconds on a cold start
  const chatMessages = page.locator('div[class*="ring-gray-200"][class*="my-2"]');
  await expect(chatMessages.nth(2)).toBeVisible({ timeout: 60_000 });

  // Confirm the right number of messages
  const count = await chatMessages.count();
  expect(count).toBeGreaterThanOrEqual(3); // 1 user + 2 bot minimum
});

test('sign out returns to login screen', async ({ page }) => {
  await page.getByRole('button', { name: 'Sign out' }).click();
  // Amplify Authenticator shows the sign-in tab after sign-out
  await expect(page.getByRole('tab', { name: 'Sign In' })).toBeVisible();
});
