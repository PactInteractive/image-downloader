import html, { createContext, useContext, useEffect, useState } from '../html.js';

const defaults = {
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
	selected_images: [],
	columns: 2,
};

const OptionsContext = createContext(null);

export function OptionsProvider({ children }) {
	const [options, setOptions] = useState(null);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		(async () => {
			// First, migrate from localStorage if there's data there
			await migrateFromLocalStorage();

			// Then load from chrome.storage (native types, no conversion needed)
			const stored = await chrome.storage.local.get(null);

			const filtered = {};
			for (const key of Object.keys(stored)) {
				if (key in defaults) {
					filtered[key] = stored[key];
				}
			}

			setOptions({ ...defaults, ...filtered });
			setIsReady(true);
		})();
	}, []);

	const updateOptions = async (changesOrUpdater) => {
		const changes = typeof changesOrUpdater === 'function' ? changesOrUpdater(options) : changesOrUpdater;
		if (!(changes && Object.keys(changes).length > 0)) return;

		setOptions((options) => ({ ...options, ...changes }));
		await chrome.storage.local.set(changes);
	};

	if (!isReady) {
		return 'Loading...';
	}

	return html`<${OptionsContext.Provider} value=${[options, updateOptions]}>${children}<//>`;
}

export function useOptions() {
	const context = useContext(OptionsContext);
	if (context === null) {
		throw new Error('useOptions must be called within an OptionsProvider');
	}
	return context;
}

async function migrateFromLocalStorage() {
	if (localStorage.length === 0) return;

	// Only migrate keys that don't already exist in chrome.storage
	// to avoid overwriting newer data (e.g. from another device)
	const existing = await chrome.storage.local.get(null);

	const toMigrate = {};
	for (let index = localStorage.length - 1; index >= 0; index--) {
		const key = localStorage.key(index);
		if (key && key in defaults && !(key in existing)) {
			toMigrate[key] = parseLocalStorageValue(localStorage.getItem(key), defaults[key]);
		}
	}

	// Write to chrome.storage
	if (Object.keys(toMigrate).length > 0) {
		await chrome.storage.local.set(toMigrate);
	}

	// Clear all localStorage
	localStorage.clear();
}

function parseLocalStorageValue(value, defaultValue) {
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
