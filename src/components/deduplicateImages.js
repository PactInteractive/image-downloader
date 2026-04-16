// @ts-check
import { unique } from '../utils.js';

const priorities = ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'avif'];

export function deduplicateImages(/** @type {string[]} */ urls, /** @type {HTMLDivElement} */ imagesCache) {
	const groups = new Map();

	for (const url of urls) {
		const key = getNormalizedBaseKey(url);
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(url);
	}

	const result = [];
	for (const groupUrls of groups.values()) {
		const bestImageUrl = pickBestImageUrl(groupUrls, imagesCache);
		if (bestImageUrl) {
			result.push(bestImageUrl);
		}
	}
	return result;
}

/** @returns {string} */
function getNormalizedBaseKey(/** @type {string} */ url) {
	if (url.startsWith('data:')) return url;

	try {
		const parsed = new URL(url);

		const parts = parsed.pathname.split('.');
		const nameWithoutExtension =
			parts.length > 1 && priorities.includes(/** @type {string} */ (parts.at(-1)))
				? parts.slice(0, -1).join('.')
				: parsed.pathname;

		// Get base name without resolution suffix
		const basename = nameWithoutExtension.replace(/(?:[-_](?:\d{2,4}x\d{2,4}|\d{2,4}w)|@\d+x)$/i, '');

		// Extract identifier: look for hash-like pattern at end (e.g., 7qulxnmlw8sg1 from longer names)
		const identifierMatch = basename.match(/((?=.*\d)[a-zA-Z0-9]{6,})$/);
		let identifier = identifierMatch ? identifierMatch[1] : basename;

		// Extract special query params
		const urlParamKeys = ['url', 'domain'];
		for (const key of urlParamKeys) {
			const value = parsed.searchParams.get(key);
			if (value) {
				const decodedUrl = decodeURIComponent(value);

				if (decodedUrl.startsWith('http:') || decodedUrl.startsWith('https:')) {
					const ampIndex = decodedUrl.indexOf('&');
					return ampIndex !== -1
						? getNormalizedBaseKey(decodedUrl.slice(0, ampIndex) + '?' + decodedUrl.slice(ampIndex + 1))
						: getNormalizedBaseKey(decodedUrl);
				}

				if (decodedUrl.startsWith('/')) {
					const ampIndex = decodedUrl.indexOf('&');
					if (ampIndex !== -1) {
						return getNormalizedBaseKey(
							parsed.origin + decodedUrl.slice(0, ampIndex) + '?' + decodedUrl.slice(ampIndex + 1)
						);
					}
					return getNormalizedBaseKey(parsed.origin + decodedUrl);
				}

				// Attempt to add a protocol and parse the value
				try {
					return new URL(`https://${value}`).href;
				} catch (error) {
					// ignore
				}
			}
		}

		// Normalize subdomain: use hostname without subdomain for deduplication
		const hostnameParts = parsed.hostname.split('.');
		const domain = hostnameParts.length > 2 ? hostnameParts.slice(-2).join('.') : parsed.hostname;

		// Use filename for cross-subdomain matching, full path otherwise
		const normalizedPath = identifier || basename;

		return domain + normalizedPath;
	} catch {
		return url;
	}
}

function pickBestImageUrl(/** @type {string[]} */ urlStrings, /** @type {HTMLDivElement} */ imagesCache) {
	const uniqueUrlStrings = unique(urlStrings);

	const realUrls = /** @type {URL[]} */ ([]);
	for (const urlString of uniqueUrlStrings) {
		try {
			realUrls.push(new URL(urlString));
		} catch {
			// skip invalid URLs
		}
	}

	if (realUrls.length === 0) return undefined;

	const getResolution = (/** @type {URL} */ url) => {
		const img = /** @type {HTMLImageElement | null} */ (imagesCache.querySelector(`img[src="${url.href}"]`));
		return img ? { width: img.naturalWidth, height: img.naturalHeight } : { width: 0, height: 0 };
	};

	const bestResolutionUrls = realUrls.slice(1).reduce(
		(/** @type {URL[]} */ bestUrls, /** @type {URL} */ currentUrl) => {
			const bestResolution = getResolution(bestUrls[0]);
			const currentResolution = getResolution(currentUrl);

			if (currentResolution.width > bestResolution.width && currentResolution.height > bestResolution.height) {
				return [currentUrl];
			}

			if (currentResolution.width === bestResolution.width && currentResolution.height === bestResolution.height) {
				return [...bestUrls, currentUrl];
			}

			return bestUrls;
		},
		[realUrls[0]]
	);

	const bestResolutionUrl = bestResolutionUrls.reduce((/** @type {URL} */ bestUrl, /** @type {URL} */ currentUrl) => {
		const bestPriority = priorities.indexOf(getExtension(bestUrl));
		const currentPriority = priorities.indexOf(getExtension(currentUrl));

		if (currentPriority < 0) return bestUrl;
		if (bestPriority < 0) return currentUrl;
		return currentPriority < bestPriority ? currentUrl : bestUrl;
	}, bestResolutionUrls[0]);

	return bestResolutionUrl.href;
}

function getExtension(/** @type {URL} */ url) {
	return /** @type {string} */ (url.pathname.split('.').at(-1)).toLowerCase();
}
