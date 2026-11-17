// @ts-check
import { Zip, ZipPassThrough } from 'fflate';

import { fileExtension, isTruthy, removeSpecialCharacters, unique } from '../utils.js';

/**
 * @typedef {{ url: string, mime: string, data: Uint8Array, index?: number }} ImageFile
 */

/**
 * Streams the entries into the Blob without first joining them into one buffer.
 * Yields every so often rather than per entry, because each `setTimeout` costs at least 4ms.
 * @param {{ name: string, data: Uint8Array }[]} files
 * @param {AbortSignal} [signal]
 * @returns {Promise<Blob>}
 */
export async function buildZip(files, signal) {
	/** @type {Uint8Array<ArrayBuffer>[]} */
	const chunks = [];
	/** @type {Error | null} */
	let zipError = null;
	const zip = new Zip((error, chunk) => {
		if (error) zipError = error;
		// fflate never allocates a `SharedArrayBuffer`.
		else chunks.push(/** @type {Uint8Array<ArrayBuffer>} */ (chunk));
	});

	let lastYield = -Infinity;
	for (const { name, data } of files) {
		if (performance.now() - lastYield > 50) {
			// Lets a cancel message arrive.
			await new Promise((resolve) => setTimeout(resolve, 0));
			lastYield = performance.now();
		}
		if (signal?.aborted) {
			zip.terminate();
			throw signal.reason;
		}
		const entry = new ZipPassThrough(name);
		zip.add(entry);
		entry.push(data, true);
		if (zipError) throw zipError;
	}
	zip.end();
	if (zipError) throw zipError;

	return new Blob(chunks, { type: 'application/zip' });
}

/**
 * Images are already compressed, so the zip stores them as-is and only pays for the container.
 * @param {string[]} urls
 * @param {AbortSignal} [signal]
 * @param {number} [concurrency]
 * @returns {Promise<{ files: ImageFile[], failed: string[] }>}
 */
export async function fetchImageFiles(urls, signal, concurrency = 4) {
	/** @type {(ImageFile | undefined)[]} */
	const files = new Array(urls.length);
	let nextIndex = 0;

	async function fetchNext() {
		while (nextIndex < urls.length && !signal?.aborted) {
			const index = nextIndex++;
			const url = urls[index];
			// Time out a host that doesn't answer, but not a large image that is still arriving.
			// A body that stalls after the headers waits for the user to cancel.
			const request = new AbortController();
			const timeout = AbortSignal.timeout(30_000);
			const abortOnTimeout = () => request.abort(timeout.reason);
			timeout.addEventListener('abort', abortOnTimeout);
			try {
				const requestSignal = signal ? AbortSignal.any([signal, request.signal]) : request.signal;
				const response = await fetch(url, { credentials: 'include', signal: requestSignal })
					.catch((error) => {
						// Chrome fails a cookie-carrying redirect to a host without access, even one that allows any origin.
						if (!(error instanceof TypeError) || requestSignal.aborted) throw error;
						return fetch(url, { credentials: 'omit', signal: requestSignal });
					})
					.finally(() => timeout.removeEventListener('abort', abortOnTimeout));
				if (!response.ok) {
					throw new Error(`Could not read ${url} (${response.status})`);
				}

				const mime = (response.headers.get('content-type') || '').split(';')[0].trim();
				if (isMarkupMime(mime)) {
					throw new Error(`Unexpected content type for ${url} (${mime})`);
				}
				files[index] = { url, mime, data: new Uint8Array(await response.arrayBuffer()), index };
			} catch (error) {
				if (signal?.aborted) throw signal.reason;
				// Match individual downloads: keep the images that load instead of failing the batch.
				console.error(`${url}:`, error);
			}
		}
	}

	await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, fetchNext));

	if (signal?.aborted) throw signal.reason;

	const loaded = files.filter(isTruthy);
	if (urls.length > 0 && loaded.length === 0) {
		throw new Error('Could not download any of the selected images.');
	}
	return { files: loaded, failed: urls.filter((_, index) => !files[index]) };
}

/**
 * Login and challenge pages sometimes answer with status 200. Reject only clearly non-image
 * markup, so images served with an unexpected MIME type still make it into the zip.
 * @param {string} mime
 */
