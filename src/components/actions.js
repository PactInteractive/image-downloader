// @ts-check
import { folderName, hostname, newFileName } from './data.js';
import { sendMessage } from '../utils.js';
import { imageOrigins } from './zip.js';

export const downloadImages = (/** @type {string[]} */ imagesToDownload) =>
	new Promise((resolve) => {
		chrome.runtime.sendMessage(
			{
				type: 'downloadImages',
				imagesToDownload,
				options: {
					folder_name: folderName.value,
					new_file_name: newFileName.value,
				},
			},
			resolve
		);
	});

/**
 * Asks for host access, then hands the zip to the background, which keeps going
 * after the panel closes. Resolves once the job is preparing.
 * @returns {Promise<import('../background/zipJobs.js').ZipJobState>}
 */
export const downloadImagesAsZip = async (
	/** @type {string[]} */ imagesToDownload,
	/** @type {AbortSignal | undefined} */ signal = undefined
) => {
	// The permission prompt can take a while; use the settings visible when Download was clicked.
	/** @type {import('../background/zipJobs.js').ZipRequest} */
	const request = {
		images: imagesToDownload,
		folder: folderName.value,
		fileBaseName: newFileName.value,
		fallbackName: hostname.value,
	};

	const origins = imageOrigins(imagesToDownload);
	if (origins.length > 0 && chrome.permissions) {
		const granted = await untilAborted(chrome.permissions.request({ origins }), signal);
		if (!granted) {
			throw new Error('Allow access to the image hosts to download them as a .zip.');
		}
	}
	if (signal?.aborted) throw signal.reason;

	const { state } = await sendMessage({ type: 'startZip', request });
	if (signal?.aborted) {
		await cancelZip();
		throw signal.reason;
	}
	return state;
};

export const cancelZip = () => sendMessage({ target: 'zipJobs', type: 'cancel' });

/** @returns {Promise<import('../background/zipJobs.js').ZipJobState | undefined>} undefined when no job has run */
export const getZipJob = () =>
	sendMessage({ target: 'zipJobs', type: 'getState' }).then(
		(response) => response.state,
		// Chrome has no offscreen document to answer until a job starts.
		() => undefined
	);

/**
 * The permission prompt can't be closed from code, so stop waiting for it instead.
 * @template T
 * @param {Promise<T>} promise
 * @param {AbortSignal | undefined} signal
 * @returns {Promise<T>}
 */
function untilAborted(promise, signal) {
	if (!signal) return promise;
	return new Promise((resolve, reject) => {
		const rejectWithReason = () => reject(signal.reason);
		if (signal.aborted) return rejectWithReason();
		signal.addEventListener('abort', rejectWithReason, { once: true });
		promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', rejectWithReason));
	});
}

export const openImage = async (/** @type {string} */ url) => {
	// Browsers refuse to open `data:` URLs in a tab, but open a blob from the extension's own origin
	const tabUrl = url.startsWith('data:') ? URL.createObjectURL(await (await fetch(url)).blob()) : url;
	await chrome.tabs.create({ url: tabUrl, active: false });
};
