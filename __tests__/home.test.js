import { render, screen, act, fireEvent, within } from '@testing-library/react';

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

// Capture props passed to PersonalitiesUpdateForm so tests can assert on them.
// Module-level so it can be read inside test callbacks.
let lastPersonalitiesFormProps = {};
jest.mock('../src/ui-components', () => ({
  PersonalitiesUpdateForm: (props) => {
    lastPersonalitiesFormProps = props;
    return (
      <div data-testid="personalities-update-form">
        {props.onSuccess && (
          <button data-testid="mock-form-success" onClick={props.onSuccess}>Save</button>
        )}
      </div>
    );
  },
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
    lastPersonalitiesFormProps = {};
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

  test('renders bot avatar image next to speaker_name when personality has image_1', async () => {
    const personalityWithImages = {
      ...mockPersonality,
      image_1: 'JIM_BASE64_PNG',
      image_2: 'MARK_BASE64_PNG',
    };
    const chats = [
      {
        id: 'c1',
        message: 'Eagles forever.',
        speaker_name: 'Jim',
        user_email: 'bot@botchat.internal',
        createdAt: '2024-01-01T00:00:01Z',
      },
      {
        id: 'c2',
        message: 'Indeed they are.',
        speaker_name: 'Mark',
        user_email: 'bot@botchat.internal',
        createdAt: '2024-01-01T00:00:02Z',
      },
    ];
    mockGraphQL.mockImplementation((params) => {
      if (params.query === subscriptions.onCreateChat) {
        return { subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }) };
      }
      if (params.query === queries.listChats) {
        return Promise.resolve({ data: { listChats: { items: chats } } });
      }
      if (params.query === queries.listPersonalities) {
        return Promise.resolve({ data: { listPersonalities: { items: [personalityWithImages] } } });
      }
      return Promise.resolve({ data: {} });
    });

    await act(async () => {
      render(<Home {...defaultProps} />);
    });

    const jimAvatar = screen.getByAltText('Jim avatar');
    expect(jimAvatar).toBeInTheDocument();
    expect(jimAvatar.getAttribute('src')).toBe('data:image/png;base64,JIM_BASE64_PNG');

    const markAvatar = screen.getByAltText('Mark avatar');
    expect(markAvatar).toBeInTheDocument();
    expect(markAvatar.getAttribute('src')).toBe('data:image/png;base64,MARK_BASE64_PNG');
  });

  test('does not render an avatar for chat rows whose speaker has no image yet', async () => {
    // Personality has image_1 but no image_2
    const personality = {
      ...mockPersonality,
      image_1: 'JIM_BASE64',
      image_2: null,
    };
    const chats = [
      {
        id: 'c1',
        message: 'Eagles forever.',
        speaker_name: 'Jim',
        user_email: 'bot@botchat.internal',
        createdAt: '2024-01-01T00:00:01Z',
      },
      {
        id: 'c2',
        message: 'Polite take.',
        speaker_name: 'Mark',
        user_email: 'bot@botchat.internal',
        createdAt: '2024-01-01T00:00:02Z',
      },
    ];
    mockGraphQL.mockImplementation((params) => {
      if (params.query === subscriptions.onCreateChat) {
        return { subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }) };
      }
      if (params.query === queries.listChats) {
        return Promise.resolve({ data: { listChats: { items: chats } } });
      }
      if (params.query === queries.listPersonalities) {
        return Promise.resolve({ data: { listPersonalities: { items: [personality] } } });
      }
      return Promise.resolve({ data: {} });
    });

    await act(async () => {
      render(<Home {...defaultProps} />);
    });

    expect(screen.getByAltText('Jim avatar')).toBeInTheDocument();
    expect(screen.queryByAltText('Mark avatar')).not.toBeInTheDocument();
  });

  test('does not render avatars for the user (speaker_name="You")', async () => {
    const personality = { ...mockPersonality, image_1: 'JIM_BASE64', image_2: 'MARK_BASE64' };
    const chats = [
      {
        id: 'c1',
        message: 'My take.',
        speaker_name: 'You',
        user_email: 'test@example.com',
        createdAt: '2024-01-01T00:00:01Z',
      },
    ];
    mockGraphQL.mockImplementation((params) => {
      if (params.query === subscriptions.onCreateChat) {
        return { subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }) };
      }
      if (params.query === queries.listChats) {
        return Promise.resolve({ data: { listChats: { items: chats } } });
      }
      if (params.query === queries.listPersonalities) {
        return Promise.resolve({ data: { listPersonalities: { items: [personality] } } });
      }
      return Promise.resolve({ data: {} });
    });

    await act(async () => {
      render(<Home {...defaultProps} />);
    });

    expect(screen.queryByAltText(/avatar/i)).not.toBeInTheDocument();
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

  test('personalities panel is hidden on mobile and visible on desktop', async () => {
    setupGraphQLMock([]);
    await act(async () => {
      render(<Home {...defaultProps} />);
    });
    const panel = screen.getByTestId('personalities-panel');
    expect(panel.className).toMatch(/\bhidden\b/);
    expect(panel.className).toMatch(/\bmd:block\b/);
  });

  test('chat area is full-width on mobile', async () => {
    setupGraphQLMock([]);
    await act(async () => {
      render(<Home {...defaultProps} />);
    });
    const chatArea = screen.getByTestId('chat-area');
    expect(chatArea.className).toMatch(/\bw-full\b/);
    expect(chatArea.className).toMatch(/\bmd:w-3\/4\b/);
  });

  test('mobile settings button exists and is hidden on desktop', async () => {
    setupGraphQLMock([]);
    await act(async () => {
      render(<Home {...defaultProps} />);
    });
    const btn = screen.getByTestId('mobile-settings-button');
    expect(btn).toBeInTheDocument();
    expect(btn.className).toMatch(/\bmd:hidden\b/);
  });

  test('mobile settings modal is not shown by default', async () => {
    setupGraphQLMock([]);
    await act(async () => {
      render(<Home {...defaultProps} />);
    });
    expect(screen.queryByTestId('mobile-settings-modal')).not.toBeInTheDocument();
  });

  test('clicking mobile settings button opens the personality settings modal', async () => {
    setupGraphQLMock([]);
    await act(async () => {
      render(<Home {...defaultProps} />);
    });
    fireEvent.click(screen.getByTestId('mobile-settings-button'));
    expect(screen.getByTestId('mobile-settings-modal')).toBeInTheDocument();
  });

  test('mobile settings modal contains the personality form', async () => {
    setupGraphQLMock([]);
    await act(async () => {
      render(<Home {...defaultProps} />);
    });
    fireEvent.click(screen.getByTestId('mobile-settings-button'));
    const modal = screen.getByTestId('mobile-settings-modal');
    expect(within(modal).getByTestId('personalities-update-form')).toBeInTheDocument();
  });

  test('mobile settings modal passes current bot names to the personality form', async () => {
    setupGraphQLMock([]);
    await act(async () => {
      render(<Home {...defaultProps} />);
    });
    fireEvent.click(screen.getByTestId('mobile-settings-button'));
    expect(lastPersonalitiesFormProps.personalities).toMatchObject({
      name_1: 'Jim',
      name_2: 'Mark',
    });
  });

  test('close button in mobile settings modal hides the modal', async () => {
    setupGraphQLMock([]);
    await act(async () => {
      render(<Home {...defaultProps} />);
    });
    fireEvent.click(screen.getByTestId('mobile-settings-button'));
    expect(screen.getByTestId('mobile-settings-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('mobile-settings-close'));
    expect(screen.queryByTestId('mobile-settings-modal')).not.toBeInTheDocument();
  });

  test('submitting personality form closes the mobile settings modal', async () => {
    setupGraphQLMock([]);
    await act(async () => {
      render(<Home {...defaultProps} />);
    });
    fireEvent.click(screen.getByTestId('mobile-settings-button'));
    expect(screen.getByTestId('mobile-settings-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('mock-form-success'));
    expect(screen.queryByTestId('mobile-settings-modal')).not.toBeInTheDocument();
  });

  test('mobile header action buttons use flex ordering for two-row mobile layout', async () => {
    setupGraphQLMock([]);
    await act(async () => {
      render(<Home {...defaultProps} />);
    });
    const actionsRow = screen.getByTestId('header-actions');
    expect(actionsRow.className).toMatch(/\border-first\b/);
    expect(actionsRow.className).toMatch(/\bmd:order-last\b/);
  });

  test('header spacer is taller on mobile than desktop', async () => {
    setupGraphQLMock([]);
    await act(async () => {
      render(<Home {...defaultProps} />);
    });
    const spacer = screen.getByTestId('header-spacer');
    expect(spacer.className).toMatch(/\bh-24\b/);
    expect(spacer.className).toMatch(/\bmd:h-14\b/);
  });
});
