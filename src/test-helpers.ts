import { mock } from 'bun:test';
import { Window } from 'happy-dom';
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

export function mockDOM(options?: { localStorage?: boolean }) {
	const win = new Window();
	(globalThis as any).document = win.document;
	(globalThis as any).window = win;
	(globalThis as any).CSS = win.CSS;
	(globalThis as any).getComputedStyle = win.getComputedStyle.bind(win);
	if (!win.SyntaxError) win.SyntaxError = SyntaxError;
	if (options?.localStorage) (globalThis as any).localStorage = win.localStorage;
	return win;
}
