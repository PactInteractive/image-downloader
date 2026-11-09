// @ts-check
import { normalizeSlashes, removeSpecialCharacters } from '../utils.js';
import { folderName, hostname, newFileName } from './data.js';
import { buildZip, fetchImageFiles, imageOrigins, zipEntries } from './zip.js';

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

export const downloadImagesAsZip = async (/** @type {string[]} */ imagesToDownload) => {
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

	const { files, failed } = await fetchImageFiles(imagesToDownload);
	const blob = buildZip(zipEntries(files, { new_file_name: fileBaseName, count: imagesToDownload.length }));

	const baseName = removeSpecialCharacters(fileBaseName || fallbackName || 'images').replace(/\.zip$/i, '');
	const zipName = `${baseName || 'images'}.zip`;
	const filename = normalizeSlashes(folder ? `${folder}/${zipName}` : zipName);
	await downloadBlob(blob, filename);
	return failed;
};

/**
 * @param {Blob} blob
 * @param {string} filename
 */
async function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	let started = false;

	try {
		await new Promise((resolve, reject) => {
			chrome.downloads.download({ url, filename, conflictAction: 'uniquify' }, (downloadId) => {
				if (downloadId == null) {
					reject(new Error(chrome.runtime.lastError?.message || 'Could not start the .zip download.'));
				} else {
					resolve(null);
				}
			});
		});
		started = true;
	} finally {
		if (started) {
			setTimeout(() => URL.revokeObjectURL(url), 60_000);
		} else {
			URL.revokeObjectURL(url);
		}
	}
}

export const openImage = async (/** @type {string} */ url) => {
	// Browsers refuse to open `data:` URLs in a tab, but open a blob from the extension's own origin
	const tabUrl = url.startsWith('data:') ? URL.createObjectURL(await (await fetch(url)).blob()) : url;
	await chrome.tabs.create({ url: tabUrl, active: false });
};
