// @ts-check
import html, { For, useEffect, useRef, useSignal, useSignalEffect } from '../html.js';

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
	// The zip runs in the background, so another panel may have started it.
	const zipIsPreparing = useSignal(false);
	const downloadConfirmationIsShown = useSignal(false);
	const downloadError = useSignal('');
	const downloadFailures = useSignal(/** @type {string[]} */ ([]));
	const cancelController = useRef(/** @type {AbortController | null} */ (null));
	const previousSelection = useRef(/** @type {string[]} */ ([]));
	const zipRevision = useRef(0);

	useSignalEffect(() => {
		const selection = selectedImages.value;
		// Page reloads rewrite the same selection; only a content change makes the messages stale.
		if (arraysEqual(selection, previousSelection.current)) return;

		previousSelection.current = selection;
		downloadError.value = '';
		downloadFailures.value = [];
	});

	/** @param {import('../background/zipJobs.js').ZipJobState | undefined} state */
	function showZipJob(state) {
		if (!state || state.revision < zipRevision.current) return;
		zipRevision.current = state.revision;
		zipIsPreparing.value = state.status === 'preparing';

		if (state.status === 'idle' || !arraysEqual(state.images, selectedImages.value)) return;
		if (state.status === 'started') downloadFailures.value = state.failed;
		else if (state.status === 'failed') downloadError.value = state.error;
	}

	useEffect(() => {
		const showChangedZipJob = (/** @type {any} */ message) => {
			if (message?.type === 'zipJobChanged') showZipJob(message.state);
		};
		chrome.runtime.onMessage.addListener(showChangedZipJob);
		// Results of a job that finished while this panel was closed are stale.
		actions.getZipJob().then((state) => state?.status === 'preparing' && showZipJob(state));
		return () => chrome.runtime.onMessage.removeListener(showChangedZipJob);
	}, []);

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
		downloadIsInProgress.value = true;
		downloadError.value = '';
		downloadFailures.value = [];

		try {
			if (mode === 'zip') {
				showZipJob(await actions.downloadImagesAsZip(images, controller.signal));
			} else {
				await actions.downloadImages(images);
			}
		} catch (error) {
			if (!controller.signal.aborted) {
				downloadError.value = error instanceof Error ? error.message : `${error}`;
			}
		} finally {
			if (cancelController.current === controller) cancelController.current = null;
			downloadIsInProgress.value = false;
		}
	}

	function cancelZip() {
		cancelController.current?.abort();
		if (zipIsPreparing.value)
			actions.cancelZip().then(
				({ state }) => showZipJob(state),
				() => {}
			);
		zipIsPreparing.value = false;
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
									loading=${downloadIsInProgress.value || zipIsPreparing.value}
									selectedCount=${selectedImages.value.length}
									selectedImages=${selectedImages.value}
									mode=${downloadMode.value}
									isPopup=${isPopup}
									onClick=${maybeDownloadImages}
									onSelectMode=${selectDownloadMode}
								/>
							</div>

							${
								zipIsPreparing.value || (downloadIsInProgress.value && downloadMode.value === 'zip')
									? html`
											<button
												type="button"
												class="mt-1 ml-auto block rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
												title="Cancel preparing the .zip"
												onClick=${cancelZip}
											>
												Cancel
											</button>
										`
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
