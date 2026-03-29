import html, { useEffect, useMemo } from '../html.js';

import { Checkbox } from '../components/Checkbox.js';
import { useImageResolution } from '../hooks/useImageResolution.js';
import { isIncludedIn, isNotStrictEqual, stopPropagation } from '../utils.js';

import { DownloadImageButton, ImageUrlTextbox, OpenImageButton } from './ImageActions.js';

const ImageCard = ({
	imageUrl,
	index,
	options,
	selectedImages,
	setSelectedImages,
	showOpenImageButton,
	showDownloadImageButton,
	showImageUrl,
	showImageResolution,
}) => {
	const { resolution, onLoad, onError, resetResolution } = useImageResolution();
	const showImageType = true; // TODO: Add option & implement badge next to the resolution
	// TODO: Remove `showImageUrl` option, extension is enough

	// Reset resolution when imageUrl changes to avoid showing stale data
	useEffect(resetResolution, [imageUrl, resetResolution]);

	const isSelected = selectedImages.includes(imageUrl);

	return html`
		<div
			class="relative flex items-center shadow-md ${isSelected ? 'checked' : ''}"
			style=${{
			minHeight: `200px`,
			backgroundImage: 'conic-gradient(var(--color-slate-100) 90deg, var(--color-slate-300) 90deg 180deg, var(--color-slate-100) 180deg 270deg, var(--color-slate-300) 270deg)',
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
			<img
				class="w-full"
				src=${imageUrl}
				onLoad=${onLoad}
				onError=${onError}
			/>

			<div class="checkbox"></div>

			${(showOpenImageButton || showDownloadImageButton) && html`
				<div class="actions">
					${showOpenImageButton && html`<${OpenImageButton} imageUrl=${imageUrl} onClick=${stopPropagation} />`}
					${showDownloadImageButton && html`<${DownloadImageButton} imageUrl=${imageUrl} options=${options} onClick=${stopPropagation} />`}
				</div>
			`}

			${((showImageResolution && resolution.ready) || showImageType || showImageUrl) && html`
				<div class="absolute bottom-1 left-1 right-1 flex gap-1">
					${showImageResolution && resolution.ready && html`
						<div class="rounded bg-slate-950/80 text-white px-1">
							${resolution.error ? 'Error loading image' : `${resolution.width}×${resolution.height}`}
						</div>
					`}

					${showImageUrl && html`
						<div class="image_url_container">
							<${ImageUrlTextbox} value=${imageUrl} onClick=${stopPropagation} />
						</div>
					`}
				</div>
			`}
		</div>
	`;
};

export const Images = ({
	options,
	visibleImages,
	selectedImages,
	imagesToDownload,
	setSelectedImages,
	style,
	...props
}) => {
	// const containerStyle = useMemo(() => {
	// 	const columns = parseInt(options.columns, 10);
	// 	return {
	// 		gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
	// 		width: `calc(2 * var(--images-container-padding) + ${columns} * 200px + ${columns - 1} * var(--images-container-gap))`,
	// 		...style,
	// 	};
	// }, [options.columns, style]);

	// Fix weird flexbox bug where the parent does not respect the child's width
	// https://github.com/PactInteractive/image-downloader/issues/114#issuecomment-1715716846
	// useEffect(() => {
	// 	// Set min width instead of width to allow for other content like header or footer to render properly
	// 	document.querySelector('main').style.minWidth = containerStyle.width;
	// }, [containerStyle]);

	const showImageUrl = options.show_image_url === 'true';
	const showOpenImageButton = options.show_open_image_button === 'true';
	const showDownloadImageButton = options.show_download_image_button === 'true';
	const showImageResolution = options.show_image_resolution === 'true';

	const someImagesAreSelected = useMemo(
		() => visibleImages.length > 0 && visibleImages.some(isIncludedIn(selectedImages)),
		[visibleImages, selectedImages]
	);

	const allImagesAreSelected = useMemo(
		() => visibleImages.length > 0 && visibleImages.every(isIncludedIn(selectedImages)),
		[visibleImages, selectedImages]
	);

	return html`
		<div
			id="images_container"
			class="grid grid-cols-(--image-columns) gap-2 bg-slate-50 px-3 py-2"
			style=${{ '--image-columns': `repeat(${parseInt(options.columns, 10)}, minmax(0, 1fr))` }}
			...${props}
		>
			<${Checkbox}
				class="col-span-full"
				checked=${allImagesAreSelected}
				indeterminate=${someImagesAreSelected && !allImagesAreSelected}
				onChange=${({ currentTarget: { checked } }) => {
			setSelectedImages(checked ? visibleImages : []);
		}}
			>
				Select all (${imagesToDownload.length} / ${visibleImages.length})
			<//>

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
						showImageUrl=${showImageUrl}
						showImageResolution=${showImageResolution}
					/>
				`
		)}
		</div>
	`;
};
