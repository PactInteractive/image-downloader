import { mock, Mock } from 'bun:test';
import { mockRecursivePartial } from 'sneer';
import manifest from '../manifest.json';

export const mockChrome = (opts?: { storage?: Record<string, any> }) => {
	const store = opts?.storage ?? {};
	const chrome = mockRecursivePartial<any>({
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
	chrome.storage = {
		local: {
			get: async (keys: any) => {
				if (keys === null || keys === undefined) return { ...store };
				const result: Record<string, any> = {};
				const ks = Array.isArray(keys) ? keys : typeof keys === 'string' ? [keys] : Object.keys(keys);
				for (const key of ks) {
					if (key in store) result[key] = store[key];
				}
				return result;
			},
			set: async (items: Record<string, any>) => {
				Object.assign(store, items);
			},
		},
	};
	return chrome;
};

export const asMockedFunction = <T extends (...args: any[]) => any>(fn: T) => fn as unknown as Mock<T>;
