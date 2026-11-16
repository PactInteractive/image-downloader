// @ts-check
import { buildZip, fetchImageFiles, safeEntryName, zipEntries } from '../components/zip.js';
import { normalizeSlashes } from '../utils.js';

/**
 * The settings visible when Download was clicked; the job can outlive the panel that started it.
 * @typedef {{ images: string[], folder: string, fileBaseName: string, fallbackName: string }} ZipRequest
 */

/**
 * @typedef {(
 *   | { status: 'idle' }
 *   | { status: 'preparing', images: string[] }
 *   | { status: 'started', images: string[], failed: string[] }
 *   | { status: 'failed', images: string[], error: string }
 * )} ZipJobStatus
 */

/**
 * `revision` orders states that reach a panel by different routes.
 * @typedef {ZipJobStatus & { revision: number }} ZipJobState
 */

/**
 * What the page running the jobs needs from the extension: the offscreen document
 * in Chrome reaches `chrome.downloads` through the service worker; Firefox's
 * background page calls it directly.
 * @typedef {{
 *   download: (url: string, filename: string) => Promise<number>,
 *   findDownload: (downloadId: number) => Promise<chrome.downloads.DownloadItem | undefined>,
 *   cancelDownload: (downloadId: number) => Promise<void>,
 *   publish: (state: ZipJobState) => void,
 *   release: () => void,
 * }} ZipJobHost
 */

/** @param {ZipJobHost} host */
export function createZipJobs(host) {
	/** @type {ZipJobState} */
	let state = { status: 'idle', revision: 0 };
	/** @type {AbortController | null} */
	let controller = null;
	/** The blob must stay alive until Chrome has finished reading it. */
	/** @type {Map<number, { url: string, images: string[], startedState: ZipJobState }>} */
	const downloads = new Map();

	function setState(/** @type {ZipJobStatus} */ next) {
		// Wall-clock based, so a state from a recreated document still sorts after older ones.
		state = { ...next, revision: Math.max(Date.now(), state.revision + 1) };
		host.publish(state);
		return state;
	}

	function isIdle() {
		return !controller && downloads.size === 0;
	}

	function releaseIfIdle() {
		if (isIdle()) host.release();
	}

	/** @param {ZipRequest} request */
	function start(request) {
		if (controller) throw new Error('A .zip is already being prepared.');

		const jobController = new AbortController();
		controller = jobController;
		const preparingState = setState({ status: 'preparing', images: request.images });
		run(request, jobController.signal).then(
			(started) => {
				if (controller === jobController) controller = null;
				if (started) {
					const startedState = setState({ status: 'started', images: request.images, failed: started.failed });
					trackDownload(started.downloadId, started.url, request.images, startedState);
				}
				releaseIfIdle();
			},
			(error) => {
				if (controller === jobController) {
					controller = null;
					setState({ status: 'failed', images: request.images, error: errorMessage(error) });
				}
				releaseIfIdle();
			}
		);
		return preparingState;
	}

	/**
	 * @param {ZipRequest} request
	 * @param {AbortSignal} signal
	 * @returns {Promise<{ downloadId: number, url: string, failed: string[] } | undefined>}
	 *   undefined when cancelled
	 */
	async function run(request, signal) {
		let { files, failed } = await fetchImageFiles(request.images, signal);
		const blob = await buildZip(
			zipEntries(files, { new_file_name: request.fileBaseName, count: request.images.length }),
			signal
		);
		// The zip holds its own copy; drop the per-image buffers before waiting for the download.
		files = [];

		const baseName = safeEntryName(request.fileBaseName || request.fallbackName || 'images').replace(/\.zip$/i, '');
		const zipName = `${baseName || 'images'}.zip`;
		const filename = normalizeSlashes(request.folder ? `${request.folder}/${zipName}` : zipName);

		const url = URL.createObjectURL(blob);
		let downloadId;
		try {
			downloadId = await host.download(url, filename);
		} catch (error) {
			URL.revokeObjectURL(url);
			throw error;
		}
		if (signal.aborted) {
			try {
				// Wait for Chrome to stop reading before revoking the blob URL.
				await host.cancelDownload(downloadId);
			} catch {
				// The download may already have finished.
			}
			URL.revokeObjectURL(url);
			return undefined;
		}
		return { downloadId, url, failed };
	}

	/**
	 * @param {number} downloadId
	 * @param {string} url
	 * @param {string[]} images
	 * @param {ZipJobState} startedState
	 */
	function trackDownload(downloadId, url, images, startedState) {
		downloads.set(downloadId, { url, images, startedState });
		// The download may have finished before it was tracked.
		host.findDownload(downloadId).then(
			(download) => download && downloadChanged(deltaFromItem(download)),
			() => {}
		);
	}

	/** @param {chrome.downloads.DownloadDelta} delta */
	function downloadChanged(delta) {
		const download = downloads.get(delta.id);
		const finishedState = delta.state?.current;
		if (!download || (finishedState !== 'complete' && finishedState !== 'interrupted')) return;

		downloads.delete(delta.id);
		URL.revokeObjectURL(download.url);
		const reason = delta.error?.current ?? 'interrupted';
		// The user knows when they cancel a download; other interruptions are failures.
		if (finishedState === 'interrupted' && reason !== 'USER_CANCELED' && state === download.startedState) {
			setState({ status: 'failed', images: download.images, error: 'The .zip download was interrupted.' });
		}
		releaseIfIdle();
	}

	function cancel() {
		if (!controller) return state;
		controller.abort(new DOMException('The .zip was cancelled.', 'AbortError'));
		controller = null;
		return setState({ status: 'idle' });
	}

	return { start, cancel, downloadChanged, isIdle, getState: () => state };
}

/** @typedef {ReturnType<typeof createZipJobs>} ZipJobs */

/**
 * Handles messages addressed to `target: 'zipJobs'`, from the panels or the service worker.
 * @param {ZipJobs} jobs
 */
export function handleZipJobMessages(jobs) {
	return (
		/** @type {any} */ message,
		/** @type {chrome.runtime.MessageSender} */ _sender,
		/** @type {(response?: any) => void} */ respond
	) => {
		if (message?.target !== 'zipJobs') return;

		try {
			if (message.type === 'start') respond({ state: jobs.start(message.request) });
			else if (message.type === 'cancel') respond({ state: jobs.cancel() });
			else if (message.type === 'getState') respond({ state: jobs.getState() });
			else if (message.type === 'isIdle') respond({ idle: jobs.isIdle() });
			else if (message.type === 'downloadChanged') respond(jobs.downloadChanged(message.delta));
		} catch (error) {
			respond({ error: errorMessage(error) });
		}
	};
}

/** @param {chrome.downloads.DownloadItem} download */
function deltaFromItem(download) {
	return /** @type {chrome.downloads.DownloadDelta} */ ({
		id: download.id,
		state: { current: download.state },
		error: download.error ? { current: download.error } : undefined,
	});
}

/** @param {unknown} error */
function errorMessage(error) {
	return error instanceof Error ? error.message : `${error}`;
}
