// @ts-check
import { action, batch, computed, effect, signal } from '../html.js';
import { isIncludedIn, unique } from '../utils.js';
import { deduplicateImages } from './deduplicateImages.js';
import { findImages } from './findImages.js';

// Options
/** @typedef {typeof defaults} Options */
export const defaults = {
	// UI
	open_mode: 'sidebar',
	// Filters
	filter_url: '',
	filter_url_mode: 'normal',
	// Advanced filters
	show_advanced_filters: true,
	filter_min_width_enabled: false,
	filter_min_width: 0,
	filter_max_width_enabled: false,
	filter_max_width: 3000,
	filter_min_height_enabled: false,
	filter_min_height: 0,
	filter_max_height_enabled: false,
	filter_max_height: 3000,
	only_unique_images: true,
	only_images_from_links: false,
	// Download
	folder_name: '',
	new_file_name: '',
	show_download_confirmation: true,
	// Images
	selected_images: /** @type {string[]} */ ([]),
	columns: 2,
};

/** @template {keyof Options} K */
function storedSignal(/** @type {K} */ key) {
	const ss = signal(defaults[key]);

	effect(() => {
		if (initialized.value) {
			chrome.storage.local.set({ [key]: ss.value });
		}
	});

	return ss;
}

export const initialized = signal(false);

// UI
export const openMode = storedSignal('open_mode');

// Filters
export const filterUrl = storedSignal('filter_url');

export const filterUrlMode = storedSignal('filter_url_mode');

// Advanced filters
export const showAdvancedFilters = storedSignal('show_advanced_filters');

export const filterMinWidthEnabled = storedSignal('filter_min_width_enabled');
export const filterMinWidth = storedSignal('filter_min_width');

export const filterMaxWidthEnabled = storedSignal('filter_max_width_enabled');
export const filterMaxWidth = storedSignal('filter_max_width');

export const filterMinHeightEnabled = storedSignal('filter_min_height_enabled');
export const filterMinHeight = storedSignal('filter_min_height');

export const filterMaxHeightEnabled = storedSignal('filter_max_height_enabled');
export const filterMaxHeight = storedSignal('filter_max_height');

export const onlyUniqueImages = storedSignal('only_unique_images');

export const onlyImagesFromLinks = storedSignal('only_images_from_links');

// Download
export const folderName = storedSignal('folder_name');

export const newFileName = storedSignal('new_file_name');

export const showDownloadConfirmation = storedSignal('show_download_confirmation');

// Images
/** @type {import('@preact/signals').Signal<string[]>} */
export const selectedImages = storedSignal('selected_images');

export const columns = storedSignal('columns');

export const initialize = action(async () => {
	await migrateFromLocalStorage();
	const stored = await chrome.storage.local.get(null);

	const options = {
		open_mode: openMode,
		filter_url: filterUrl,
		filter_url_mode: filterUrlMode,
		show_advanced_filters: showAdvancedFilters,
		filter_min_width_enabled: filterMinWidthEnabled,
		filter_max_width_enabled: filterMaxWidthEnabled,
		filter_min_height_enabled: filterMinHeightEnabled,
		filter_max_height_enabled: filterMaxHeightEnabled,
		filter_min_width: filterMinWidth,
		filter_max_width: filterMaxWidth,
		filter_min_height: filterMinHeight,
		filter_max_height: filterMaxHeight,
		only_unique_images: onlyUniqueImages,
		only_images_from_links: onlyImagesFromLinks,
		folder_name: folderName,
		new_file_name: newFileName,
		show_download_confirmation: showDownloadConfirmation,
		selected_images: selectedImages,
		columns: columns,
	};
	for (const key in options) {
		const defaultValue = defaults[/** @type {keyof Options} */ (key)];
		if (Array.isArray(defaultValue) ? Array.isArray(stored[key]) : typeof stored[key] === typeof defaultValue) {
			options[/** @type {keyof Options} */ (key)].value = stored[key];
		}
	}

	initialized.value = true;
});

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

// State
/** @type {import('@preact/signals').Signal<string[]>} */
export const allImages = signal([]);

/** @type {import('@preact/signals').Signal<string[]>} */
export const linkedImages = signal([]);

/** @type {import('@preact/signals').Signal<HTMLDivElement | null>} */
export const imagesCache = signal(null); // Not displayed; only used for filtering by natural width / height

export const tab = signal('matching');

export const matchingImages = computed(() => {
	let filtered = onlyImagesFromLinks.value ? linkedImages.value : allImages.value;

	let filterValue = filterUrl.value;
	if (filterValue) {
		switch (filterUrlMode.value) {
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
		if (!imagesCache.value) return false;

		/** @type {HTMLImageElement | null} */ const image = imagesCache.value.querySelector(`img[src="${url}"]`);

		return (
			// image && <-- we don't want this, it results in overly filtered images on initial load
			(!filterMinWidthEnabled.value || filterMinWidth.value <= (image?.naturalWidth || 0)) &&
			(!filterMaxWidthEnabled.value || (image?.naturalWidth || 0) <= filterMaxWidth.value) &&
			(!filterMinHeightEnabled.value || filterMinHeight.value <= (image?.naturalHeight || 0)) &&
			(!filterMaxHeightEnabled.value || (image?.naturalHeight || 0) <= filterMaxHeight.value) &&
			!erroredImages.value.includes(url)
		);
	});

	if (onlyUniqueImages.value && imagesCache.value) {
		filtered = deduplicateImages(filtered, imagesCache.value);
	}

	return filtered;
});
export const selectedMatchingImages = computed(() => selectedImages.value.filter(isIncludedIn(matchingImages.value)));

export const filteredOutImages = computed(() =>
	allImages.value.filter((url) => !matchingImages.value.includes(url) && !erroredImages.value.includes(url))
);
export const selectedFilteredOutImages = computed(() =>
	selectedImages.value.filter(isIncludedIn(filteredOutImages.value))
);

/** @type {import('@preact/signals').Signal<string[]>} */
export const erroredImages = signal([]);
export const selectedErroredImages = computed(() => selectedImages.value.filter(isIncludedIn(erroredImages.value)));

export const displayedImages = computed(() => {
	return (
		{
			matching: matchingImages.value,
			filtered_out: filteredOutImages.value,
			errors: erroredImages.value,
		}[tab.value] ?? []
	);
});

export const hostname = signal('');
export const limitedAccessHostnames = /\.google\.com/;

export const scriptError = signal('');

export const loadImagesFromActiveTab = action(
	(/** @type {{ waitForIdleDOM: number | false }} */ { waitForIdleDOM } = { waitForIdleDOM: false }) => {
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
						batch(() => {
							erroredImages.value = [];
							allImages.value = unique(messages.flatMap((message) => message.result?.allImages || []));
							linkedImages.value = unique(messages.flatMap((message) => message.result?.linkedImages || []));
							selectedImages.value = selectedImages.value.filter(isIncludedIn(allImages.value));

							for (const message of messages) {
								if (message.result?.origin) {
									try {
										hostname.value = new URL(message?.result?.origin).hostname;
									} catch (error) {
										// ignore
									}
								}
							}
						});

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
);

export const reloadImagesWhenPageLoads = action(
	(/** @type {number | undefined}*/ tabId, /** @type {any} */ changeInfo, /** @type {any} */ tab) => {
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
);
