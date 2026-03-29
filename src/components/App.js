import html, { useCallback, useEffect, useMemo, useRef, useState } from '../html.js';

import { useOptions } from '../hooks/useOptions.js';
import { useRunAfterUpdate } from '../hooks/useRunAfterUpdate.js';
import { isIncludedIn, removeSpecialCharacters, unique } from '../utils.js';

import * as actions from './actions.js';
import { AdvancedFilters } from './AdvancedFilters.js';
import { DownloadButton } from './DownloadButton.js';
import { DownloadConfirmation } from './DownloadConfirmation.js';
import { findImages } from './findImages.js';
import { Images } from './Images.js';
import { UrlFilterMode } from './UrlFilterMode.js';

// Load saved selections from localStorage
const loadSavedSelections = () => {
	try {
		const saved = localStorage.selectedImages;
		return saved ? JSON.parse(saved) : [];
	} catch {
		return [];
	}
};

// Save selections to localStorage
const saveSelections = (selections) => {
	localStorage.selectedImages = JSON.stringify(selections);
};

export function App({ openSidebar }) {
	const [options, updateOptions] = useOptions();

	const [allImages, setAllImages] = useState([]);
	const [linkedImages, setLinkedImages] = useState([]);
	const [selectedImages, setSelectedImages] = useState(loadSavedSelections);
	const [visibleImages, setVisibleImages] = useState([]);

	// Persist selections to localStorage whenever they change
	useEffect(() => {
		saveSelections(selectedImages);
	}, [selectedImages]);

	useEffect(() => {
		// Get images on the page
		chrome.windows.getCurrent((currentWindow) => {
			chrome.tabs.query({ active: true, windowId: currentWindow.id }, (activeTabs) => {
				chrome.scripting
					.executeScript({
						target: { tabId: activeTabs[0].id, allFrames: true },
						func: findImages,
					})
					.then((messages) => {
						setAllImages((allImages) =>
							unique([...allImages, ...messages.flatMap((message) => message?.result?.allImages)])
						);

						setLinkedImages((linkedImages) =>
							unique([...linkedImages, ...messages.flatMap((message) => message?.result?.linkedImages)])
						);

						localStorage.active_tab_origin = messages[0]?.result?.origin;
					});
			});
		});
	}, []);

	const imagesCacheRef = useRef(null); // Not displayed; only used for filtering by natural width / height
	const filterImages = useCallback(() => {
		let visibleImages = options.only_images_from_links ? linkedImages : allImages;

		let filterValue = options.filter_url;
		if (filterValue) {
			switch (options.filter_url_mode) {
				case 'normal':
					const terms = filterValue.split(/\s+/);
					visibleImages = visibleImages.filter((url) => {
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
					visibleImages = visibleImages.filter((url) => {
						try {
							return url.match(filterValue);
						} catch (error) {
							return false;
						}
					});
					break;
			}
		}

		visibleImages = visibleImages.filter((url) => {
			const image = imagesCacheRef.current.querySelector(`img[src="${encodeURI(url)}"]`);

			return (
				(!options.filter_min_width_enabled || options.filter_min_width <= image.naturalWidth) &&
				(!options.filter_max_width_enabled || image.naturalWidth <= options.filter_max_width) &&
				(!options.filter_min_height_enabled || options.filter_min_height <= image.naturalHeight) &&
				(!options.filter_max_height_enabled || image.naturalHeight <= options.filter_max_height)
			);
		});

		setVisibleImages(visibleImages);
	}, [allImages, linkedImages, options]);

	useEffect(filterImages, [allImages, linkedImages, options]);

	const [downloadIsInProgress, setDownloadIsInProgress] = useState(false);
	const imagesToDownload = useMemo(
		() => visibleImages.filter(isIncludedIn(selectedImages)),
		[visibleImages, selectedImages]
	);

	const [downloadConfirmationIsShown, setDownloadConfirmationIsShown] = useState(false);

	function maybeDownloadImages() {
		if (options.show_download_confirmation && imagesToDownload.length > 1) {
			setDownloadConfirmationIsShown(true);
		} else {
			downloadImages();
		}
	}

	async function downloadImages() {
		setDownloadIsInProgress(true);
		await actions.downloadImages(imagesToDownload, options);
		setDownloadIsInProgress(false);
	}

	const runAfterUpdate = useRunAfterUpdate();

	const numberOfActiveAdvancedFilters = [
		'filter_min_width_enabled',
		'filter_max_width_enabled',
		'filter_min_height_enabled',
		'filter_max_height_enabled',
		'only_images_from_links',
	].filter((key) => options[key]).length;

	// `relative` for new z-index stack to get box shadow
	return html`
		<header class="sticky top-0 z-1 bg-white shadow-md">
			<div class="flex items-center gap-1 p-2">
				<input
					id="filter_by_url_input"
					type="text"
					placeholder="Filter by URL"
					title="Filter by parts of the URL or regular expressions."
					value=${options.filter_url}
					class="flex-1"
					onChange=${({ currentTarget: { value } }) => {
						updateOptions({ filter_url: value.trim() });
					}}
				/>

				<${UrlFilterMode}
					id="url_filter_mode_select"
					value=${options.filter_url_mode}
					onChange=${({ currentTarget: { value } }) => {
						updateOptions({ filter_url_mode: value });
					}}
				/>

				<button
					class="relative w-8"
					title="Toggle advanced filters"
					onClick=${() => {
						updateOptions({ show_advanced_filters: !options.show_advanced_filters });
					}}
				>
					<img
						class="${options.show_advanced_filters ? '' : '-rotate-225'} inline w-3 transition-transform"
						src="/images/times.svg"
					/>

					<small
						class="corner-round ${!options.show_advanced_filters && numberOfActiveAdvancedFilters > 0
							? ''
							: 'opacity-0'} absolute top-0.5 right-0.5 flex h-4 w-4 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-sky-600 font-bold text-white tabular-nums transition-opacity"
					>
						${numberOfActiveAdvancedFilters}
					</small>
				</button>

				${openSidebar &&
				html`
					<button class="w-8" title="Open in sidebar" onClick=${openSidebar}>
						<img class="inline w-6" src="/images/sidebar.svg" />
					</button>
				`}

				<!-- TODO: Button to switch to popup -->
				<!-- TODO: Button to the About page -->
			</div>

			${options.show_advanced_filters && html`<${AdvancedFilters} options=${options} setOptions=${updateOptions} />`}
		</header>

		<div id="images_cache" ref=${imagesCacheRef} hidden>
			${allImages.map((url) => html`<img src=${encodeURI(url)} onLoad=${filterImages} />`)}
		</div>

		<${Images}
			id="images_container"
			options=${options}
			updateOptions=${updateOptions}
			visibleImages=${visibleImages}
			selectedImages=${selectedImages}
			imagesToDownload=${imagesToDownload}
			setSelectedImages=${setSelectedImages}
		/>

		<footer
			class="sticky bottom-0 mt-auto bg-white p-2"
			style=${{
				boxShadow:
					'0 -4px 6px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 2px 4px -2px var(--tw-shadow-color, rgb(0 0 0 / 0.1))',
			}}
		>
			${downloadConfirmationIsShown
				? html`
						<${DownloadConfirmation}
							numberOfImages=${imagesToDownload.length}
							onCheckboxChange=${({ currentTarget: { checked } }) => {
								updateOptions({ show_download_confirmation: !checked });
							}}
							onClose=${() => setDownloadConfirmationIsShown(false)}
							onConfirm=${downloadImages}
						/>
					`
				: html`
						<div class="flex gap-2">
							<input
								id="subfolder_name_input"
								class="flex-1"
								type="text"
								placeholder="Save to subfolder"
								title="Set the name of the subfolder you want to download the images to."
								value=${options.folder_name}
								onChange=${({ currentTarget: input }) => {
									const savedSelectionStart = removeSpecialCharacters(
										input.value.slice(0, input.selectionStart)
									).length;

									runAfterUpdate(() => {
										input.selectionStart = input.selectionEnd = savedSelectionStart;
									});

									updateOptions({ folder_name: removeSpecialCharacters(input.value) });
								}}
							/>

							<input
								id="rename_pattern_input"
								class="flex-1"
								type="text"
								placeholder="Rename files"
								title="Set a new file name for the images you want to download."
								value=${options.new_file_name}
								onChange=${({ currentTarget: input }) => {
									const savedSelectionStart = removeSpecialCharacters(
										input.value.slice(0, input.selectionStart)
									).length;

									runAfterUpdate(() => {
										input.selectionStart = input.selectionEnd = savedSelectionStart;
									});

									updateOptions({ new_file_name: removeSpecialCharacters(input.value) });
								}}
							/>

							<${DownloadButton}
								disabled=${imagesToDownload.length === 0}
								loading=${downloadIsInProgress}
								onClick=${maybeDownloadImages}
							/>
						</div>
					`}
		</footer>
	`;
}
