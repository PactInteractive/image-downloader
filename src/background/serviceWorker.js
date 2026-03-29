// @ts-check
// Handle updates
chrome.runtime.onInstalled.addListener(async (details) => {
	if (details.reason === 'install') {
		// Open the Options page after install
		chrome.tabs.create({ url: 'src/Options/index.html' });
	}

	// Set initial popup state based on open_mode
	await updateActionPopup();
});

// Handle storage changes to update popup state
chrome.storage.onChanged.addListener(async (changes, areaName) => {
	if (areaName === 'local' && changes.open_mode) {
		await updateActionPopup();
	}
});

// Initialize popup state on service worker startup
updateActionPopup();

async function updateActionPopup() {
	const { open_mode = 'sidebar' } = await chrome.storage.local.get('open_mode');
	if (open_mode === 'sidebar') {
		// Clear popup so onClicked listener fires
		await chrome.action.setPopup({ popup: '' });
	} else {
		// Set popup so it opens naturally
		await chrome.action.setPopup({ popup: 'src/Popup/index.html' });
	}
}

// Handle icon click - open sidebar (only fires when popup is cleared)
chrome.action.onClicked.addListener(async (tab) => {
	await chrome.sidePanel.open({ windowId: tab.windowId });
});

// Download images
/** @typedef {{
 *   imagesToDownload: string[],
 *   options: any,
 *   indices: Map<number, number> // downloadId → original index
 * }} Task */

/** @type {Map<number, Task>} */
const tasksByDownloadId = new Map();

chrome.runtime.onMessage.addListener(startDownload);
chrome.downloads.onDeterminingFilename.addListener(suggestNewFilename);
chrome.downloads.onChanged.addListener(cleanupCompletedDownloadTasks);

// NOTE: Don't directly use an `async` function as a listener for `onMessage`:
// https://stackoverflow.com/a/56483156
// https://developer.chrome.com/docs/extensions/reference/runtime/#event-onMessage
function startDownload(
	/** @type {any} */ message,
	/** @type {chrome.runtime.MessageSender} */ sender,
	/** @type {(response?: any) => void} */ resolve
) {
	if (!(message && message.type === 'downloadImages')) return;

	downloadImages({
		imagesToDownload: message.imagesToDownload,
		options: message.options,
		indices: new Map(),
	}).then(resolve);

	return true; // Keeps the message channel open until `resolve` is called
}

async function downloadImages(/** @type {Task} */ task) {
	const promises = task.imagesToDownload.map((image, index) => {
		return new Promise((/** @type {(response?: any) => void} */ resolve) => {
			chrome.downloads.download({ url: image }, (downloadId) => {
				if (downloadId != null) {
					task.indices.set(downloadId, index);
					tasksByDownloadId.set(downloadId, task);
				} else {
					if (chrome.runtime.lastError) {
						console.error(`${image}:`, chrome.runtime.lastError.message);
					}
				}
				resolve();
			});
		});
	});

	await Promise.allSettled(promises);
}

// https://developer.chrome.com/docs/extensions/reference/downloads/#event-onDeterminingFilename
/** @type {Parameters<chrome.downloads.DownloadDeterminingFilenameEvent['addListener']>[0]} */
function suggestNewFilename(item, suggest) {
	const task = tasksByDownloadId.get(item.id);
	if (!task) {
		suggest();
		return;
	}

	const index = task.indices.get(item.id);
	if (index === undefined) {
		suggest();
		tasksByDownloadId.delete(item.id);
		return;
	}

	let newFilename = '';
	if (task.options.folder_name) {
		newFilename += `${task.options.folder_name}/`;
	}

	if (task.options.new_file_name) {
		const regex = /(?:\.([^.]+))?$/;
		const extension = regex.exec(item.filename)?.[1] || item.mime?.split('/')?.[1]?.replace('jpeg', 'jpg');

		const numberOfDigits = task.imagesToDownload.length.toString().length;
		const formattedImageNumber = `${index + 1}`.padStart(numberOfDigits, '0');

		newFilename += `${task.options.new_file_name}${formattedImageNumber}${extension ? `.${extension}` : ''}`;
	} else {
		newFilename += item.filename;
	}

	suggest({
		filename: normalizeSlashes(newFilename),
		conflictAction: 'uniquify',
	});

	task.indices.delete(item.id);
	tasksByDownloadId.delete(item.id);
}

function cleanupCompletedDownloadTasks(/** @type {chrome.downloads.DownloadDelta} */ delta) {
	if (delta.state?.current === 'complete' || delta.state?.current === 'interrupted') {
		tasksByDownloadId.delete(delta.id);
	}
}

function normalizeSlashes(/** @type {string} */ filename) {
	return filename.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
}
