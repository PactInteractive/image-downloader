import { beforeEach, expect, it, mock } from 'bun:test';
import { mockChrome } from '../test-helpers';

declare var global: any;

beforeEach(() => {
	global.chrome = mockChrome();
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
	global.this = global;
	global.$ = require('../../lib/jquery-3.5.1.min');
	($.fn as any).fadeIn = function (duration: any, fn: any) {
		setTimeout(duration, fn);
		return this;
	};
	($.fn as any).fadeOut = function (duration: any, fn: any) {
		setTimeout(duration, fn);
		return this;
	};
	($ as any).Link = mock();
	($.fn as any).noUiSlider = mock();
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
	require('../defaults');
	require('./Popup');
});

it(`renders images`, async () => {
	// React 18's concurrent rendering uses MessageChannel for scheduling
	// Wait for React to finish rendering and effects to run
	await new Promise((resolve) => setTimeout(resolve, 50));

	expect(document.querySelectorAll('#images_container img').length).toBe(3);
});
