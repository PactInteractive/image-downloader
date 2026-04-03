// @ts-check
import html, { useSignal } from '../html.js';

import { removeSpecialCharacters } from '../utils.js';
import * as actions from './actions.js';
import { options, selectedImages, updateOptions } from './data.js';
import { DownloadButton } from './DownloadButton.js';
import { DownloadConfirmation } from './DownloadConfirmation.js';
import { useRunAfterUpdate } from './useRunAfterUpdate.js';

export function Footer(/** @type {Object} */ props) {
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

	return html`
		<footer ...${props}>
			${downloadConfirmationIsShown.value
				? html`
						<${DownloadConfirmation}
							numberOfImages=${selectedImages.value.length}
							onCheckboxChange=${(/** @type {Event} */ e) => {
								updateOptions({
									show_download_confirmation: !(/** @type {HTMLInputElement} */ (e.currentTarget).checked),
								});
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

									updateOptions({ folder_name: removeSpecialCharacters(input.value) });
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

									updateOptions({ new_file_name: removeSpecialCharacters(input.value) });
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
