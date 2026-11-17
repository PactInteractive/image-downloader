import { afterEach, beforeEach, expect, it, mock, spyOn } from 'bun:test';
import { mockChrome, waitFor } from '../test-helpers';

// Imported fresh per test, like `serviceWorker.js`, so each registers against its own mock.
const modulePath = './firefoxZipJobs.js';
let instance = 0;

const realFetch = globalThis.fetch;
let chrome: ReturnType<typeof mockChrome>;

beforeEach(async () => {
	chrome = mockChrome();
	chrome.downloads.download = mock(async () => 1);
	chrome.downloads.search = mock(async () => [{ id: 1, state: 'in_progress' }]);
	chrome.runtime.sendMessage = mock(async () => {});
	(globalThis as any).chrome = chrome;
	globalThis.fetch = mock(
		async () => new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/png' } })
	) as any;
	instance += 1;
	await import(`${modulePath}?${instance}`);
});

afterEach(() => {
	globalThis.fetch = realFetch;
});

function sendMessage(message: any) {
	const [listener] = [...chrome.runtime.onMessage.listeners];
	return new Promise<any>((resolve) => listener(message, {}, resolve));
}

it('builds the zip in the background page and downloads it with its filename', async () => {
	const revoke = spyOn(URL, 'revokeObjectURL');
	const request = { images: ['https://example.com/a.png'], folder: 'folder', fileBaseName: 'name', fallbackName: '' };

	const { state } = await sendMessage({ type: 'startZip', request });
	expect(state.status).toBe('preparing');
	await waitFor(() => chrome.downloads.search.mock.calls.length > 0);

	const [options] = chrome.downloads.download.mock.calls[0];
	expect(options).toEqual({
		url: expect.stringMatching(/^blob:/),
		filename: 'folder/name.zip',
		conflictAction: 'uniquify',
	});
	expect(chrome.runtime.sendMessage.mock.calls.at(-1)[0]).toMatchObject({
		type: 'zipJobChanged',
		state: { status: 'started', failed: [] },
	});

	const [listener] = [...chrome.downloads.onChanged.listeners];
	listener({ id: 1, state: { current: 'complete' } });
	expect(revoke.mock.calls).toEqual([[options.url]]);
	revoke.mockRestore();
});

it('answers the panels about the current zip', async () => {
	expect(await sendMessage({ target: 'zipJobs', type: 'getState' })).toEqual({
		state: { status: 'idle', revision: 0 },
	});
});

it('keeps the background page awake while a zip is being prepared', async () => {
	const setIntervalSpy = spyOn(globalThis, 'setInterval');
	chrome.runtime.getPlatformInfo = mock(async () => ({}));
	globalThis.fetch = mock(() => new Promise(() => {})) as any;
	const request = { images: ['https://example.com/a.png'], folder: '', fileBaseName: '', fallbackName: '' };

	await sendMessage({ type: 'startZip', request });
	const [[keepAwake]] = setIntervalSpy.mock.calls as any;
	keepAwake();
	setIntervalSpy.mockRestore();

	expect(chrome.runtime.getPlatformInfo).toHaveBeenCalled();
	await sendMessage({ target: 'zipJobs', type: 'cancel' });
});

it('goes back to idle when the user closes the Save As dialog', async () => {
	chrome.downloads.download = mock(async () => {
		throw new Error('Download canceled by the user');
	});
	const request = { images: ['https://example.com/a.png'], folder: '', fileBaseName: 'name', fallbackName: '' };

	await sendMessage({ type: 'startZip', request });
	await waitFor(() => chrome.downloads.download.mock.calls.length > 0);

	await waitFor(() => chrome.runtime.sendMessage.mock.calls.at(-1)[0].state.status !== 'preparing');
	expect(chrome.runtime.sendMessage.mock.calls.at(-1)[0].state.status).toBe('idle');
});
