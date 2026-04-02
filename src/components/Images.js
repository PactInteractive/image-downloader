import html, { useEffect, useLayoutEffect, useMemo, useRef, useState } from '../html.js';

import { isIncludedIn, isNotStrictEqual, stopPropagation } from '../utils.js';
import * as actions from './actions.js';
import { Checkbox } from './Checkbox.js';
import { useOptions } from './OptionsProvider.js';
import { useImageStats } from './useImageStats.js';

export function Images({ visibleImages, allImages, imagesToDownload, style, ...props }) {
	const [options, updateOptions] = useOptions();
	const selectedImages = options.selected_images;
	const [errorCount, setErrorCount] = useState(0);
	const [showFiltered, setShowFiltered] = useState(false);

	const displayedImages = useMemo(
		() => (showFiltered && allImages ? allImages.filter((url) => !visibleImages.includes(url)) : visibleImages),
		[showFiltered, allImages, visibleImages]
	);

	const setSelectedImages = (updater) => {
		updateOptions((prev) => ({
			selected_images: typeof updater === 'function' ? updater(prev.selected_images) : updater,
		}));
	};

	const someImagesAreSelected = displayedImages.length > 0 && displayedImages.some(isIncludedIn(selectedImages));
	const allImagesAreSelected = displayedImages.length > 0 && displayedImages.every(isIncludedIn(selectedImages));

	return html`
		<div
			class="grid grid-cols-(--image-columns) gap-2 p-2"
			style=${{ '--image-columns': `repeat(${options.columns}, minmax(0, 1fr))` }}
			...${props}
		>
			<div class="col-span-full flex items-center gap-2 tabular-nums">
				${allImages?.length > 0 &&
				html`
					<${Badge}
						as=${Checkbox}
						class="border-slate-300 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100"
						checked=${allImagesAreSelected}
						indeterminate=${someImagesAreSelected && !allImagesAreSelected}
						disabled=${displayedImages.length === 0}
						title="Click to select or unselect all visible images"
						onChange=${({ currentTarget: { checked } }) => setSelectedImages(checked ? displayedImages : [])}
					>
						${imagesToDownload.length}/${displayedImages.length} selected
					<//>
				`}
				${allImages?.length - visibleImages.length > 0 &&
				html`
					<${Badge}
						as="button"
						type="button"
						class="border-slate-300 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100"
						title="Images removed by your filters"
						onClick=${() => setShowFiltered((v) => !v)}
					>
						<${Circle} class="${showFiltered ? 'border-solid' : 'border-dashed'} border border-slate-600" />
						${allImages?.length - visibleImages.length} filtered out
					<//>
				`}
				${errorCount > 0 &&
				html`
					<${Badge}
						as="button"
						type="button"
						class="border-red-300 bg-red-50 hover:bg-red-100 text-red-600"
						title="Images that failed to load"
					>
						<${Circle} class="bg-red-600 text-center font-bold text-white">✕<//>
						${errorCount} ${errorCount === 1 ? 'error' : 'errors'}
					<//>
				`}

				<div class="ml-auto">Columns:</div>

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

			${displayedImages.map(
				(imageUrl) => html`
					<${ImageCard}
						key=${imageUrl}
						imageUrl=${imageUrl}
						selectedImages=${selectedImages}
						setSelectedImages=${setSelectedImages}
						setImageErrorCount=${setErrorCount}
					/>
				`
			)}
		</div>
	`;
}

function Badge({ as: Component = 'div', class: className = '', children, ...props }) {
	return html`
		<${Component} class="${className} flex h-8 items-center gap-1 rounded-full border p-1 text-xs" ...${props}>
			${children}
		<//>
	`;
}

function Circle({ class: className = '', children, ...props }) {
	return html`
		<span class="corner-round ${className} inline-block h-4 w-4 rounded-full" ...${props}> ${children} </span>
	`;
}

function ImageCard({ imageUrl, selectedImages, setSelectedImages, setImageErrorCount }) {
	const stats = useImageStats();
	const [retryCount, setRetryCount] = useState(0);
	const isSelected = selectedImages.includes(imageUrl);

	// Reset stats when imageUrl changes to avoid showing stale data
	useEffect(stats.reset, [imageUrl, stats.reset]);

	// Track error count for status bar
	const isErrored = stats.data.status === 'error';
	useEffect(() => {
		if (isErrored) setImageErrorCount((c) => c + 1);
		return () => {
			if (isErrored) setImageErrorCount((c) => c - 1);
		};
	}, [isErrored]);

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
			onClick=${() => {
				setSelectedImages((selectedImages) =>
					selectedImages.includes(imageUrl)
						? selectedImages.filter(isNotStrictEqual(imageUrl))
						: [...selectedImages, imageUrl]
				);
			}}
		>
			${
				stats.data.status === 'error'
					? html`<${ImageError}
							onClick=${() => {
								stats.reset();
								setRetryCount((c) => c + 1);
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
			class="flex flex-col items-center justify-center gap-1 p-4 h-auto border-red-300 bg-red-50 hover:bg-red-100 text-red-600 text-xs"
			type="button"
			title="Retry loading image"
			onClick=${(e) => {
				e.stopPropagation();
				onClick?.(e);
			}}
			...${props}
		>
			<div>
				<${Circle} class="bg-red-600 text-center font-bold text-white">✕<//>
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
