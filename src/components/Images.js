// @ts-check
import html, { For, Show, useComputed, useSignal } from '../html.js';

import { getReferralUrl, isIncludedIn, isNotIncludedIn, isNotStrictEqual, stopPropagation, unique } from '../utils.js';
import * as actions from './actions.js';
import { Checkbox } from './Checkbox.js';
import {
	columns,
	displayedImages,
	filteredOutImages,
	imageErrored,
	imageLoaded,
	matchingImages,
	selectedFilteredOutImages,
	selectedImages,
	selectedMatchingImages,
	tab,
	theme,
} from './data.js';
import { ExternalLink } from './ExternalLink.js';
import { Icon } from './Icon.js';
import { useImageStats } from './useImageStats.js';
import { useScrollToEnd } from './useScrollToEnd.js';

/**
 * @typedef {import('./useImageStats.js').ImageStatsData} ImageStatsData
 * @typedef {import('./useImageStats.js').ImageStats} ImageStats
 */

/**
 * @typedef {import('./data.js').Options} Options
 */

/**
 * @typedef {Object} CSSProperties
 * @property {string} [minHeight]
 * @property {string} [backgroundImage]
 * @property {string} [backgroundRepeat]
 * @property {string} [backgroundSize]
 */

/**
 * @typedef {Object} ImagesProps
 * @property {string} [class]
 * @property {CSSProperties} [style]
 */

export function Images(/** @type {ImagesProps} */ { class: className, style, ...props }) {
	const allImagesFromCurrentTabAreSelected = displayedImages.value.every(isIncludedIn(selectedImages.value));

	const themeTooltip = {
		system: 'Using your system theme',
		dark: 'Using dark theme',
		light: 'Using light theme',
	}[theme.value];

	const themeIcon = /** @type {'monitor' | 'moon' | 'sun'} */ (
		{ system: 'monitor', dark: 'moon', light: 'sun' }[theme.value]
	);

	return html`
		<div class="flex flex-wrap items-start gap-2 p-2 pb-0 tabular-nums">
			<ul
				class="flex items-center gap-0.5 rounded-[10px] border border-black/8 bg-black/5 p-0.5 text-xs text-nowrap dark:border-white/10 dark:bg-white/5"
				onChange=${(/** @type {Event} */ e) => {
					tab.value = /** @type {HTMLInputElement} */ (e.target).value;
				}}
			>
				<li>
					<${Tab}
						title="Images matching your filters"
						input=${{ name: 'visibility', value: 'matching', checked: tab.value === 'matching' }}
					>
						<${Circle} class="bg-green-600 text-white">
							${
								selectedMatchingImages.value.length > 0
									? html`<span class="text-2xs">${selectedMatchingImages.value.length}</span>`
									: '+'
							}
						<//>
						${matchingImages.value.length} matching
					<//>
				</li>

				<li>
					<${Tab}
						title="Images removed by your filters"
						input=${{ name: 'visibility', value: 'filtered_out', checked: tab.value === 'filtered_out' }}
					>
						<${Circle} class="bg-slate-600 text-white">
							${
								selectedFilteredOutImages.value.length > 0
									? html`<span class="text-2xs">${selectedFilteredOutImages.value.length}</span>`
									: '-'
							}
						<//>
						${filteredOutImages.value.length} filtered out
					<//>
				</li>
			</ul>

			<${Checkbox}
				class="flex h-7.5 items-center gap-1.5 rounded-[10px] border border-black/8 bg-white px-2.5 text-xs text-nowrap text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
				checked=${selectedImages.value.length > 0 && allImagesFromCurrentTabAreSelected}
				indeterminate=${selectedImages.value.length > 0 && !allImagesFromCurrentTabAreSelected}
				disabled=${displayedImages.value.length === 0}
				title="Click to select or unselect all displayed images"
				onChange=${(/** @type {Event} */ e) => {
					const { checked } = /** @type {HTMLInputElement} */ (e.currentTarget);
					selectedImages.value = checked
						? unique([...selectedImages.value, ...displayedImages.value])
						: selectedImages.value.filter(isNotIncludedIn(displayedImages.value));
				}}
			>
				${selectedImages.value.length} selected
			<//>

			<div class="mt-px ml-auto flex items-center gap-1.5 text-xs">
				<div
					class="flex items-center gap-0.5 overflow-hidden rounded-[10px] border border-black/8 bg-white p-0.5 dark:border-white/10 dark:bg-slate-800"
				>
					<button
						type="button"
						class="inline-flex size-6 items-center justify-center rounded-lg border-0 bg-transparent text-slate-600 shadow-none hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
						aria-label="Fewer columns"
						onClick=${() => (columns.value = Math.max(1, columns.value - 1))}
					>
						<${Icon} name="minus" size=${14} />
					</button>

					<span class="min-w-4 text-center tabular-nums" title="Number of columns">${columns}</span>

					<button
						type="button"
						class="inline-flex size-6 items-center justify-center rounded-lg border-0 bg-transparent text-slate-600 shadow-none hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
						aria-label="More columns"
						onClick=${() => (columns.value = Math.min(columns.value + 1, 6))}
					>
						<${Icon} name="plus" size=${14} />
					</button>
				</div>

				<button
					class="inline-flex size-7 items-center justify-center text-slate-600 dark:text-slate-300"
					title=${`${themeTooltip} (click to cycle)`}
					onClick=${() => {
						theme.value = theme.value === 'system' ? 'light' : theme.value === 'light' ? 'dark' : 'system';
					}}
				>
					<${Icon} name=${themeIcon} size=${16} />
				</button>
			</div>
		</div>

		<div
			class="grid gap-2 p-2"
			style=${{ gridTemplateColumns: `repeat(${columns.value}, minmax(0, 1fr))`, ...style }}
			...${props}
		>
			<${For} each=${displayedImages}>
				${(/** @type {string} */ imageUrl) => html`
					<${ImageCard}
						key=${imageUrl}
						imageUrl=${imageUrl}
						onClick=${() => {
							selectedImages.value = selectedImages.value.includes(imageUrl)
								? selectedImages.value.filter(isNotStrictEqual(imageUrl))
								: [...selectedImages.value, imageUrl];
						}}
					/>
				`}
			<//>
		</div>
	`;
}

