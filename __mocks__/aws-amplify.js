const mockAmplify = {
    Auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
      currentAuthenticatedUser: jest.fn()
    },
    API: {
      graphql: jest.fn(),
      get: jest.fn(),
      post: jest.fn()
    }
  };
  
  export default mockAmplify;
  