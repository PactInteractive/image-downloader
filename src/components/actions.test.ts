import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { mockChrome, waitFor } from '../test-helpers';

let chrome: ReturnType<typeof mockChrome>;
const realFetch = globalThis.fetch;

beforeEach(() => {
	chrome = mockChrome();
	(globalThis as any).chrome = chrome;
});

afterEach(() => {
	globalThis.fetch = realFetch;
});

describe('openImage', () => {
	it('opens a regular image URL as is', async () => {
		const { openImage } = await import('./actions.js');
		await openImage('https://example.com/a.png');

		expect(chrome.tabs.create.mock.calls).toEqual([[{ url: 'https://example.com/a.png', active: false }]]);
	});

	it('opens a data: URL as a blob, because browsers refuse data: URLs in tabs', async () => {
		const { openImage } = await import('./actions.js');
		await openImage(`data:image/webp;base64,${btoa('webp bytes')}`);

		const { url } = chrome.tabs.create.mock.calls[0][0];
		expect(url).toStartWith('blob:');
		const blob = await (await fetch(url)).blob();
		expect([blob.type, await blob.text()]).toEqual(['image/webp', 'webp bytes']);
	});
});

describe('downloadImagesAsZip', () => {
	beforeEach(async () => {
		const { folderName, hostname, newFileName } = await import('./data.js');
		folderName.value = '';
		newFileName.value = '';
		hostname.value = '';
		chrome.permissions = { request: mock(async () => true), contains: mock(async () => false) };
		chrome.runtime.sendMessage = mock((_message: any, callback: (response?: any) => void) =>
			callback({ state: { status: 'preparing', revision: 1 } })
		);
	});

	it('requests access to every image host, then hands the zip to the background', async () => {
		const { folderName, hostname, newFileName } = await import('./data.js');
		folderName.value = 'folder';
		newFileName.value = 'name';
		hostname.value = 'example.com';
		const images = ['https://example.com/a.png', 'https://cdn.example.net/b.jpg'];

		const { downloadImagesAsZip } = await import('./actions.js');
		expect(await downloadImagesAsZip(images)).toEqual({ status: 'preparing', revision: 1 } as any);

		expect(chrome.permissions.request.mock.calls).toEqual([
			[{ origins: ['https://example.com/*', 'https://cdn.example.net/*'] }],
		]);
		expect(chrome.runtime.sendMessage.mock.calls[0][0]).toEqual({
			type: 'startZip',
			request: { images, folder: 'folder', fileBaseName: 'name', fallbackName: 'example.com' },
		});
	});

	it('uses the folder and file name that were set when the download started', async () => {
		const { folderName, newFileName } = await import('./data.js');
		folderName.value = 'folder';
		newFileName.value = 'name';
		let grant: (granted: boolean) => void = () => {};
		chrome.permissions.request = mock(() => new Promise<boolean>((resolve) => (grant = resolve)));

		const { downloadImagesAsZip } = await import('./actions.js');
		const download = downloadImagesAsZip(['https://example.com/a.png']);
		folderName.value = 'changed';
		newFileName.value = 'other';
		grant(true);
		await download;

		expect(chrome.runtime.sendMessage.mock.calls[0][0].request).toMatchObject({
			folder: 'folder',
			fileBaseName: 'name',
		});
	});

	it('does not ask for permission for data: images', async () => {
		const { downloadImagesAsZip } = await import('./actions.js');
		await downloadImagesAsZip([`data:image/png;base64,${btoa('png')}`]);

		expect(chrome.permissions.request.mock.calls).toEqual([]);
		expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
	});

	it('stops without starting the zip when host access is denied', async () => {
		chrome.permissions.request = mock(async () => false);

		const { downloadImagesAsZip } = await import('./actions.js');
		await expect(downloadImagesAsZip(['https://example.com/a.png'])).rejects.toThrow(
			'Allow access to the image hosts to download them as a .zip.'
		);
		expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
	});

	it('stops waiting for the permission prompt when the user cancels', async () => {
		chrome.permissions.request = mock(() => new Promise(() => {}));
		const controller = new AbortController();

		const { downloadImagesAsZip } = await import('./actions.js');
		const download = downloadImagesAsZip(['https://example.com/a.png'], controller.signal);
		controller.abort();

		await expect(download).rejects.toHaveProperty('name', 'AbortError');
		expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
	});

	it('cancels a zip that started while the handoff was pending', async () => {
		const controller = new AbortController();
		let respond: (response?: any) => void = () => {};
		chrome.runtime.sendMessage = mock((message: any, callback: (response?: any) => void) => {
			if (message.type === 'startZip') respond = callback;
			else callback({ state: { status: 'idle', revision: 2 } });
		});

		const { downloadImagesAsZip } = await import('./actions.js');
		const download = downloadImagesAsZip(['data:image/png;base64,AAAA'], controller.signal);
		await waitFor(() => chrome.runtime.sendMessage.mock.calls.length > 0);
		controller.abort();
		respond({ state: { status: 'preparing', revision: 1 } });

		await expect(download).rejects.toHaveProperty('name', 'AbortError');
		expect(chrome.runtime.sendMessage.mock.calls[1][0]).toEqual({ target: 'zipJobs', type: 'cancel' });
	});

	it('reports when the zip cannot start', async () => {
		chrome.runtime.sendMessage = mock((_message: any, callback: (response?: any) => void) =>
			callback({ error: 'A .zip is already being prepared.' })
		);

		const { downloadImagesAsZip } = await import('./actions.js');
		await expect(downloadImagesAsZip(['data:image/png;base64,AAAA'])).rejects.toThrow(
			'A .zip is already being prepared.'
		);
	});
});

describe('getZipJob', () => {
	it('reports no job when nothing is there to answer', async () => {
		chrome.runtime.sendMessage = mock((_message: any, callback: (response?: any) => void) => {
			chrome.runtime.lastError = { message: 'Could not establish connection. Receiving end does not exist.' };
			callback(undefined);
			chrome.runtime.lastError = undefined;
		});

		const { getZipJob } = await import('./actions.js');
		expect(await getZipJob()).toBeUndefined();
	});
});
