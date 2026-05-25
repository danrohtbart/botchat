/**
 * @jest-environment node
 */

const fs = require('fs');
const path = require('path');

const RESOURCE_FILES = [
  'amplify/functions/botchat-trigger/resource.ts',
  'amplify/functions/botchat-presignup/resource.ts',
];

describe('Lambda Node runtime', () => {
  test.each(RESOURCE_FILES)('%s declares runtime: 24', (relPath) => {
    const content = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
    expect(content).toMatch(/runtime:\s*24/);
  });
});
