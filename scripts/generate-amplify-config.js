#!/usr/bin/env node
/**
 * Bridge Gen 2 amplify_outputs.json into the Gen 1 aws-exports.js path
 * that the frontend reads via `import awsmobile from '../aws-exports'`.
 *
 * - If amplify_outputs.json exists at the project root, write its contents
 *   to src/aws-exports.js as the default export. aws-amplify@6 accepts the
 *   Gen 2 nested shape directly, so no transformation is needed.
 * - Otherwise, this script is a no-op. Gen 1 builds continue to rely on
 *   `amplifyPush --simple` (run earlier in the build) to produce
 *   src/aws-exports.js.
 *
 * Wired into amplify.yml preBuild so the generated frontend bundle picks
 * up whichever backend is present.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outputsPath = path.join(root, 'amplify_outputs.json');
const exportsPath = path.join(root, 'src', 'aws-exports.js');

if (!fs.existsSync(outputsPath)) {
  console.log(
    'generate-amplify-config: amplify_outputs.json not found; ' +
      'leaving src/aws-exports.js as-is (Gen 1 path).',
  );
  process.exit(0);
}

const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
const content =
  '// AUTO-GENERATED from amplify_outputs.json by scripts/generate-amplify-config.js\n' +
  '// Do not edit manually. See ClickUp 86b9qh888 (Gen 1 → Gen 2 migration).\n' +
  `const config = ${JSON.stringify(outputs, null, 2)};\n` +
  'export default config;\n';

fs.writeFileSync(exportsPath, content);
console.log(
  `generate-amplify-config: wrote ${path.relative(root, exportsPath)} ` +
    'from amplify_outputs.json (Gen 2 path).',
);
