/**
 * @jest-environment node
 */

// ─── Mock setup ───────────────────────────────────────────────────────────────
//
// jest.mock factories are hoisted before variable declarations, so we cannot
// close over variables defined in this file. Instead we embed the mock fns
// inside the factory and expose them via __mock* keys, then retrieve them after
// the mocks are registered.

jest.mock('@aws-sdk/client-bedrock-runtime', () => {
  const send = jest.fn();
  return {
    BedrockRuntimeClient: jest.fn(() => ({ send })),
    ConverseCommand: jest.fn((params) => params),
    __mockSend: send,
  };
});

jest.mock('aws-amplify/api', () => {
  const graphql = jest.fn();
  return {
    generateClient: jest.fn(() => ({ graphql })),
    __mockGraphql: graphql,
  };
});

jest.mock('aws-amplify', () => ({
  Amplify: { configure: jest.fn() },
}));

// ─── Retrieve mock references ─────────────────────────────────────────────────

const bedrockMod = require('@aws-sdk/client-bedrock-runtime');
const mockBedrockSend = bedrockMod.__mockSend;
const { BedrockRuntimeClient, ConverseCommand } = bedrockMod;

const apiMod = require('aws-amplify/api');
const mockGraphql = apiMod.__mockGraphql;

const { Amplify } = require('aws-amplify');

const { handler } = require('../amplify/backend/function/botchattriggerjs/src/index.js');

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * Builds a minimal DynamoDB Stream event for INSERT (or REMOVE) records.
 */
function makeStreamEvent({
  eventName = 'INSERT',
  message = 'Who is the best Eagle?',
  speaker_name = 'You',
  message_in_thread = 0,
  thread_id = 'thread-abc',
  user_email = 'test@example.com',
} = {}) {
  const event = { Records: [{ eventName, dynamodb: {} }] };
  if (eventName !== 'REMOVE') {
    event.Records[0].dynamodb.NewImage = {
      message: { S: message },
      speaker_name: { S: speaker_name },
      message_in_thread: { N: String(message_in_thread) },
      user_email: { S: user_email },
      thread_id: { S: thread_id },
    };
  }
  return event;
}

/**
 * Builds a Chat item as returned by listChats.
 */
function makeChat(message_in_thread, message, speaker = 'Bot') {
  return {
    id: `c${message_in_thread}`,
    message,
    message_in_thread,
    speaker_name: speaker,
    thread_id: 'thread-abc',
  };
}

/**
 * Builds a Bedrock Converse API response containing the given text.
 */
function makeBedrockResponse(text) {
  return { output: { message: { content: [{ text }] } } };
}

const defaultPersonality = {
  id: 'p1',
  name_1: 'Jim',
  personality_1: 'Jim personality',
  name_2: 'Mark',
  personality_2: 'Mark personality',
  user_email: 'test@example.com',
};

/**
 * Configures mockGraphql to route queries by operation name substring.
 */
function setupGraphqlMock({
  personalities = [defaultPersonality],
  chats = [],
  createChatShouldFail = false,
} = {}) {
  mockGraphql.mockImplementation((params) => {
    const q = params.query;
    if (q.includes('listPersonalities')) {
      return Promise.resolve({ data: { listPersonalities: { items: personalities } } });
    }
    if (q.includes('listChats')) {
      return Promise.resolve({ data: { listChats: { items: chats } } });
    }
    if (q.includes('createChat')) {
      if (createChatShouldFail) return Promise.reject(new Error('GraphQL write failed'));
      return Promise.resolve({ data: { createChat: { id: 'new-id' } } });
    }
    return Promise.resolve({ data: {} });
  });
}

// ─── Environment variables ────────────────────────────────────────────────────

beforeAll(() => {
  process.env.REGION = 'us-east-1';
  process.env.API_BOTCHAT_GRAPHQLAPIENDPOINTOUTPUT = 'https://test.appsync.amazonaws.com/graphql';
  process.env.API_BOTCHAT_GRAPHQLAPIKEYOUTPUT = 'test-api-key';
  process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
  process.env.AWS_SESSION_TOKEN = 'test-session-token';
});

