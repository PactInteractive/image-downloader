import html, { useCallback, useEffect, useMemo, useRef, useState } from '../html.js';

import { useRunAfterUpdate } from '../hooks/useRunAfterUpdate.js';
import { isIncludedIn, removeSpecialCharacters, unique } from '../utils.js';
import { useOptions } from './OptionsProvider.js';

import * as actions from './actions.js';
import { AdvancedFilters } from './AdvancedFilters.js';
import { DownloadButton } from './DownloadButton.js';
import { DownloadConfirmation } from './DownloadConfirmation.js';
import { Images } from './Images.js';
import { findImages } from './imageUtils.js';
import { UrlFilterMode } from './UrlFilterMode.js';

export function App() {
	const [options, updateOptions] = useOptions();

	// Images
	const [allImages, setAllImages] = useState([]);
	const [linkedImages, setLinkedImages] = useState([]);
	const [visibleImages, setVisibleImages] = useState([]);

	// Extension can only access the domain it was initially opened on
	const initialHostname = useRef();
	const [hostname, setHostname] = useState(initialHostname.value);

	const loadImagesFromActiveTab = useCallback(({ waitForIdleDOM }) => {
		chrome.windows.getCurrent((currentWindow) => {
			chrome.tabs.query({ active: true, windowId: currentWindow.id }, (activeTabs) => {
				if (activeTabs.length === 0) return;

				const activeTab = activeTabs[0];
				if (activeTab.url) {
					try {
						initialHostname.value = new URL(activeTab.url).hostname;
						setHostname(initialHostname.value);
					} catch (error) {
						console.error(error, activeTab.url);
					}
				}

				chrome.scripting
					.executeScript({
						target: { tabId: activeTab.id, allFrames: true },
						func: findImages,
						args: [{ waitForIdleDOM }],
					})
					.then((messages) => {
						setAllImages(unique(messages.flatMap((message) => message?.result?.allImages)));
						setLinkedImages(unique(messages.flatMap((message) => message?.result?.linkedImages)));
						if (!waitForIdleDOM) {
							loadImagesFromActiveTab({ waitForIdleDOM: 1000 });
						}
					})
					.catch((error) => {
						// Some errors are expected like `Cannot access contents of the page.
						// Extension manifest must request permission to access the respective host.`
						console.error(error);
					});
			});
		});
	}, []);

	useEffect(() => {
		loadImagesFromActiveTab({ waitForIdleDOM: false });

		function reloadImagesWhenPageLoads(tabId, changeInfo, tab) {
			if (tab?.active && changeInfo?.url) {
				try {
					setHostname(new URL(tab.url).hostname);
				} catch (error) {
					console.error(error, tab.url);
					setHostname('!invalid!');
				}
			}

			if (tab?.active && changeInfo?.status === 'complete') {
				loadImagesFromActiveTab({ waitForIdleDOM: false });
			}
		}

		chrome.tabs.onUpdated.addListener(reloadImagesWhenPageLoads);
		chrome.tabs.onActivated.addListener(reloadImagesWhenPageLoads);

		return () => {
			chrome.tabs.onUpdated.removeListener(reloadImagesWhenPageLoads);
			chrome.tabs.onActivated.removeListener(reloadImagesWhenPageLoads);
		};
	}, [loadImagesFromActiveTab]);

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

	// Download
	const [downloadIsInProgress, setDownloadIsInProgress] = useState(false);
	const imagesToDownload = useMemo(
		() => visibleImages.filter(isIncludedIn(options.selected_images)),
		[visibleImages, options.selected_images]
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
			${hostname !== initialHostname.value &&
			html`
				<div class="bg-amber-100 p-2 text-amber-800">
					<span class="text-shadow">⚠️</span> For privacy and security reasons the extension can only look for images
					on${' '}<b>${initialHostname.value}</b> where it was initially opened. To find images on${' '}
					<b>${hostname}</b> close the extension and reopen it.
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
					class="relative min-w-8"
					title="Toggle advanced filters"
					onClick=${() => {
						updateOptions({ show_advanced_filters: !options.show_advanced_filters });
					}}
				>
					<img
						class="${options.show_advanced_filters ? '' : '-rotate-90'} inline w-3 transition-transform"
						src="/images/chevron.svg"
					/>

					<small
						class="corner-round ${!options.show_advanced_filters && numberOfActiveAdvancedFilters > 0
							? 'ease-elastic duration-400'
							: 'scale-0'} absolute top-0.5 right-0.5 flex h-4 w-4 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-sky-600 font-bold text-white tabular-nums transition-transform"
					>
						${numberOfActiveAdvancedFilters}
					</small>
				</button>

				<button
					class="min-w-8"
					title=${options.open_mode === 'sidebar' ? 'Switch to popup mode' : 'Switch to sidebar mode'}
					onClick=${async () => {
						if (options.open_mode === 'sidebar') {
							await updateOptions({ open_mode: 'popup' });
							openPopup();
						} else {
							await updateOptions({ open_mode: 'sidebar' });
							openSidebar();
						}
					}}
				>
					<img
						class="inline w-5"
						src=${options.open_mode === 'sidebar' ? '/images/window.svg' : '/images/sidebar.svg'}
					/>
				</button>

				<button class="min-w-8" title="Close extension" onClick=${() => window.close()}>
					<img class="inline w-3" src="/images/times.svg" />
				</button>
			</div>

			${options.show_advanced_filters && html`<${AdvancedFilters} />`}
		</header>

		<div id="images_cache" ref=${imagesCacheRef} hidden>
			${allImages.map((url) => html`<img src=${encodeURI(url)} onLoad=${filterImages} />`)}
		</div>

		<${Images} id="images_container" visibleImages=${visibleImages} imagesToDownload=${imagesToDownload} />

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
						<div class="grid-cols-[1fr_1fr_auto] grid gap-2">
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
								class="col-span-1"
								disabled=${imagesToDownload.length === 0}
								loading=${downloadIsInProgress}
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
