// @ts-check
import { options } from './data';

export const downloadImages = (/** @type {string[]} */ imagesToDownload) =>
	new Promise((resolve) => {
		chrome.runtime.sendMessage({ type: 'downloadImages', imagesToDownload, options: options.value }, resolve);
	});
