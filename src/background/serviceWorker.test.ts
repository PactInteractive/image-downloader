import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { mockChrome } from '../test-helpers';

// `serviceWorker.js` has no exports: importing it registers its listeners as a side
// effect. Each test imports a fresh instance (a new query string bypasses the module
// cache) against a fresh chrome mock, through a variable so `bun check` accepts the
// query string.
const serviceWorkerPath = './serviceWorker.js';
let serviceWorkerInstance = 0;

let chrome: ReturnType<typeof mockChrome>;
let downloadIds: number[];
let deferDownloadCallbacks: boolean;
let pendingDownloadCallbacks: (() => void)[];

beforeEach(async () => {
	chrome = mockChrome();
	downloadIds = [];
	deferDownloadCallbacks = false;
	pendingDownloadCallbacks = [];
	chrome.downloads.download = mock((_options: any, callback: (downloadId?: number) => void) => {
		const downloadId = downloadIds.length + 1;
		downloadIds.push(downloadId);
		const respond = () => callback(downloadId);
		if (deferDownloadCallbacks) pendingDownloadCallbacks.push(respond);
		else respond();
	});

	(globalThis as any).chrome = chrome;
	serviceWorkerInstance += 1;
	await import(`${serviceWorkerPath}?${serviceWorkerInstance}`);
});

function sendMessage(message: any) {
	const handleMessage = chrome.runtime.onMessage.addListener.mock.calls[0][0];
	return new Promise<any>((resolve) => {
		expect(handleMessage(message, {}, resolve)).toBe(true);
	});
}

function startBatch(images: string[], options: any = {}) {
	return sendMessage({ type: 'downloadImages', imagesToDownload: images, options });
}

function filenameListener() {
	return [...chrome.downloads.onDeterminingFilename.listeners][0] as (
		item: { id: number; filename: string; mime?: string; url?: string },
		suggest: (suggestion?: { filename: string }) => void
	) => void;
}

describe('serviceWorker filename suggestions', () => {
	it('does not listen for onDeterminingFilename until a batch starts', () => {
		expect(chrome.downloads.onDeterminingFilename.listeners.size).toBe(0);
	});

	it('passes an unrelated download through with a bare suggest()', async () => {
		const done = startBatch(['https://example.com/1.jpg']);
		const downloadId = downloadIds[downloadIds.length - 1];

		expect(chrome.downloads.onDeterminingFilename.listeners.size).toBe(1);
		const listener = filenameListener();

		const unrelated = mock();
		listener({ id: downloadId + 1000, filename: 'external.jpg' }, unrelated);
		expect(unrelated.mock.calls).toEqual([[]]);

		const own = mock();
		listener({ id: downloadId, filename: '1.jpg' }, own);
		expect(own.mock.calls).toEqual([[{ filename: '1.jpg', conflictAction: 'uniquify' }]]);

		await done;
		expect(chrome.downloads.onDeterminingFilename.listeners.size).toBe(0);
	});

	it('suggests the configured folder and filename for its own downloads', async () => {
		const done = startBatch(['https://example.com/a.jpg'], { folder_name: 'folder', new_file_name: 'name' });
		const downloadId = downloadIds[downloadIds.length - 1];

		const suggest = mock();
		filenameListener()({ id: downloadId, filename: 'a.jpg' }, suggest);
		expect(suggest.mock.calls).toEqual([[{ filename: 'folder/name1.jpg', conflictAction: 'uniquify' }]]);

		await done;
		expect(chrome.downloads.onDeterminingFilename.listeners.size).toBe(0);
	});

	it('ignores a URL extension that is not plain alphanumerics', async () => {
		const done = startBatch(['https://example.com/photo.%20'], { folder_name: 'folder', new_file_name: 'name' });
		const downloadId = downloadIds[downloadIds.length - 1];

		const suggest = mock();
		filenameListener()({ id: downloadId, filename: 'photo. ', mime: 'image/png' }, suggest);
		expect(suggest.mock.calls).toEqual([[{ filename: 'folder/name1.png', conflictAction: 'uniquify' }]]);

		await done;
	});

	it('keeps listening until every download in the batch has been named', async () => {
		deferDownloadCallbacks = true;
		const done = startBatch(['https://example.com/1.jpg', 'https://example.com/2.jpg']);
		deferDownloadCallbacks = false;
		const [firstId, secondId] = downloadIds.slice(-2);
		const [registerFirst, registerSecond] = pendingDownloadCallbacks.splice(0);

		registerFirst();
		filenameListener()({ id: firstId, filename: '1.jpg' }, mock());
		expect(chrome.downloads.onDeterminingFilename.listeners.size).toBe(1);

		registerSecond();
		filenameListener()({ id: secondId, filename: '2.jpg' }, mock());
		await done;
		expect(chrome.downloads.onDeterminingFilename.listeners.size).toBe(0);
	});

	it('stops listening after a batch whose downloads all failed to start', async () => {
		chrome.downloads.download.mockImplementationOnce((_options: any, callback: (downloadId?: number) => void) =>
			callback(undefined)
		);

		await startBatch(['https://example.com/broken.jpg']);
		expect(chrome.downloads.onDeterminingFilename.listeners.size).toBe(0);
	});

	it('suggests the zip filename', async () => {
		const url = 'blob:chrome-extension://id/zip';
		const done = sendMessage({ type: 'downloadZip', url, filename: 'folder/name.zip' });
		const downloadId = downloadIds[downloadIds.length - 1];

		expect(chrome.downloads.download.mock.calls.at(-1)[0]).toEqual({ url });

		const suggest = mock();
		filenameListener()({ id: downloadId, url, filename: 'name.zip' }, suggest);
		expect(suggest.mock.calls).toEqual([[{ filename: 'folder/name.zip', conflictAction: 'uniquify' }]]);

		expect(await done).toEqual({ downloadId });
		expect(chrome.downloads.onDeterminingFilename.listeners.size).toBe(0);
	});

	it('suggests the zip filename when Chrome asks before the download callback', async () => {
		const url = 'blob:chrome-extension://id/zip';
		const suggest = mock();
		chrome.downloads.download.mockImplementationOnce((_options: any, callback: (downloadId?: number) => void) => {
			filenameListener()({ id: 1, url, filename: 'uuid' }, suggest);
			callback(1);
		});

		await sendMessage({ type: 'downloadZip', url, filename: 'folder/name.zip' });
		expect(suggest.mock.calls).toEqual([[{ filename: 'folder/name.zip', conflictAction: 'uniquify' }]]);
	});

	it('reports a zip download that cannot start', async () => {
		chrome.downloads.download.mockImplementationOnce((_options: any, callback: (downloadId?: number) => void) => {
			chrome.runtime.lastError = { message: 'Download blocked' };
			callback(undefined);
		});

		const response = await sendMessage({ type: 'downloadZip', url: 'blob:test', filename: 'name.zip' });
		expect(response).toEqual({ error: 'Download blocked' });
		expect(chrome.downloads.onDeterminingFilename.listeners.size).toBe(0);
	});
});

