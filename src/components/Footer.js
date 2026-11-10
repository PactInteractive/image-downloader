// @ts-check
import html, { For, useRef, useSignal, useSignalEffect } from '../html.js';

import { arraysEqual, removeSpecialCharacters, setToInvertedCheckboxValue } from '../utils.js';
import * as actions from './actions.js';
import { downloadMode, folderName, newFileName, selectedImages, showDownloadConfirmation } from './data.js';
import { DownloadButton } from './DownloadButton.js';
import { DownloadConfirmation } from './DownloadConfirmation.js';
import { useRunAfterUpdate } from './useRunAfterUpdate.js';
import { imageLabel } from './zip.js';

export function Footer(/** @type {{ isPopup?: boolean } & Object} */ { isPopup = false, ...props }) {
	// Download
	const downloadIsInProgress = useSignal(false);
	const preparingZip = useSignal(false);
	const downloadConfirmationIsShown = useSignal(false);
	const downloadError = useSignal('');
	const downloadFailures = useSignal(/** @type {string[]} */ ([]));
	const cancelController = useRef(/** @type {AbortController | null} */ (null));
	const previousSelection = useRef(/** @type {string[]} */ ([]));

	useSignalEffect(() => {
		const selection = selectedImages.value;
		// Page reloads rewrite the same selection; only a content change makes the messages stale.
		if (arraysEqual(selection, previousSelection.current)) return;

		previousSelection.current = selection;
		downloadError.value = '';
		downloadFailures.value = [];
	});

	function maybeDownloadImages() {
		if (downloadMode.value === 'zip') {
			downloadImages();
		} else if (showDownloadConfirmation.value && selectedImages.value.length > 1) {
			downloadConfirmationIsShown.value = true;
		} else {
			downloadImages();
		}
	}

	async function downloadImages() {
		const mode = downloadMode.value;
		const images = selectedImages.value;
		const controller = new AbortController();
		cancelController.current = controller;
		preparingZip.value = mode === 'zip';
		downloadIsInProgress.value = true;
		downloadError.value = '';
		downloadFailures.value = [];

		try {
			if (mode === 'zip') {
				const failures = await actions.downloadImagesAsZip(
					images,
					controller.signal,
					() => (preparingZip.value = false)
				);
				if (arraysEqual(selectedImages.value, images)) downloadFailures.value = failures;
			} else {
				await actions.downloadImages(images);
			}
		} catch (error) {
			if (!controller.signal.aborted) {
				downloadError.value = error instanceof Error ? error.message : `${error}`;
			}
		} finally {
			if (cancelController.current === controller) cancelController.current = null;
			preparingZip.value = false;
			downloadIsInProgress.value = false;
		}
	}

	function cancelDownload() {
		preparingZip.value = false;
		cancelController.current?.abort();
	}

	function selectDownloadMode(/** @type {'individual' | 'zip'} */ mode) {
		downloadError.value = '';
		downloadFailures.value = [];
		downloadMode.value = mode;
		if (mode === 'zip') {
			downloadImages();
		} else {
			maybeDownloadImages();
		}
	}

	const runAfterUpdate = useRunAfterUpdate();

	return html`
		<footer ...${props}>
			${
				downloadConfirmationIsShown.value
					? html`
							<${DownloadConfirmation}
								numberOfImages=${selectedImages.value.length}
								onCheckboxChange=${setToInvertedCheckboxValue(showDownloadConfirmation)}
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
									value=${folderName}
									onChange=${(/** @type {Event} */ e) => {
										const input = /** @type HTMLInputElement */ (e.currentTarget);
										const savedSelectionStart = removeSpecialCharacters(
											input.value.slice(0, input.selectionStart || 0)
										).length;

										runAfterUpdate(() => {
											input.selectionStart = input.selectionEnd = savedSelectionStart;
										});

										folderName.value = removeSpecialCharacters(input.value);
									}}
								/>

								<input
									id="rename_pattern_input"
									class="flex-1"
									type="text"
									placeholder="Rename files"
									title="Set a new file name for the images you want to download."
									value=${newFileName}
									onChange=${(/** @type {Event} */ e) => {
										const input = /** @type HTMLInputElement */ (e.currentTarget);
										const savedSelectionStart = removeSpecialCharacters(
											input.value.slice(0, input.selectionStart || 0)
										).length;

										runAfterUpdate(() => {
											input.selectionStart = input.selectionEnd = savedSelectionStart;
										});

										newFileName.value = removeSpecialCharacters(input.value);
									}}
								/>

								<${DownloadButton}
									class="col-span-1"
									loading=${downloadIsInProgress.value}
									preparing=${preparingZip.value}
									selectedCount=${selectedImages.value.length}
									selectedImages=${selectedImages.value}
									mode=${downloadMode.value}
									isPopup=${isPopup}
									onClick=${maybeDownloadImages}
									onSelectMode=${selectDownloadMode}
								/>
							</div>

							${
								downloadIsInProgress.value && preparingZip.value
									? html`
											<button
												type="button"
												class="mt-1 ml-auto block rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
												title="Cancel preparing the .zip"
												onClick=${cancelDownload}
											>
												Cancel
											</button>
										`
									: null
							}
							${
								downloadIsInProgress.value && !preparingZip.value && downloadMode.value === 'zip'
									? html`<p role="status" class="mt-1 mb-0 text-xs text-slate-600 dark:text-slate-300">
											Keep the extension open until the .zip finishes downloading.
										</p>`
									: null
							}
							${
								downloadError.value
									? html`<p role="alert" class="mt-1 mb-0 text-xs text-red-600 dark:text-red-400">
											${downloadError.value}
										</p>`
									: null
							}
							<div role="status">
								${
									downloadFailures.value.length > 0
										? html`
												<details class="mt-1 text-xs text-amber-700 dark:text-amber-400">
													<summary class="cursor-pointer">
														${`${downloadFailures.value.length} image${
															downloadFailures.value.length === 1 ? '' : 's'
														} could not be included in the .zip`}
													</summary>
													<ul class="mt-1 mb-0 max-h-24 overflow-y-auto pl-4">
														<${For} each=${downloadFailures.value}>
															${(/** @type {string} */ url) => html`
																<li class="truncate" title=${url.startsWith('data:') ? undefined : url}>
																	${imageLabel(url)}
																</li>
															`}
														<//>
													</ul>
												</details>
											`
										: null
								}
							</div>
						`
			}
		</footer>
	`;
}
