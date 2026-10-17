// @ts-check
// Executed via `chrome.scripting.executeScript` in the page's own world - cannot have imports!
// A `blob:` URL only resolves in the page that created it, and only the page's own `fetch` can read it -
// a Firefox content script fetches as the extension.

/** @returns {Promise<string[]>} A `data:` URL for each blob URL, or the blob URL itself if it can't be read */
export function readBlobUrls(/** @type {string[]} */ urls) {
	return Promise.all(
		urls.map(async (url) => {
			try {
				const blob = await (await fetch(url)).blob();
				const bytes = new Uint8Array(await blob.arrayBuffer());
				let binary = '';
				// Chunked, because spreading a whole image into `fromCharCode` overflows the call stack
				for (let index = 0; index < bytes.length; index += 0x8000) {
					binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
				}
				return `data:${blob.type};base64,${btoa(binary)}`;
			} catch {
				return url;
			}
		})
	);
}
