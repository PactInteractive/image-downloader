export async function findImages({ waitForIdleDOM }) {
	// Wait until the page is fully loaded
	if (document.readyState !== 'complete') {
		await new Promise((resolve) => {
			window.addEventListener('load', resolve, { once: true });
			// Fallback in case 'load' already fired or for SPAs
			if (document.readyState === 'complete') resolve();
		});
	}

	if (waitForIdleDOM) {
		await new Promise((resolve) => {
			let debounceTimer;

			const observer = new MutationObserver(() => {
				// Something changed → reset the debounce timer
				clearTimeout(debounceTimer);
				debounceTimer = setTimeout(() => {
					observer.disconnect();
					resolve();
				}, waitForIdleDOM);
			});

			// Observe the whole document
			observer.observe(document.documentElement, {
				childList: true,
				subtree: true,
				attributes: false, // set true if you care about src changes etc.
			});

			// Initial timer in case the page is already quiet
			debounceTimer = setTimeout(() => {
				observer.disconnect();
				resolve();
			}, waitForIdleDOM);
		});
	}

	// Source: https://support.google.com/webmasters/answer/2598805?hl=en
	const imageUrlRegex =
		/(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*\.(?:bmp|gif|ico|jfif|jpe?g|png|svg|tiff?|webp|avif))(?:\?([^#]*))?(?:#(.*))?/i;

	/** @returns {string[]} */
	function extractImagesFromSelector(selector) {
		return unique(
			toArray(document.querySelectorAll(selector))
				.flatMap(extractImageFromElement)
				.filter(isTruthy)
				.map(relativeUrlToAbsolute)
		);
	}

	function extractImageFromElement(element) {
		if (element.tagName.toLowerCase() === 'img') {
			const images = [];

			// Extract src
			const src = element.src;
			if (src) {
				const hashIndex = src.indexOf('#');
				images.push(hashIndex >= 0 ? src.substr(0, hashIndex) : src);
			}

			// Extract data-src for lazy loading
			const dataSrc = element.getAttribute?.('data-src');
			if (dataSrc) {
				const hashIndex = dataSrc.indexOf('#');
				images.push(hashIndex >= 0 ? dataSrc.substr(0, hashIndex) : dataSrc);
			}

			// Extract srcset URLs
			const srcset = element.getAttribute?.('srcset');
			if (srcset) {
				const srcsetUrls = extractSrcsetURLs(srcset);
				images.push(...srcsetUrls);
			}

			// Extract data-srcset URLs for lazy loading
			const dataSrcset = element.getAttribute?.('data-srcset');
			if (dataSrcset) {
				const dataSrcsetUrls = extractSrcsetURLs(dataSrcset);
				images.push(...dataSrcsetUrls);
			}

			return images.length > 0 ? images : null;
		}

		if (element.tagName.toLowerCase() === 'image') {
			const src = element.getAttribute('xlink:href');
			const hashIndex = src.indexOf('#');
			return hashIndex >= 0 ? src.substr(0, hashIndex) : src;
		}

		if (element.tagName.toLowerCase() === 'use') {
			// <use> elements in SVG reference external images via xlink:href
			const href = element.getAttribute?.('xlink:href');
			if (href) {
				const hashIndex = href.indexOf('#');
				return hashIndex >= 0 ? href.substr(0, hashIndex) : href;
			}
			return null;
		}

		if (element.tagName.toLowerCase() === 'source') {
			// <source> elements in <picture> use srcset for responsive images
			const srcset = element.getAttribute?.('srcset');
			if (srcset) {
				return extractSrcsetURLs(srcset);
			}
			return null;
		}

		if (element.tagName.toLowerCase() === 'a') {
			const href = element.href;
			if (isImageURL(href)) {
				return href;
			}
		}

		const backgroundImage = window.getComputedStyle(element).backgroundImage;
		if (backgroundImage) {
			const parsedURLs = extractURLsFromStyle(backgroundImage);
			// For background images, accept any valid URL (not just ones with image extensions)
			// since the browser will load whatever image is specified
			const validURLs = parsedURLs.filter((url) => isImageURL(url) || isValidBackgroundImageURL(url));
			if (validURLs.length > 0) {
				return validURLs;
			}
		}
	}

	function isImageURL(url) {
		return url.indexOf('data:image') === 0 || imageUrlRegex.test(url);
	}

	function extractSrcsetURLs(srcset) {
		// Parse srcset format: "url1 1x, url2 2x, url3 100w"
		// Each candidate has a URL followed by an optional descriptor (width or pixel density)
		return srcset
			.split(',')
			.map((candidate) => {
				const url = candidate.trim().split(/\s+/)[0];
				const hashIndex = url.indexOf('#');
				return hashIndex >= 0 ? url.substr(0, hashIndex) : url;
			})
			.filter((url) => url.length > 0);
	}

	function isValidBackgroundImageURL(url) {
		// Accept any URL that looks like it could be a background image
		// (has a protocol or is protocol-relative or is a blob URL)
		return /^https?:\/\//.test(url) || /^\/\//.test(url) || /^blob:/.test(url);
	}

	function extractURLsFromStyle(style) {
		// Extract all URLs from CSS functions like url() - handles multiple values
		const urls = [];
		const urlRegex = /url\(["']?([^"')]+)["']?\)/g;
		let match;
		while ((match = urlRegex.exec(style)) !== null) {
			urls.push(match[1]);
		}
		return urls;
	}

	function relativeUrlToAbsolute(url) {
		// Only convert root-relative URLs (single /), not protocol-relative URLs (//)
		return url.indexOf('/') === 0 && url.indexOf('//') !== 0 ? `${window.location.origin}${url}` : url;
	}

	function unique(values) {
		return toArray(new Set(values));
	}

	function toArray(values) {
		return [...values];
	}

	function isTruthy(value) {
		return !!value;
	}

	return {
		allImages: extractImagesFromSelector('img, image, source, use, a, [class], [style]'),
		linkedImages: extractImagesFromSelector('a'),
		origin: window.location.origin,
	};
}

const extensionPreference = { jpg: 1, jpeg: 1, png: 2, webp: 3, avif: 4, gif: 5, svg: 6, bmp: 7, ico: 8 };

export function deduplicateImages(urls, imagesCache) {
	const groups = new Map();

	for (const url of urls) {
		const key = getNormalizedBaseKey(url);
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(url);
	}

	const result = [];
	for (const groupUrls of groups.values()) {
		result.push(pickBestImage(groupUrls, imagesCache));
	}
	return result;
}

function getNormalizedBaseKey(url) {
	try {
		const parsed = new URL(url);
		const path = parsed.pathname;
		const lastSlash = path.lastIndexOf('/');
		const filename = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;

		const dotIndex = filename.lastIndexOf('.');
		const baseName = dotIndex >= 0 ? filename.substring(0, dotIndex) : filename;
		const ext = dotIndex >= 0 ? filename.substring(dotIndex).toLowerCase() : '';

		// Strip resolution indicators: -300x200, _300w, -1x, etc.
		const stripped = baseName.replace(/[-_](?:\d{2,4}x\d{2,4}|\d{2,4}w|\d+x)$/i, '');

		return parsed.origin + path.substring(0, lastSlash + 1) + stripped + ext;
	} catch {
		return url;
	}
}

function pickBestImage(urls, imagesCache) {
	return urls.reduce((best, url) => {
		if (best === url) return best;

		const bestExt = getExtension(best);
		const urlExt = getExtension(url);
		const bestPref = extensionPreference[bestExt] ?? 99;
		const urlPref = extensionPreference[urlExt] ?? 99;

		// Prefer by extension
		if (urlPref < bestPref) return url;
		if (urlPref > bestPref) return best;

		// Same extension - prefer higher resolution
		const bestImg = imagesCache.querySelector(`img[src="${encodeURI(best)}"]`);
		const urlImg = imagesCache.querySelector(`img[src="${encodeURI(url)}"]`);
		const bestPixels = bestImg ? bestImg.naturalWidth * bestImg.naturalHeight : 0;
		const urlPixels = urlImg ? urlImg.naturalWidth * urlImg.naturalHeight : 0;

		return urlPixels > bestPixels ? url : best;
	}, urls[0]);
}

function getExtension(url) {
	const pathname = url.split('?')[0].split('#')[0];
	const dotIndex = pathname.lastIndexOf('.');
	return dotIndex >= 0 ? pathname.substring(dotIndex + 1).toLowerCase() : '';
}
