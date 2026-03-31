import { isTruthy, unique } from '../utils.js';

const extensionPriorities = ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'avif'];

export function deduplicateImages(urls, imagesCache) {
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

function getNormalizedBaseKey(url) {
	try {
		const parsed = new URL(url);
		const path = parsed.pathname;

		const basepath = path
			// Remove extension
			.split('.').slice(0, -1).join('.')
			// Remove common resolution suffixes: -300x200, _300w, -1x, etc.
			.replace(/[-_](?:\d{2,4}x\d{2,4}|\d{2,4}w|\d+x)$/i, '');

		// Whitelist params
		const params = new URLSearchParams();
		for (const [name, value] of parsed.searchParams) {
			if (['id', 'url', 'href'].includes(name)) {
				params.append(name, value);
			}
		}

		return `${parsed.origin}${basepath}?${params.toString()}`;
	} catch {
		return url;
	}
}

function pickBestImageUrl(urls, imagesCache) {
	const truthyUrls = urls.filter(isTruthy);
	if (truthyUrls.length === 0) return undefined;

	const uniqueUrls = unique(truthyUrls);

	const getResolution = (url) => {
		const img = imagesCache.querySelector(`img[src="${encodeURI(url)}"]`);
		return img ? { width: img.naturalWidth, height: img.naturalHeight } : { w: 0, height: 0 };
	};

	const bestResolutionUrls = uniqueUrls.slice(1).reduce(
		(bestUrls, currentUrl) => {
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
		[uniqueUrls[0]]
	);

	return bestResolutionUrls.reduce((bestUrl, currentUrl) => {
		const bestPriority = extensionPriorities.indexOf(getExtension(bestUrl));
		const currentPriority = extensionPriorities.indexOf(getExtension(currentUrl));

		return currentPriority < bestPriority ? currentUrl : bestUrl;
	}, bestResolutionUrls[0]);
}

function getExtension(url) {
	const pathname = url.split('?')[0].split('#')[0];
	const dotIndex = pathname.lastIndexOf('.');
	return dotIndex >= 0 ? pathname.substring(dotIndex + 1).toLowerCase() : '';
}
