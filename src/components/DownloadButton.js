// @ts-check
import html, { useRef, useSignal } from '../html.js';
import { imageOrigins } from './zip.js';

/**
 * @typedef {'individual' | 'zip'} DownloadMode
 */

/**
 * @param {{
 *   class?: string,
 *   loading: boolean,
 *   selectedCount: number,
 *   selectedImages: string[],
 *   mode: DownloadMode,
 *   isPopup?: boolean,
 *   onClick: (event: MouseEvent) => void,
 *   onSelectMode: (mode: DownloadMode) => void,
 * }} props
 */
export function DownloadButton({
	class: className = '',
	loading,
	selectedCount,
	selectedImages,
	mode,
	isPopup = false,
	onClick,
	onSelectMode,
	...props
}) {
	const triggerRef = useRef(/** @type {HTMLDivElement | null} */ (null));
	const menuRef = useRef(/** @type {HTMLDivElement | null} */ (null));
	const expanded = useSignal(false);
	const permissionHosts = useSignal(/** @type {string[]} */ ([]));
	const permissionCheckRef = useRef(0);
	const empty = selectedCount === 0;
	const hosts = permissionHosts.value;
	const additionalHostCount = hosts.length - 2;
	const permissionHint =
		hosts.length === 0
			? null
			: hosts.length === 1
				? html`Choosing .zip will ask you to allow access to <b>${hosts[0]}</b>`
				: hosts.length === 2
					? html`Choosing .zip will ask you to allow access to <b>${hosts[0]}</b> and <b>${hosts[1]}</b>`
					: html`Choosing .zip will ask you to allow access to <b>${hosts[0]}</b>, <b>${hosts[1]}</b> and
							${additionalHostCount} more ${additionalHostCount === 1 ? 'site' : 'sites'}`;
	const popupRetryWarning =
		isPopup && hosts.length > 0
			? html` - after granting access, reopen the extension popup and click <b>Download</b> again.`
			: null;

	const tooltip = empty
		? 'Select some images to download them'
		: loading
			? mode === 'zip'
				? 'Keep the extension open while the .zip is prepared'
				: 'If you want, you can close the extension popup\nwhile the images are downloading!'
			: mode === 'zip'
				? 'Download the selected images as a .zip'
				: 'Download the selected images as individual files';

	function positionMenu() {
		const trigger = triggerRef.current;
		const menu = menuRef.current;
		if (!trigger || !menu) return;

		const rect = trigger.getBoundingClientRect();
		const width = Math.min(288, window.innerWidth - 8);
		// The surface is in the top layer, so it is positioned from the trigger's rectangle.
		menu.style.width = `${width}px`;
		menu.style.maxWidth = `calc(100vw - 8px)`;
		menu.style.left = `${Math.min(Math.max(4, rect.right - width), window.innerWidth - width - 4)}px`;
		menu.style.right = 'auto';
		menu.style.bottom = `${window.innerHeight - rect.top + 4}px`;
		menu.style.top = 'auto';
	}

	function selectMode(/** @type {DownloadMode} */ selectedMode) {
		const menu = menuRef.current;
		if (menu?.matches(':popover-open')) menu.hidePopover();
		onSelectMode(selectedMode);
	}

	function openMenu() {
		const menu = menuRef.current;
		if (menu && !menu.matches(':popover-open')) menu.showPopover();
	}

	async function updatePermissionHint() {
		const checkId = ++permissionCheckRef.current;
		if (permissionHosts.value.length > 0) permissionHosts.value = [];

		const origins = imageOrigins(selectedImages);
		if (empty || origins.length === 0 || !chrome.permissions) return;

		try {
			/** @type {string[]} */
			const missing = [];
			await Promise.all(
				origins.map(async (origin) => {
					if (!(await chrome.permissions.contains({ origins: [origin] }))) {
						missing.push(origin);
					}
				})
			);

			if (permissionCheckRef.current !== checkId) return;

			permissionHosts.value = [
				...new Set(missing.map((origin) => origin.replace(/^https?:\/\//, '').replace(/\/\*$/, ''))),
			];
		} catch {
			// If access can't be inspected, the request itself will explain what it needs.
		}
	}

	function handleDownloadClick(/** @type {MouseEvent} */ event) {
		if (empty) {
			openMenu();
		} else {
			onClick(event);
		}
	}

	return html`
		<div ref=${triggerRef} class="${className} flex items-stretch">
			<button
				class="${
					loading ? 'animate-pulse' : ''
				} flex flex-col items-center justify-center rounded-l-xl rounded-r-none border-r-0 bg-sky-700 px-2 leading-none whitespace-nowrap text-white hover:bg-sky-800 active:bg-sky-900"
				type="button"
				disabled=${loading}
				title=${tooltip}
				aria-controls=${empty ? 'download_options' : undefined}
				aria-expanded=${empty ? expanded.value : undefined}
				onClick=${handleDownloadClick}
				...${props}
			>
				<span class="leading-none tabular-nums">
					${loading ? '•••' : selectedCount > 0 ? `Download (${selectedCount})` : 'Download'}
				</span>
				<span class="text-2xs leading-none text-sky-100"> ${mode === 'zip' ? 'as .zip' : 'as individual files'} </span>
			</button>

			<button
				class="shrink-0 rounded-l-none rounded-r-xl border-l border-l-sky-400 bg-sky-700 px-1.5 text-white hover:bg-sky-800 active:bg-sky-900"
				type="button"
				disabled=${loading}
				aria-label="Choose how to download"
				aria-controls="download_options"
				aria-expanded=${expanded.value}
				title="Choose how to download"
				popovertarget="download_options"
			>
				<svg class="size-3" viewBox="0 0 448 512" aria-hidden="true">
					<path
						d="M441.9 167.3l-19.8-19.8c-4.7-4.7-12.3-4.7-17 0L224 328.2 42.9 147.5c-4.7-4.7-12.3-4.7-17 0L6.1 167.3c-4.7 4.7-4.7 12.3 0 17l209.4 209.4c4.7 4.7 12.3 4.7 17 0l209.4-209.4c4.7-4.7 4.7-12.3 0-17z"
					/>
				</svg>
			</button>
		</div>

		<div
			ref=${menuRef}
			id="download_options"
			popover="auto"
			role="group"
			aria-label="Download options"
			class="fixed m-0 max-h-[calc(100vh-8px)] w-72 overflow-y-auto rounded-xl border border-slate-300 bg-white p-1 text-slate-950 shadow-lg dark:border-slate-600 dark:bg-slate-800 dark:text-white"
			onBeforeToggle=${(/** @type {{ newState: string }} */ event) => {
				if (event.newState === 'open') {
					positionMenu();
					updatePermissionHint();
				}
			}}
			onToggle=${(/** @type {{ newState: string }} */ event) => (expanded.value = event.newState === 'open')}
		>
			${
				empty
					? html`
							<div
								class="mx-1 mt-1 mb-2 flex items-start gap-1 rounded-lg border border-sky-200 bg-sky-50 p-2 text-xs leading-snug text-sky-900 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-100"
							>
								${infoIcon('mt-px size-3.5 shrink-0 text-sky-600 dark:text-sky-400')}
								<span>Choose some images to download by clicking them above.</span>
							</div>
						`
					: null
			}

			<button
				type="button"
				aria-pressed=${mode === 'individual'}
				autofocus=${!empty && mode === 'individual'}
				disabled=${empty || loading}
				class="flex h-8 w-full items-center gap-2 rounded-lg border-0 bg-transparent px-2 text-left text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:bg-transparent dark:hover:bg-slate-700"
				onClick=${() => selectMode('individual')}
			>
				<span>
					${
						selectedCount === 0
							? 'Download as individual files'
							: selectedCount === 1
								? 'Download as 1 individual file'
								: `Download as ${selectedCount} individual files`
					}
				</span>
				${mode === 'individual' ? checkIcon() : null}
			</button>

			<button
				type="button"
				aria-pressed=${mode === 'zip'}
				aria-describedby=${hosts.length > 0 ? 'download_permission_hint' : undefined}
				autofocus=${!empty && mode === 'zip'}
				disabled=${empty || loading}
				class="flex h-8 w-full items-center gap-2 rounded-lg border-0 bg-transparent px-2 text-left text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:bg-transparent dark:hover:bg-slate-700"
				onClick=${() => selectMode('zip')}
			>
				<span>Download as .zip</span>
				${mode === 'zip' ? checkIcon() : null}
			</button>

			${
				permissionHint
					? html`
							<div
								id="download_permission_hint"
								class="text-2xs mx-0 mt-[-4px] mb-0 px-2 pt-0 pb-1 leading-snug text-slate-500 dark:text-slate-400"
								title=${hosts.join('\n')}
							>
								<p class="m-0">${permissionHint}${popupRetryWarning}</p>
							</div>
						`
					: null
			}
		</div>
	`;
}

function infoIcon(/** @type {string} */ className) {
	return html`
		<svg class=${className} viewBox="0 0 512 512" aria-hidden="true">
			<path
				d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"
			/>
		</svg>
	`;
}

function checkIcon() {
	return html`
		<svg class="ml-auto size-4 shrink-0 text-sky-600 dark:text-sky-400" viewBox="0 0 448 512" aria-hidden="true">
			<path
				d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"
			/>
		</svg>
	`;
}
