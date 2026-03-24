import html, { useEffect, useMemo } from '../html.js';

import { Checkbox } from '../components/Checkbox.js';
import { useImageResolution } from '../hooks/useImageResolution.js';
import { isIncludedIn, isNotStrictEqual, stopPropagation } from '../utils.js';

import {
  DownloadImageButton,
  ImageUrlTextbox,
  OpenImageButton,
} from './ImageActions.js';

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

  // Reset resolution when imageUrl changes to avoid showing stale data
  useEffect(resetResolution, [imageUrl, resetResolution]);

  const isSelected = selectedImages.includes(imageUrl);

  return html`
    <div
      id=${`card_${index}`}
      class="card ${isSelected ? 'checked' : ''}"
      style=${{ minHeight: `${options.image_max_width}px` }}
      onClick=${() => {
        setSelectedImages((selectedImages) =>
          selectedImages.includes(imageUrl)
            ? selectedImages.filter(isNotStrictEqual(imageUrl))
            : [...selectedImages, imageUrl],
        );
      }}
    >
      <img
        src=${imageUrl}
        style=${{
          minWidth: `${options.image_min_width}px`,
          maxWidth: `${options.image_max_width}px`,
        }}
        onLoad=${onLoad}
        onError=${onError}
      />

      <div class="checkbox"></div>

      ${(showOpenImageButton || showDownloadImageButton) &&
      html`
        <div class="actions">
          ${showOpenImageButton &&
          html`
            <${OpenImageButton}
              imageUrl=${imageUrl}
              onClick=${stopPropagation}
            />
          `}
          ${showDownloadImageButton &&
          html`
            <${DownloadImageButton}
              imageUrl=${imageUrl}
              options=${options}
              onClick=${stopPropagation}
            />
          `}
        </div>
      `}
      ${((showImageResolution && resolution.ready) || showImageUrl) &&
      html`
        <div class="bottom_overlay">
          ${showImageResolution && resolution.ready &&
          html`
            <div class="resolution">
              ${resolution.error
                ? 'Error loading image'
                : `${resolution.width}×${resolution.height}`}
            </div>
          `}
          ${showImageUrl &&
          html`
            <div class="image_url_container">
              <${ImageUrlTextbox}
                value=${imageUrl}
                onClick=${stopPropagation}
              />
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
  const containerStyle = useMemo(() => {
    const columns = parseInt(options.columns, 10);
    return {
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      width: `calc(2 * var(--images-container-padding) + ${columns} * ${options.image_max_width}px + ${columns - 1} * var(--images-container-gap))`,
      ...style,
    };
  }, [options.columns, options.image_max_width, style]);

  // Fix weird flexbox bug where the parent does not respect the child's width
  // https://github.com/PactInteractive/image-downloader/issues/114#issuecomment-1715716846
  useEffect(() => {
    // Set min width instead of width to allow for other content like header or footer to render properly
    document.querySelector('main').style.minWidth = containerStyle.width;
  }, [containerStyle]);

  const showImageUrl = options.show_image_url === 'true';
  const showOpenImageButton = options.show_open_image_button === 'true';
  const showDownloadImageButton = options.show_download_image_button === 'true';
  const showImageResolution = options.show_image_resolution === 'true';

  const someImagesAreSelected = useMemo(
    () =>
      visibleImages.length > 0 &&
      visibleImages.some(isIncludedIn(selectedImages)),
    [visibleImages, selectedImages],
  );

  const allImagesAreSelected = useMemo(
    () =>
      visibleImages.length > 0 &&
      visibleImages.every(isIncludedIn(selectedImages)),
    [visibleImages, selectedImages],
  );

  return html`
    <div id="images_container" style=${containerStyle} ...${props}>
      <${Checkbox}
        class="select_all_checkbox"
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
        `,
      )}
    </div>
  `;
};
