import { mock } from 'bun:test';
import { Window } from 'happy-dom';
import { mockRecursivePartial } from 'sneer';
import manifest from '../manifest.json';

/** A `chrome.events.Event` mock whose `hasListener`/`removeListener` reflect what was added. */
export const createChromeEvent = () => {
	const listeners = new Set<(...args: any[]) => void>();
	return {
		addListener: mock((listener: (...args: any[]) => void) => {
			listeners.add(listener);
		}),
		removeListener: mock((listener: (...args: any[]) => void) => {
			listeners.delete(listener);
		}),
		hasListener: mock((listener: (...args: any[]) => void) => listeners.has(listener)),
		listeners,
	};
};

export const mockChrome = (opts?: { storage?: Record<string, any> }) => {
	const store = opts?.storage ?? {};
	const chrome = mockRecursivePartial<any>({
		action: {
			setPopup: mock(),
		},
		downloads: {
			download: mock(),
			onChanged: createChromeEvent(),
			onDeterminingFilename: createChromeEvent(),
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
		onChanged: createChromeEvent(),
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
