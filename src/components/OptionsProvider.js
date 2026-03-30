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
	only_images_from_links: false,
	// Download
	show_download_confirmation: true,
	show_file_renaming: true,
	// Images
	selected_images: [],
	columns: 2,
};

const OptionsContext = createContext(null);

export function OptionsProvider({ children }) {
	const [options, setOptions] = useState(null);
	const [isReady, setIsReady] = useState(false);

	useEffect(async () => {
		// First, migrate from localStorage if there's data there
		await migrateFromLocalStorage();

		// Then load from chrome.storage
		const stored = await chrome.storage.local.get(null);

		// Deserialize stored values to their proper types
		const deserialized = {};
		for (const key of Object.keys(stored)) {
			if (key in defaults) {
				deserialized[key] = deserialize(stored[key], defaults[key]);
			}
		}

		setOptions({ ...defaults, ...deserialized });
		setIsReady(true);
	}, []);

	const updateOptions = async (changesOrUpdater) => {
		setOptions((options) => {
			const changes = typeof changesOrUpdater === 'function' ? changesOrUpdater(options) : changesOrUpdater;
			const next = { ...options, ...changes };
			chrome.storage.local.set(changes);
			return next;
		});
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

	const toMigrate = {};
	for (let index = localStorage.length - 1; index >= 0; index--) {
		const key = localStorage.key(index);
		if (key && key in defaults) {
			const value = localStorage.getItem(key);
			toMigrate[key] = deserialize(value, defaults[key]);
		}
	}

	// Write to chrome.storage
	if (Object.keys(toMigrate).length > 0) {
		await chrome.storage.local.set(toMigrate);
	}

	// Clear all localStorage
	localStorage.clear();
}

function deserialize(value, defaultValue) {
	if (value == null) return defaultValue;

	switch (typeof defaultValue) {
		case 'number':
			const number = parseFloat(value);
			return isNaN(number) ? defaultValue : number;
		case 'boolean':
			return value === 'true' || value === true;
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
