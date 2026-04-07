import '@testing-library/jest-dom'

// jsdom doesn't implement scrollIntoView — stub it so AlwaysScrollToBottom works
// Guard against Node.js test environments where window is not defined
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
}

// jsdom doesn't implement crypto.randomUUID — stub it for WriteToGraphQL
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: jest.fn(() => 'test-uuid-1234') },
  configurable: true,
});

