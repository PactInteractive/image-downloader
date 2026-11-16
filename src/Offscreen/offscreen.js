// @ts-check
// Chrome only: runs zip jobs where they survive the popup closing. Offscreen
// documents can only use `chrome.runtime`, so `chrome.downloads` goes through
// the service worker.
import { createZipJobs, handleZipJobMessages } from '../background/zipJobs.js';

const jobs = createZipJobs({
	async download(url, filename) {
		const response = await sendMessage({ type: 'downloadZip', url, filename });
		if (response?.error) throw new Error(response.error);
		return response.downloadId;
	},
	findDownload: (downloadId) => sendMessage({ type: 'findDownload', downloadId }),
	cancelDownload: (downloadId) => sendMessage({ type: 'cancelDownload', downloadId }),
	publish: (state) => sendMessage({ type: 'zipJobChanged', state }).catch(() => {}),
	release: () => sendMessage({ type: 'closeOffscreen' }).catch(() => {}),
});

chrome.runtime.onMessage.addListener(handleZipJobMessages(jobs));

/** @param {any} message */
function sendMessage(message) {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage(message, (response) => {
			if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
			else resolve(response);
		});
	});
}
