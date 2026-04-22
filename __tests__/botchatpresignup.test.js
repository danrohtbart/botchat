/**
 * @jest-environment node
 */

const { handler } = require('../amplify/backend/function/botchatpresignup/src/index.js');

/**
 * Wraps the callback-style handler in a Promise so tests can use async/await.
 * Resolves with the result on success, rejects with the error string on failure.
 */
function invoke(email) {
  return new Promise((resolve, reject) => {
    const event = { request: { userAttributes: { email } } };
    handler(event, {}, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

describe('botchatpresignup handler', () => {
  // ─── Acceptable domains ───────────────────────────────────────────────────

  test('allows email from rohtbart.com', async () => {
    const result = await invoke('Dan@rohtbart.com');
    expect(result.request.userAttributes.email).toBe('Dan@rohtbart.com');
  });

  test('allows email from aetion.com', async () => {
    await expect(invoke('User@aetion.com')).resolves.toBeDefined();
  });

  test('allows email from arccosgolf.com', async () => {
    await expect(invoke('User@arccosgolf.com')).resolves.toBeDefined();
  });

  test('arccosgolf.com domain matching is case-insensitive', async () => {
    await expect(invoke('User@ARCCOSGOLF.COM')).resolves.toBeDefined();
  });

  test('domain matching is case-insensitive', async () => {
    await expect(invoke('User@ROHTBART.COM')).resolves.toBeDefined();
    await expect(invoke('Someone@AETION.COM')).resolves.toBeDefined();
  });

  // ─── Acceptable individual addresses ─────────────────────────────────────

  test('allows bobschwartz314@gmail.com', async () => {
    await expect(invoke('bobschwartz314@gmail.com')).resolves.toBeDefined();
  });

  test('allows aglazer@fourcubits.com', async () => {
    await expect(invoke('aglazer@fourcubits.com')).resolves.toBeDefined();
  });

  test('allows jets613@gmail.com', async () => {
    await expect(invoke('jets613@gmail.com')).resolves.toBeDefined();
  });

  test('allows betsymorserohtbart@gmail.com', async () => {
    await expect(invoke('betsymorserohtbart@gmail.com')).resolves.toBeDefined();
  });

  test('address matching is case-insensitive', async () => {
    // Mixed-case input should still match against the lowercase allow-list
    await expect(invoke('BobSchwartz314@Gmail.com')).resolves.toBeDefined();
  });

  // ─── Rejections ───────────────────────────────────────────────────────────

  test('rejects unknown gmail address', async () => {
    await expect(invoke('stranger@gmail.com')).rejects.toBe(
      'Sorry, we are not yet open to the internet. Ask Dan.'
    );
  });

  test('rejects unknown domain', async () => {
    await expect(invoke('user@yahoo.com')).rejects.toBeDefined();
  });

  test('rejects partial domain match (attackeraetion.com is not aetion.com)', async () => {
    // Ensures the check is exact-match, not substring
    await expect(invoke('user@attackeraetion.com')).rejects.toBeDefined();
  });

  test('rejects subdomain of acceptable domain (sub.aetion.com is not aetion.com)', async () => {
    // Subdomains must not inherit acceptance from the parent domain
    await expect(invoke('user@sub.aetion.com')).rejects.toBeDefined();
  });

  test('rejects address with empty local part', async () => {
    await expect(invoke('@gmail.com')).rejects.toBeDefined();
  });
});
