import { afterEach, beforeEach, expect, it, mock } from 'bun:test';
import { h, render } from 'preact';
import { mockChrome, mockDOM, waitFor } from '../test-helpers';

mockDOM();

import { downloadMode, folderName, newFileName, selectedImages } from './data.js';
import { Footer } from './Footer.js';

let chrome: ReturnType<typeof mockChrome>;
let root: HTMLDivElement;
let backgroundState: any;
let revision: number;

beforeEach(() => {
	chrome = mockChrome();
	(globalThis as any).chrome = chrome;
	chrome.permissions = { request: mock(async () => true), contains: mock(async () => false) };
	revision = 0;
	backgroundState = undefined;
	// Answers like the page running the zip jobs.
	chrome.runtime.sendMessage = mock((message: any, callback: (response?: any) => void) => {
		if (message.type === 'startZip') {
			callback({ state: jobState({ status: 'preparing', images: message.request.images }) });
		} else if (message.type === 'cancel') {
			callback({ state: jobState({ status: 'idle' }) });
		} else if (message.type === 'getState') {
			if (backgroundState) callback({ state: backgroundState });
			else {
				chrome.runtime.lastError = { message: 'Receiving end does not exist.' };
				callback(undefined);
				chrome.runtime.lastError = undefined;
			}
		}
	});
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
});

function jobState(state: any) {
	revision += 1;
	return { ...state, revision };
}

function publish(state: any) {
	for (const listener of [...chrome.runtime.onMessage.listeners]) {
		listener({ type: 'zipJobChanged', state: jobState(state) }, {}, () => {});
	}
}

function button(text: string) {
	return [...root.querySelectorAll('button')].find((element) => element.textContent?.trim().includes(text));
}

function sentMessages() {
	return chrome.runtime.sendMessage.mock.calls.map(([message]: [any]) => message.type);
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

it('shows Cancel while the zip is prepared and returns to Download once it starts', async () => {
	render(h(Footer, {}), root);
	button('Download (1)')?.click();
	await waitFor(() => sentMessages().includes('startZip'));
	await tick();

	expect(button('Cancel')?.tagName).toBe('BUTTON');
	expect(button('Download (1)')).toBeUndefined();

	publish({ status: 'started', images: selectedImages.value, failed: [] });
	await tick();

	expect(button('Cancel')).toBeUndefined();
	expect(button('Download (1)')?.tagName).toBe('BUTTON');
});

it('cancels a zip that is being prepared without reporting an error', async () => {
	render(h(Footer, {}), root);
	button('Download (1)')?.click();
	await waitFor(() => button('Cancel') !== undefined);

	button('Cancel')?.click();
	await tick();

	expect(chrome.runtime.sendMessage.mock.calls.at(-1)[0]).toEqual({ target: 'zipJobs', type: 'cancel' });
	expect(button('Cancel')).toBeUndefined();
	expect(button('Download (1)')?.tagName).toBe('BUTTON');
	expect(root.querySelector('[role="alert"]')).toBeNull();
});

it('returns to the Download button as soon as the user cancels during the permission prompt', async () => {
	chrome.permissions.request = mock(() => new Promise(() => {}));

	render(h(Footer, {}), root);
	button('Download (1)')?.click();
	await tick();

	button('Cancel')?.click();
	await tick();

	expect(button('Download (1)')?.tagName).toBe('BUTTON');
	expect(root.querySelector('[role="alert"]')).toBeNull();
	expect(sentMessages()).not.toContain('startZip');
});

it('shows a zip that another panel is preparing', async () => {
	backgroundState = jobState({ status: 'preparing', images: ['https://example.com/other.png'] });

	render(h(Footer, {}), root);
	await waitFor(() => button('Cancel') !== undefined);

	expect(button('Download (1)')).toBeUndefined();
});

it('does not show the results of a zip that finished while the panel was closed', async () => {
	backgroundState = jobState({ status: 'failed', images: selectedImages.value, error: 'Download blocked' });

	render(h(Footer, {}), root);
	await waitFor(() => sentMessages().includes('getState'));
	await tick();

	expect(root.querySelector('[role="alert"]')).toBeNull();
});

it('ignores a state older than one it has shown', async () => {
	let respond: (response?: any) => void = () => {};
	const answer = chrome.runtime.sendMessage.getMockImplementation();
	chrome.runtime.sendMessage = mock((message: any, callback: (response?: any) => void) => {
		if (message.type === 'startZip') respond = callback;
		else answer(message, callback);
	});

	render(h(Footer, {}), root);
	button('Download (1)')?.click();
	await waitFor(() => sentMessages().includes('startZip'));

	const preparing = jobState({ status: 'preparing', images: selectedImages.value });
	publish({ status: 'started', images: selectedImages.value, failed: [] });
	respond({ state: preparing });
	await tick();

	expect(button('Cancel')).toBeUndefined();
	expect(button('Download (1)')?.tagName).toBe('BUTTON');
});

it('reports a zip that fails', async () => {
	render(h(Footer, {}), root);
	button('Download (1)')?.click();
	await waitFor(() => button('Cancel') !== undefined);

	publish({ status: 'failed', images: selectedImages.value, error: 'The .zip download was interrupted.' });
	await tick();

	expect(root.querySelector('[role="alert"]')?.textContent).toContain('The .zip download was interrupted.');
});

it('clears a previous download error when the selection changes', async () => {
	chrome.permissions.request = mock(async () => false);

	render(h(Footer, {}), root);
	button('Download (1)')?.click();
	await tick();

	expect(root.querySelector('[role="alert"]')?.textContent).toContain('Allow access to the image hosts');

	selectedImages.value = ['https://example.com/b.png'];
	await tick();

	expect(root.querySelector('[role="alert"]')).toBeNull();
});

it('keeps a download error when a page reload rewrites the same selection', async () => {
	chrome.permissions.request = mock(async () => false);

	render(h(Footer, {}), root);
	button('Download (1)')?.click();
	await tick();

	expect(root.querySelector('[role="alert"]')?.textContent).toContain('Allow access to the image hosts');

	selectedImages.value = [...selectedImages.value];
	await tick();

	expect(root.querySelector('[role="alert"]')?.textContent).toContain('Allow access to the image hosts');
});

it('lists failed images and leaves data URLs out of the tooltip', async () => {
	selectedImages.value = ['data:image/png;base64,AAAA', 'https://example.com/a.png'];

	render(h(Footer, {}), root);
	button('Download (2)')?.click();
	await waitFor(() => button('Cancel') !== undefined);

	publish({ status: 'started', images: selectedImages.value, failed: ['data:image/png;base64,AAAA'] });
	await tick();

	expect(root.textContent).toContain('1 image could not be included in the .zip');
	const item = root.querySelector('li');
	expect(item?.textContent?.trim()).toBe('Embedded image');
	expect(item?.getAttribute('title')).toBeNull();
});

it('does not list failures for a different selection', async () => {
	render(h(Footer, {}), root);
	await waitFor(() => chrome.runtime.onMessage.listeners.size === 1);
	publish({ status: 'started', images: ['https://example.com/other.png'], failed: ['https://example.com/other.png'] });
	await tick();

	expect(root.textContent).not.toContain('could not be included');
});

it('stops listening when unmounted', async () => {
	render(h(Footer, {}), root);
	await waitFor(() => chrome.runtime.onMessage.listeners.size === 1);

	render(null, root);
	await waitFor(() => chrome.runtime.onMessage.listeners.size === 0);
});
