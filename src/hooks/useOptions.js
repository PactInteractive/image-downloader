import { useState } from '../html.js';

const defaults = {
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

// Clean up obsolete stored data
Object.keys(localStorage).forEach((key) => {
	if (defaults[key] === undefined) {
		localStorage.removeItem(key);
	}
});

export function useOptions() {
	const [options, setOptions] = useState(() => {
		const initial = {};
		for (const [key, defaultValue] of Object.entries(defaults)) {
			initial[key] = deserialize(localStorage[key], defaultValue);
		}
		return initial;
	});

	const updateOptions = (updater) => {
		setOptions((prev) => {
			const changes = typeof updater === 'function' ? updater(prev) : updater;
			const next = { ...prev, ...changes };
			for (const [key, value] of Object.entries(changes)) {
				localStorage[key] = serialize(value);
			}
			return next;
		});
	};

	return [options, updateOptions];
}

function serialize(value) {
	return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function deserialize(value, defaultValue) {
	if (value == null) return defaultValue;

	switch (typeof defaultValue) {
		case 'number':
			return parseFloat(value);
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
