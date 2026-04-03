import html, { useEffect, useLayoutEffect, useMemo, useRef, useState } from '../html.js';

import { add, isIncludedIn, isNotIncludedIn, isNotStrictEqual, stopPropagation, unique } from '../utils.js';
import * as actions from './actions.js';
import { Checkbox } from './Checkbox.js';
import { useOptions } from './OptionsProvider.js';
import { useImageStats } from './useImageStats.js';

export function Images({ allImages, matchingImages, erroredUrlsRef, style, ...props }) {
	const [options, updateOptions] = useOptions();

	const [tab, setTab] = useState('matching');
	const displayedImages = useMemo(() => {
		if (!allImages) {
			return matchingImages;
		}
		if (tab === 'matching') {
			return matchingImages;
		}
		if (tab === 'filtered_out') {
			return allImages.filter((url) => !matchingImages.includes(url) && !erroredUrlsRef?.current?.has(url));
		}
		if (tab === 'errors') {
			return allImages.filter((url) => erroredUrlsRef?.current?.has(url));
		}
		return matchingImages;
	}, [tab, allImages, matchingImages, errorCount]);

	const selectedImages = useMemo(
		() => options.selected_images.filter(isIncludedIn(allImages)),
		[options.selected_images, allImages]
	);
	const errorCount = erroredUrlsRef.current.size;
	const filteredOutCount = allImages.length - matchingImages.length - errorCount;

	const allImagesFromCurrentTabAreSelected = displayedImages.every(isIncludedIn(selectedImages));

	return html`
		<div class="flex flex-wrap items-start gap-2 p-2 pb-0 tabular-nums">
			${displayedImages.length > 0 &&
			html`
				<${Badge} as="ul" class="overflow-hidden border-slate-300" onChange=${(e) => setTab(e.target.value)}>
					<li>
						<${Tab}
							class="text-slate-600 has-checked:text-slate-700"
							title="Images matching your filters"
							input=${{ name: 'visibility', value: 'matching', checked: tab === 'matching' }}
						>
							<${Circle} class="bg-green-600 text-white">+<//>
							${allImages.length - filteredOutCount - errorCount} matching
						<//>
					</li>

					${filteredOutCount > 0 &&
					html`
						<li>
							<${Tab}
								class="border-l border-slate-300 text-slate-600 has-checked:text-slate-700"
								title="Images removed by your filters"
								input=${{ name: 'visibility', value: 'filtered_out', checked: tab === 'filtered_out' }}
							>
								<${Circle} class="bg-slate-600 text-white">-<//>
								${filteredOutCount} filtered out
							<//>
						</li>
					`}
					${errorCount > 0 &&
					html`
						<li>
							<${Tab}
								class="border-l border-slate-300 text-red-600 has-checked:text-red-700"
								title="Images that failed to load"
								input=${{ name: 'visibility', value: 'errors', checked: tab === 'errors' }}
							>
								<${Circle} class="bg-red-600 text-white">×<//>
								${errorCount} ${errorCount === 1 ? 'error' : 'errors'}
							<//>
						</li>
					`}
				<//>

				<${Badge}
					as=${Checkbox}
					class="gap-1 border-slate-300 bg-slate-50 p-1 text-slate-600 transition-colors hover:bg-slate-100"
					checked=${selectedImages.length > 0 && allImagesFromCurrentTabAreSelected}
					indeterminate=${selectedImages.length > 0 && !allImagesFromCurrentTabAreSelected}
					disabled=${allImages.length === 0}
					title="Click to select or unselect all visible images"
					onChange=${({ currentTarget: { checked } }) =>
						updateOptions((options) => ({
							selected_images: checked
								? unique([...options.selected_images, ...displayedImages])
								: options.selected_images.filter(isNotIncludedIn(displayedImages)),
						}))}
				>
					${selectedImages.length} selected
				<//>
			`}

			<div class="mt-px ml-auto flex items-center gap-1.5">
				Columns:

				<button
					type="button"
					class="h-6 w-6 font-bold"
					aria-label="Fewer columns"
					onClick=${() => {
						updateOptions({ columns: Math.max(1, options.columns - 1) });
					}}
				>
					-
				</button>

				${options.columns}

				<button
					type="button"
					class="h-6 w-6 font-bold"
					aria-label="More columns"
					onClick=${() => {
						updateOptions({ columns: Math.min(options.columns + 1, 6) });
					}}
				>
					+
				</button>
			</div>
		</div>

		<div
			class="grid grid-cols-(--image-columns) gap-2 p-2"
			style=${{ '--image-columns': `repeat(${options.columns}, minmax(0, 1fr))` }}
			...${props}
		>
			${displayedImages.map(
				(imageUrl) => html`
					<${ImageCard}
						key=${imageUrl}
						imageUrl=${imageUrl}
						selectedImages=${selectedImages}
						erroredUrlsRef=${erroredUrlsRef}
						onClick=${() => {
							updateOptions((options) =>
								options.selected_images.includes(imageUrl)
									? options.selected_images.filter(isNotStrictEqual(imageUrl))
									: [...options.selected_images, imageUrl]
							);
						}}
					/>
				`
			)}
		</div>
	`;
}

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

