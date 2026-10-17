import { beforeAll, describe, expect, it, mock } from 'bun:test';
import { mockChrome } from '../test-helpers';

// `serviceWorker.js` is a classic script with no exports: importing it registers its
// listeners as a side effect. Set up the chrome mock first, and import it through a
// variable so `bun check` (which sees no module type) stays happy.
const chrome = mockChrome();

const downloadIds: number[] = [];
chrome.downloads.download = mock((_options: any, callback: (downloadId?: number) => void) => {
	const downloadId = downloadIds.length + 1;
	downloadIds.push(downloadId);
	callback(downloadId);
});

const serviceWorkerPath = './serviceWorker.js';

beforeAll(async () => {
	(globalThis as any).chrome = chrome;
	await import(serviceWorkerPath);
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
});
