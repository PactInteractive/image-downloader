// @ts-check
// Chrome only: runs zip jobs where they survive the popup closing. Offscreen
// documents can only use `chrome.runtime`, so `chrome.downloads` goes through
// the service worker.
import { createZipJobs, handleZipJobMessages } from '../background/zipJobs.js';
import { sendMessage } from '../utils.js';

const jobs = createZipJobs({
	download: async (url, filename) => (await sendMessage({ type: 'downloadZip', url, filename })).downloadId,
	findDownload: async (downloadId) => (await sendMessage({ type: 'findDownload', downloadId })).download,
	cancelDownload: (downloadId) => sendMessage({ type: 'cancelDownload', downloadId }),
	publish: (state) => sendMessage({ type: 'zipJobChanged', state }).catch(() => {}),
	closePage: () => sendMessage({ type: 'closeOffscreen' }).catch(() => {}),
});

chrome.runtime.onMessage.addListener(handleZipJobMessages(jobs));
