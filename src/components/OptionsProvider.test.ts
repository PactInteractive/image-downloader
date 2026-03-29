import { beforeEach, describe, expect, it } from 'bun:test';

declare global {
	var React: any;
	var ReactDOM: any;
}

global.React = require('../../lib/react-18.3.1.min');
global.ReactDOM = require('../../lib/react-dom-18.3.1.min');

let OptionsProvider: any;
let useOptions: () => [any, (arg?: any) => void];

beforeEach(() => {
	const { Window } = require('happy-dom');
	const window = new Window();
	global.document = window.document;
	global.window = window;

	// Mock chrome.storage.local
	const storage: Record<string, any> = {};
	(global as any).chrome = {
		storage: {
			local: {
				get: async (keys: any) => {
					if (keys === null || keys === undefined) {
						return { ...storage };
					}
					const result: Record<string, any> = {};
					if (Array.isArray(keys)) {
						for (const key of keys) {
							if (key in storage) {
								result[key] = storage[key];
							}
						}
					} else if (typeof keys === 'string') {
						if (keys in storage) {
							result[keys] = storage[keys];
						}
					} else if (typeof keys === 'object') {
						for (const key of Object.keys(keys)) {
							if (key in storage) {
								result[key] = storage[key];
							}
						}
					}
					return result;
				},
				set: async (items: Record<string, any>) => {
					Object.assign(storage, items);
				},
			} as any,
		},
	};

	// Mock localStorage
	const localStorageData: Record<string, string> = {};
	const mockLocalStorage = {
		get length() {
			return Object.keys(localStorageData).length;
		},
		getItem: (key: string) => localStorageData[key] || null,
		setItem: (key: string, value: string) => {
			localStorageData[key] = value;
		},
		removeItem: (key: string) => {
			delete localStorageData[key];
		},
		clear: () => {
			for (const key in localStorageData) {
				delete localStorageData[key];
			}
		},
		key: (index: number) => Object.keys(localStorageData)[index] || null,
	};
	Object.defineProperty(global, 'localStorage', {
		value: mockLocalStorage,
		writable: true,
		configurable: true,
	});

	// Clear storage before each test
	for (const key in storage) {
		delete storage[key];
	}
	global.localStorage.clear();

	const hooks = require('./OptionsProvider.js');
	OptionsProvider = hooks.OptionsProvider;
	useOptions = hooks.useOptions;
});

async function testHook(hookFn: () => [any, (arg?: any) => void]): Promise<[any, (arg?: any) => void]> {
	let result: any;
	const TestComponent = () => {
		result = hookFn();
		return null;
	};

	const App = () => {
		return global.React.createElement(OptionsProvider, null, global.React.createElement(TestComponent));
	};

	const document = global.document;
	const rootElement = document.body.appendChild(document.createElement('div'));
	const root = global.ReactDOM.createRoot(rootElement);

	root.render(global.React.createElement(App));

	// Wait for async loading
	await new Promise((resolve) => setTimeout(resolve, 100));

	if (!result) {
		throw new Error('Hook result was not captured');
	}

	return result;
}

