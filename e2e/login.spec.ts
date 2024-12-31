import { test, expect } from '@playwright/test';

// TODO: externalize this test account u/p into environment variables or secrets. But TBH the blast radius is nonexistent. 

/*

test('login', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('tab', { name: 'Sign In' }).click();
  await page.getByPlaceholder('Enter your Email').click();
  await page.getByPlaceholder('Enter your Email').fill('TEST_USER_EMAIL');
  await page.getByPlaceholder('Enter your Password').click();
  await page.getByPlaceholder('Enter your Password').click();
  await page.getByPlaceholder('Enter your Password').fill('TEST_USER_PASSWORD');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Talk: Sign out Delete Chats')).toBeVisible();
  await expect(page.getByText('Bot Personality ControlsName')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete Chats' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Update Personalities' })).toBeVisible();
});
*/