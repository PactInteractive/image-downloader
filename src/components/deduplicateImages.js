import { isTruthy, unique } from '../utils.js';

const priorities = ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'avif'];

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

		// Extract actual filename (last path segment) for cross-subdomain deduplication
		const filename = parsed.pathname.split('/').filter(isTruthy).at(-1) || '';
		const hasExtension = filename.includes('.');
		const parts = filename.split('.');
		const nameWithoutExtension =
			parts.length > 1 && priorities.includes(parts.at(-1)) ? parts.slice(0, -1).join('.') : filename;

		// Get base name without resolution suffix
		const basename = nameWithoutExtension.replace(/[-_](?:\d{2,4}x\d{2,4}|\d{2,4}w|\d+x)$/i, '');

		// Extract identifier: look for hash-like pattern at end (e.g., 7qulxnmlw8sg1 from longer names)
		const identifierMatch = nameWithoutExtension.match(/([a-zA-Z0-9]{6,})$/);
		let identifier = identifierMatch ? identifierMatch[1] : basename;

		// Extract `?url=`
		const urlParam = parsed.searchParams.get('url');
		if (urlParam) {
			const decodedUrl = decodeURIComponent(urlParam);

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

function pickBestImageUrl(urlStrings, imagesCache) {
	const uniqueUrlStrings = unique(urlStrings);

	const realUrls = uniqueUrlStrings
		.map((urlString) => {
			try {
				return new URL(urlString);
			} catch (error) {
				return false;
			}
		})
		.filter(isTruthy);

	if (realUrls.length === 0) return undefined;

	const getResolution = (url) => {
		const img = imagesCache.querySelector(`img[src="${url}"]`);
		return img ? { width: img.naturalWidth, height: img.naturalHeight } : { width: 0, height: 0 };
	};

	const bestResolutionUrls = realUrls.slice(1).reduce(
		(bestUrls, currentUrl) => {
			const bestResolution = getResolution(bestUrls[0].href);
			const currentResolution = getResolution(currentUrl.href);

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

	const bestResolutionUrl = bestResolutionUrls.reduce((bestUrl, currentUrl) => {
		const bestPriority = priorities.indexOf(getExtension(bestUrl));
		const currentPriority = priorities.indexOf(getExtension(currentUrl));

		if (currentPriority < 0) return bestUrl;
		if (bestPriority < 0) return currentUrl;
		return currentPriority < bestPriority ? currentUrl : bestUrl;
	}, bestResolutionUrls[0]);

	return bestResolutionUrl.href;
}

function getExtension(url) {
	return url.pathname.split('.').at(-1).toLowerCase();
}
