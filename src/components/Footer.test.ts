import { afterEach, beforeEach, expect, it, mock, spyOn } from 'bun:test';
import { h, render } from 'preact';
import { mockChrome, mockDOM } from '../test-helpers';

mockDOM();

import { downloadMode, folderName, newFileName, selectedImages } from './data.js';
import { Footer } from './Footer.js';

const realFetch = globalThis.fetch;

let chrome: ReturnType<typeof mockChrome>;
let root: HTMLDivElement;

beforeEach(() => {
	chrome = mockChrome();
	(globalThis as any).chrome = chrome;
	chrome.permissions = { request: mock(async () => true), contains: mock(async () => false) };
	downloadMode.value = 'zip';
	folderName.value = '';
	newFileName.value = '';
	selectedImages.value = ['https://example.com/a.png'];
	root = document.createElement('div');
	document.body.append(root);
});

afterEach(() => {
	render(null, root);
	root.remove();
	globalThis.fetch = realFetch;
});

function button(text: string) {
	return [...root.querySelectorAll('button')].find((element) => element.textContent?.trim().includes(text));
}

it('cancels a zip that is still being prepared without reporting an error', async () => {
	const fetchMock = mock((_url: any, options: any) => {
		return new Promise((_resolve, reject) => {
			options.signal.addEventListener('abort', () => reject(options.signal.reason));
		});
	});
	globalThis.fetch = fetchMock as any;

	render(h(Footer, {}), root);
	button('Download (1)')?.click();
	await new Promise((resolve) => setTimeout(resolve, 0));

	const cancelButton = button('Cancel');
	expect(cancelButton?.tagName).toBe('BUTTON');
	cancelButton?.click();
	await new Promise((resolve) => setTimeout(resolve, 0));

	expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
	expect(button('Cancel')).toBeUndefined();
	expect(button('Download (1)')?.tagName).toBe('BUTTON');
	expect(root.querySelector('[role="alert"]')).toBeNull();
	expect(chrome.downloads.download.mock.calls).toEqual([]);
});

it('hides Cancel once the browser download starts and returns when it finishes', async () => {
	globalThis.fetch = mock(
		async () => new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/png' } })
	) as any;
	chrome.downloads.search = mock((_query: any, callback: (downloads: any[]) => void) =>
		callback([{ id: 1, state: 'in_progress' }])
	);
	let respond: (response?: any) => void = () => {};
	chrome.runtime.sendMessage = mock((_message: any, callback: (response?: any) => void) => {
		respond = callback;
	});

	render(h(Footer, {}), root);
	button('Download (1)')?.click();
	await new Promise((resolve) => setTimeout(resolve, 0));

	expect(button('Cancel')?.tagName).toBe('BUTTON');
	respond({ downloadId: 1 });
	await new Promise((resolve) => setTimeout(resolve, 0));

	expect(button('Cancel')).toBeUndefined();
	expect(button('Download (1)')).toBeUndefined();
	expect(root.textContent).toContain('Keep the extension open until the .zip finishes downloading.');

	const [listener] = [...chrome.downloads.onChanged.listeners];
	listener({ id: 1, state: { current: 'complete' } });
	await new Promise((resolve) => setTimeout(resolve, 0));

	expect(button('Download (1)')?.tagName).toBe('BUTTON');
	expect(root.textContent).not.toContain('Keep the extension open until the .zip finishes downloading.');
});

it('clears a previous download error when the selection changes', async () => {
	chrome.permissions.request = mock(async () => false);

	render(h(Footer, {}), root);
	button('Download (1)')?.click();
	await new Promise((resolve) => setTimeout(resolve, 0));

	expect(root.querySelector('[role="alert"]')?.textContent).toContain('Allow access to the image hosts');

	selectedImages.value = ['https://example.com/b.png'];
	await new Promise((resolve) => setTimeout(resolve, 0));

	expect(root.querySelector('[role="alert"]')).toBeNull();
});

it('keeps a download error when a page reload rewrites the same selection', async () => {
	chrome.permissions.request = mock(async () => false);

	render(h(Footer, {}), root);
	button('Download (1)')?.click();
	await new Promise((resolve) => setTimeout(resolve, 0));

	expect(root.querySelector('[role="alert"]')?.textContent).toContain('Allow access to the image hosts');

	selectedImages.value = [...selectedImages.value];
	await new Promise((resolve) => setTimeout(resolve, 0));

	expect(root.querySelector('[role="alert"]')?.textContent).toContain('Allow access to the image hosts');
});

it('lists failed images and leaves data URLs out of the tooltip', async () => {
	const consoleError = spyOn(console, 'error').mockImplementation(() => {});
	try {
		selectedImages.value = ['data:image/png;base64,AAAA', 'https://example.com/a.png'];
		globalThis.fetch = mock(async (url: any) => {
			if (String(url).startsWith('data:')) {
				return new Response('<html>Just a moment...</html>', {
					headers: { 'content-type': 'text/html' },
				});
			}
			return new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/png' } });
		}) as any;
		chrome.downloads.search = mock((_query: any, callback: (downloads: any[]) => void) =>
			callback([{ id: 1, state: 'in_progress' }])
		);
		chrome.runtime.sendMessage = mock((_message: any, callback: (response?: any) => void) => {
			callback({ downloadId: 1 });
		});

		render(h(Footer, {}), root);
		button('Download (2)')?.click();
		await new Promise((resolve) => setTimeout(resolve, 0));

		const [listener] = [...chrome.downloads.onChanged.listeners];
		listener({ id: 1, state: { current: 'complete' } });
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(root.textContent).toContain('1 image could not be included in the .zip');
		const item = root.querySelector('li');
		expect(item?.textContent?.trim()).toBe('Embedded image');
		expect(item?.getAttribute('title')).toBeNull();
	} finally {
		consoleError.mockRestore();
	}
});

it('cancels a download that starts while the handoff is pending', async () => {
	globalThis.fetch = mock(
		async () => new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/png' } })
	) as any;
	chrome.downloads.cancel = mock();
	let respond: (response?: any) => void = () => {};
	chrome.runtime.sendMessage = mock((_message: any, callback: (response?: any) => void) => {
		respond = callback;
	});

	render(h(Footer, {}), root);
	button('Download (1)')?.click();
	await new Promise((resolve) => setTimeout(resolve, 0));

	button('Cancel')?.click();
	respond({ downloadId: 42 });
	await new Promise((resolve) => setTimeout(resolve, 0));

	expect(chrome.downloads.cancel.mock.calls).toEqual([[42]]);
	expect(button('Cancel')).toBeUndefined();
	expect(button('Download (1)')?.tagName).toBe('BUTTON');
	expect(root.querySelector('[role="alert"]')).toBeNull();
});
