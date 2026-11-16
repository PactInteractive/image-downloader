// @ts-check
// Firefox only, listed beside `serviceWorker.js` in the Firefox manifest: its
// background page can create blob URLs, so zip jobs run here directly.
import { createZipJobs, handleZipJobMessages } from './zipJobs.js';

const jobs = createZipJobs({
	async download(url, filename) {
		return chrome.downloads.download({ url, filename, conflictAction: 'uniquify' });
	},
	findDownload: async (downloadId) => (await chrome.downloads.search({ id: downloadId }))[0],
	cancelDownload: (downloadId) => chrome.downloads.cancel(downloadId),
	publish: (state) => chrome.runtime.sendMessage({ type: 'zipJobChanged', state }).catch(() => {}),
	closePage: () => {},
});

const handleMessage = handleZipJobMessages(jobs);
chrome.runtime.onMessage.addListener((message, sender, respond) => {
	// The service worker forwards `startZip` to the offscreen document in Chrome.
	if (message?.type === 'startZip') {
		handleMessage({ target: 'zipJobs', type: 'start', request: message.request }, sender, respond);
	} else {
		handleMessage(message, sender, respond);
	}
});
chrome.downloads.onChanged.addListener(jobs.downloadChanged);