function Tab(
	/** @type {{ class?: string, children?: any, input?: { name: string, value: string, checked: boolean } }} */ {
		class: className = '',
		children,
		input,
		...props
	}
) {
	return html`
		<label
			class="${className} flex items-center gap-1 rounded-lg px-2 py-1 text-slate-500 transition-[background-color,color,box-shadow] duration-200 hover:text-slate-700 has-checked:bg-white has-checked:text-slate-800 has-checked:shadow-[0_1px_1px_rgb(0_0_0/0.04),0_1px_3px_rgb(0_0_0/0.1)] dark:text-slate-400 dark:hover:text-slate-200 dark:has-checked:bg-slate-600 dark:has-checked:text-white"
			...${props}
		>
			<input class="sr-only" type="radio" ...${input} />
			${children}
		</label>
	`;
}

function Circle(/** @type {{ class?: string, children?: any }} */ { class: className = '', children, ...props }) {
	return html`
		<span
			class="corner-round ${className} inline-block h-4 min-w-4 rounded-full px-1 text-center font-bold"
			...${props}
		>
			${children}
		</span>
	`;
}

function ImageCard(/** @type {{ imageUrl: string }} */ { imageUrl, ...props }) {
	const stats = useImageStats(imageUrl);
	const statsAreLoaded = useComputed(() => stats.data.value.status === 'loaded');
	const retryCount = useSignal(0);
	const isSelected = selectedImages.value.includes(imageUrl);

	return html`
		<div
			class="group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl border bg-[conic-gradient(var(--color-slate-100)_90deg,var(--color-slate-300)_90deg_180deg,var(--color-slate-100)_180deg_270deg,var(--color-slate-300)_270deg)] transition-[box-shadow,outline-color] duration-200 dark:bg-[conic-gradient(var(--color-slate-800)_90deg,var(--color-slate-700)_90deg_180deg,var(--color-slate-800)_180deg_270deg,var(--color-slate-700)_270deg)] ${isSelected ? 'border-sky-600 shadow-[0_4px_14px_-2px_color-mix(in_srgb,var(--color-sky-600)_45%,transparent)] outline-2 outline-sky-600 dark:border-sky-400 dark:outline-sky-400' : 'border-black/8 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_4px_12px_-4px_rgb(0_0_0/0.12)] hover:shadow-[0_2px_6px_rgb(0_0_0/0.08),0_8px_22px_-6px_rgb(0_0_0/0.18)] dark:border-white/10'}"
			style=${{
				minHeight: `192px`,
				backgroundRepeat: 'repeat',
				backgroundSize: '12px 12px',
			}}
			...${props}
		>
			${
				stats.data.value.status === 'error'
					? html`<${ImageError}
							onClick=${() => {
								retryCount.value++;
								stats.reset();
							}}
						/>`
					: html`<img
							key=${retryCount}
							class="outline outline-1 -outline-offset-1 outline-black/10 drop-shadow-sm dark:outline-white/10"
							src=${imageUrl}
							onLoad=${(/** @type {Event}  */ e) => {
								imageLoaded(imageUrl);
								stats.onLoad(e);
							}}
							onError=${(/** @type {Event}  */ e) => {
								imageErrored(imageUrl);
								stats.onError();
							}}
						/>`
			}

			<div
				class=${`
					absolute top-1.5 left-1.5
					flex h-6 w-6 items-center justify-center
					rounded-lg border shadow-md backdrop-blur-sm
					transition-[background-color,border-color,color] duration-150
					group-hover:flex
					${
						isSelected
							? 'flex border-sky-600 bg-sky-600 text-white'
							: 'hidden border-black/10 bg-white/85 text-transparent dark:border-white/15 dark:bg-slate-900/70'
					}
				`}
			>
				<${Icon} name="check" size=${14} />
			</div>

			<div class="absolute top-1.5 right-1.5 hidden gap-1 group-hover:flex">
				<${RemoveBackgroundButton} imageUrl=${imageUrl} />
				<${OpenImageButton} imageUrl=${imageUrl} onClick=${stopPropagation} />
				<${DownloadImageButton} imageUrl=${imageUrl} onClick=${stopPropagation} />
			</div>

			<div class="absolute right-1 bottom-1 left-1">
				<!-- Toggle opacity - toggling display messes with the input content scrolling -->
				<${ImageUrlTextbox} class="opacity-0 group-hover:opacity-100 w-full" url=${imageUrl} />

				<div class="group-hover:hidden flex gap-1">
					<${ImageStat} class="uppercase">${stats.data.value.extension}</${ImageStat}>

					<${Show} when=${statsAreLoaded}>
						<${ImageStat}>${stats.data.value.width}×${stats.data.value.height}</${ImageStat}>
						<${ImageStat} class="small-caps lowercase">${stats.data.value.size ? stats.data.value.size.formatted : ''}</${ImageStat}>
					<//>
				</div>
			</div>
		</div>
	`;
}

