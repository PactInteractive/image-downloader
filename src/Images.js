import html, { useMemo } from './html.js';

import { Checkbox } from './components/Checkbox.js';
import {
  DownloadImageButton,
  ImageUrlTextbox,
  OpenImageButton,
} from './ImageActions.js';
import { isIncludedIn, isNotStrictEqual, stopPropagation } from './utils.js';

export const Images = ({
  options,
  visibleImages,
  selectedImages,
  setSelectedImages,
  style,
  ...props
}) => {
  const containerStyle = useMemo(() => {
    const columns = parseInt(options.columns, 10);
    return {
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      width: `calc(2 * var(--images-container-padding) + ${columns} * ${
        options.image_max_width
      }px + ${columns - 1} * var(--images-container-gap))`,
      ...style,
    };
  }, [options.columns, options.image_max_width, style]);

  const showImageUrl = useMemo(() => options.show_image_url === 'true', [
    options.show_image_url,
  ]);

  const showOpenImageButton = useMemo(
    () => options.show_open_image_button === 'true',
    [options.show_open_image_button]
  );

  const showDownloadImageButton = useMemo(
    () => options.show_download_image_button === 'true',
    [options.show_download_image_button]
  );

  const someImagesAreSelected = useMemo(
    () =>
      visibleImages.length > 0 &&
      visibleImages.some(isIncludedIn(selectedImages)),
    [visibleImages, selectedImages]
  );

  const allImagesAreSelected = useMemo(
    () =>
      visibleImages.length > 0 &&
      visibleImages.every(isIncludedIn(selectedImages)),
    [visibleImages, selectedImages]
  );

  return html`
    <div id="images_container" style=${containerStyle} ...${props}>
      <div style=${{ gridColumn: '1 / -1', fontWeight: 'bold' }}>
        <${Checkbox}
          checked=${allImagesAreSelected}
          indeterminate=${someImagesAreSelected && !allImagesAreSelected}
          onChange=${({ currentTarget: { checked } }) => {
            setSelectedImages(checked ? visibleImages : []);
          }}
        >
          Select all (${visibleImages.length})
        <//>
      </div>

      ${visibleImages.map(
        (imageUrl, index) => html`
          <div
            id=${`card_${index}`}
            class="card ${selectedImages.includes(imageUrl) ? 'checked' : ''}"
            style=${{ minHeight: `${options.image_max_width}px` }}
            onClick=${() => {
              setSelectedImages((selectedImages) =>
                selectedImages.includes(imageUrl)
                  ? selectedImages.filter(isNotStrictEqual(imageUrl))
                  : [...selectedImages, imageUrl]
              );
            }}
          >
            <img
              src=${imageUrl}
              style=${{
                minWidth: `${options.image_min_width}px`,
                maxWidth: `${options.image_max_width}px`,
              }}
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
                    onClick=${stopPropagation}
                  />
                `}
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
        `
      )}
    </div>
  `;
};
