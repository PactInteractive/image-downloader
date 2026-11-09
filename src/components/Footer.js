// @ts-check
import html, { For, useSignal } from '../html.js';

import { removeSpecialCharacters, setToInvertedCheckboxValue } from '../utils.js';
import * as actions from './actions.js';
import { downloadMode, folderName, newFileName, selectedImages, showDownloadConfirmation } from './data.js';
import { DownloadButton } from './DownloadButton.js';
import { DownloadConfirmation } from './DownloadConfirmation.js';
import { useRunAfterUpdate } from './useRunAfterUpdate.js';
import { imageLabel } from './zip.js';

export function Footer(/** @type {{ isPopup?: boolean } & Object} */ { isPopup = false, ...props }) {
	// Download
	const downloadIsInProgress = useSignal(false);
	const downloadConfirmationIsShown = useSignal(false);
	const downloadError = useSignal('');
	const downloadFailures = useSignal(/** @type {string[]} */ ([]));

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
		downloadIsInProgress.value = true;
		downloadError.value = '';
		downloadFailures.value = [];

		try {
			if (downloadMode.value === 'zip') {
				downloadFailures.value = await actions.downloadImagesAsZip(selectedImages.value);
			} else {
				await actions.downloadImages(selectedImages.value);
			}
		} catch (error) {
			downloadError.value = error instanceof Error ? error.message : `${error}`;
		} finally {
			downloadIsInProgress.value = false;
		}
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
									selectedCount=${selectedImages.value.length}
									selectedImages=${selectedImages.value}
									mode=${downloadMode.value}
									isPopup=${isPopup}
									onClick=${maybeDownloadImages}
									onSelectMode=${selectDownloadMode}
								/>
							</div>

							${
								downloadError.value
									? html`<p role="alert" class="mt-1 mb-0 text-xs text-red-600 dark:text-red-400">
											${downloadError.value}
										</p>`
									: null
							}
							${
								downloadFailures.value.length > 0
									? html`
											<details class="mt-1 text-xs text-amber-700 dark:text-amber-400" aria-live="polite">
												<summary class="cursor-pointer">
													${downloadFailures.value.length} image${downloadFailures.value.length === 1 ? '' : 's'} could
													not be included in the .zip
												</summary>
												<ul class="mt-1 mb-0 max-h-24 overflow-y-auto pl-4">
													<${For} each=${downloadFailures.value}>
														${(/** @type {string} */ url) => html`
															<li class="truncate" title=${url}>${imageLabel(url)}</li>
														`}
													<//>
												</ul>
											</details>
										`
									: null
							}
						`
			}
		</footer>
	`;
}
