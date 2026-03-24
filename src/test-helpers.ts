import { mockRecursivePartial } from 'sneer';
import { mock, Mock } from 'bun:test';
import manifest from '../manifest.json';

export const mockChrome = () =>
  mockRecursivePartial<any>({
    downloads: {
      onDeterminingFilename: {
        addListener: mock(),
      },
    },
    runtime: {
      getManifest: () => manifest,
      onInstalled: {
        addListener: mock(),
      },
      onMessage: {
        addListener: mock(),
      },
      sendMessage: mock(),
    },
    tabs: {
      create: mock(),
      query: mock(),
    },
    windows: {
      getCurrent: () => ({ id: 'window' }),
    },
  });

export const asMockedFunction = <T extends (...args: any[]) => any>(fn: T) =>
  fn as unknown as Mock<T>;
