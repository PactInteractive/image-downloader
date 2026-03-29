import html, { useEffect } from '../html.js';

import { Checkbox } from '../components/Checkbox.js';
import { useImageResolution } from '../hooks/useImageResolution.js';
import { useOption } from '../hooks/useOption.js';
import { isIncludedIn, isNotStrictEqual, stopPropagation } from '../utils.js';
import * as actions from './actions.js';

export function Images({
	options,
	visibleImages,
	selectedImages,
	imagesToDownload,
	setSelectedImages,
	style,
	...props
}) {
	// TODO: Use if applicable, remove if not
	// Fix weird flexbox bug where the parent does not respect the child's width
	// https://github.com/PactInteractive/image-downloader/issues/114#issuecomment-1715716846
	// useEffect(() => {
	// 	// Set min width instead of width to allow for other content like header or footer to render properly
	// 	document.querySelector('main').style.minWidth = containerStyle.width;
	// }, [containerStyle]);

	// TODO: Remove `showImageUrl` option, file extension is enough
	// const showImageUrl = options.show_image_url === 'true';

	const showOpenImageButton = options.show_open_image_button === 'true';
	const showDownloadImageButton = options.show_download_image_button === 'true';
	const showImageResolution = options.show_image_resolution === 'true';

	const someImagesAreSelected = visibleImages.length > 0 && visibleImages.some(isIncludedIn(selectedImages));
	const allImagesAreSelected = visibleImages.length > 0 && visibleImages.every(isIncludedIn(selectedImages));

	const [columns, setColumns] = useOption('columns');

	return html`
		<div
			class="grid grid-cols-(--image-columns) gap-2 bg-slate-50 p-2"
			style=${{ '--image-columns': `repeat(${columns}, minmax(0, 1fr))` }}
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
					onClick=${() => setColumns(Math.max(1, (parseInt(columns, 10) || 0) - 1))}
				>
					-
				</button>

				${columns}

				<button
					type="button"
					class="h-6 w-6 font-bold"
					aria-label="More columns"
					onClick=${() => setColumns(Math.min((parseInt(columns, 10) || 0) + 1, 6))}
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
						showOpenImageButton=${showOpenImageButton}
						showDownloadImageButton=${showDownloadImageButton}
						showImageResolution=${showImageResolution}
					/>
				`
			)}
		</div>
	`;
}

function ImageCard({
	imageUrl,
	index,
	options,
	selectedImages,
	setSelectedImages,
	showOpenImageButton,
	showDownloadImageButton,
	showImageResolution,
}) {
	const { resolution, onLoad, onError, resetResolution } = useImageResolution();
	const isSelected = selectedImages.includes(imageUrl);

	// Reset resolution when imageUrl changes to avoid showing stale data
	useEffect(resetResolution, [imageUrl, resetResolution]);

	// TODO: Add option & implement badge next to the resolution
	const showImageType = true;

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

			${(showOpenImageButton || showDownloadImageButton) &&
			html`
				<div class="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100">
					${showOpenImageButton && html`<${OpenImageButton} imageUrl=${imageUrl} onClick=${stopPropagation} />`}
					${showDownloadImageButton &&
					html`<${DownloadImageButton} imageUrl=${imageUrl} options=${options} onClick=${stopPropagation} />`}
				</div>
			`}

			${((showImageResolution && resolution.ready) || showImageType) &&
			html`
				<div class="absolute right-1 bottom-1 left-1 flex gap-1">
					${showImageResolution &&
					resolution.ready &&
					html`
						<div class="rounded bg-slate-950/80 px-1 text-white">
							${resolution.error ? 'Error loading image' : `${resolution.width}×${resolution.height}`}
						</div>
					`}
				</div>
			`}
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
			class="w-7 h-7 rounded bg-size-[20px] bg-center bg-no-repeat shadow-md"
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
			class="w-7 h-7 rounded bg-size-[20px] bg-center bg-no-repeat shadow-md"
			style=${{ backgroundImage: 'url("/images/download.svg")' }}
			type="button"
			title="Download"
			onClick=${downloadImages}
			...${props}
		/>
	`;
}
