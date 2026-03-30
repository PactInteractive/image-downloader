import { useCallback, useState } from '../html.js';

export function useImageStats() {
	const [data, setData] = useState({
		width: 0,
		height: 0,
		size: null,
		extension: '',
		status: 'idle',
	});

	const onLoad = useCallback((event) => {
		const img = event.currentTarget;
		const size = getImageResourceSize(img);
		setData({
			width: img.naturalWidth,
			height: img.naturalHeight,
			size,
			extension: getImageExtension(img.src),
			status: 'loaded',
		});
	}, []);

	const onError = useCallback(() => {
		setData({
			width: 0,
			height: 0,
			size: null,
			extension: '',
			status: 'error',
		});
	}, []);

	const resetStats = useCallback(() => {
		setData({
			width: 0,
			height: 0,
			size: null,
			extension: '',
			status: 'idle',
		});
	}, []);

	return {
		data,
		onLoad,
		onError,
		resetStats,
	};
}

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

	// Extract pathname to avoid matching hostname (e.g. .com)
	let pathname;
	try {
		pathname = new URL(url).pathname;
	} catch {
		pathname = url.split('?')[0].split('#')[0];
	}

	const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
	return match ? match[1].toLowerCase() : '';
}

function formatFileSize(bytes) {
	if (bytes === 0 || bytes == null || isNaN(bytes)) return '';

	const units = ['KB', 'MB', 'GB'];
	const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(1024)) - 1);
	const size = (bytes / Math.pow(1024, i + 1)).toFixed(1);
	return `${size}${units[i]}`;
}

function getImageResourceSize(img) {
	const url = img.src;
	if (!url) return null;

	const entries = performance.getEntriesByName(url);
	const entry = entries.find((e) => e.initiatorType === 'img');

	if (!entry) return null;

	const encodedSize = entry.encodedBodySize || entry.transferSize;
	const decodedSize = entry.decodedBodySize;

	if (!encodedSize && !decodedSize) return null;

	const fromCache = entry.transferSize === 0 || (entry.transferSize === undefined && encodedSize > 0);

	const bytes = encodedSize || decodedSize;

	return {
		bytes,
		formatted: formatFileSize(bytes),
		fromCache,
	};
}
