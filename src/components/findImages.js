// @ts-check
// Executed via `chrome.scripting.executeScript` - cannot have imports!

export async function findImages(
	/** @type {{ waitForIdleDOM?: number | false; document?: Document; window?: Window; }} */ {
		waitForIdleDOM,
		...rest
	} = {}
) {
	const context = {
		document: rest.document || document,
		window: /** @type {Window & typeof globalThis} */ (rest.window || window),
	};

	// Clean up any previously created observer and timeout from prior executions
	context.window.__observer?.disconnect();
	clearTimeout(context.window.__idleDomTimer);

	// Wait until the page is fully loaded
	if (context.document.readyState !== 'complete') {
		await new Promise((/** @type {(...args: any[]) => void} */ resolve) => {
			context.window.addEventListener('load', resolve, { once: true });
			// Fallback in case 'load' already fired or for SPAs
			if (context.document.readyState === 'complete') resolve();
		});
	}

	// Maybe wait until DOM is likely idle
	if (waitForIdleDOM !== false && waitForIdleDOM != null && waitForIdleDOM >= 0 && Number.isFinite(waitForIdleDOM)) {
		await new Promise((/** @type {(...args: any[]) => void} */ resolve) => {
			const observer = new context.window.MutationObserver(() => {
				resetTimer(waitForIdleDOM);
			});

			observer.observe(context.document.documentElement, {
				childList: true,
				subtree: true,
				attributes: false,
			});

			context.window.__observer = observer;
			resetTimer(waitForIdleDOM);

			function resetTimer(/** @type {number} */ waitForIdleDOM) {
				clearTimeout(context.window.__idleDomTimer);
				context.window.__idleDomTimer = setTimeout(() => {
					observer.disconnect();
					resolve();
				}, waitForIdleDOM);
			}
		});
	}

	// Source: https://support.google.com/webmasters/answer/2598805?hl=en
	const imageUrlRegex =
		/(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*\.(?:bmp|gif|ico|jfif|jpe?g|png|svg|tiff?|webp|avif))(?:\?([^#]*))?(?:#(.*))?/i;

	/** @returns {(Document | ShadowRoot)[]} */
	function getRoots(/** @type {Document} */ root) {
		/** @type {(Document | ShadowRoot)[]} */
		const roots = [root];

		/** @type {Document | ShadowRoot | undefined} */ let current;
		for (let index = 0; index < roots.length; index++) {
			const current = roots[index];
			// Find all potential shadow hosts in this root
			for (const element of current.querySelectorAll('*')) {
				if (element.shadowRoot) {
					roots.push(element.shadowRoot);
				}
			}
		}

		return roots;
	}

	/** @returns {string[]} */
	function extractImagesFromSelector(/** @type {(Document | ShadowRoot)[]} */ roots, /** @type {string} */ selector) {
		const images = /** @type {Set<string>} */ (new Set());

		for (const root of roots) {
			root.querySelectorAll(selector).forEach((element) => {
				const urls = extractImageUrlsFromElement(element);
				urls?.forEach((url) => {
					if (url) {
						images.add(relativeUrlToAbsolute(url));
					}
				});
			});
		}

		return [...images];
	}

	/** @returns {string[] | null | undefined} */
	function extractImageUrlsFromElement(/** @type {Element} */ element) {
		if (element.tagName.toLowerCase() === 'img') {
			const images = [];

			// Extract src
			const src = /** @type {HTMLImageElement}  */ (element).src;
			if (src) {
				const hashIndex = src.indexOf('#');
				images.push(hashIndex >= 0 ? src.slice(0, hashIndex) : src);
			}

			// Extract data-src for lazy loading
			const dataSrc = element.getAttribute?.('data-src');
			if (dataSrc) {
				const hashIndex = dataSrc.indexOf('#');
				images.push(hashIndex >= 0 ? dataSrc.slice(0, hashIndex) : dataSrc);
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
			const src = /** @type {string}  */ (element.getAttribute('xlink:href'));
			if (src) {
				const hashIndex = src.indexOf('#');
				return [hashIndex >= 0 ? src.slice(0, hashIndex) : src];
			}
			return null;
		}

		if (element.tagName.toLowerCase() === 'use') {
			// <use> elements in SVG reference external images via xlink:href
			const href = element.getAttribute?.('xlink:href');
			if (href) {
				const hashIndex = href.indexOf('#');
				return [hashIndex >= 0 ? href.slice(0, hashIndex) : href];
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
			const href = /** @type {HTMLAnchorElement} */ (element).href;
			if (isImageURLForLink(href)) {
				return [href];
			}
		}

		const backgroundImage = context.window.getComputedStyle(element).backgroundImage;
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

	function isImageURL(/** @type {string} */ url) {
		return url.indexOf('data:image') === 0 || imageUrlRegex.test(url);
	}

	function isImageURLForLink(/** @type {string} */ url) {
		try {
			const urlObj = new URL(url);
			const pathname = urlObj.pathname;
			return imageUrlRegex.test(pathname);
		} catch {
			return false;
		}
	}

	function extractSrcsetURLs(/** @type {string} */ srcset) {
		// Parse srcset format: "url1 1x, url2 2x, url3 100w"
		// Each candidate has a URL followed by an optional descriptor (width or pixel density)
		return srcset
			.split(',')
			.map((candidate) => {
				const url = candidate.trim().split(/\s+/)[0];
				const hashIndex = url.indexOf('#');
				return hashIndex >= 0 ? url.slice(0, hashIndex) : url;
			})
			.filter((url) => url.length > 0);
	}

	function isValidBackgroundImageURL(/** @type {string} */ url) {
		// Accept any URL that looks like it could be a background image
		// (has a protocol or is protocol-relative or is a blob URL)
		return /^https?:\/\//.test(url) || /^\/\//.test(url) || /^blob:/.test(url);
	}

	function extractURLsFromStyle(/** @type {string} */ style) {
		// Extract all URLs from CSS functions like url() - handles multiple values
		const urls = [];
		const urlRegex = /url\(["']?([^"')]+)["']?\)/g;
		let match;
		while ((match = urlRegex.exec(style)) !== null) {
			urls.push(match[1]);
		}
		return urls;
	}

	function relativeUrlToAbsolute(/** @type {string} */ url) {
		// Only convert root-relative URLs (single /), not protocol-relative URLs (//)
		return url.indexOf('/') === 0 && url.indexOf('//') !== 0 ? `${context.window.location.origin}${url}` : url;
	}

	const roots = getRoots(context.document);
	return {
		allImages: extractImagesFromSelector(roots, 'img, image, source, use, a, [class], [style]'),
		linkedImages: extractImagesFromSelector(roots, 'a'), // Do not merge into `allImages` - we want to preserve the order of images from the DOM
		origin: context.window.location.origin,
	};
}