function Circle({ class: className = '', children, ...props }) {
	return html`
		<span class="corner-round ${className} inline-block h-4 w-4 rounded-full text-center font-bold" ...${props}>
			${children}
		</span>
	`;
}

function ImageCard({ imageUrl, selectedImages, erroredUrlsRef, ...props }) {
	const stats = useImageStats();
	const [retryCount, setRetryCount] = useState(0);
	const isSelected = selectedImages.includes(imageUrl);

	// Reset stats when imageUrl changes to avoid showing stale data
	useEffect(stats.reset, [imageUrl, stats.reset]);

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
		>
			${
				stats.data.status === 'error'
					? html`<${ImageError}
							onClick=${() => {
								erroredUrlsRef?.current?.delete(imageUrl);
								stats.reset();
								setRetryCount(add(1));
							}}
						/>`
					: html`<img
							key=${retryCount}
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
					<${ImageStat} class="uppercase">${stats.data.extension}</${ImageStat}>

					${
						stats.data.status === 'loaded' &&
						html`
						<${ImageStat}>${stats.data.width}×${stats.data.height}</${ImageStat}>
						<${ImageStat} class="small-caps lowercase">${stats.data.size ? stats.data.size.formatted : ''}</${ImageStat}>
					`
					}
				</div>
			</div>
		</div>
	`;
}

function ImageError({ onClick, ...props }) {
	return html`
		<button
			class="flex h-auto flex-col items-center justify-center gap-1 border-red-300 bg-red-50 p-4 text-xs text-red-600 hover:bg-red-100"
			type="button"
			title="Retry loading image"
			onClick=${(e) => {
				e.stopPropagation();
				onClick?.(e);
			}}
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

function OpenImageButton({ imageUrl, onClick, ...props }) {
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

function DownloadImageButton({ imageUrl, onClick, ...props }) {
	const [options] = useOptions();

	function downloadImages(e) {
		actions.downloadImages([imageUrl], options);
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

function ImageStat({ class: className = '', children, ...props }) {
	return html`
		<small class="${className} rounded bg-slate-950/80 px-1 text-white empty:hidden" ...${props}>${children}</small>
	`;
}

function ImageUrlTextbox(props) {
	const inputRef = useRef(null);

	function scrollToEnd() {
		const input = inputRef.current;
		if (input) {
			input.scrollLeft = input.scrollWidth;
		}
	}

	useLayoutEffect(scrollToEnd, []);

	return html`
		<input
			ref=${inputRef}
			type="text"
			readonly
			onClick=${(e) => {
				e.stopPropagation();
				e.currentTarget.select();
			}}
			...${props}
		/>
	`;
}