describe('zip jobs in Chrome', () => {
	let hasDocument: boolean;

	beforeEach(() => {
		hasDocument = false;
		chrome.offscreen = {
			Reason: { BLOBS: 'BLOBS' },
			hasDocument: mock(async () => hasDocument),
			createDocument: mock(async () => {
				hasDocument = true;
			}),
			closeDocument: mock(async () => {
				hasDocument = false;
			}),
		};
		chrome.runtime.sendMessage = mock(async () => ({ state: { status: 'preparing', revision: 1 } }));
	});

	it('starts the zip in an offscreen document, which survives the popup closing', async () => {
		const request = { images: ['https://example.com/a.png'], folder: '', fileBaseName: '', fallbackName: '' };

		expect(await sendMessage({ type: 'startZip', request })).toEqual({ state: { status: 'preparing', revision: 1 } });
		expect(chrome.offscreen.createDocument.mock.calls).toEqual([
			[{ url: 'src/Offscreen/index.html', reasons: ['BLOBS'], justification: expect.any(String) }],
		]);
		expect(chrome.runtime.sendMessage.mock.calls).toEqual([[{ target: 'zipJobs', type: 'start', request }]]);
	});

	it('reuses an open offscreen document', async () => {
		hasDocument = true;
		await sendMessage({ type: 'startZip', request: {} });

		expect(chrome.offscreen.createDocument).not.toHaveBeenCalled();
	});

	it('creates one offscreen document for zips started at the same time', async () => {
		await Promise.all([sendMessage({ type: 'startZip', request: {} }), sendMessage({ type: 'startZip', request: {} })]);

		expect(chrome.offscreen.createDocument).toHaveBeenCalledTimes(1);
	});

	it('forwards the finished zip download to the offscreen document', async () => {
		const { downloadId } = await sendMessage({ type: 'downloadZip', url: 'blob:zip', filename: 'images.zip' });
		const [listener] = [...chrome.downloads.onChanged.listeners];
		listener({ id: downloadId, state: { current: 'in_progress' } });
		listener({ id: downloadId, state: { current: 'complete' } });

		expect(chrome.runtime.sendMessage.mock.calls).toEqual([
			[{ target: 'zipJobs', type: 'downloadChanged', delta: { id: downloadId, state: { current: 'complete' } } }],
		]);
	});

	it('does not forward downloads that are not zips', async () => {
		hasDocument = true;
		await startBatch(['https://example.com/1.jpg']);
		const [listener] = [...chrome.downloads.onChanged.listeners];
		listener({ id: downloadIds[0], state: { current: 'complete' } });
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
	});

	it('creates one offscreen document even when the first is created before the second start checks', async () => {
		let checks = 0;
		chrome.offscreen.hasDocument = mock(() => {
			const value = hasDocument;
			checks += 1;
			return new Promise((resolve) => setTimeout(() => resolve(value), checks * 10));
		});

		const starts = [sendMessage({ type: 'startZip', request: {} }), sendMessage({ type: 'startZip', request: {} })];
		await Promise.all(starts);

		expect(chrome.offscreen.createDocument).toHaveBeenCalledTimes(1);
	});

	it('closes the offscreen document when it is done', async () => {
		hasDocument = true;
		chrome.runtime.sendMessage = mock(async () => ({ idle: true }));
		await sendMessage({ type: 'closeOffscreen' });

		expect(chrome.runtime.sendMessage.mock.calls).toEqual([[{ target: 'zipJobs', type: 'isIdle' }]]);
		expect(chrome.offscreen.closeDocument).toHaveBeenCalledTimes(1);
	});

	it('keeps the offscreen document open when a zip started after it asked to close', async () => {
		hasDocument = true;
		chrome.runtime.sendMessage = mock(async (message: any) =>
			message.type === 'isIdle' ? { idle: false } : { state: { status: 'preparing', revision: 1 } }
		);

		await Promise.all([sendMessage({ type: 'startZip', request: {} }), sendMessage({ type: 'closeOffscreen' })]);

		expect(chrome.runtime.sendMessage.mock.calls.map(([message]: any[]) => message.type)).toEqual(['start', 'isIdle']);
		expect(chrome.offscreen.closeDocument).not.toHaveBeenCalled();
	});

	it('looks up and cancels downloads for the offscreen document, which has no chrome.downloads', async () => {
		chrome.downloads.search = mock((_query: any, callback: (downloads: any[]) => void) =>
			callback([{ id: 7, state: 'complete' }])
		);
		chrome.downloads.cancel = mock((_id: number, callback: () => void) => callback());

		expect(await sendMessage({ type: 'findDownload', downloadId: 7 })).toEqual({
			download: { id: 7, state: 'complete' },
		});
		await sendMessage({ type: 'cancelDownload', downloadId: 7 });
		expect(chrome.downloads.cancel.mock.calls[0][0]).toBe(7);
	});
});

