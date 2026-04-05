import { beforeEach, expect, it, mock } from 'bun:test';
import { mockChrome, mockDOM } from '../test-helpers';

mockDOM({ localStorage: true });

beforeEach(() => {
	(global as any).chrome = mockChrome();
	(global as any).chrome.storage = {
		local: {
			get: async () => ({}),
			set: async () => {},
		},
	};
	(global as any).chrome.tabs.onUpdated = { addListener: mock(), removeListener: mock() };
	(global as any).chrome.tabs.onActivated = { addListener: mock(), removeListener: mock() };
	(global as any).chrome.action = {
		setPopup: mock(),
		openPopup: mock(),
	};
	(global as any).chrome.sidePanel = {
		open: mock(),
	};
	(global as any).chrome.windows.getCurrent = mock((callback: any) => callback({ id: 'window' }));
	(global as any).chrome.tabs.query = mock((query: any, callback: any) => callback([{ id: 'tab-1' }]));
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
	(global as any).chrome.scripting = {
		executeScript: executeScriptMock,
	};
	(global as any).noUiSlider = {
		create: mock((element: any, options: any) => {
			element.noUiSlider = {
				on: mock(),
				destroy: mock(),
			};
		}),
	};
	document.body.innerHTML = '<main></main>';
});

it(`renders images`, async () => {
	require('./Popup');

	await new Promise((resolve) => setTimeout(resolve, 50));

	expect(document.querySelectorAll('#images_container img').length).toBe(3);
});
