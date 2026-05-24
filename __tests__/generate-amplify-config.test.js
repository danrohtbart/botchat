const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SCRIPT = path.resolve(__dirname, '..', 'scripts', 'generate-amplify-config.js');

function runInTempProject({ withOutputs, existingExports }) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-amplify-config-'));
  fs.mkdirSync(path.join(tmp, 'src'));
  fs.mkdirSync(path.join(tmp, 'scripts'));
  fs.copyFileSync(SCRIPT, path.join(tmp, 'scripts', 'generate-amplify-config.js'));

  if (existingExports !== undefined) {
    fs.writeFileSync(path.join(tmp, 'src', 'aws-exports.js'), existingExports);
  }
  if (withOutputs) {
    fs.writeFileSync(
      path.join(tmp, 'amplify_outputs.json'),
      JSON.stringify(withOutputs),
    );
  }

  const stdout = execFileSync('node', ['scripts/generate-amplify-config.js'], {
    cwd: tmp,
    encoding: 'utf8',
  });

  const exportsPath = path.join(tmp, 'src', 'aws-exports.js');
  const exportsContent = fs.existsSync(exportsPath)
    ? fs.readFileSync(exportsPath, 'utf8')
    : null;

  fs.rmSync(tmp, { recursive: true, force: true });
  return { stdout, exportsContent };
}

describe('scripts/generate-amplify-config.js', () => {
  it('is a no-op when amplify_outputs.json is absent (Gen 1 path)', () => {
    const existing = "const c = { aws_project_region: 'us-east-1' };\nexport default c;\n";
    const { stdout, exportsContent } = runInTempProject({
      withOutputs: null,
      existingExports: existing,
    });

    expect(stdout).toMatch(/not found/i);
    expect(exportsContent).toBe(existing);
  });

  it('writes src/aws-exports.js from amplify_outputs.json (Gen 2 path)', () => {
    const gen2 = {
      version: '1.4',
      auth: { user_pool_id: 'us-east-1_TEST', aws_region: 'us-east-1' },
      data: { url: 'https://example.appsync-api/graphql', aws_region: 'us-east-1' },
    };
    const { stdout, exportsContent } = runInTempProject({
      withOutputs: gen2,
      existingExports: 'const c = {};\nexport default c;\n',
    });

    expect(stdout).toMatch(/wrote src\/aws-exports\.js/i);
    expect(exportsContent).toMatch(/AUTO-GENERATED from amplify_outputs\.json/);
    expect(exportsContent).toContain('"user_pool_id": "us-east-1_TEST"');
    expect(exportsContent).toContain('"url": "https://example.appsync-api/graphql"');
    expect(exportsContent).toContain('"version": "1.4"');
    expect(exportsContent).toMatch(/^export default config;/m);
  });

  it('overwrites an existing aws-exports.js when Gen 2 outputs are present', () => {
    const gen2 = { version: '1.4', auth: { user_pool_id: 'NEW' } };
    const { exportsContent } = runInTempProject({
      withOutputs: gen2,
      existingExports: 'const c = { aws_user_pools_id: "OLD" };\nexport default c;\n',
    });

    expect(exportsContent).toContain('"user_pool_id": "NEW"');
    expect(exportsContent).not.toContain('OLD');
  });
});
