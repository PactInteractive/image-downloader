// @ts-check
import html from '../html.js';

import { AdvancedFilters } from './AdvancedFilters.js';
import {
	hostname,
	limitedAccessHostnames,
	loadImagesFromActiveTab,
	options,
	scriptError,
	updateOptions,
} from './data.js';
import { UrlFilterMode } from './UrlFilterMode.js';

export function Header(/** @type {Object} */ props) {
	/** @type {(keyof import('./data.js').Options)[]} */
	const advancedFilterKeys = [
		'filter_min_width_enabled',
		'filter_max_width_enabled',
		'filter_min_height_enabled',
		'filter_max_height_enabled',
		'only_unique_images',
		'only_images_from_links',
	];
	const numberOfActiveAdvancedFilters = advancedFilterKeys.filter((key) => options.value?.[key]).length;

	return html`
		<header ...${props}>
			${hostname.value &&
			limitedAccessHostnames.test(hostname.value) &&
			html`
				<div class="bg-sky-100 p-2 text-sky-800">
					<span class="text-shadow">🛡️</span> Image Downloader has limited access to sensitive domains like ${' '}<b
						>${hostname.value}</b
					>
				</div>
			`}
			${scriptError.value &&
			html`
				<div class="bg-amber-100 p-2 text-amber-800">
					<span class="text-shadow">⚠️</span> Image Downloader cannot access the contents of this page - please close
					the extension and open it again
				</div>
			`}

			<div class="flex items-center gap-1 p-2">
				<button
					class="min-w-8"
					title="Reload images from current tab"
					onClick=${() => loadImagesFromActiveTab({ waitForIdleDOM: false })}
				>
					<img class="inline w-3.5" src="/images/reload.svg" />
				</button>

				<input
					id="filter_by_url_input"
					type="text"
					placeholder="Filter by URL"
					title="Filter by parts of the URL or regular expressions."
					value=${options.value?.filter_url}
					class="flex-1"
					onChange=${(/** @type {Event} */ e) =>
						updateOptions({ filter_url: /** @type {HTMLInputElement} */ (e.currentTarget).value.trim() })}
				/>

				<${UrlFilterMode}
					id="url_filter_mode_select"
					value=${options.value?.filter_url_mode}
					onChange=${(/** @type {Event} */ e) =>
						updateOptions({ filter_url_mode: /** @type {HTMLInputElement} */ (e.currentTarget).value })}
				/>

				<button
					class="relative min-w-8"
					title=${!options.value?.show_advanced_filters && numberOfActiveAdvancedFilters > 0
						? `${numberOfActiveAdvancedFilters} advanced ${numberOfActiveAdvancedFilters === 1 ? 'filter' : 'filters'} active`
						: 'Toggle advanced filters'}
					onClick=${() => updateOptions({ show_advanced_filters: !options.value?.show_advanced_filters })}
				>
					<img
						class="${options.value?.show_advanced_filters ? '' : '-rotate-90'} inline w-3 transition-transform"
						src="/images/chevron.svg"
					/>

					<small
						class="${!options.value?.show_advanced_filters && numberOfActiveAdvancedFilters > 0
							? 'ease-elastic duration-400'
							: 'scale-0'} corner-round absolute top-0.5 right-0.5 flex h-4 w-4 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-sky-600 font-bold text-white tabular-nums transition-transform"
					>
						${numberOfActiveAdvancedFilters}
					</small>
				</button>

				<button
					class="min-w-8"
					title=${options.value?.open_mode === 'sidebar' ? 'Switch to popup mode' : 'Switch to sidebar mode'}
					onClick=${async () => {
						if (options.value?.open_mode === 'sidebar') {
							updateOptions({ open_mode: 'popup' });
							openPopup();
						} else {
							updateOptions({ open_mode: 'sidebar' });
							openSidebar();
						}
					}}
				>
					<img
						class="inline w-5"
						src=${options.value?.open_mode === 'sidebar' ? '/images/window.svg' : '/images/sidebar.svg'}
					/>
				</button>

				<button class="min-w-8" title="Close extension" onClick=${() => window.close()}>
					<img class="inline w-3" src="/images/times.svg" />
				</button>
			</div>

			${options.value?.show_advanced_filters && html`<${AdvancedFilters} />`}
		</header>
	`;
}

async function openPopup() {
	try {
		await chrome.action.setPopup({ popup: 'src/Popup/index.html' });
		await chrome.action.openPopup();
		window.close();
	} catch (error) {
		console.error('Error opening popup:', error);
	}
}

async function openSidebar() {
	try {
		await chrome.action.setPopup({ popup: '' });
		const currentWindow = await new Promise((resolve) => chrome.windows.getCurrent(resolve));
		await chrome.sidePanel.open({ windowId: currentWindow.id });
		window.close(); // Closes the popup
	} catch (error) {
		console.error('Error opening side panel:', error);
	}
}
