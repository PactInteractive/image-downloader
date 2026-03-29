import html, { useEffect } from '../html.js';

import { Checkbox } from '../components/Checkbox.js';
import { useImageResolution } from '../hooks/useImageResolution.js';
import { isIncludedIn, isNotStrictEqual, stopPropagation } from '../utils.js';
import * as actions from './actions.js';
import { getImageExtension } from './imageUtils.js';

export function Images({ options, updateOptions, visibleImages, imagesToDownload, style, ...props }) {
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
			class="grid grid-cols-(--image-columns) gap-2 bg-slate-50 p-2"
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
						options=${options}
						selectedImages=${selectedImages}
						setSelectedImages=${setSelectedImages}
					/>
				`
			)}
		</div>
	`;
}

function ImageCard({ imageUrl, index, options, selectedImages, setSelectedImages }) {
	const { resolution, onLoad, onError, resetResolution } = useImageResolution();
	const isSelected = selectedImages.includes(imageUrl);

	// Reset resolution when imageUrl changes to avoid showing stale data
	useEffect(resetResolution, [imageUrl, resetResolution]);

	return html`
		<div
			class="group relative flex cursor-pointer items-center overflow-hidden rounded-xl shadow-md"
			style=${{
				minHeight: `200px`,
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
			<img class="w-full drop-shadow-md" src=${imageUrl} onLoad=${onLoad} onError=${onError} />

			<div
				class=${`
					absolute top-1 left-1
					w-7 h-7
					rounded-md border-2 shadow-md
					transition-all
					${isSelected ? 'border-sky-600 bg-sky-600' : 'opacity-0 border-slate-400 bg-white'}
					group-hover:opacity-100
					after:content-['']
					after:absolute after:top-1/2 after:left-1/2
					after:-translate-x-1/2 after:-translate-y-2/3
					after:w-5 after:h-3
					after:border-4 after:border-t-0 after:border-r-0
					after:-rotate-45
					after:transition-all
					${isSelected ? 'after:border-white' : 'after:border-slate-400'}
				`}
			></div>

			<div class="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100">
				<${OpenImageButton} imageUrl=${imageUrl} onClick=${stopPropagation} />
				<${DownloadImageButton} imageUrl=${imageUrl} options=${options} onClick=${stopPropagation} />
			</div>

			<div class="absolute right-1 bottom-1 left-1 flex gap-1">
				${resolution.ready &&
				html`
					<div class="rounded bg-slate-950/80 px-1 text-white">
						${resolution.error ? 'Error loading image' : `${resolution.width}×${resolution.height}`}
					</div>
				`}
				
				<div class="rounded bg-slate-950/80 px-1 text-white empty:hidden">${getImageExtension(imageUrl)}</div>
			</div>
		</div>
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

function DownloadImageButton({ imageUrl, options, onClick, ...props }) {
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
