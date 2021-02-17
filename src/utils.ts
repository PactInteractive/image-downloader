import { mockRecursivePartial } from 'sneer';

export const mockChrome = () =>
  mockRecursivePartial<typeof chrome>({
    downloads: {
      onDeterminingFilename: {
        addListener: jest.fn(),
      },
    },
    runtime: {
      onInstalled: {
        addListener: jest.fn(),
      },
      onMessage: {
        addListener: jest.fn(),
      },
      sendMessage: jest.fn(),
    },
    tabs: {
      create: jest.fn(),
      query: jest.fn(),
    },
    windows: {
      getCurrent: () => ({ id: 'window' }),
    },
  });

export const asMockedFunction = <T extends (...args: any[]) => any>(fn: T) =>
  fn as jest.MockedFunction<T>;
