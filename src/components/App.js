// @ts-check
import html, { useEffect, useSignal } from '../html.js';

import { removeSpecialCharacters } from '../utils.js';
import * as actions from './actions.js';
import { AdvancedFilters } from './AdvancedFilters.js';
import {
	allImages,
	erroredUrls,
	hostname,
	imagesCache,
	limitedAccessHostnames,
	loadedImages,
	loadImagesFromActiveTab,
	options,
	scriptError,
	selectedImages,
	updateOption,
} from './data.js';
import { DownloadButton } from './DownloadButton.js';
import { DownloadConfirmation } from './DownloadConfirmation.js';
import { Images } from './Images.js';
import { UrlFilterMode } from './UrlFilterMode.js';
import { useRunAfterUpdate } from './useRunAfterUpdate.js';

export function App() {
	useEffect(() => {
		if (!options.value) return;

		loadImagesFromActiveTab({ waitForIdleDOM: false });
	}, [options.value]);

	// Images
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

	// Download
	const downloadIsInProgress = useSignal(false);
	const downloadConfirmationIsShown = useSignal(false);

	function maybeDownloadImages() {
		if (options.value?.show_download_confirmation && selectedImages.value.length > 1) {
			downloadConfirmationIsShown.value = true;
		} else {
			downloadImages();
		}
	}

	async function downloadImages() {
		downloadIsInProgress.value = true;
		await actions.downloadImages(selectedImages.value);
		downloadIsInProgress.value = false;
	}

	const runAfterUpdate = useRunAfterUpdate();

	if (!options.value) {
		return html`<div class="p-4">Loading...</div>`;
	}

	return html`
		<header class="sticky top-0 z-1 bg-white shadow-md">
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
						updateOption('filter_url', /** @type {HTMLInputElement} */ (e.currentTarget).value.trim())}
				/>

				<${UrlFilterMode}
					id="url_filter_mode_select"
					value=${options.value?.filter_url_mode}
					onChange=${(/** @type {Event} */ e) =>
						updateOption('filter_url_mode', /** @type {HTMLInputElement} */ (e.currentTarget).value)}
				/>

				<button
					class="relative min-w-8"
					title=${!options.value?.show_advanced_filters && numberOfActiveAdvancedFilters > 0
						? `${numberOfActiveAdvancedFilters} advanced ${numberOfActiveAdvancedFilters === 1 ? 'filter' : 'filters'} active`
						: 'Toggle advanced filters'}
					onClick=${() => updateOption('show_advanced_filters', !options.value?.show_advanced_filters)}
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
							updateOption('open_mode', 'popup');
							openPopup();
						} else {
							updateOption('open_mode', 'sidebar');
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

		<div
			id="images_cache"
			ref=${(/** @type {HTMLDivElement} */ element) => {
				imagesCache.value = element;
			}}
			hidden
		>
			${allImages.value.map(
				(url) => html`
					<img
						key=${url}
						src=${encodeURI(url)}
						onLoad=${() => (loadedImages.value = [...loadedImages.value, url])}
						onError=${() => (erroredUrls.value = [...erroredUrls.value, url])}
					/>
				`
			)}
		</div>

		<${Images} id="images_container" />

		<footer
			class="sticky bottom-0 mt-auto bg-white p-2"
			style=${{
				boxShadow:
					'0 -4px 6px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 2px 4px -2px var(--tw-shadow-color, rgb(0 0 0 / 0.1))',
			}}
		>
			${downloadConfirmationIsShown.value
				? html`
						<${DownloadConfirmation}
							numberOfImages=${selectedImages.value.length}
							onCheckboxChange=${(/** @type {Event} */ e) => {
								updateOption(
									'show_download_confirmation',
									!(/** @type {HTMLInputElement} */ (e.currentTarget).checked)
								);
							}}
							onClose=${() => (downloadConfirmationIsShown.value = false)}
							onConfirm=${downloadImages}
						/>
					`
				: html`
						<div class="grid grid-cols-[1fr_1fr_auto] gap-2">
							<input
								id="subfolder_name_input"
								class="flex-1"
								type="text"
								placeholder="Save to subfolder"
								title="Set the name of the subfolder you want to download the images to."
								value=${options.value?.folder_name}
								onChange=${(/** @type {Event} */ e) => {
									const input = /** @type HTMLInputElement */ (e.currentTarget);
									const savedSelectionStart = removeSpecialCharacters(
										input.value.slice(0, input.selectionStart || 0)
									).length;

									runAfterUpdate(() => {
										input.selectionStart = input.selectionEnd = savedSelectionStart;
									});

									updateOption('folder_name', removeSpecialCharacters(input.value));
								}}
							/>

							<input
								id="rename_pattern_input"
								class="flex-1"
								type="text"
								placeholder="Rename files"
								title="Set a new file name for the images you want to download."
								value=${options.value?.new_file_name}
								onChange=${(/** @type {Event} */ e) => {
									const input = /** @type HTMLInputElement */ (e.currentTarget);
									const savedSelectionStart = removeSpecialCharacters(
										input.value.slice(0, input.selectionStart || 0)
									).length;

									runAfterUpdate(() => {
										input.selectionStart = input.selectionEnd = savedSelectionStart;
									});

									updateOption('new_file_name', removeSpecialCharacters(input.value));
								}}
							/>

							<${DownloadButton}
								class="col-span-1"
								disabled=${selectedImages.value.length === 0}
								loading=${downloadIsInProgress.value}
								onClick=${maybeDownloadImages}
							/>
						</div>
					`}
		</footer>
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
