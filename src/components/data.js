// @ts-check
import { computed, effect, signal } from '../html.js';
import { unique } from '../utils.js';
import { deduplicateImages } from './deduplicateImages.js';
import { findImages } from './findImages.js';

/** @type {import('../html.js').Signal<string[]>} */
export const allImages = signal([]);

/** @type {import('../html.js').Signal<string[]>} */
export const linkedImages = signal([]);

/** @type {import('../html.js').Signal<HTMLDivElement | null>} */
export const imagesCache = signal(null); // Not displayed; only used for filtering by natural width / height

/** @type {import('../html.js').Signal<string[]>} */
export const loadedImages = signal([]);

/** @type {import('../html.js').Signal<string[]>} */
export const erroredImages = signal([]);

export const matchingImages = computed(() => {
	if (!options.value) return [];

	let filtered = options.value.only_images_from_links ? linkedImages.value : allImages.value;

	let filterValue = options.value.filter_url;
	if (filterValue) {
		switch (options.value.filter_url_mode) {
			case 'normal':
				const terms = filterValue.split(/\s+/);
				filtered = filtered.filter((url) => {
					for (let index = 0; index < terms.length; index++) {
						let term = terms[index];
						if (term.length !== 0) {
							const expected = term[0] !== '-';
							if (!expected) {
								term = term.substr(1);
								if (term.length === 0) {
									continue;
								}
							}
							const found = url.indexOf(term) !== -1;
							if (found !== expected) {
								return false;
							}
						}
					}
					return true;
				});
				break;
			case 'wildcard':
				filterValue = filterValue.replace(/([.^$[\]\\(){}|-])/g, '\\$1').replace(/([?*+])/, '.$1');
			/* fall through */
			case 'regex':
				filtered = filtered.filter((url) => {
					try {
						return url.match(filterValue);
					} catch (error) {
						return false;
					}
				});
				break;
		}
	}

	filtered = filtered.filter((url) => {
		if (!(options.value && imagesCache.value)) return false;

		/** @type {HTMLImageElement | null} */ const image = imagesCache.value.querySelector(
			`img[src="${encodeURI(url)}"]`
		);

		return (
			image &&
			(!options.value.filter_min_width_enabled || options.value.filter_min_width <= image.naturalWidth) &&
			(!options.value.filter_max_width_enabled || image.naturalWidth <= options.value.filter_max_width) &&
			(!options.value.filter_min_height_enabled || options.value.filter_min_height <= image.naturalHeight) &&
			(!options.value.filter_max_height_enabled || image.naturalHeight <= options.value.filter_max_height) &&
			!erroredImages.value.includes(url)
		);
	});

	if (options.value.only_unique_images && imagesCache.value) {
		filtered = deduplicateImages(filtered, imagesCache.value);
	}

	return filtered;
});

export const filteredOutImages = computed(() =>
	allImages.value.filter((url) => !matchingImages.value.includes(url) && !erroredImages.value.includes(url))
);

/** @type {import('../html.js').Signal<string[]>} */
export const selectedImages = signal([]);

export const tab = signal('matching');

export const displayedImages = computed(() => {
	return (
		{
			matching: matchingImages.value,
			filtered_out: filteredOutImages.value,
			errors: erroredImages.value,
		}[tab.value] ?? []
	);
});

export const defaults = {
	// UI
	open_mode: 'sidebar',
	// Filters
	folder_name: '',
	new_file_name: '',
	filter_url: '',
	filter_url_mode: 'normal',
	// Advanced filters
	show_advanced_filters: true,
	filter_min_width: 0,
	filter_min_width_default: 0,
	filter_min_width_enabled: false,
	filter_max_width: 3000,
	filter_max_width_default: 3000,
	filter_max_width_enabled: false,
	filter_min_height: 0,
	filter_min_height_default: 0,
	filter_min_height_enabled: false,
	filter_max_height: 3000,
	filter_max_height_default: 3000,
	filter_max_height_enabled: false,
	only_unique_images: true,
	only_images_from_links: false,
	// Download
	show_download_confirmation: true,
	// Images
	selected_images: /** @type {string[]} */ ([]),
	columns: 2,
};

/** @typedef {typeof defaults} Options */

/** @type {import('../html.js').Signal<Options | null>} */
export const options = signal(null);