function ImageError(/** @type {{ onClick?: (e: MouseEvent) => void }} */ { onClick, ...props }) {
	return html`
		<button
			class="flex h-auto flex-col items-center justify-center gap-1 border-red-300 bg-red-50 p-4 text-xs text-red-600 hover:bg-red-100"
			type="button"
			title="Retry loading image"
			onClick=${(/** @type {MouseEvent} e */ e) => {
				e.stopPropagation();
				onClick?.(e);
			}}
			...${props}
		>
			<div><${Circle} class="bg-red-600 text-white">×<//> Error loading image</div>
			Click to retry
		</button>
	`;
}

function RemoveBackgroundButton(/** @type {{ imageUrl: string }} */ { imageUrl, ...props }) {
	return html`
		<${ExternalLink}
			...${props}
			class="btn flex h-7 w-7 items-center justify-center rounded-lg bg-size-[18px] bg-center bg-no-repeat text-transparent shadow-md"
			style=${{ backgroundImage: 'url("/images/cutout.svg")' }}
			href=${getReferralUrl('https://cutoutmagic.com/library', { url: imageUrl, utm_content: 'remove_background_button' })}
			title="Remove background with CutoutMagic.com"
			onClick=${stopPropagation}
		>
			Remove background with CutoutMagic.com
		<//>
	`;
}

