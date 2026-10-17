import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { mockChrome } from '../test-helpers';

// `serviceWorker.js` is a classic script with no exports: importing it registers its
// listeners as a side effect. Each test imports a fresh instance (a new query string
// bypasses the module cache) against a fresh chrome mock, through a variable so
// `bun check` (which sees no module type) stays happy.
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

function startBatch(images: string[], options: any = {}) {
	const startDownload = chrome.runtime.onMessage.addListener.mock.calls[0][0];
	return new Promise<void>((resolve) => {
		startDownload({ type: 'downloadImages', imagesToDownload: images, options }, {}, resolve);
	});
}

function filenameListener() {
	return [...chrome.downloads.onDeterminingFilename.listeners][0] as (
		item: { id: number; filename: string },
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
});
