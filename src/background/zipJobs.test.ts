import { afterEach, beforeEach, expect, it, mock, spyOn } from 'bun:test';
import { unzipSync } from 'fflate';
import { waitFor } from '../test-helpers';

import { createZipJobs, type ZipJobState } from './zipJobs.js';

const realFetch = globalThis.fetch;
const pngResponse = () => new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/png' } });

let host: {
	download: ReturnType<typeof mock>;
	findDownload: ReturnType<typeof mock>;
	cancelDownload: ReturnType<typeof mock>;
	publish: ReturnType<typeof mock>;
	release: ReturnType<typeof mock>;
};
let zipData: Promise<Uint8Array>;
let revoke: ReturnType<typeof spyOn>;

beforeEach(() => {
	zipData = Promise.resolve(new Uint8Array());
	host = {
		download: mock(async (url: string) => {
			// Read the zip while the blob URL is alive.
			zipData = realFetch(url).then(async (response) => new Uint8Array(await response.arrayBuffer()));
			await zipData;
			return 1;
		}),
		findDownload: mock(async () => ({ id: 1, state: 'in_progress' })),
		cancelDownload: mock(async () => {}),
		publish: mock(),
		release: mock(),
	};
	globalThis.fetch = mock(async () => pngResponse()) as any;
	revoke = spyOn(URL, 'revokeObjectURL');
});

afterEach(() => {
	globalThis.fetch = realFetch;
	revoke.mockRestore();
});

function request(overrides: Record<string, any> = {}) {
	return { images: ['https://example.com/a.png'], folder: '', fileBaseName: '', fallbackName: '', ...overrides };
}

function published() {
	return host.publish.mock.calls.map((call: any[]) => call[0] as ZipJobState);
}

const lastStatus = () => published().at(-1)?.status;

it('downloads one zip into the configured folder and reports the images that failed', async () => {
	const consoleError = spyOn(console, 'error').mockImplementation(() => {});
	const missing = 'https://example.com/missing.png';
	globalThis.fetch = mock(async (url: any) => {
		if (String(url) === missing) return new Response('', { status: 404 });
		const isPng = String(url).endsWith('.png');
		return new Response(new Uint8Array([isPng ? 1 : 2]), {
			headers: { 'content-type': isPng ? 'image/png' : 'image/jpeg' },
		});
	}) as any;

	const jobs = createZipJobs(host);
	const images = ['https://example.com/a.png', missing, 'https://cdn.example.net/b.jpg'];
	expect(jobs.start(request({ images, folder: 'folder', fileBaseName: 'name' })).status).toBe('preparing');
	await waitFor(() => lastStatus() === 'started');
	consoleError.mockRestore();

	expect(host.download.mock.calls[0][1]).toBe('folder/name.zip');
	const entries = unzipSync(await zipData);
	expect(Object.keys(entries).sort()).toEqual(['name1.png', 'name3.jpg']);
	expect(entries['name3.jpg']).toEqual(new Uint8Array([2]));
	expect(published().at(-1)).toMatchObject({ status: 'started', images, failed: [missing] });
});

it('orders every published state after the previous one', async () => {
	const jobs = createZipJobs(host);
	jobs.start(request());
	await waitFor(() => lastStatus() === 'started');

	const [preparing, started] = published();
	expect(started.revision).toBeGreaterThan(preparing.revision);
});

it('normalizes the zip path like individual downloads', async () => {
	createZipJobs(host).start(request({ images: ['data:image/png;base64,AAAA'], folder: 'a/', fileBaseName: 'b\\c' }));
	await waitFor(() => lastStatus() === 'started');

	expect(host.download.mock.calls[0][1]).toBe('a/b/c.zip');
});

it('sanitizes the archive filename like archive entries', async () => {
	createZipJobs(host).start(request({ fileBaseName: 'CON' }));
	await waitFor(() => lastStatus() === 'started');

	expect(host.download.mock.calls[0][1]).toBe('_CON.zip');
});

it('names the zip after the page when no file name is set', async () => {
	createZipJobs(host).start(request({ fallbackName: 'example.com' }));
	await waitFor(() => lastStatus() === 'started');

	expect(host.download.mock.calls[0][1]).toBe('example.com.zip');
});

it('keeps the blob alive until the download finishes, then releases the page', async () => {
	const jobs = createZipJobs(host);
	jobs.start(request());
	await waitFor(() => host.findDownload.mock.calls.length > 0);
	await new Promise((resolve) => setTimeout(resolve, 0));

	expect(revoke).not.toHaveBeenCalled();
	expect(host.release).not.toHaveBeenCalled();

	jobs.downloadChanged({ id: 1, state: { current: 'complete' } } as any);
	expect(revoke).toHaveBeenCalledTimes(1);
	expect(host.release).toHaveBeenCalledTimes(1);
	expect(lastStatus()).toBe('started');
});

