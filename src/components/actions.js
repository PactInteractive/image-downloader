export const downloadImages = (imagesToDownload, options) =>
	new Promise((resolve) => {
		chrome.runtime.sendMessage({ type: 'downloadImages', imagesToDownload, options }, resolve);
	});
