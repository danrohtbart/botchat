import { render, screen, act } from '@testing-library/react';
import Home from '../src/app/page';

// With user logged out, confirm they get the Authenticator screen, by checking for the "Create Account" button

// Mock aws-amplify with all required methods
// This is too much config, provided by Q
jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
    getConfig: () => ({
      Auth: {
        Cognito: {
          userPoolId: 'test-user-pool-id',
          userPoolClientId: 'test-client-id',
          signUpConfig: {
            hiddenDefaults: [],
            defaultCountryCode: '1'
          }
        }
      }
    })
  },
  Auth: {
    currentAuthenticatedUser: jest.fn().mockResolvedValue({
      attributes: {
        email: 'test@example.com',
        sub: 'test-user-id'
      }
    }),
    signOut: jest.fn().mockResolvedValue({}),
  },
  I18n: {
    setLanguage: jest.fn(),
  },
  Hub: {
    listen: jest.fn(),
  }
}));

// Mock aws-exports
jest.mock('../src/aws-exports', () => ({
  default: {
    aws_project_region: 'us-east-1',
    aws_cognito_identity_pool_id: 'dev-identity-pool-id',
    aws_cognito_region: 'us-east-1',
    aws_user_pools_id: 'dev-user-pool-id',
    aws_user_pools_web_client_id: 'dev-client-id',
  }
}));

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Home component is wrapped with authenticator', async () => {
    await act(async () => {
      render(<Home />);
    });

    // Default state is signIn — wait for the Sign in button to appear
    const signInButton = await screen.findByRole('button', {
      name: /sign in/i
    });

    expect(signInButton).toBeInTheDocument();
  });
});