it('releases the blob when the download finished before it was tracked', async () => {
	host.findDownload = mock(async () => ({ id: 1, state: 'complete' }));

	createZipJobs(host).start(request());
	await waitFor(() => host.release.mock.calls.length > 0);

	expect(revoke).toHaveBeenCalledTimes(1);
});

it('reports a download that is interrupted', async () => {
	const jobs = createZipJobs(host);
	jobs.start(request());
	await waitFor(() => host.findDownload.mock.calls.length > 0);

	jobs.downloadChanged({ id: 1, state: { current: 'interrupted' }, error: { current: 'FILE_ACCESS_DENIED' } } as any);
	expect(published().at(-1)).toMatchObject({ status: 'failed', error: 'The .zip download was interrupted.' });
	expect(revoke).toHaveBeenCalledTimes(1);
});

it('does not report a download the user cancelled', async () => {
	const jobs = createZipJobs(host);
	jobs.start(request());
	await waitFor(() => host.findDownload.mock.calls.length > 0);

	jobs.downloadChanged({ id: 1, state: { current: 'interrupted' }, error: { current: 'USER_CANCELED' } } as any);
	expect(lastStatus()).toBe('started');
	expect(revoke).toHaveBeenCalledTimes(1);
});

it('ignores changes to other downloads', async () => {
	const jobs = createZipJobs(host);
	jobs.start(request());
	await waitFor(() => host.findDownload.mock.calls.length > 0);

	jobs.downloadChanged({ id: 2, state: { current: 'complete' } } as any);
	expect(revoke).not.toHaveBeenCalled();
});

it('stops preparing without downloading when cancelled', async () => {
	globalThis.fetch = mock(
		(_url: any, options: any) =>
			new Promise((_resolve, reject) => {
				options.signal.addEventListener('abort', () => reject(options.signal.reason));
			})
	) as any;

	const jobs = createZipJobs(host);
	jobs.start(request());
	await waitFor(() => (globalThis.fetch as any).mock.calls.length > 0);

	expect(jobs.cancel().status).toBe('idle');
	await waitFor(() => host.release.mock.calls.length > 0);
	expect(host.download).not.toHaveBeenCalled();
	expect(lastStatus()).toBe('idle');
});

it('cancels a download that starts while the handoff is pending', async () => {
	let respond: (downloadId: number) => void = () => {};
	host.download = mock(() => new Promise<number>((resolve) => (respond = resolve)));

	const jobs = createZipJobs(host);
	jobs.start(request());
	await waitFor(() => host.download.mock.calls.length > 0);

	jobs.cancel();
	respond(42);
	await waitFor(() => host.release.mock.calls.length > 0);

	expect(host.cancelDownload.mock.calls).toEqual([[42]]);
	expect(revoke).toHaveBeenCalledTimes(1);
	expect(lastStatus()).toBe('idle');
});

it('reports when the zip download cannot start', async () => {
	host.download = mock(async () => {
		throw new Error('Download blocked');
	});

	createZipJobs(host).start(request());
	await waitFor(() => lastStatus() === 'failed');

	expect(published().at(-1)).toMatchObject({ status: 'failed', error: 'Download blocked' });
	expect(revoke).toHaveBeenCalledTimes(1);
	expect(host.release).toHaveBeenCalledTimes(1);
});

it('reports when none of the images can be fetched', async () => {
	const consoleError = spyOn(console, 'error').mockImplementation(() => {});
	globalThis.fetch = mock(async () => new Response('', { status: 404 })) as any;

	createZipJobs(host).start(request());
	await waitFor(() => lastStatus() === 'failed');
	consoleError.mockRestore();

	expect(published().at(-1)).toMatchObject({ error: 'Could not download any of the selected images.' });
});

it('refuses a second zip while one is being prepared', async () => {
	globalThis.fetch = mock(() => new Promise(() => {})) as any;

	const jobs = createZipJobs(host);
	jobs.start(request());

	expect(() => jobs.start(request())).toThrow('A .zip is already being prepared.');
	expect(jobs.getState().status).toBe('preparing');
});

it('reports whether it is idle, so the page is not closed under a new job', async () => {
	globalThis.fetch = mock(() => new Promise(() => {})) as any;
	const jobs = createZipJobs(host);
	expect(jobs.isIdle()).toBe(true);

	jobs.start(request());
	expect(jobs.isIdle()).toBe(false);
});
