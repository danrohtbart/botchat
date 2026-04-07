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

  it('amplify.yml has a preview section', () => {
    expect(config).toHaveProperty('preview');
  });

  it('preview section has build phases', () => {
    expect(config.preview).toHaveProperty('phases');
    expect(config.preview.phases).toHaveProperty('preBuild');
    expect(config.preview.phases).toHaveProperty('build');
  });

  it('preview build phase runs npm run build', () => {
    const buildCommands = config.preview.phases.build.commands;
    expect(buildCommands).toContain('npm run build');
  });

  it('preview section has artifacts pointing to .next', () => {
    expect(config.preview).toHaveProperty('artifacts');
    expect(config.preview.artifacts.baseDirectory).toBe('.next');
  });

  it('preview preBuild generates aws-exports.js from environment variables', () => {
    const preBuildCommands = config.preview.phases.preBuild.commands;
    const generationStep = preBuildCommands.find(cmd => cmd.includes('aws-exports.js'));
    expect(generationStep).toBeDefined();
    expect(generationStep).toContain('PREVIEW_APPSYNC_ENDPOINT');
    expect(generationStep).toContain('PREVIEW_USER_POOLS_ID');
  });
});
