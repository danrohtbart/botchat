/**
 * @jest-environment node
 *
 * Smoke tests for the real (unmocked) BedrockRuntimeClient to verify that
 * @smithy/config-resolver still integrates correctly after version upgrades.
 *
 * These tests intentionally do NOT mock @aws-sdk/client-bedrock-runtime.
 * If a @smithy breaking change prevents the SDK from initialising, the
 * constructor calls below will throw and the tests will fail — giving us an
 * early signal before the Lambda hits production.
 */

const {
  BedrockRuntimeClient,
  ConverseCommand,
} = require('@aws-sdk/client-bedrock-runtime');

describe('BedrockRuntimeClient — @smithy/config-resolver integration', () => {
  describe('client instantiation', () => {
    test('constructs without throwing given an explicit region', () => {
      expect(() => new BedrockRuntimeClient({ region: 'us-east-1' })).not.toThrow();
    });

    test('constructs without throwing for an alternate region', () => {
      expect(() => new BedrockRuntimeClient({ region: 'us-west-2' })).not.toThrow();
    });

    test('exposes a send() method', () => {
      const client = new BedrockRuntimeClient({ region: 'us-east-1' });
      expect(typeof client.send).toBe('function');
    });

    test('exposes a destroy() method', () => {
      const client = new BedrockRuntimeClient({ region: 'us-east-1' });
      expect(typeof client.destroy).toBe('function');
      // Ensure clean-up doesn't throw either
      expect(() => client.destroy()).not.toThrow();
    });
  });

  describe('region config resolution (@smithy/config-resolver)', () => {
    test('resolves the provided region asynchronously', async () => {
      const client = new BedrockRuntimeClient({ region: 'us-east-1' });
      const resolved = await client.config.region();
      expect(resolved).toBe('us-east-1');
    });

    test('resolves an alternate region correctly', async () => {
      const client = new BedrockRuntimeClient({ region: 'us-west-2' });
      const resolved = await client.config.region();
      expect(resolved).toBe('us-west-2');
    });

    test('config.region is a callable function (not a raw string)', () => {
      const client = new BedrockRuntimeClient({ region: 'us-east-1' });
      // @smithy/config-resolver normalises scalar values to provider functions
      expect(typeof client.config.region).toBe('function');
    });
  });

  describe('ConverseCommand construction', () => {
    const FIXTURE_PARAMS = {
      modelId: 'meta.llama3-70b-instruct-v1:0',
      messages: [{ role: 'user', content: [{ text: 'Hello' }] }],
      system: [{ text: 'You are a helpful assistant.' }],
      inferenceConfig: { maxTokens: 100, temperature: 0.9, top_p: 0.1 },
    };

    test('constructs without throwing', () => {
      expect(() => new ConverseCommand(FIXTURE_PARAMS)).not.toThrow();
    });

    test('preserves all input params on cmd.input', () => {
      const cmd = new ConverseCommand(FIXTURE_PARAMS);
      expect(cmd.input).toEqual(FIXTURE_PARAMS);
    });

    test('preserves modelId matching what the Lambda uses', () => {
      const cmd = new ConverseCommand(FIXTURE_PARAMS);
      expect(cmd.input.modelId).toBe('meta.llama3-70b-instruct-v1:0');
    });

    test('preserves inferenceConfig shape matching what the Lambda uses', () => {
      const cmd = new ConverseCommand(FIXTURE_PARAMS);
      expect(cmd.input.inferenceConfig).toEqual({
        maxTokens: 100,
        temperature: 0.9,
        top_p: 0.1,
      });
    });
  });
});
