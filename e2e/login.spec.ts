import { test, expect } from '@playwright/test';

// Credentials are read from environment variables (TEST_USER_EMAIL / TEST_USER_PASSWORD).
// Set them locally via a .env.test file or your shell; in CI they come from Amplify secrets.

test('login', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set');
  }

  await page.goto('http://localhost:3000/');
  await page.getByRole('tab', { name: 'Sign In' }).click();
  await page.getByPlaceholder('Enter your Email').fill(email);
  await page.getByPlaceholder('Enter your Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Talk: Sign out Delete Chats')).toBeVisible();
  await expect(page.getByText('Bot Personality ControlsName')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete Chats' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Update Personalities' })).toBeVisible();
});
