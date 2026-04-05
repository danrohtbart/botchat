import { test as setup, expect } from '@playwright/test';
import path from 'path';

export const AUTH_FILE = path.join(__dirname, '.auth/user.json');

// Runs once before the browser test projects. Logs in and saves storage
// state so authenticated tests can skip the login flow entirely.
//
// Requires environment variables:
//   TEST_USER_EMAIL    — test account email
//   TEST_USER_PASSWORD — test account password
setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set');
  }

  await page.goto('/');
  await page.getByRole('tab', { name: 'Sign In' }).click();
  await page.getByPlaceholder('Enter your Email').fill(email);
  await page.getByPlaceholder('Enter your Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await page.context().storageState({ path: AUTH_FILE });
});
