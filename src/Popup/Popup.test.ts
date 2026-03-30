import { beforeEach, expect, it, mock } from 'bun:test';
import { mockChrome } from '../test-helpers';

declare var global: any;

beforeEach(() => {
	// Set up happy-dom for DOM mocking
	const { Window } = require('happy-dom');
	const window = new Window();
	global.document = window.document;
	global.window = window;
	Object.defineProperty(global, 'localStorage', { value: window.localStorage, writable: true, configurable: true });
	// Patch missing constructor in happy-dom
	if (!window.SyntaxError) window.SyntaxError = SyntaxError;

	global.chrome = mockChrome();
	global.chrome.storage = {
		local: {
			get: async () => ({}),
			set: async () => {},
		},
	};
	global.chrome.tabs.onUpdated = { addListener: mock(), removeListener: mock() };
	global.chrome.tabs.onActivated = { addListener: mock(), removeListener: mock() };
	global.chrome.action = {
		setPopup: mock(),
		openPopup: mock(),
	};
	global.chrome.sidePanel = {
		open: mock(),
	};
	global.chrome.windows.getCurrent = mock((callback: any) => callback({ id: 'window' }));
	global.chrome.tabs.query = mock((query: any, callback: any) => callback([{ id: 'tab-1' }]));
	const executeScriptMock = mock(() =>
		Promise.resolve([
			{
				result: {
					allImages: [
						'http://example.com/image-1.png',
						'http://example.com/image-2.png',
						'http://example.com/image-3.png',
					],
					linkedImages: [],
					origin: 'http://example.com',
				},
			},
		])
	);
	global.chrome.scripting = {
		executeScript: executeScriptMock,
	};
	global.noUiSlider = {
		create: mock((element: any, options: any) => {
			element.noUiSlider = {
				on: mock(),
				destroy: mock(),
			};
		}),
	};
	document.body.innerHTML = '<main></main>';
	global.React = require('../../lib/react-18.3.1.min');
	global.ReactDOM = require('../../lib/react-dom-18.3.1.min');
	require('./Popup');
});

it(`renders images`, async () => {
	// React 18's concurrent rendering uses MessageChannel for scheduling
	// Wait for React to finish rendering and effects to run
	await new Promise((resolve) => setTimeout(resolve, 50));

	expect(document.querySelectorAll('#images_container img').length).toBe(3);
});
