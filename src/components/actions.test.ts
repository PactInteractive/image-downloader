import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { unzipSync } from 'fflate';
import { mockChrome } from '../test-helpers';

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

function finishDownload(/** @type {number} */ downloadId = 1) {
	for (const listener of [...chrome.downloads.onChanged.listeners]) {
		listener({ id: downloadId, state: { current: 'complete' } });
	}
}

describe('downloadImagesAsZip', () => {
	let zipData: Promise<Uint8Array>;

	beforeEach(async () => {
		const { folderName, hostname, newFileName } = await import('./data.js');
		folderName.value = '';
		newFileName.value = '';
		hostname.value = '';
		zipData = Promise.resolve(new Uint8Array());
		chrome.permissions = { request: mock(async () => true), contains: mock(async () => false) };
		const onChanged = chrome.downloads.onChanged;
		chrome.downloads.download = mock((options: any, callback: (downloadId?: number) => void) => {
			// Read the zip while the blob URL is alive, before the simulated download completes.
			zipData = realFetch(options.url).then(async (response) => new Uint8Array(await response.arrayBuffer()));
			callback(1);
			const finish = () =>
				setTimeout(() => {
					for (const listener of [...onChanged.listeners]) listener({ id: 1, state: { current: 'complete' } });
				}, 0);
			zipData.then(finish, finish);
		});
		chrome.runtime.sendMessage = mock((message: any, callback: (response?: any) => void) => {
			chrome.downloads.download(
				{ url: message.url, filename: message.filename, conflictAction: 'uniquify' },
				(downloadId?: number) =>
					callback(downloadId == null ? { error: chrome.runtime.lastError?.message } : { downloadId })
			);
		});
	});

	it('requests access to every image host, then downloads one zip into the configured folder', async () => {
		const { folderName, newFileName } = await import('./data.js');
		folderName.value = 'folder';
		newFileName.value = 'name';
		globalThis.fetch = mock(async (url: any) => {
			const isPng = String(url).endsWith('.png');
			return new Response(new Uint8Array([isPng ? 1 : 2]), {
				headers: { 'content-type': isPng ? 'image/png' : 'image/jpeg' },
			});
		}) as any;

		const { downloadImagesAsZip } = await import('./actions.js');
		await downloadImagesAsZip(['https://example.com/a.png', 'https://cdn.example.net/b.jpg']);

		expect(chrome.permissions.request.mock.calls).toEqual([
			[{ origins: ['https://example.com/*', 'https://cdn.example.net/*'] }],
		]);

		const options = chrome.downloads.download.mock.calls[0][0];
		expect(options.filename).toBe('folder/name.zip');
		const entries = unzipSync(await zipData);
		expect(Object.keys(entries).sort()).toEqual(['name1.png', 'name2.jpg']);
		expect(entries['name1.png']).toEqual(new Uint8Array([1]));
		expect(entries['name2.jpg']).toEqual(new Uint8Array([2]));
	});

	it('uses the folder and file name that were set when the download started', async () => {
		const { folderName, newFileName } = await import('./data.js');
		folderName.value = 'folder';
		newFileName.value = 'name';

		let resolveFetch: (response: Response) => void = () => {};
		globalThis.fetch = mock(
			() =>
				new Promise<Response>((resolve) => {
					resolveFetch = resolve;
				})
		) as any;

		const { downloadImagesAsZip } = await import('./actions.js');
		const download = downloadImagesAsZip(['https://example.com/a.png']);
		await new Promise((resolve) => setTimeout(resolve, 0));

		folderName.value = 'changed';
		newFileName.value = 'other';
		resolveFetch(new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/png' } }));
		await download;

		const options = chrome.downloads.download.mock.calls[0][0];
		expect(options.filename).toBe('folder/name.zip');
		const entries = unzipSync(await zipData);
		expect(Object.keys(entries)).toEqual(['name1.png']);
	});

	it('does not ask for permission for data: images', async () => {
		globalThis.fetch = mock(async () => new Response(new Uint8Array([1]))) as any;

		const { downloadImagesAsZip } = await import('./actions.js');
		await downloadImagesAsZip([`data:image/png;base64,${btoa('png')}`]);

		expect(chrome.permissions.request.mock.calls).toEqual([]);
		expect(chrome.downloads.download.mock.calls[0][0].filename).toBe('images.zip');
	});

	it('returns the images that failed while downloading the rest', async () => {
		const consoleError = spyOn(console, 'error').mockImplementation(() => {});
		const missing = 'https://example.com/missing.png';
		globalThis.fetch = mock(async (url: any) => {
			if (String(url) === missing) return new Response('', { status: 404 });
			return new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/png' } });
		}) as any;

		const { downloadImagesAsZip } = await import('./actions.js');
		const failed = await downloadImagesAsZip(['data:image/png;base64,AAAA', missing]);
		consoleError.mockRestore();

		expect(failed).toEqual([missing]);
		const entries = unzipSync(await zipData);
		expect(Object.keys(entries)).toEqual(['image.png']);
	});

	it('keeps the blob alive and resolves only when the download finishes', async () => {
		const revoke = spyOn(URL, 'revokeObjectURL');
		chrome.downloads.download.mockImplementation((_options: any, callback: (downloadId?: number) => void) =>
			callback(1)
		);
		globalThis.fetch = mock(
			async () => new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/png' } })
		) as any;

		const { downloadImagesAsZip } = await import('./actions.js');
		let finished = false;
		const download = downloadImagesAsZip(['data:image/png;base64,AAAA']).then(() => {
			finished = true;
		});

		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(revoke).not.toHaveBeenCalled();
		expect(finished).toBe(false);

		finishDownload();
		await download;
		expect(revoke).toHaveBeenCalledTimes(1);
		revoke.mockRestore();
	});

	it('revokes the blob URL when the download completed before the listener was attached', async () => {
		const revoke = spyOn(URL, 'revokeObjectURL');
		chrome.downloads.search = mock((_query: any, callback: (downloads: any[]) => void) =>
			callback([{ id: 1, state: 'complete' }])
		);
		globalThis.fetch = mock(
			async () => new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/png' } })
		) as any;

		const { downloadImagesAsZip } = await import('./actions.js');
		await downloadImagesAsZip(['data:image/png;base64,AAAA']);
		expect(revoke).toHaveBeenCalledTimes(1);
		revoke.mockRestore();
	});

	it('reports a download that is interrupted', async () => {
		const revoke = spyOn(URL, 'revokeObjectURL');
		chrome.downloads.download.mockImplementation((_options: any, callback: (downloadId?: number) => void) =>
			callback(1)
		);
		globalThis.fetch = mock(
			async () => new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/png' } })
		) as any;

		const { downloadImagesAsZip } = await import('./actions.js');
		const download = downloadImagesAsZip(['data:image/png;base64,AAAA']);
		await new Promise((resolve) => setTimeout(resolve, 0));

		for (const listener of [...chrome.downloads.onChanged.listeners]) {
			listener({ id: 1, state: { current: 'interrupted' }, error: { current: 'FILE_ACCESS_DENIED' } });
		}
		await expect(download).rejects.toThrow('The .zip download was interrupted.');
		expect(revoke).toHaveBeenCalledTimes(1);
		revoke.mockRestore();
	});

	it('does not report a download the user cancelled', async () => {
		chrome.downloads.download.mockImplementation((_options: any, callback: (downloadId?: number) => void) =>
			callback(1)
		);
		globalThis.fetch = mock(
			async () => new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/png' } })
		) as any;

		const { downloadImagesAsZip } = await import('./actions.js');
		const download = downloadImagesAsZip(['data:image/png;base64,AAAA']);
		await new Promise((resolve) => setTimeout(resolve, 0));

		for (const listener of [...chrome.downloads.onChanged.listeners]) {
			listener({ id: 1, state: { current: 'interrupted' }, error: { current: 'USER_CANCELED' } });
		}
		await expect(download).resolves.toEqual([]);
	});

	it('normalizes the zip path like individual downloads', async () => {
		const { folderName, newFileName } = await import('./data.js');
		folderName.value = 'a/';
		newFileName.value = 'b\\c';
		globalThis.fetch = mock(
			async () => new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/png' } })
		) as any;

		const { downloadImagesAsZip } = await import('./actions.js');
		await downloadImagesAsZip(['data:image/png;base64,AAAA']);

		expect(chrome.downloads.download.mock.calls[0][0].filename).toBe('a/b/c.zip');
	});

	it('sanitizes the archive filename like archive entries', async () => {
		const { newFileName } = await import('./data.js');
		newFileName.value = 'CON';
		globalThis.fetch = mock(
			async () => new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/png' } })
		) as any;

		const { downloadImagesAsZip } = await import('./actions.js');
		await downloadImagesAsZip(['data:image/png;base64,AAAA']);

		expect(chrome.downloads.download.mock.calls[0][0].filename).toBe('_CON.zip');
	});

	it('stops without downloading when host access is denied', async () => {
		chrome.permissions.request = mock(async () => false);

		const { downloadImagesAsZip } = await import('./actions.js');
		await expect(downloadImagesAsZip(['https://example.com/a.png'])).rejects.toThrow(
			'Allow access to the image hosts to download them as a .zip.'
		);
		expect(chrome.downloads.download.mock.calls).toEqual([]);
	});

	it('reports when the zip download cannot start', async () => {
		globalThis.fetch = mock(async () => new Response(new Uint8Array([1]))) as any;
		chrome.runtime.sendMessage = mock((_message: any, callback: (response?: any) => void) =>
			callback({ error: 'Download blocked' })
		);

		const { downloadImagesAsZip } = await import('./actions.js');
		await expect(downloadImagesAsZip(['data:image/png;base64,AAAA'])).rejects.toThrow('Download blocked');
	});
});
