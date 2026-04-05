// @ts-check
import { useSignal } from '../html.js';

/**
 * @typedef {Object} ImageSize
 * @property {number} bytes
 * @property {string} formatted
 * @property {boolean} fromCache
 */

/**
 * @typedef {Object} ImageStatsData
 * @property {number} width
 * @property {number} height
 * @property {ImageSize | null} size
 * @property {string} extension
 * @property {'idle' | 'loaded' | 'error'} status
 */

/**
 * @typedef {Object} ImageStats
 * @property {{ value: ImageStatsData }} data
 * @property {(event: Event) => void} onLoad
 * @property {() => void} onError
 * @property {() => void} reset
 */

/** @type {Map<string, ImageStatsData>} */
const cache = new Map();
const MAX_CACHE_SIZE = 500;

/** @returns {ImageStats} */
export function useImageStats(/** @type {string} */ imageUrl) {
	const cached = cache.get(imageUrl);

	/** @type {{ value: ImageStatsData }} */
	const data = useSignal(
		cached || {
			width: 0,
			height: 0,
			size: null,
			extension: '',
			status: 'idle',
		}
	);

	function onLoad(/** @type {Event} */ e) {
		const img = /** @type {HTMLImageElement} */ (e.currentTarget);
		const url = img.currentSrc || img.src;
		const size = getImageResourceSize(img);
		const urlExtension = getImageExtension(url);

		const loaded = {
			width: img.naturalWidth,
			height: img.naturalHeight,
			size,
			extension: urlExtension,
			status: /** @type {'loaded'} */ ('loaded'),
		};

		if (cache.size >= MAX_CACHE_SIZE) {
			const firstKey = cache.keys().next().value;
			if (firstKey !== undefined) cache.delete(firstKey);
		}
		cache.set(url, loaded);
		data.value = loaded;

		// Refine extension via fetch if URL parsing was inconclusive
		if (!urlExtension) {
			fetchImageExtension(url).then((extension) => {
				if (extension) {
					data.value = { ...data.value, extension };
					cache.set(url, data.value);
				}
			});
		}
	}

	function onError() {
		data.value = {
			width: 0,
			height: 0,
			size: null,
			extension: '',
			status: 'error',
		};
	}

	function reset() {
		cache.delete(imageUrl);
		data.value = {
			width: 0,
			height: 0,
			size: null,
			extension: '',
			status: 'idle',
		};
	}

	return {
		data,
		onLoad,
		onError,
		reset,
	};
}

/**
 * @param {string} url
 * @returns {string}
 */
export function getImageExtension(url) {
	if (!url) return '';

	// Handle data URIs: data:image/png;base64,... or data:image/svg+xml,...
	if (url.startsWith('data:image/')) {
		const match = url.match(/^data:image\/([a-zA-Z0-9+]+)[;,]/);
		if (!match) return '';
		const mimeType = match[1].toLowerCase();
		// Extract base type from compound types like 'svg+xml'
		return mimeType.split('+')[0];
	}

	// Blob URLs have no extension; MIME detection requires fetch
	if (url.startsWith('blob:')) return '';

	// Extract pathname to avoid matching hostname (e.g. .com)
	let pathname;
	try {
		pathname = new URL(url).pathname;
	} catch {
		pathname = url.split('?')[0].split('#')[0];
	}

	const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
	if (match) return match[1].toLowerCase();

	// Fallback: check query parameters for format indicators
	// (e.g., /cdn/image?format=jpg or /image?output=webp)
	const formatParams = ['format', 'type', 'output', 'ext', 'fmt'];
	try {
		const params = new URL(url).searchParams;
		for (const param of formatParams) {
			const value = params.get(param);
			if (value && /^[a-zA-Z0-9]{2,8}$/.test(value)) return value.toLowerCase();
		}
	} catch {
		// Not a parseable URL
	}

	return '';
}

/** @type {Record<string, string>} */
const mimeExtensions = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'image/avif': 'avif',
	'image/svg+xml': 'svg',
	'image/bmp': 'bmp',
	'image/tiff': 'tiff',
	'image/x-icon': 'ico',
	'image/vnd.microsoft.icon': 'ico',
};

/**
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function fetchImageExtension(url) {
	if (!url) return '';

	// Blob URLs: fetch the blob and read its type property
	if (url.startsWith('blob:')) {
		const response = await fetch(url);
		const blob = await response.blob();
		return mimeExtensions[blob.type] || blob.type.replace('image/', '') || '';
	}

	// Try HEAD request from browser cache
	try {
		const response = await fetch(url, {
			method: 'HEAD',
			cache: 'force-cache',
		});

		if (response.ok) {
			const contentType = response.headers.get('content-type');
			if (contentType) {
				const mime = contentType.split(';')[0].trim().toLowerCase();
				return mimeExtensions[mime] || (mime.startsWith('image/') ? mime.replace('image/', '') : '');
			}
		}
	} catch {
		// CORS blocked or network error
	}

	return '';
}

/**
 * @param {HTMLImageElement} img
 * @returns {ImageSize | null}
 */
export function getImageResourceSize(img) {
	const url = img.src;
	if (!url) return null;

	// Data URIs: decode base64 payload to estimate byte size
	if (url.startsWith('data:')) {
		const base64Index = url.indexOf('base64,');
		if (base64Index !== -1) {
			try {
				const base64 = url.slice(base64Index + 7);
				const bytes = atob(base64).length;
				return {
					bytes,
					formatted: formatFileSize(bytes),
					fromCache: false,
				};
			} catch {
				return null;
			}
		}
		// Non-base64 data URI (e.g. SVG encoded as text)
		const commaIndex = url.indexOf(',');
		if (commaIndex !== -1) {
			const bytes = decodeURIComponent(url.slice(commaIndex + 1)).length;
			return {
				bytes,
				formatted: formatFileSize(bytes),
				fromCache: false,
			};
		}
		return null;
	}

	const entries = performance.getEntriesByName(url);
	const entry = entries.find((entry) => /** @type {PerformanceResourceTiming} */ (entry).initiatorType === 'img');

	if (!entry) return null;

	const resourceEntry = /** @type {PerformanceResourceTiming} */ (entry);
	const encodedSize = resourceEntry.encodedBodySize || resourceEntry.transferSize;
	const decodedSize = resourceEntry.decodedBodySize;

	if (!encodedSize && !decodedSize) return null;

	const fromCache = resourceEntry.transferSize === 0 || (resourceEntry.transferSize === undefined && encodedSize > 0);

	const bytes = encodedSize || decodedSize;

	return {
		bytes,
		formatted: formatFileSize(bytes),
		fromCache,
	};
}

/**
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
	if (bytes === 0 || bytes == null || isNaN(bytes)) return '';

	const units = ['KB', 'MB', 'GB'];
	const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(1024)) - 1);
	const size = (bytes / Math.pow(1024, i + 1)).toFixed(1);
	return `${size.endsWith('.0') ? size.slice(0, -2) : size}${units[i]}`;
}
