import { beforeEach, describe, expect, it } from 'bun:test';
import { mockChrome, mockDOM } from '../test-helpers';

mockDOM();

import {
	allImages,
	columns,
	filterMaxHeight,
	filterMaxHeightEnabled,
	filterMaxWidth,
	filterMaxWidthEnabled,
	filterMinHeight,
	filterMinHeightEnabled,
	filterMinWidth,
	filterMinWidthEnabled,
	filterUrl,
	filterUrlMode,
	folderName,
	imagesCache,
	initialize,
	matchingImages,
	newFileName,
	openMode,
	selectedImages,
	showAdvancedFilters,
	showDownloadConfirmation,
} from './data.js';

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
	openMode.value = 'sidebar';
	filterUrl.value = '';
	filterUrlMode.value = 'normal';
	showAdvancedFilters.value = true;
	filterMinWidth.value = 0;
	filterMaxWidth.value = 3000;
	filterMinHeight.value = 0;
	filterMaxHeight.value = 3000;
	selectedImages.value = [];
	columns.value = 2;
	folderName.value = '';
	newFileName.value = '';
	setupMocks();
});

describe('useOptions', () => {
	describe('initialization', () => {
		it('should initialize with default values when chrome.storage is empty', async () => {
			await initialize();

			expect(openMode.value).toBe('sidebar');
			expect(filterUrl.value).toBe('');
			expect(filterUrlMode.value).toBe('normal');
			expect(showAdvancedFilters.value).toBe(true);
			expect(filterMinWidthEnabled.value).toBe(false);
			expect(filterMinWidth.value).toBe(0);
			expect(filterMaxWidthEnabled.value).toBe(false);
			expect(filterMaxWidth.value).toBe(3000);
			expect(filterMinHeightEnabled.value).toBe(false);
			expect(filterMinHeight.value).toBe(0);
			expect(filterMaxHeightEnabled.value).toBe(false);
			expect(filterMaxHeight.value).toBe(3000);
			expect(folderName.value).toBe('');
			expect(newFileName.value).toBe('');
			expect(showDownloadConfirmation.value).toBe(true);
			expect(selectedImages.value).toEqual([]);
			expect(columns.value).toBe(2);
		});

		it('should load values from chrome.storage', async () => {
			setupMocks({ columns: 4 });
			await initialize();
			expect(columns.value).toBe(4);
		});

		it('should migrate values from localStorage and clear it', async () => {
			localStorageData.columns = '5';
			localStorageData.unknown_key = 'should_be_ignored';

			await initialize();
			expect(columns.value).toBe(5);
			expect(Object.keys(localStorageData).length).toBe(0);

			const stored = await chrome.storage.local.get(null);
			expect(stored.columns).toBe(5);
			expect(stored.unknown_key).toBeUndefined();
		});

		it('should not overwrite existing chrome.storage data during migration', async () => {
			setupMocks({ columns: 3 });
			localStorageData.columns = '4';

			await initialize();
			expect(columns.value).toBe(3);
			expect(Object.keys(localStorageData).length).toBe(0);
		});
	});

	describe('updates', () => {
		it('should update filterUrl signal and sync to storage', async () => {
			await initialize();

			filterUrl.value = 'test.jpg';

			const stored = await chrome.storage.local.get(['filter_url']);
			expect(stored.filter_url).toBe('test.jpg');
		});

		it('should update filterUrlMode signal and sync to storage', async () => {
			await initialize();

			filterUrlMode.value = 'regex';

			const stored = await chrome.storage.local.get(['filter_url_mode']);
			expect(stored.filter_url_mode).toBe('regex');
		});

		it('should update openMode signal and sync to storage', async () => {
			await initialize();

			openMode.value = 'popup';

			const stored = await chrome.storage.local.get(['open_mode']);
			expect(stored.open_mode).toBe('popup');
		});
	});

	describe('native types in storage', () => {
		it('should store numbers as numbers', async () => {
			await initialize();

			filterMinWidth.value = 100;

			const stored = await chrome.storage.local.get(['filter_min_width']);
			expect(stored.filter_min_width).toBe(100);
			expect(typeof stored.filter_min_width).toBe('number');
		});

		it('should store booleans as booleans', async () => {
			await initialize();

			showAdvancedFilters.value = false;

			const stored = await chrome.storage.local.get(['show_advanced_filters']);
			expect(stored.show_advanced_filters).toBe(false);
			expect(typeof stored.show_advanced_filters).toBe('boolean');
		});

		it('should store arrays as arrays', async () => {
			await initialize();

			selectedImages.value = ['img1.jpg', 'img2.jpg'];
			await new Promise((resolve) => setTimeout(resolve, 0));

			const stored = await chrome.storage.local.get(['selected_images']);
			expect(stored.selected_images).toEqual(['img1.jpg', 'img2.jpg']);
			expect(Array.isArray(stored.selected_images)).toBe(true);
		});
	});
});

describe('matchingImages', () => {
	it('should include an image whose URL contains a double quote', () => {
		const url = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"/>';
		const cache = document.createElement('div');
		const image = document.createElement('img');
		image.setAttribute('src', url);
		cache.append(image);
		imagesCache.value = cache;

		allImages.value = [url];

		expect(matchingImages.value).toEqual([url]);
	});

	it('should treat every * in a wildcard filter as any sequence of characters', () => {
		imagesCache.value = document.createElement('div');
		allImages.value = ['https://example.com/ac.png', 'https://example.com/abc.png'];

		filterUrlMode.value = 'wildcard';
		filterUrl.value = 'a*b*c';

		expect(matchingImages.value).toEqual(['https://example.com/abc.png']);
	});

	it('should treat ? in a wildcard filter as exactly one character and + as itself', () => {
		imagesCache.value = document.createElement('div');
		allImages.value = [
			'https://example.com/photo.png',
			'https://example.com/photo1.png',
			'https://example.com/photo12.png',
			'https://example.com/a+b.png',
			'https://example.com/aab.png',
		];
		filterUrlMode.value = 'wildcard';

		filterUrl.value = 'photo?.png';
		expect(matchingImages.value).toEqual(['https://example.com/photo1.png']);

		filterUrl.value = 'a+b';
		expect(matchingImages.value).toEqual(['https://example.com/a+b.png']);
	});
});