function isMarkupMime(mime) {
	return /^(?:text\/html|text\/xml|application\/(?:json|xml|xhtml\+xml|problem\+json))$/i.test(mime);
}

/** @param {string} url */
export function imageLabel(url) {
	if (url.startsWith('data:')) return 'Embedded image';

	const filename = originalFilename(url);
	if (filename) return filename;

	try {
		return new URL(url).hostname || url;
	} catch {
		return url;
	}
}

/**
 * The zip itself goes into the configured subfolder, so its entries don't repeat that folder.
 * Names follow `buildFilename()` in `serviceWorker.js`.
 * @param {ImageFile[]} files
 * @param {{ new_file_name: string, count?: number }} options
 * @returns {{ name: string, data: Uint8Array }[]}
 */
export function zipEntries(files, options) {
	const usedNames = new Set();
	const count = options.count ?? files.length;

	return files.map((file, index) => {
		const name = uniqueName(entryName(file, file.index ?? index, count, options.new_file_name), usedNames);
		return { name, data: file.data };
	});
}

/** @param {string[]} urls */
export function imageOrigins(urls) {
	return unique(
		urls.flatMap((url) => {
			try {
				// Match patterns don't include ports; host access is granted per host.
				const { hostname, protocol } = new URL(url);
				if ((protocol !== 'http:' && protocol !== 'https:') || !isConcreteHostname(hostname)) return [];
				return [`${protocol}//${hostname}/*`];
			} catch {
				return [];
			}
		})
	);
}

/**
 * Page content supplies these URLs, and match patterns treat `*` as a wildcard, so
 * a host like `*` or `*.example.com` would grant far more access than the image needs.
 * Underscores and IPv6 hosts are left out too: one pattern a browser rejects fails the whole request.
 * @param {string} hostname
 */
function isConcreteHostname(hostname) {
	return hostname.split('.').every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
}

/**
 * @param {ImageFile} file
 * @param {number} index
 * @param {number} count
 * @param {string} newFileName
 */
function entryName(file, index, count, newFileName) {
	const original = originalFilename(file.url);
	const extension = fileExtension(original, file.mime);
	const suffix = extension ? `.${extension}` : '';

	// Chrome adds the type's extension to a downloaded file that lacks one.
	const originalHasExtension = original !== '' && fileExtension(original, undefined) !== '';
	const name = newFileName
		? `${newFileName}${`${index + 1}`.padStart(`${count}`.length, '0')}${suffix}`
		: originalHasExtension
			? original
			: `${original.replace(/[. ]+$/, '') || 'image'}${suffix}`;

	return safeEntryName(name);
}

/** @param {string} url */
function originalFilename(url) {
	if (url.startsWith('data:')) return '';

	try {
		return decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
	} catch {
		return '';
	}
}

/** @param {string} name */
export function safeEntryName(name) {
	const parts = name
		.split(/[\\/]+/)
		.map((part) =>
			removeSpecialCharacters(part)
				.replace(/[\u0000-\u001f\u007f-\u009f\u061c\u200b\u200e\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/g, '')
				.replace(/[. ]+$/g, '')
		)
		.filter(Boolean)
		.map((part) => (reservedWindowsName.test(part) ? `_${part}` : part));

	const entry = parts.join('/') || 'image';
	// JS unzippers such as fflate's `unzipSync` assign entries into a plain object; `__proto__` would change its prototype.
	return entry.toLowerCase() === '__proto__' ? `_${entry}` : entry;
}

// Windows refuses to extract files with these names, even with an extension.
// Spaces and dots before the extension don't hide the device name.
const reservedWindowsName = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:[ .]*\.|$)/i;

/**
 * @param {string} name
 * @param {Set<string>} usedNames
 */
function uniqueName(name, usedNames) {
	let candidate = name;
	let counter = 1;

	while (usedNames.has(candidate.toLowerCase())) {
		const slash = name.lastIndexOf('/');
		const dot = name.lastIndexOf('.');
		const suffix = ` (${counter++})`;
		candidate = dot > slash ? `${name.slice(0, dot)}${suffix}${name.slice(dot)}` : `${name}${suffix}`;
	}

	usedNames.add(candidate.toLowerCase());
	return candidate;
}