function OpenImageButton(
	/** @type {{ imageUrl: string, onClick?: (e: MouseEvent) => void }} */ { imageUrl, onClick, ...props }
) {
	function openNewTab(/** @type {MouseEvent} */ e) {
		chrome.tabs.create({ url: imageUrl, active: false });
		if (onClick) {
			onClick(e);
		}
	}

	return html`
		<button
			class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/85 text-slate-700 shadow-md backdrop-blur-sm hover:bg-white dark:bg-slate-800/85 dark:text-slate-100 dark:hover:bg-slate-800"
			type="button"
			title="Open in new tab"
			onClick=${openNewTab}
			...${props}
		>
			<${Icon} name="open" size=${16} />
		</button>
	`;
}

function DownloadImageButton(
	/** @type {{ imageUrl: string, onClick?: (e: MouseEvent) => void }} */ { imageUrl, onClick, ...props }
) {
	function downloadImages(/** @type {MouseEvent} */ e) {
		actions.downloadImages([imageUrl]);
		if (onClick) {
			onClick(e);
		}
	}

	return html`
		<button
			class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/85 text-slate-700 shadow-md backdrop-blur-sm hover:bg-white dark:bg-slate-800/85 dark:text-slate-100 dark:hover:bg-slate-800"
			type="button"
			title="Download"
			onClick=${downloadImages}
			...${props}
		>
			<${Icon} name="download" size=${16} />
		</button>
	`;
}

function ImageStat(/** @type {{ class?: string; children?: any }} */ { class: className = '', children, ...props }) {
	return html`
		<small class="${className} rounded-md bg-slate-950/75 px-1.5 py-0.5 text-white backdrop-blur-sm empty:hidden" ...${props}>${children}</small>
	`;
}

function ImageUrlTextbox(/** @type {{ class?: string; url: string }} */ { class: className = '', url, ...props }) {
	const inputRef = useScrollToEnd();

	function setInputValue(/** @type {string} */ value) {
		if (inputRef.current) {
			inputRef.current.value = value;
		}
	}

	return html`
		<div class="${className} flex">
			<input
				ref=${inputRef}
				class="flex-1 rounded-r-none border-r-0"
				type="text"
				readonly
				value=${url}
				onClick=${(/** @type {MouseEvent} */ e) => {
					e.stopPropagation();
					/** @type {HTMLInputElement} */ (e.currentTarget).select();
				}}
				...${props}
			/>

			<button
				type="button"
				class="inline-flex w-8 items-center justify-center rounded-l-none text-slate-600 dark:text-slate-300"
				title="Copy image URL to clipboard"
				onClick=${async (/** @type {Event} */ e) => {
					e.stopPropagation();
					await window.navigator.clipboard.writeText(url);
					setInputValue('Copied URL!');
					setTimeout(() => setInputValue(url), 2000);
				}}
			>
				<${Icon} name="copy" size=${15} />
			</button>
		</div>
	`;
}
