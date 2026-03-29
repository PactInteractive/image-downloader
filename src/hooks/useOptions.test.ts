import { beforeEach, describe, expect, it } from 'bun:test';

declare global {
	var React: any;
	var ReactDOM: any;
}

global.React = require('../../lib/react-18.3.1.min');
global.ReactDOM = require('../../lib/react-dom-18.3.1.min');

let useOptions: () => [any, (arg?: any) => void];

beforeEach(() => {
	const { Window } = require('happy-dom');
	const window = new Window();
	global.document = window.document;
	global.window = window;
	const storage = window.localStorage;
	Object.defineProperty(global, 'localStorage', {
		value: storage,
		writable: true,
		configurable: true,
	});
	storage.clear();

	useOptions = require('./useOptions.js').useOptions;
});

async function testHook(hookFn: () => [any, (arg?: any) => void]): Promise<[any, (arg?: any) => void]> {
	let result: any;
	const TestComponent = () => {
		result = hookFn();
		return null;
	};

	const document = global.document;
	const rootElement = document.body.appendChild(document.createElement('div'));
	const root = global.ReactDOM.createRoot(rootElement);

	root.render(global.React.createElement(TestComponent));

	await new Promise((resolve) => setTimeout(resolve, 50));

	root.unmount();
	rootElement.remove();

	if (!result) {
		throw new Error('Hook result was not captured');
	}

	return result;
}

describe('useOptions', () => {
	describe('initialization', () => {
		it('should initialize with default values when localStorage is empty', async () => {
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

		it('should load values from localStorage', async () => {
			localStorage.setItem('folder_name', 'TestFolder');
			localStorage.setItem('columns', '4');

			const [options] = await testHook(useOptions);

			expect(options.folder_name).toBe('TestFolder');
			expect(options.columns).toBe(4);
		});
	});

	describe('updates', () => {
		it('should update options with an object', async () => {
			const [, updateOptions] = await testHook(useOptions);

			updateOptions({ folder_name: 'NewFolder' });

			expect(localStorage.getItem('folder_name')).toBe('NewFolder');
		});

		it('should update options with a function updater', async () => {
			const [initialOptions, updateOptions] = await testHook(useOptions);
			expect(initialOptions.columns).toBe(2);

			updateOptions((prev: any) => ({ columns: prev.columns + 1 }));

			expect(localStorage.getItem('columns')).toBe('3');
		});
	});

	describe('serialization', () => {
		it('should serialize numbers correctly', async () => {
			const [, updateOptions] = await testHook(useOptions);

			updateOptions({ filter_min_width: 100 });

			expect(localStorage.getItem('filter_min_width')).toBe('100');
		});

		it('should serialize booleans correctly', async () => {
			const [, updateOptions] = await testHook(useOptions);

			updateOptions({ show_advanced_filters: false });

			expect(localStorage.getItem('show_advanced_filters')).toBe('false');
		});

		it('should serialize objects correctly', async () => {
			const [, updateOptions] = await testHook(useOptions);

			updateOptions({ selected_images: ['img1.jpg', 'img2.jpg'] });

			expect(localStorage.getItem('selected_images')).toBe('["img1.jpg","img2.jpg"]');
		});
	});

	describe('deserialization', () => {
		it('should deserialize numbers correctly', async () => {
			localStorage.setItem('columns', '3');

			const [options] = await testHook(useOptions);

			expect(options.columns).toBe(3);
		});

		it('should deserialize booleans correctly', async () => {
			localStorage.setItem('show_file_renaming', 'false');

			const [options] = await testHook(useOptions);

			expect(options.show_file_renaming).toBe(false);
		});

		it('should deserialize objects correctly', async () => {
			localStorage.setItem('selected_images', '["a.jpg","b.jpg"]');

			const [options] = await testHook(useOptions);

			expect(options.selected_images).toEqual(['a.jpg', 'b.jpg']);
		});
	});

	describe('error handling', () => {
		it('should return default value for invalid localStorage data', async () => {
			localStorage.setItem('columns', 'not-a-number');

			const [options] = await testHook(useOptions);

			expect(options.columns).toBe(2);
		});

		it('should return default value when number parses to NaN', async () => {
			localStorage.setItem('filter_min_width', 'abc');

			const [options] = await testHook(useOptions);

			expect(options.filter_min_width).toBe(0);
		});

		it('should return default value for invalid JSON objects', async () => {
			localStorage.setItem('selected_images', 'invalid json');

			const [options] = await testHook(useOptions);

			expect(options.selected_images).toEqual([]);
		});
	});
});