describe('Firefox', () => {
	it('leaves startZip to the background page', () => {
		const handleMessage = chrome.runtime.onMessage.addListener.mock.calls[0][0];
		expect(handleMessage({ type: 'startZip', request: {} }, {}, () => {})).toBeUndefined();
	});

	describe('serviceWorker without onDeterminingFilename', () => {
		beforeEach(() => {
			chrome.downloads.onDeterminingFilename = undefined;
		});

		it('passes the configured folder and filename to downloads.download()', async () => {
			await startBatch(['https://example.com/path/a.png?size=large'], { folder_name: 'folder', new_file_name: 'name' });

			expect(chrome.downloads.download.mock.calls.at(-1)[0]).toEqual({
				url: 'https://example.com/path/a.png?size=large',
				filename: 'folder/name1.png',
				conflictAction: 'uniquify',
			});
		});

		it('ignores a URL extension that is not plain alphanumerics', async () => {
			await startBatch(['https://example.com/photo.%20'], { folder_name: 'folder', new_file_name: 'name' });

			expect(chrome.downloads.download.mock.calls.at(-1)[0]).toEqual({
				url: 'https://example.com/photo.%20',
				filename: 'folder/name1',
				conflictAction: 'uniquify',
			});
		});

		it('takes the extension of a data: URL from its MIME type', async () => {
			const url = 'data:image/png;base64,iVBORw0KGgo/AAAA+BBB=';
			await startBatch([url], { folder_name: 'folder', new_file_name: 'name' });

			expect(chrome.downloads.download.mock.calls.at(-1)[0]).toEqual({
				url,
				filename: 'folder/name1.png',
				conflictAction: 'uniquify',
			});
		});

		it('normalizes MIME extensions like zip entries', async () => {
			const urls = ['data:image/svg+xml;base64,AAAA', 'data:image/x-icon;base64,AAAA', 'data:image/pjpeg;base64,AAAA'];
			await startBatch(urls, { folder_name: 'folder', new_file_name: 'name' });

			expect(chrome.downloads.download.mock.calls.map((call: any[]) => call[0].filename)).toEqual([
				'folder/name1.svg',
				'folder/name2.ico',
				'folder/name3.jpg',
			]);
		});

		it('names a download without a URL filename "image" when only a folder is set', async () => {
			const url = 'data:image/png;base64,iVBORw0KGgo/AAAA+BBB=';
			await startBatch([url], { folder_name: 'folder' });

			expect(chrome.downloads.download.mock.calls.at(-1)[0]).toEqual({
				url,
				filename: 'folder/image.png',
				conflictAction: 'uniquify',
			});
		});

		it('passes the zip filename to downloads.download()', async () => {
			const url = 'blob:chrome-extension://id/zip';
			await sendMessage({ type: 'downloadZip', url, filename: 'folder/name.zip' });

			expect(chrome.downloads.download.mock.calls.at(-1)[0]).toEqual({
				url,
				filename: 'folder/name.zip',
				conflictAction: 'uniquify',
			});
		});
	});
});
