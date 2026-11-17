// @ts-check
// Firefox only, listed beside `serviceWorker.js` in the Firefox manifest: its
// background page can create blob URLs, so zip jobs run here directly.
import { createZipJobs, handleZipJobMessages } from './zipJobs.js';

const jobs = createZipJobs({
	async download(url, filename) {
		try {
			return await chrome.downloads.download({ url, filename, conflictAction: 'uniquify' });
		} catch (error) {
			// Firefox rejects when the user closes the Save As dialog; Chrome reports it as USER_CANCELED.
			if (error instanceof Error && error.message === 'Download canceled by the user') return undefined;
			throw error;
		}
	},
	findDownload: async (downloadId) => (await chrome.downloads.search({ id: downloadId }))[0],
	cancelDownload: (downloadId) => chrome.downloads.cancel(downloadId),
	publish: (state) => chrome.runtime.sendMessage({ type: 'zipJobChanged', state }).catch(() => {}),
	closePage: () => {},
});

// Firefox suspends an idle background page after 30s, even mid-fetch, which loses the job and
// revokes the zip's blob; an extension API call resets that timer.
/** @type {ReturnType<typeof setInterval> | undefined} */
let keepAwakeTimer;
function keepAwakeWhileBusy() {
	keepAwakeTimer ??= setInterval(() => {
		if (jobs.isIdle()) {
			clearInterval(keepAwakeTimer);
			keepAwakeTimer = undefined;
		} else {
			chrome.runtime.getPlatformInfo();
		}
	}, 10_000);
}

const handleMessage = handleZipJobMessages(jobs);
chrome.runtime.onMessage.addListener((message, sender, respond) => {
	// The service worker forwards `startZip` to the offscreen document in Chrome.
	if (message?.type === 'startZip') {
		keepAwakeWhileBusy();
		handleMessage({ target: 'zipJobs', type: 'start', request: message.request }, sender, respond);
	} else {
		handleMessage(message, sender, respond);
	}
});
chrome.downloads.onChanged.addListener(jobs.downloadChanged);
