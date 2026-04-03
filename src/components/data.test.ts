import { beforeEach, describe, expect, it } from 'bun:test';
import { mockChrome } from '../test-helpers';

import { initialize, options, updateOption, updateOptions } from './data.js';

let localStorageData: Record<string, string>;

function setupMocks(initialStorage?: Record<string, any>) {
	localStorageData = {};
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
	Object.defineProperty(globalThis, 'localStorage', {
		value: mockLocalStorage,
		writable: true,
		configurable: true,
	});

	(global as any).chrome = mockChrome({ storage: initialStorage });
}

beforeEach(() => {
	setupMocks();
	options.value = null;
});

describe('useOptions', () => {
	describe('initialization', () => {
		it('should initialize with default values when chrome.storage is empty', async () => {
			await initialize();

			expect(options.value!.folder_name).toBe('');
			expect(options.value!.new_file_name).toBe('');
			expect(options.value!.filter_url).toBe('');
			expect(options.value!.filter_url_mode).toBe('normal');
			expect(options.value!.show_advanced_filters).toBe(true);
			expect(options.value!.filter_min_width).toBe(0);
			expect(options.value!.filter_max_width).toBe(3000);
			expect(options.value!.filter_min_height).toBe(0);
			expect(options.value!.filter_max_height).toBe(3000);
			expect(options.value!.selected_images).toEqual([]);
			expect(options.value!.columns).toBe(2);
		});

		it('should load values from chrome.storage', async () => {
			setupMocks({ folder_name: 'TestFolder', columns: 4 });
			options.value = null;

			await initialize();

			expect(options.value!.folder_name).toBe('TestFolder');
			expect(options.value!.columns).toBe(4);
		});

		it('should migrate values from localStorage and clear it', async () => {
			localStorageData.folder_name = 'MigratedFolder';
			localStorageData.columns = '5';
			localStorageData.unknown_key = 'should_be_ignored';

			await initialize();

			expect(options.value!.folder_name).toBe('MigratedFolder');
			expect(options.value!.columns).toBe(5);
			expect(Object.keys(localStorageData).length).toBe(0);

			const stored = await chrome.storage.local.get(null);
			expect(stored.folder_name).toBe('MigratedFolder');
			expect(stored.columns).toBe(5);
			expect(stored.unknown_key).toBeUndefined();
		});

		it('should not overwrite existing chrome.storage data during migration', async () => {
			setupMocks({ folder_name: 'ExistingFolder', columns: 3 });
			localStorageData.folder_name = 'OldLocalFolder';
			localStorageData.new_file_name = 'MigratedFile';

			await initialize();

			expect(options.value!.folder_name).toBe('ExistingFolder');
			expect(options.value!.new_file_name).toBe('MigratedFile');
			expect(Object.keys(localStorageData).length).toBe(0);
		});
	});

	describe('updates', () => {
		it('should update options with updateOption', async () => {
			await initialize();

			updateOption('folder_name', 'NewFolder');

			const stored = await chrome.storage.local.get(['folder_name']);
			expect(stored.folder_name).toBe('NewFolder');
		});

		it('should update options with updateOptions', async () => {
			await initialize();

			updateOptions({ folder_name: 'NewFolder' });

			const stored = await chrome.storage.local.get(['folder_name']);
			expect(stored.folder_name).toBe('NewFolder');
		});
	});

	describe('native types in storage', () => {
		it('should store numbers as numbers', async () => {
			await initialize();

			updateOption('filter_min_width', 100);

			const stored = await chrome.storage.local.get(['filter_min_width']);
			expect(stored.filter_min_width).toBe(100);
			expect(typeof stored.filter_min_width).toBe('number');
		});

		it('should store booleans as booleans', async () => {
			await initialize();

			updateOption('show_advanced_filters', false);

			const stored = await chrome.storage.local.get(['show_advanced_filters']);
			expect(stored.show_advanced_filters).toBe(false);
			expect(typeof stored.show_advanced_filters).toBe('boolean');
		});

		it('should store objects as objects', async () => {
			await initialize();

			updateOptions({ selected_images: ['img1.jpg', 'img2.jpg'] });

			const stored = await chrome.storage.local.get(['selected_images']);
			expect(stored.selected_images).toEqual(['img1.jpg', 'img2.jpg']);
			expect(Array.isArray(stored.selected_images)).toBe(true);
		});
	});
});
