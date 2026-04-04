// @ts-check
import html, { For, useSignal } from '../html.js';

import { isIncludedIn, isNotIncludedIn, isNotStrictEqual, stopPropagation, unique } from '../utils.js';
import * as actions from './actions.js';
import { Checkbox } from './Checkbox.js';
import {
	allImages,
	columns,
	displayedImages,
	erroredImages,
	filteredOutImages,
	matchingImages,
	selectedImages,
	tab,
} from './data.js';
import { useImageStats } from './useImageStats.js';

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

	return html`
		<div class="flex flex-wrap items-start gap-2 p-2 pb-0 tabular-nums">
			<${Badge}
				as="ul"
				class="overflow-hidden border-slate-300"
				onChange=${
					/** @param {Event} e */ (e) => {
						tab.value = /** @type {HTMLInputElement} */ (e.target).value;
					}
				}
			>
				<li>
					<${Tab}
						class="text-slate-600 has-checked:text-slate-700"
						title="Images matching your filters"
						input=${{ name: 'visibility', value: 'matching', checked: tab.value === 'matching' }}
					>
						<${Circle} class="bg-green-600 text-white">+<//>
						${matchingImages.value.length} matching
					<//>
				</li>

				${filteredOutImages.value.length > 0 &&
				html`
					<li>
						<${Tab}
							class="border-l border-slate-300 text-slate-600 has-checked:text-slate-700"
							title="Images removed by your filters"
							input=${{ name: 'visibility', value: 'filtered_out', checked: tab.value === 'filtered_out' }}
						>
							<${Circle} class="bg-slate-600 text-white">-<//>
							${filteredOutImages.value.length} filtered out
						<//>
					</li>
				`}
				${erroredImages.value.length > 0 &&
				html`
					<li>
						<${Tab}
							class="border-l border-slate-300 text-red-600 has-checked:text-red-700"
							title="Images that failed to load"
							input=${{ name: 'visibility', value: 'errors', checked: tab.value === 'errors' }}
						>
							<${Circle} class="bg-red-600 text-white">×<//>
							${erroredImages.value.length} ${erroredImages.value.length === 1 ? 'error' : 'errors'}
						<//>
					</li>
				`}
			<//>

			<${Badge}
				as=${Checkbox}
				class="gap-1 border-slate-300 bg-slate-50 p-1 text-slate-600 transition-colors hover:bg-slate-100"
				checked=${selectedImages.value.length > 0 && allImagesFromCurrentTabAreSelected}
				indeterminate=${selectedImages.value.length > 0 && !allImagesFromCurrentTabAreSelected}
				disabled=${allImages.value.length === 0}
				title="Click to select or unselect all visible images"
				onChange=${(/** @type {Event} */ e) => {
					const { checked } = /** @type {HTMLInputElement} */ (e.currentTarget);
					selectedImages.value = checked
						? unique([...selectedImages.value, ...displayedImages.value])
						: selectedImages.value.filter(isNotIncludedIn(displayedImages.value));
				}}
			>
				${selectedImages.value.length} selected
			<//>

			<div class="mt-px ml-auto flex items-center gap-1.5">
				Columns:

				<button
					type="button"
					class="h-6 w-6 font-bold"
					aria-label="Fewer columns"
					onClick=${() => (columns.value = Math.max(1, columns.value - 1))}
				>
					-
				</button>

				${columns.value}

				<button
					type="button"
					class="h-6 w-6 font-bold"
					aria-label="More columns"
					onClick=${() => (columns.value = Math.min(columns.value + 1, 6))}
				>
					+
				</button>
			</div>
		</div>

		<div
			class="grid grid-cols-(--image-columns) gap-2 p-2"
			style=${{ '--image-columns': `repeat(${columns.value}, minmax(0, 1fr))`, ...style }}
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

/**
 * @param {Object} props
 * @param {string | Function} [props.as]
 * @param {string} [props.class]
 * @param {any} [props.children]
 * @param {Object} [props.onChange]
 */
function Badge({ as: Component = 'button', class: className = '', children, ...props }) {
	return html`
		<${Component}
			class="${className} flex items-center rounded-full border text-xs text-nowrap"
			...${Component === 'button' ? { type: 'button', ...props } : props}
		>
			${children}
		<//>
	`;
}

/**
 * @param {Object} props
 * @param {string} [props.class]
 * @param {any} [props.children]
 * @param {{ name: string, value: string, checked: boolean }} [props.input]
 */
function Tab({ class: className = '', children, input, ...props }) {
	return html`
		<label
			class="${className} bg-slate-50 p-1 transition-colors hover:bg-slate-100 has-checked:bg-slate-200"
			...${props}
		>
			<input class="sr-only" type="radio" ...${input} />
			${children}
		</label>
	`;
}

/**
 * @param {Object} props
 * @param {string} [props.class]
 * @param {any} [props.children]
 */
function Circle({ class: className = '', children, ...props }) {
	return html`
		<span class="corner-round ${className} inline-block h-4 w-4 rounded-full text-center font-bold" ...${props}>
			${children}
		</span>
	`;
}

/**
 * @param {Object} props
 * @param {string} props.imageUrl
 */
function ImageCard({ imageUrl, ...props }) {
	const stats = useImageStats();
	const retryCount = useSignal(0);
	const isSelected = selectedImages.value.includes(imageUrl);

	return html`
		<div
			class="group relative cursor-pointer flex justify-center items-center overflow-hidden rounded-xl shadow-md"
			style=${{
				minHeight: `192px`,
				backgroundImage:
					'conic-gradient(var(--color-slate-100) 90deg, var(--color-slate-300) 90deg 180deg, var(--color-slate-100) 180deg 270deg, var(--color-slate-300) 270deg)',
				backgroundRepeat: 'repeat',
				backgroundSize: '12px 12px',
			}}
			...${props}
		>
			${
				stats.data.value.status === 'error'
					? html`<${ImageError}
							onClick=${() => {
								erroredImages.value = erroredImages.value.filter(isNotStrictEqual(imageUrl));
								retryCount.value++;
								stats.reset();
							}}
						/>`
					: html`<img
							key=${retryCount.value}
							class="drop-shadow-md"
							src=${imageUrl}
							onLoad=${stats.onLoad}
							onError=${stats.onError}
						/>`
			}

			<div
				class=${`
					absolute top-1 left-1
					w-7 h-7
					rounded-md border shadow-md
					transition-all
					${isSelected ? 'border-sky-600 bg-sky-600' : 'hidden border-slate-400 bg-white'}
					group-hover:block
					after:content-['']
					after:absolute after:top-1/2 after:left-1/2
					after:-translate-x-1/2 after:-translate-y-2/3
					after:w-4.5 after:h-2.5
					after:border-3 after:border-t-0 after:border-r-0
					after:-rotate-45
					after:transition-all
					${isSelected ? 'after:border-white' : 'after:border-slate-400'}
				`}
			></div>

			<div class="absolute top-1 right-1 hidden group-hover:flex gap-1">
				<${OpenImageButton} imageUrl=${imageUrl} onClick=${stopPropagation} />
				<${DownloadImageButton} imageUrl=${imageUrl} onClick=${stopPropagation} />
			</div>

			<div class="absolute right-1 bottom-1 left-1">
				<!-- Toggle opacity - toggling display messes with the input content scrolling -->
				<${ImageUrlTextbox} class="opacity-0 group-hover:opacity-100 w-full" value=${imageUrl} />

				<div class="group-hover:hidden flex gap-1">
					<${ImageStat} class="uppercase">${stats.data.value.extension}</${ImageStat}>

					${
						stats.data.value.status === 'loaded' &&
						html`
						<${ImageStat}>${stats.data.value.width}×${stats.data.value.height}</${ImageStat}>
						<${ImageStat} class="small-caps lowercase">${stats.data.value.size ? stats.data.value.size.formatted : ''}</${ImageStat}>
					`
					}
				</div>
			</div>
		</div>
	`;
}

/**
 * @param {Object} props
 * @param {(e: MouseEvent) => void} [props.onClick]
 */
function ImageError({ onClick, ...props }) {
	return html`
		<button
			class="flex h-auto flex-col items-center justify-center gap-1 border-red-300 bg-red-50 p-4 text-xs text-red-600 hover:bg-red-100"
			type="button"
			title="Retry loading image"
			onClick=${
				/** @param {MouseEvent} e */ (e) => {
					e.stopPropagation();
					onClick?.(e);
				}
			}
			...${props}
		>
			<div>
				<${Circle} class="bg-red-600 text-white">×<//>
				${' '}Error loading image
			</div>
			Click to retry
		</button>
	`;
}

/**
 * @param {Object} props
 * @param {string} props.imageUrl
 * @param {(e: MouseEvent) => void} [props.onClick]
 */
function OpenImageButton({ imageUrl, onClick, ...props }) {
	/**
	 * @param {MouseEvent} e
	 */
	function openNewTab(e) {
		chrome.tabs.create({ url: imageUrl, active: false });
		if (onClick) {
			onClick(e);
		}
	}

	return html`
		<button
			class="h-7 w-7 rounded bg-size-[20px] bg-center bg-no-repeat shadow-md"
			style=${{ backgroundImage: 'url("/images/open.svg")' }}
			type="button"
			title="Open in new tab"
			onClick=${openNewTab}
			...${props}
		/>
	`;
}

/**
 * @param {Object} props
 * @param {string} props.imageUrl
 * @param {(e: MouseEvent) => void} [props.onClick]
 */
function DownloadImageButton({ imageUrl, onClick, ...props }) {
	/**
	 * @param {MouseEvent} e
	 */
	function downloadImages(e) {
		actions.downloadImages([imageUrl]);
		if (onClick) {
			onClick(e);
		}
	}

	return html`
		<button
			class="h-7 w-7 rounded bg-size-[20px] bg-center bg-no-repeat shadow-md"
			style=${{ backgroundImage: 'url("/images/download.svg")' }}
			type="button"
			title="Download"
			onClick=${downloadImages}
			...${props}
		/>
	`;
}

/**
 * @param {Object} props
 * @param {string} [props.class]
 * @param {any} [props.children]
 */
function ImageStat({ class: className = '', children, ...props }) {
	return html`
		<small class="${className} rounded bg-slate-950/80 px-1 text-white empty:hidden" ...${props}>${children}</small>
	`;
}

/**
 * @param {Object} props
 */
function ImageUrlTextbox(props) {
	// TODO: Implement
	// const inputRef = useRef(null);

	// function scrollToEnd() {
	// 	const input = inputRef.current;
	// 	if (input) {
	// 		input.scrollLeft = input.scrollWidth;
	// 	}
	// }

	// useLayoutEffect(scrollToEnd, []);

	return html`
		<input
			type="text"
			readonly
			onClick=${
				/** @param {MouseEvent} e */ (e) => {
					e.stopPropagation();
					/** @type {HTMLInputElement} */ (e.currentTarget).select();
				}
			}
			...${props}
		/>
	`;
}
