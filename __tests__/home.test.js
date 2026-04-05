import { render, screen, act, fireEvent } from '@testing-library/react';

// ─── Mocks ────────────────────────────────────────────────────────────────────
// jest.mock calls are hoisted, so factories cannot close over variables defined
// in this file. Instead, use stable object references that we can configure in
// beforeEach via mockImplementation.

jest.mock('aws-amplify/api', () => {
  // Single stable client object — page.js calls generateClient() at module load
  // time, so we need the same reference to be returned every call.
  const client = { graphql: jest.fn() };
  return { generateClient: jest.fn(() => client) };
});

jest.mock('aws-amplify/auth', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    signInDetails: { loginId: 'test@example.com' },
  }),
}));

jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
    getConfig: () => ({
      Auth: { Cognito: { userPoolId: 'test-pool', userPoolClientId: 'test-client' } },
    }),
  },
}));

jest.mock('../src/aws-exports', () => ({}));

jest.mock('../src/ui-components', () => ({
  PersonalitiesUpdateForm: () => null,
}));

jest.mock('date-fns/intlFormatDistance', () => jest.fn(() => 'just now'));

jest.mock('@aws-amplify/ui-react', () => ({
  withAuthenticator: (Component) => Component,
  Button: ({ children, onClick, isLoading, loadingText, colorTheme, size, ...rest }) => (
    <button onClick={onClick} {...rest}>{isLoading ? loadingText : children}</button>
  ),
  Input: ({ onKeyUp, ...rest }) => <input onKeyUp={onKeyUp} {...rest} />,
  ScrollView: ({ children }) => <div>{children}</div>,
  Authenticator: ({ children }) =>
    typeof children === 'function' ? children({ signOut: jest.fn(), user: {} }) : children,
  Menu: ({ children }) => <div>{children}</div>,
}));

// ─── Imports that depend on mocks being ready ─────────────────────────────────

import { Home } from '../src/app/page';
import { generateClient } from 'aws-amplify/api';
import * as subscriptions from '../src/graphql/subscriptions';
import * as queries from '../src/graphql/queries';

// Grab the stable graphql mock — same function that page.js's amplifyClient uses
const mockGraphQL = generateClient().graphql;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockPersonality = {
  id: 'p1',
  name_1: 'Jim',
  personality_1: 'Sports radio host',
  name_2: 'Mark',
  personality_2: 'Polite sports host',
  user_email: 'test@example.com',
  createdAt: '2024-01-01T00:00:00Z',
};

function setupGraphQLMock(chatItems = []) {
  mockGraphQL.mockImplementation((params) => {
    if (params.query === subscriptions.onCreateChat) {
      return { subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }) };
    }
    if (params.query === queries.listChats) {
      return Promise.resolve({ data: { listChats: { items: chatItems } } });
    }
    if (params.query === queries.listPersonalities) {
      return Promise.resolve({ data: { listPersonalities: { items: [mockPersonality] } } });
    }
    return Promise.resolve({ data: {} });
  });
}

const mockSignOut = jest.fn();
const defaultProps = { signOut: mockSignOut, user: { username: 'test@example.com' } };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Home component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows empty-state prompt when there are no chats', async () => {
    setupGraphQLMock([]);
    await act(async () => {
      render(<Home {...defaultProps} />);
    });
    expect(
      screen.getByText(/Add a topic in the box above/i)
    ).toBeInTheDocument();
  });

  test('renders chat messages returned from the API', async () => {
    const chats = [
      {
        id: 'c1',
        message: 'Who is the greatest Eagle?',
        speaker_name: 'You',
        user_email: 'test@example.com',
        createdAt: '2024-01-01T00:00:01Z',
      },
      {
        id: 'c2',
        message: 'Definitely Brian Dawkins.',
        speaker_name: 'Jim',
        user_email: 'bot@botchat.internal',
        createdAt: '2024-01-01T00:00:02Z',
      },
      {
        id: 'c3',
        message: 'I agree, Dawkins was legendary.',
        speaker_name: 'Mark',
        user_email: 'bot@botchat.internal',
        createdAt: '2024-01-01T00:00:03Z',
      },
    ];
    setupGraphQLMock(chats);

    await act(async () => {
      render(<Home {...defaultProps} />);
    });

    expect(screen.getByText('Who is the greatest Eagle?')).toBeInTheDocument();
    expect(screen.getByText('Definitely Brian Dawkins.')).toBeInTheDocument();
    expect(screen.getByText('I agree, Dawkins was legendary.')).toBeInTheDocument();
    expect(screen.getByText('Jim')).toBeInTheDocument();
    expect(screen.getByText('Mark')).toBeInTheDocument();
    expect(screen.queryByText(/Add a topic in the box above/i)).not.toBeInTheDocument();
  });

  test('clears the input after pressing Enter', async () => {
    setupGraphQLMock([]);
    await act(async () => {
      render(<Home {...defaultProps} />);
    });

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Is Jalen Hurts elite?' } });
    expect(input.value).toBe('Is Jalen Hurts elite?');

    await act(async () => {
      fireEvent.keyUp(input, { key: 'Enter', code: 'Enter' });
    });

    expect(input.value).toBe('');
  });

  test('sign-out button calls signOut', async () => {
    setupGraphQLMock([]);
    await act(async () => {
      render(<Home {...defaultProps} />);
    });
    // Button text uses &nbsp; — use \s to match non-breaking spaces too
    fireEvent.click(screen.getByRole('button', { name: /sign\s*out/i }));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