describe('useOptions', () => {
	describe('initialization', () => {
		it('should initialize with default values when chrome.storage is empty', async () => {
			const [options] = await testHook(useOptions);

			expect(options.folder_name).toBe('');
			expect(options.new_file_name).toBe('');
			expect(options.filter_url).toBe('');
			expect(options.filter_url_mode).toBe('normal');
			expect(options.show_advanced_filters).toBe(true);
			expect(options.filter_min_width).toBe(0);
			expect(options.filter_max_width).toBe(3000);
			expect(options.filter_min_height).toBe(0);
			expect(options.filter_max_height).toBe(3000);
			expect(options.selected_images).toEqual([]);
			expect(options.columns).toBe(2);
		});

		it('should load values from chrome.storage', async () => {
			await chrome.storage.local.set({ folder_name: 'TestFolder', columns: '4' });

			const [options] = await testHook(useOptions);

			expect(options.folder_name).toBe('TestFolder');
			expect(options.columns).toBe(4);
		});

		it('should migrate values from localStorage and clear it', async () => {
			global.localStorage.setItem('folder_name', 'MigratedFolder');
			global.localStorage.setItem('columns', '5');
			global.localStorage.setItem('unknown_key', 'should_be_ignored');

			const [options] = await testHook(useOptions);

			expect(options.folder_name).toBe('MigratedFolder');
			expect(options.columns).toBe(5);
			expect(global.localStorage.length).toBe(0);

			// Verify the data is now in chrome.storage
			const stored = await chrome.storage.local.get(null);
			expect(stored.folder_name).toBe('MigratedFolder');
			expect(stored.columns).toBe('5');
			expect(stored.unknown_key).toBeUndefined();
		});
	});

	describe('updates', () => {
		it('should update options with an object', async () => {
			const [, updateOptions] = await testHook(useOptions);

			await updateOptions({ folder_name: 'NewFolder' });

			const stored = await chrome.storage.local.get(['folder_name']);
			expect(stored.folder_name).toBe('NewFolder');
		});

		it('should update options with a function updater', async () => {
			const [initialOptions, updateOptions] = await testHook(useOptions);
			expect(initialOptions.columns).toBe(2);

			await updateOptions((prev: any) => ({ columns: prev.columns + 1 }));

			const stored = await chrome.storage.local.get(['columns']);
			expect(stored.columns).toBe('3');
		});
	});

	describe('serialization', () => {
		it('should serialize numbers correctly', async () => {
			const [, updateOptions] = await testHook(useOptions);

			await updateOptions({ filter_min_width: 100 });

			const stored = await chrome.storage.local.get(['filter_min_width']);
			expect(stored.filter_min_width).toBe('100');
		});

		it('should serialize booleans correctly', async () => {
			const [, updateOptions] = await testHook(useOptions);

			await updateOptions({ show_advanced_filters: false });

			const stored = await chrome.storage.local.get(['show_advanced_filters']);
			expect(stored.show_advanced_filters).toBe('false');
		});

		it('should serialize objects correctly', async () => {
			const [, updateOptions] = await testHook(useOptions);

			await updateOptions({ selected_images: ['img1.jpg', 'img2.jpg'] });

			const stored = await chrome.storage.local.get(['selected_images']);
			expect(stored.selected_images).toBe('["img1.jpg","img2.jpg"]');
		});
	});

	describe('deserialization', () => {
		it('should deserialize numbers correctly', async () => {
			await chrome.storage.local.set({ columns: '3' });

			const [options] = await testHook(useOptions);

			expect(options.columns).toBe(3);
		});

		it('should deserialize booleans correctly', async () => {
			await chrome.storage.local.set({ show_file_renaming: 'false' });

			const [options] = await testHook(useOptions);

			expect(options.show_file_renaming).toBe(false);
		});

		it('should deserialize objects correctly', async () => {
			await chrome.storage.local.set({ selected_images: '["a.jpg","b.jpg"]' });

			const [options] = await testHook(useOptions);

			expect(options.selected_images).toEqual(['a.jpg', 'b.jpg']);
		});
	});

	describe('error handling', () => {
		it('should return default value for invalid chrome.storage data', async () => {
			await chrome.storage.local.set({ columns: 'not-a-number' });

			const [options] = await testHook(useOptions);

			expect(options.columns).toBe(2);
		});

		it('should return default value when number parses to NaN', async () => {
			await chrome.storage.local.set({ filter_min_width: 'abc' });

			const [options] = await testHook(useOptions);

			expect(options.filter_min_width).toBe(0);
		});

		it('should return default value for invalid JSON objects', async () => {
			await chrome.storage.local.set({ selected_images: 'invalid json' });

			const [options] = await testHook(useOptions);

			expect(options.selected_images).toEqual([]);
		});
	});
});