/** @template {keyof Options} K */
export function updateOption(/** @type {K} */ key, /** @type {Options[K]} */ value) {
	if (!options.value) return;

	options.value = { ...options.value, [key]: value };
}

export function updateOptions(/** @type {Partial<Options>} */ newOptions) {
	if (!options.value) return;

	options.value = { ...options.value, ...newOptions };
}

// Store options
effect(() => {
	if (options.value) {
		chrome.storage.local.set(options.value);
	}
});

export async function initialize() {
	await migrateFromLocalStorage();
	const stored = await chrome.storage.local.get(null);
	/** @type {Partial<Options>} */
	const filtered = {};
	for (const key of Object.keys(stored)) {
		if (key in defaults) filtered[/** @type {keyof Options} */ (key)] = stored[key];
	}
	options.value = { ...defaults, ...filtered };
}

async function migrateFromLocalStorage() {
	if (localStorage.length === 0) return;

	const existing = await chrome.storage.local.get(null);

	/** @type {Record<string, unknown>} */
	const toMigrate = {};
	for (let index = localStorage.length - 1; index >= 0; index--) {
		const key = localStorage.key(index);
		if (key && key in defaults && !(key in existing)) {
			toMigrate[key] = parseLocalStorageValue(localStorage.getItem(key), defaults[/** @type {keyof Options} */ (key)]);
		}
	}

	if (Object.keys(toMigrate).length > 0) {
		await chrome.storage.local.set(toMigrate);
	}

	localStorage.clear();
}

/** @returns {Options[keyof Options]} */
function parseLocalStorageValue(
	/** @type {string | null} */ value,
	/** @type {Options[keyof Options]} */ defaultValue
) {
	if (value == null) return defaultValue;

	switch (typeof defaultValue) {
		case 'number': {
			const number = parseFloat(value);
			return isNaN(number) ? defaultValue : number;
		}
		case 'boolean':
			return value === 'true';
		case 'object':
			try {
				return JSON.parse(value);
			} catch {
				return defaultValue;
			}
		default:
			return value;
	}
}

export const hostname = signal('');
export const limitedAccessHostnames = /\.google\.com/;

export const scriptError = signal('');

export function loadImagesFromActiveTab(/** @type {{ waitForIdleDOM: number | false }} */ { waitForIdleDOM }) {
	chrome.windows.getCurrent((currentWindow) => {
		chrome.tabs.query({ active: true, windowId: currentWindow.id }, (activeTabs) => {
			if (activeTabs.length === 0) return;

			const activeTab = activeTabs[0];
			if (activeTab.url) {
				try {
					hostname.value = new URL(activeTab.url).hostname;
				} catch (error) {
					hostname.value = activeTab.url;
				}
			}

			scriptError.value = '';
			if (activeTab.id == null) return;

			chrome.scripting
				.executeScript({
					target: { tabId: activeTab.id, allFrames: true },
					func: findImages,
					args: [{ waitForIdleDOM }],
				})
				.then((messages) => {
					loadedImages.value = [];
					erroredImages.value = [];
					allImages.value = unique(messages.flatMap((message) => message.result?.allImages || []));
					linkedImages.value = unique(messages.flatMap((message) => message.result?.linkedImages || []));
					for (const message of messages) {
						if (message.result?.origin) {
							try {
								hostname.value = new URL(message?.result?.origin).hostname;
							} catch (error) {
								// ignore
							}
						}
					}
					if (!waitForIdleDOM) {
						loadImagesFromActiveTab({ waitForIdleDOM: 1000 });
					}
				})
				.catch((error) => {
					// Ignore some errors that happen regularly when navigating around
					if (error.message === 'Cannot access a chrome:// URL') return;

					scriptError.value = error.message;
				});
		});
	});
}

export function reloadImagesWhenPageLoads(
	/** @type {number}*/ tabId,
	/** @type {any} */ changeInfo,
	/** @type {any} */ tab
) {
	if (!tab) {
		hostname.value = '';
		loadImagesFromActiveTab({ waitForIdleDOM: 1 });
		return;
	}

	if (tab?.active) {
		if (changeInfo?.url) {
			try {
				hostname.value = new URL(tab.url).hostname;
			} catch (error) {
				hostname.value = tab.url;
			}
		}

		if (changeInfo?.status === 'complete') {
			loadImagesFromActiveTab({ waitForIdleDOM: false });
		}
	}
}
