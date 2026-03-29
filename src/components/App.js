import html, { useCallback, useEffect, useMemo, useRef, useState } from '../html.js';

import { useRunAfterUpdate } from '../hooks/useRunAfterUpdate.js';
import { isIncludedIn, removeSpecialCharacters, unique } from '../utils.js';

import * as actions from './actions.js';
import { AdvancedFilters } from './AdvancedFilters.js';
import { DownloadButton } from './DownloadButton.js';
import { DownloadConfirmation } from './DownloadConfirmation.js';
import { findImages } from './findImages.js';
import { Images } from './Images.js';
import { Options } from './Options.js';
import { UrlFilterMode } from './UrlFilterMode.js';

const initialOptions = localStorage;

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

export const App = ({ sidebarButton }) => {
	const [options, setOptions] = useState(initialOptions);

	useEffect(() => {
		Object.assign(localStorage, options);
	}, [options]);

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
		let visibleImages = options.only_images_from_links === 'true' ? linkedImages : allImages;

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
				(options.filter_min_width_enabled !== 'true' || options.filter_min_width <= image.naturalWidth) &&
				(options.filter_max_width_enabled !== 'true' || image.naturalWidth <= options.filter_max_width) &&
				(options.filter_min_height_enabled !== 'true' || options.filter_min_height <= image.naturalHeight) &&
				(options.filter_max_height_enabled !== 'true' || image.naturalHeight <= options.filter_max_height)
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

	const [showOptions, setShowOptions] = useState(false);
	const [downloadConfirmationIsShown, setDownloadConfirmationIsShown] = useState(false);

	function maybeDownloadImages() {
		if (options.show_download_confirmation === 'true') {
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

	// `relative` for new z-index stack to get box shadow
	return html`
		<div class="relative shadow-md">
			<div class="flex items-center gap-1 px-3 py-2">
				<input
					id="filter_by_url_input"
					type="text"
					placeholder="Filter by URL"
					title="Filter by parts of the URL or regular expressions."
					value=${options.filter_url}
					class="flex-1"
					onChange=${({ currentTarget: { value } }) => {
			setOptions((options) => ({ ...options, filter_url: value.trim() }));
		}}
				/>

				<${UrlFilterMode}
					id="url_filter_mode_select"
					value=${options.filter_url_mode}
					onChange=${({ currentTarget: { value } }) => {
			setOptions((options) => ({ ...options, filter_url_mode: value }));
		}}
				/>

				<button
					class="w-8"
					title="Toggle advanced filters"
					onClick=${() => {
			setOptions((options) => ({
				...options,
				show_advanced_filters: options.show_advanced_filters === 'true' ? 'false' : 'true',
			}));
		}}
				>
					<img
						class="inline w-4 transition-transform ${options.show_advanced_filters === 'true' ? '' : '-rotate-225'}"
						src="/images/times.svg"
					/>
				</button>

				<button id="open_options_button" class="w-8" title="Options" onClick=${() => setShowOptions((show) => !show)}>
					<img
						class="inline transition-transform ${showOptions ? 'w-4 rotate-180' : 'w-5'}"
						src=${showOptions ? '/images/times.svg' : '/images/cog.svg'}
					/>
				</button>

				${sidebarButton}
			</div>

			${options.show_advanced_filters === 'true' && html`<${AdvancedFilters} options=${options} setOptions=${setOptions} />`}
		
			${showOptions && html`<${Options} />`}
		</div>

		<div ref=${imagesCacheRef} class="hidden">
			${allImages.map((url) => html`<img src=${encodeURI(url)} onLoad=${filterImages} />`)}
		</div>

		<${Images}
			options=${options}
			visibleImages=${visibleImages}
			selectedImages=${selectedImages}
			imagesToDownload=${imagesToDownload}
			setSelectedImages=${setSelectedImages}
		/>

		<div
			id="downloads_container"
			style=${{
			gridTemplateColumns: `${options.show_file_renaming === 'true' ? 'minmax(100px, 1fr)' : ''
				} minmax(100px, 1fr) 80px`,
		}}
		>
			<input
				type="text"
				placeholder="Save to subfolder"
				title="Set the name of the subfolder you want to download the images to."
				value=${options.folder_name}
				onChange=${({ currentTarget: input }) => {
			const savedSelectionStart = removeSpecialCharacters(input.value.slice(0, input.selectionStart)).length;

			runAfterUpdate(() => {
				input.selectionStart = input.selectionEnd = savedSelectionStart;
			});

			setOptions((options) => ({
				...options,
				folder_name: removeSpecialCharacters(input.value),
			}));
		}}
			/>

			${options.show_file_renaming === 'true' &&
		html`
				<input
					type="text"
					placeholder="Rename files"
					title="Set a new file name for the images you want to download."
					value=${options.new_file_name}
					onChange=${({ currentTarget: input }) => {
				const savedSelectionStart = removeSpecialCharacters(input.value.slice(0, input.selectionStart)).length;

				runAfterUpdate(() => {
					input.selectionStart = input.selectionEnd = savedSelectionStart;
				});

				setOptions((options) => ({
					...options,
					new_file_name: removeSpecialCharacters(input.value),
				}));
			}}
				/>
			`}

			<${DownloadButton}
				disabled=${imagesToDownload.length === 0}
				loading=${downloadIsInProgress}
				onClick=${maybeDownloadImages}
			/>

			${downloadConfirmationIsShown &&
		html`
				<${DownloadConfirmation}
					onCheckboxChange=${({ currentTarget: { checked } }) => {
				setOptions((options) => ({
					...options,
					show_download_confirmation: (!checked).toString(),
				}));
			}}
					onClose=${() => setDownloadConfirmationIsShown(false)}
					onConfirm=${downloadImages}
				/>
			`}
		</div>
	`;
};
