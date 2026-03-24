import { describe, it, expect, beforeEach } from 'bun:test';

type UseImageResolutionReturn = {
  resolution: {
    width: number;
    height: number;
    ready: boolean;
    error: boolean;
  };
  onLoad: (event: { currentTarget: HTMLImageElement }) => void;
  onError: () => void;
  resetResolution: () => void;
};

// Import the hook (JS file without types)
const { useImageResolution } = require('./useImageResolution.js') as {
  useImageResolution: () => UseImageResolutionReturn;
};

declare global {
  var React: any;
  var ReactDOM: any;
}

beforeEach(() => {
  global.React = require('../../lib/react-18.3.1.min');
  global.ReactDOM = require('../../lib/react-dom-18.3.1.min');
  document.body.innerHTML = '<div id="root"></div>';
});

// Helper to test hooks by rendering a component that captures the result
async function testHook<T>(hookFn: () => T): Promise<T> {
  let result: T | undefined;
  const TestComponent = () => {
    result = hookFn();
    return null;
  };

  const rootElement = document.getElementById('root');
  const root = global.ReactDOM.createRoot(rootElement);

  // Render the component
  root.render(global.React.createElement(TestComponent));

  // React 18's concurrent rendering uses MessageChannel for scheduling
  // Wait for React to finish rendering and effects to run
  await new Promise((resolve) => setTimeout(resolve, 50));

  root.unmount();

  if (!result) {
    throw new Error('Hook result was not captured');
  }

  return result;
}

describe('useImageResolution', () => {
  it('should initialize with default resolution state', async () => {
    const result = (await testHook(
      useImageResolution,
    )) as UseImageResolutionReturn;

    expect(result.resolution.width).toBe(0);
    expect(result.resolution.height).toBe(0);
    expect(result.resolution.ready).toBe(false);
    expect(result.resolution.error).toBe(false);
  });

  it('should have callable onLoad handler', async () => {
    const result = (await testHook(
      useImageResolution,
    )) as UseImageResolutionReturn;
    expect(typeof result.onLoad).toBe('function');
  });

  it('should have callable onError handler', async () => {
    const result = (await testHook(
      useImageResolution,
    )) as UseImageResolutionReturn;
    expect(typeof result.onError).toBe('function');
  });

  it('should have callable resetResolution handler', async () => {
    const result = (await testHook(
      useImageResolution,
    )) as UseImageResolutionReturn;
    expect(typeof result.resetResolution).toBe('function');
  });
});