beforeEach(() => {
  jest.clearAllMocks();
  // Default: Bedrock returns a valid sentence
  mockBedrockSend.mockResolvedValue(makeBedrockResponse('Great question. Eagles rule!'));
  // Default: personality found, no prior chats
  setupGraphqlMock();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('early-exit conditions', () => {
  test('REMOVE event returns 200 without calling Bedrock or GraphQL', async () => {
    const event = makeStreamEvent({ eventName: 'REMOVE' });
    const result = await handler(event);
    expect(result).toEqual({ statusCode: 200 });
    expect(mockGraphql).not.toHaveBeenCalled();
    expect(mockBedrockSend).not.toHaveBeenCalled();
  });

  test('message_in_thread > 6 returns 204 without calling Bedrock', async () => {
    const event = makeStreamEvent({ message_in_thread: 7 });
    const result = await handler(event);
    expect(result).toEqual({ statusCode: 204 });
    expect(mockBedrockSend).not.toHaveBeenCalled();
  });

  test('message_in_thread == 6 does NOT return 204 (off-by-one guard)', async () => {
    const event = makeStreamEvent({ message_in_thread: 6 });
    const result = await handler(event);
    expect(result).not.toEqual({ statusCode: 204 });
    expect(mockBedrockSend).toHaveBeenCalledTimes(1);
  });
});

describe('Amplify.configure', () => {
  test('is called with AWS_IAM auth type and no API key', async () => {
    const event = makeStreamEvent();
    await handler(event);
    expect(Amplify.configure).toHaveBeenCalledTimes(1);
    const configArg = Amplify.configure.mock.calls[0][0];
    expect(configArg).toMatchObject({
      aws_project_region: 'us-east-1',
      aws_appsync_authenticationType: 'AWS_IAM',
      aws_appsync_graphqlEndpoint: 'https://test.appsync.amazonaws.com/graphql',
    });
    expect(configArg).not.toHaveProperty('aws_appsync_apiKey');
  });

  test('passes a credentials provider that reads Lambda IAM env vars', async () => {
    const event = makeStreamEvent();
    await handler(event);
    const libraryOptions = Amplify.configure.mock.calls[0][1];
    expect(libraryOptions).toBeDefined();
    const provider = libraryOptions?.Auth?.credentialsProvider;
    expect(provider).toBeDefined();
    const result = await provider.getCredentialsAndIdentityId();
    expect(result.credentials).toMatchObject({
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      sessionToken: 'test-session-token',
    });
  });
});

describe('personality resolution', () => {
  test('uses custom personalities from GraphQL when found', async () => {
    setupGraphqlMock({
      personalities: [{
        ...defaultPersonality,
        name_1: 'Alice',
        personality_1: 'Custom personality one',
        name_2: 'Bob',
        personality_2: 'Custom personality two',
      }],
    });
    // speaker_name 'NotAlice' → name_1 (Alice) should speak
    const event = makeStreamEvent({ speaker_name: 'NotAlice' });
    await handler(event);

    const converseArgs = ConverseCommand.mock.calls[0][0];
    expect(converseArgs.system[0].text).toContain('Custom personality one');

    const createChatCall = mockGraphql.mock.calls.find((c) => c[0].query.includes('createChat'));
    expect(createChatCall[0].variables.input.speaker_name).toBe('Alice');
  });

  test('falls back to default "Jim"/"Mark" when personalities list is empty', async () => {
    setupGraphqlMock({ personalities: [] });
    // Empty list triggers the else-branch throw, caught internally; defaults persist
    const event = makeStreamEvent({ speaker_name: 'NotJim' });
    await handler(event);

    const converseArgs = ConverseCommand.mock.calls[0][0];
    expect(converseArgs.system[0].text).toContain('Jim Hoagies');

    const createChatCall = mockGraphql.mock.calls.find((c) => c[0].query.includes('createChat'));
    expect(createChatCall[0].variables.input.speaker_name).toBe('Jim');
  });

  test('falls back to defaults when listPersonalities throws — handler does not throw', async () => {
    mockGraphql.mockImplementation((params) => {
      if (params.query.includes('listPersonalities')) return Promise.reject(new Error('network error'));
      if (params.query.includes('createChat')) return Promise.resolve({ data: { createChat: { id: 'x' } } });
      return Promise.resolve({ data: {} });
    });
    const event = makeStreamEvent({ speaker_name: 'NotJim' });
    await expect(handler(event)).resolves.toBeDefined();

    const converseArgs = ConverseCommand.mock.calls[0][0];
    expect(converseArgs.system[0].text).toContain('Jim Hoagies');
  });
});

describe('speaker selection', () => {
  test('name_1 (Jim) speaks when last_speaker is not Jim', async () => {
    const event = makeStreamEvent({ speaker_name: 'Mark' });
    await handler(event);
    const createChatCall = mockGraphql.mock.calls.find((c) => c[0].query.includes('createChat'));
    expect(createChatCall[0].variables.input.speaker_name).toBe('Jim');
  });

  test('name_2 (Mark) speaks when last_speaker is Jim', async () => {
    const event = makeStreamEvent({ speaker_name: 'Jim' });
    await handler(event);
    const createChatCall = mockGraphql.mock.calls.find((c) => c[0].query.includes('createChat'));
    expect(createChatCall[0].variables.input.speaker_name).toBe('Mark');
  });

  test('name_1 (Jim) speaks when last_speaker is "You" (the user)', async () => {
    const event = makeStreamEvent({ speaker_name: 'You' });
    await handler(event);
    const createChatCall = mockGraphql.mock.calls.find((c) => c[0].query.includes('createChat'));
    expect(createChatCall[0].variables.input.speaker_name).toBe('Jim');
  });
});

describe('Bedrock message construction — first message (message_in_thread == 0)', () => {
  test('builds a single user message from last_statement', async () => {
    const event = makeStreamEvent({ message: 'Is Hurts elite?', message_in_thread: 0 });
    await handler(event);
    const converseArgs = ConverseCommand.mock.calls[0][0];
    expect(converseArgs.messages).toEqual([
      { role: 'user', content: [{ text: 'Is Hurts elite?' }] },
    ]);
  });

  test('newlines in the initial message are replaced with spaces', async () => {
    const event = makeStreamEvent({ message: 'Line one\nLine two', message_in_thread: 0 });
    await handler(event);
    const converseArgs = ConverseCommand.mock.calls[0][0];
    expect(converseArgs.messages[0].content[0].text).toBe('Line one Line two');
  });
});

describe('Bedrock message construction — continuation (message_in_thread > 0)', () => {
  // Helper: returns the messages array passed to ConverseCommand
  async function getConverseMessages(chats, message_in_thread = 1) {
    setupGraphqlMock({ chats });
    const event = makeStreamEvent({ message_in_thread, thread_id: 'thread-abc' });
    await handler(event);
    return ConverseCommand.mock.calls[0][0].messages;
  }

  test('length=1 (odd): only the initial user message is sent', async () => {
    const chats = [makeChat(0, 'Q0')];
    const messages = await getConverseMessages(chats, 1);
    expect(messages).toEqual([
      { role: 'user', content: [{ text: 'Q0' }] },
    ]);
  });

  test('length=2 (even): start=2, loop never runs — msg1 is skipped', async () => {
    const chats = [makeChat(0, 'Q0'), makeChat(1, 'A1')];
    const messages = await getConverseMessages(chats, 2);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual({ role: 'user', content: [{ text: 'Q0' }] });
  });

  test('length=3 (odd): [user(Q0), assistant(A1), user(Q2)]', async () => {
    const chats = [makeChat(0, 'Q0'), makeChat(1, 'A1'), makeChat(2, 'Q2')];
    const messages = await getConverseMessages(chats, 3);
    expect(messages).toEqual([
      { role: 'user',      content: [{ text: 'Q0' }] },
      { role: 'assistant', content: [{ text: 'A1' }] },
      { role: 'user',      content: [{ text: 'Q2' }] },
    ]);
  });

  test('length=4 (even): start=2, msg1 skipped — [user(Q0), assistant(A2), user(Q3)]', async () => {
    const chats = [makeChat(0, 'Q0'), makeChat(1, 'A1'), makeChat(2, 'A2'), makeChat(3, 'Q3')];
    const messages = await getConverseMessages(chats, 4);
    expect(messages).toEqual([
      { role: 'user',      content: [{ text: 'Q0' }] },
      { role: 'assistant', content: [{ text: 'A2' }] },
      { role: 'user',      content: [{ text: 'Q3' }] },
    ]);
  });

  test('length=5 (odd): full alternating sequence of 5 messages', async () => {
    const chats = [
      makeChat(0, 'Q0'), makeChat(1, 'A1'), makeChat(2, 'Q2'),
      makeChat(3, 'A3'), makeChat(4, 'Q4'),
    ];
    const messages = await getConverseMessages(chats, 5);
    expect(messages).toEqual([
      { role: 'user',      content: [{ text: 'Q0' }] },
      { role: 'assistant', content: [{ text: 'A1' }] },
      { role: 'user',      content: [{ text: 'Q2' }] },
      { role: 'assistant', content: [{ text: 'A3' }] },
      { role: 'user',      content: [{ text: 'Q4' }] },
    ]);
  });

  test('sorts chats by message_in_thread before building messages', async () => {
    // Provide chats out of order — handler must sort them
    const chats = [makeChat(2, 'Q2'), makeChat(0, 'Q0'), makeChat(1, 'A1')];
    const messages = await getConverseMessages(chats, 3);
    expect(messages[0].content[0].text).toBe('Q0');
  });

  test('newlines in chat history messages are replaced with spaces', async () => {
    const chats = [makeChat(0, 'Q0\npart2'), makeChat(1, 'A1'), makeChat(2, 'Q2')];
    const messages = await getConverseMessages(chats, 3);
    expect(messages[0].content[0].text).toBe('Q0 part2');
  });

  test('falls back to last_statement single message when listChats throws — handler does not throw', async () => {
    mockGraphql.mockImplementation((params) => {
      if (params.query.includes('listPersonalities'))
        return Promise.resolve({ data: { listPersonalities: { items: [defaultPersonality] } } });
      if (params.query.includes('listChats'))
        return Promise.reject(new Error('DynamoDB error'));
      if (params.query.includes('createChat'))
        return Promise.resolve({ data: { createChat: { id: 'x' } } });
      return Promise.resolve({ data: {} });
    });

    const event = makeStreamEvent({ message: 'fallback message', message_in_thread: 2 });
    await expect(handler(event)).resolves.toBeDefined();

    const converseArgs = ConverseCommand.mock.calls[0][0];
    expect(converseArgs.messages).toEqual([
      { role: 'user', content: [{ text: 'fallback message' }] },
    ]);
  });
});

describe('Bedrock response trimming', () => {
  async function getWrittenMessage(bedrockText) {
    mockBedrockSend.mockResolvedValue(makeBedrockResponse(bedrockText));
    const event = makeStreamEvent();
    await handler(event);
    const createChatCall = mockGraphql.mock.calls.find((c) => c[0].query.includes('createChat'));
    return createChatCall[0].variables.input.message;
  }

  test('trims to last period', async () => {
    const msg = await getWrittenMessage('Hello world. This is good. Incomplete frag');
    expect(msg).toBe('Hello world. This is good.');
  });

  test('trims to last exclamation mark', async () => {
    const msg = await getWrittenMessage('Eagles win! Go birds! Incomplete frag');
    expect(msg).toBe('Eagles win! Go birds!');
  });

  test('trims to last question mark', async () => {
    const msg = await getWrittenMessage('Who is the MVP? Really? Incomplete frag');
    expect(msg).toBe('Who is the MVP? Really?');
  });

  test('uses the furthest punctuation when multiple types present', async () => {
    const msg = await getWrittenMessage('First. Second! Incomplete frag');
    expect(msg).toBe('First. Second!');
  });

  test('falls back to "I\'m speechless. " when no sentence-ending punctuation', async () => {
    const msg = await getWrittenMessage('No punctuation here');
    expect(msg).toBe("I'm speechless. ");
  });

  test('falls back to "I\'m speechless. " when Bedrock returns empty string', async () => {
    const msg = await getWrittenMessage('');
    expect(msg).toBe("I'm speechless. ");
  });
});

describe('createChat output payload', () => {
  test('createChat is called with the correct output shape', async () => {
    mockBedrockSend.mockResolvedValue(makeBedrockResponse('Great answer.'));
    const event = makeStreamEvent({
      message: 'Q',
      message_in_thread: 0,
      thread_id: 'thread-xyz',
      user_email: 'test@example.com',
      speaker_name: 'You',
    });
    await handler(event);

    const createChatCall = mockGraphql.mock.calls.find((c) => c[0].query.includes('createChat'));
    expect(createChatCall[0].variables.input).toMatchObject({
      message: 'Great answer.',
      message_in_thread: 1,
      user_email: 'test@example.com',
      speaker_name: 'Jim',
      thread_id: 'thread-xyz',
    });
  });

  test('message_in_thread in createChat output is incoming value + 1', async () => {
    const event = makeStreamEvent({ message_in_thread: 3 });
    await handler(event);
    const createChatCall = mockGraphql.mock.calls.find((c) => c[0].query.includes('createChat'));
    expect(createChatCall[0].variables.input.message_in_thread).toBe(4);
  });
});

describe('return values and error handling', () => {
  test('returns "Successfully processed DynamoDB record" on success', async () => {
    const result = await handler(makeStreamEvent());
    expect(result).toBe('Successfully processed DynamoDB record');
  });

  test('does not throw when createChat GraphQL fails — returns success string', async () => {
    setupGraphqlMock({ createChatShouldFail: true });
    const result = await handler(makeStreamEvent());
    expect(result).toBe('Successfully processed DynamoDB record');
  });
});

describe('Bedrock invocation parameters', () => {
  test('ConverseCommand is called with the default model ID', async () => {
    await handler(makeStreamEvent());
    const converseArgs = ConverseCommand.mock.calls[0][0];
    expect(converseArgs.modelId).toBe('meta.llama3-70b-instruct-v1:0');
  });

  test('ConverseCommand is called with the correct inferenceConfig', async () => {
    await handler(makeStreamEvent());
    const converseArgs = ConverseCommand.mock.calls[0][0];
    expect(converseArgs.inferenceConfig).toEqual({
      maxTokens: 100,
      temperature: 0.9,
      top_p: 0.1,
    });
  });

  test('BedrockRuntimeClient is instantiated with the us-east-1 region', async () => {
    await handler(makeStreamEvent());
    expect(BedrockRuntimeClient).toHaveBeenCalledWith({ region: 'us-east-1' });
  });
});
