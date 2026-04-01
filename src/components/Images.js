import html, { useEffect, useLayoutEffect, useRef } from '../html.js';

import { useImageStats } from '../hooks/useImageStats.js';
import { isIncludedIn, isNotStrictEqual, stopPropagation } from '../utils.js';
import * as actions from './actions.js';
import { Checkbox } from './Checkbox.js';
import { useOptions } from './OptionsProvider.js';

export function Images({ visibleImages, imagesToDownload, style, ...props }) {
	const [options, updateOptions] = useOptions();
	const selectedImages = options.selected_images;

	const setSelectedImages = (updater) => {
		updateOptions((prev) => ({
			selected_images: typeof updater === 'function' ? updater(prev.selected_images) : updater,
		}));
	};

	const someImagesAreSelected = visibleImages.length > 0 && visibleImages.some(isIncludedIn(selectedImages));
	const allImagesAreSelected = visibleImages.length > 0 && visibleImages.every(isIncludedIn(selectedImages));

	return html`
		<div
			class="grid grid-cols-(--image-columns) gap-2 p-2"
			style=${{ '--image-columns': `repeat(${options.columns}, minmax(0, 1fr))` }}
			...${props}
		>
			<div class="col-span-full flex items-center gap-2 tabular-nums">
				<${Checkbox}
					class="py-1"
					checked=${allImagesAreSelected}
					indeterminate=${someImagesAreSelected && !allImagesAreSelected}
					onChange=${({ currentTarget: { checked } }) => setSelectedImages(checked ? visibleImages : [])}
				>
					Select all (${imagesToDownload.length} / ${visibleImages.length})
				<//>

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

			${visibleImages.map(
				(imageUrl, index) => html`
					<${ImageCard}
						key=${imageUrl}
						imageUrl=${imageUrl}
						index=${index}
						selectedImages=${selectedImages}
						setSelectedImages=${setSelectedImages}
					/>
				`
			)}
		</div>
	`;
}

function ImageCard({ imageUrl, index, selectedImages, setSelectedImages }) {
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
			class="flex flex-col items-center justify-center gap-1 p-4 text-slate-400"
			type="button"
			title="Retry loading image"
			onClick=${(e) => {
				e.stopPropagation();
				onClick?.(e);
			}}
			...${props}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-8 w-8"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
				<circle cx="8.5" cy="8.5" r="1.5" />
				<line x1="21" y1="15" x2="14" y2="8" />
				<line x1="14" y1="15" x2="21" y2="8" />
			</svg>
			<span class="text-xs">Failed to load</span>
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
