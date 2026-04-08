import { VIEWPORT_CONTENT } from '../src/app/layout';

describe('RootLayout', () => {
  test('exports viewport content configured for mobile', () => {
    expect(VIEWPORT_CONTENT).toContain('width=device-width');
    expect(VIEWPORT_CONTENT).toContain('initial-scale=1');
  });
});
