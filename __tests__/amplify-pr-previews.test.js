// __tests__/amplify-pr-previews.test.js
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('Amplify PR Preview configuration', () => {
  let config;

  beforeAll(() => {
    const ymlPath = path.join(__dirname, '..', 'amplify.yml');
    const raw = fs.readFileSync(ymlPath, 'utf8');
    config = yaml.load(raw);
  });

  it('amplify.yml has a frontend section', () => {
    expect(config).toHaveProperty('frontend');
  });

  it('frontend preBuild generates aws-exports.js for PR builds', () => {
    const preBuildCommands = config.frontend.phases.preBuild.commands;
    const generationStep = preBuildCommands.find(
      cmd => typeof cmd === 'string' && cmd.includes('aws-exports.js')
    );
    expect(generationStep).toBeDefined();
    expect(generationStep).toContain('AWS_PULL_REQUEST_ID');
    expect(generationStep).toContain('PREVIEW_APPSYNC_ENDPOINT');
    expect(generationStep).toContain('PREVIEW_USER_POOLS_ID');
  });

  it('frontend build phase runs npm run build', () => {
    const buildCommands = config.frontend.phases.build.commands;
    expect(buildCommands).toContain('npm run build');
  });

  it('frontend artifacts point to .next', () => {
    expect(config.frontend.artifacts.baseDirectory).toBe('.next');
  });
});
