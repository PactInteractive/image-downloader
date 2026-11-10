// @ts-check
import { normalizeSlashes } from '../utils.js';
import { folderName, hostname, newFileName } from './data.js';
import { buildZip, fetchImageFiles, imageOrigins, safeEntryName, zipEntries } from './zip.js';

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

export const downloadImagesAsZip = async (
	/** @type {string[]} */ imagesToDownload,
	/** @type {AbortSignal | undefined} */ signal = undefined,
	/** @type {() => void} */ onDownloadStarted = () => {}
) => {
	// The permission prompt and the fetches can take a while; use the settings visible when Download was clicked.
	const folder = folderName.value;
	const fileBaseName = newFileName.value;
	const fallbackName = hostname.value;

	const origins = imageOrigins(imagesToDownload);
	if (origins.length > 0 && chrome.permissions) {
		const granted = await chrome.permissions.request({ origins });
		if (!granted) {
			throw new Error('Allow access to the image hosts to download them as a .zip.');
		}
	}
	if (signal?.aborted) throw signal.reason;

	let { files, failed } = await fetchImageFiles(imagesToDownload, signal);
	if (signal?.aborted) throw signal.reason;

	const blob = buildZip(zipEntries(files, { new_file_name: fileBaseName, count: imagesToDownload.length }));
	// The zip holds its own copy; drop the per-image buffers before waiting for the download.
	files = [];
	if (signal?.aborted) throw signal.reason;

	const baseName = safeEntryName(fileBaseName || fallbackName || 'images').replace(/\.zip$/i, '');
	const zipName = `${baseName || 'images'}.zip`;
	const filename = normalizeSlashes(folder ? `${folder}/${zipName}` : zipName);
	await downloadBlob(blob, filename, signal, onDownloadStarted);
	return failed;
};

/**
 * @param {Blob} blob
 * @param {string} filename
 * @param {AbortSignal | undefined} signal
 * @param {() => void} onDownloadStarted
 */
async function downloadBlob(blob, filename, signal, onDownloadStarted) {
	if (signal?.aborted) throw signal.reason;

	const url = URL.createObjectURL(blob);
	let started = false;

	try {
		/** @type {number | undefined} */
		const downloadId = await new Promise((resolve, reject) => {
			chrome.runtime.sendMessage({ type: 'downloadZip', url, filename }, (response) => {
				if (chrome.runtime.lastError) {
					reject(new Error(chrome.runtime.lastError.message));
				} else if (response?.error) {
					reject(new Error(response.error));
				} else {
					resolve(response?.downloadId);
				}
			});
		});
		if (signal?.aborted) {
			if (downloadId != null) {
				try {
					// Wait for Chrome to stop reading before the finally block revokes the blob URL.
					await chrome.downloads.cancel(downloadId);
				} catch {
					// The download may already have finished.
				}
			}
			throw signal.reason;
		}
		started = true;
		onDownloadStarted();
		const interruption = await revokeWhenDownloadFinishes(url, downloadId);
		// The user knows when they cancel a download; other interruptions are failures.
		if (interruption && interruption !== 'USER_CANCELED') {
			throw new Error('The .zip download was interrupted.');
		}
	} finally {
		if (!started) URL.revokeObjectURL(url);
	}
}

/**
 * Keep the blob alive until Chrome has finished reading it, so the caller keeps
 * the extension open for the whole download.
 * @param {string} url
 * @param {number | undefined} downloadId
 * @returns {Promise<string | undefined>} interruption reason, or undefined when completed
 */
function revokeWhenDownloadFinishes(url, downloadId) {
	return new Promise((resolve) => {
		if (downloadId == null) {
			setTimeout(() => {
				URL.revokeObjectURL(url);
				resolve(undefined);
			}, 60_000);
			return;
		}

		let revoked = false;
		const revoke = (/** @type {string | undefined} */ reason) => {
			if (revoked) return;
			revoked = true;
			chrome.downloads.onChanged.removeListener(listener);
			URL.revokeObjectURL(url);
			resolve(reason);
		};
		const listener = (/** @type {chrome.downloads.DownloadDelta} */ delta) => {
			if (delta.id !== downloadId) return;
			if (delta.state?.current === 'complete') revoke(undefined);
			else if (delta.state?.current === 'interrupted') revoke(delta.error?.current ?? 'interrupted');
		};

		chrome.downloads.onChanged.addListener(listener);
		chrome.downloads.search?.({ id: downloadId }, ([download]) => {
			if (download?.state === 'complete') revoke(undefined);
			else if (download?.state === 'interrupted') revoke(download.error ?? 'interrupted');
		});
	});
}

export const openImage = async (/** @type {string} */ url) => {
	// Browsers refuse to open `data:` URLs in a tab, but open a blob from the extension's own origin
	const tabUrl = url.startsWith('data:') ? URL.createObjectURL(await (await fetch(url)).blob()) : url;
	await chrome.tabs.create({ url: tabUrl, active: false });
};
