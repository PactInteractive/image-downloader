import html, {
  render,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from './html.js';
import { useDebouncedCallback } from './hooks/useDebouncedCallback.js';
import { useRunAfterUpdate } from './hooks/useRunAfterUpdate.js';
import { isIncludedIn, removeSpecialCharacters, unique } from './utils.js';

import { AdvancedFilters } from './AdvancedFilters.js';
import { DownloadConfirmation } from './DownloadConfirmation.js';
import { Images } from './Images.js';
import { UrlFilterMode } from './UrlFilterMode.js';

const initialOptions = localStorage;

const Popup = () => {
  const [options, setOptions] = useState(initialOptions);

  useEffect(() => {
    Object.assign(localStorage, options);
  }, [options]);

  const [allImages, setAllImages] = useState([]);
  const [linkedImages, setLinkedImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [visibleImages, setVisibleImages] = useState([]);
  useEffect(() => {
    const setMessageResult = (result) => {
      setAllImages((allImages) => unique([...allImages, ...result.allImages]));

      setLinkedImages((linkedImages) =>
        unique([...linkedImages, ...result.linkedImages])
      );

      localStorage.active_tab_origin = result.origin;
    };

    // Add images to state and trigger filtration.
    // `sendImages.js` is injected into all frames of the active tab, so this listener may be called multiple times.
    chrome.runtime.onMessage.addListener(setMessageResult);

    // Get images on the page
    chrome.windows.getCurrent((currentWindow) => {
      chrome.tabs.query(
        { active: true, windowId: currentWindow.id },
        (activeTabs) => {
          chrome.tabs.executeScript(activeTabs[0].id, {
            file: '/src/sendImages.js',
            allFrames: true,
          });
        }
      );
    });

    return () => {
      chrome.runtime.onMessage.removeListener(setMessageResult);
    };
  }, []);

  const imagesCacheRef = useRef(null); // Not displayed; only used for filtering by natural width / height
  const filterImages = useDebouncedCallback(
    100,
    () => {
      let visibleImages =
        options.only_images_from_links === 'true' ? linkedImages : allImages;

      let filterValue = options.filter_url;
      if (filterValue) {
        switch (options.filter_url_mode) {
          case 'normal':
            const terms = filterValue.split(/\s+/);
            visibleImages = visibleImages.filter((url) => {
              for (let index = 0; index < terms.length; index++) {
                let term = terms[index];
                if (term.length !== 0) {
                  const expected = term[0] !== '-';
                  if (!expected) {
                    term = term.substr(1);
                    if (term.length === 0) {
                      continue;
                    }
                  }
                  const found = url.indexOf(term) !== -1;
                  if (found !== expected) {
                    return false;
                  }
                }
              }
              return true;
            });
            break;
          case 'wildcard':
            filterValue = filterValue
              .replace(/([.^$[\]\\(){}|-])/g, '\\$1')
              .replace(/([?*+])/, '.$1');
          /* fall through */
          case 'regex':
            visibleImages = visibleImages.filter((url) => {
              try {
                return url.match(filterValue);
              } catch (error) {
                return false;
              }
            });
            break;
        }
      }

      visibleImages = visibleImages.filter((url) => {
        const image = imagesCacheRef.current.querySelector(
          `img[src="${encodeURI(url)}"]`
        );

        return (
          (options.filter_min_width_enabled !== 'true' ||
            options.filter_min_width <= image.naturalWidth) &&
          (options.filter_max_width_enabled !== 'true' ||
            image.naturalWidth <= options.filter_max_width) &&
          (options.filter_min_height_enabled !== 'true' ||
            options.filter_min_height <= image.naturalHeight) &&
          (options.filter_max_height_enabled !== 'true' ||
            image.naturalHeight <= options.filter_max_height)
        );
      });

      setVisibleImages(visibleImages);
    },
    [allImages, linkedImages, options]
  );

  useEffect(filterImages, [filterImages]);

  const [downloadIsInProgress, setDownloadIsInProgress] = useState(false);
  const imagesToDownload = useMemo(
    () => visibleImages.filter(isIncludedIn(selectedImages)),
    [visibleImages, selectedImages]
  );

  const [
    downloadConfirmationIsShown,
    setDownloadConfirmationIsShown,
  ] = useState(false);

  function downloadImages() {
    if (options.show_download_confirmation === 'true') {
      setDownloadConfirmationIsShown(true);
    } else {
      startDownload();
    }
  }

  async function startDownload() {
    setDownloadIsInProgress(true);
    currentImageNumberRef.current = 1;

    for (const image of imagesToDownload) {
      await new Promise((resolve) => {
        chrome.downloads.download({ url: image }, resolve);
      });
    }

    setDownloadIsInProgress(false);
  }

  const currentImageNumberRef = useRef(1);
  const suggestNewFilename = useCallback(
    (item, suggest) => {
      let newFilename = '';
      if (options.folder_name) {
        newFilename += `${options.folder_name}/`;
      }
      if (options.new_file_name) {
        const regex = /(?:\.([^.]+))?$/;
        const extension = regex.exec(item.filename)[1];
        if (imagesToDownload.length === 1) {
          newFilename += `${options.new_file_name}.${extension}`;
        } else {
          const numberOfDigits = imagesToDownload.length.toString().length;
          const formattedImageNumber = `${currentImageNumberRef.current}`.padStart(
            numberOfDigits,
            '0'
          );
          newFilename += `${options.new_file_name}${formattedImageNumber}.${extension}`;
          currentImageNumberRef.current += 1;
        }
      } else {
        newFilename += item.filename;
      }
      suggest({ filename: newFilename });
    },
    [imagesToDownload, options.folder_name, options.new_file_name]
  );

  useEffect(() => {
    chrome.downloads.onDeterminingFilename.addListener(suggestNewFilename);
    return () => {
      chrome.downloads.onDeterminingFilename.removeListener(suggestNewFilename);
    };
  }, [suggestNewFilename]);

  const runAfterUpdate = useRunAfterUpdate();

  return html`
    <div id="filters_container">
      <div style=${{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <input
          type="text"
          placeholder="Filter by URL"
          title="Filter by parts of the URL or regular expressions."
          value=${options.filter_url}
          style=${{ flex: '1' }}
          onChange=${({ currentTarget: { value } }) => {
            setOptions((options) => ({ ...options, filter_url: value.trim() }));
          }}
        />

        <${UrlFilterMode}
          value=${options.filter_url_mode}
          onChange=${({ currentTarget: { value } }) => {
            setOptions((options) => ({ ...options, filter_url_mode: value }));
          }}
        />

        <button
          id="toggle_advanced_filters_button"
          class=${options.show_advanced_filters === 'true' ? '' : 'collapsed'}
          title="Toggle advanced filters"
          onClick=${() => {
            setOptions((options) => ({
              ...options,
              show_advanced_filters:
                options.show_advanced_filters === 'true' ? 'false' : 'true',
            }));
          }}
        >
          <img class="toggle" src="/images/times.svg" />
        </button>

        <button
          id="open_options_button"
          title="Options"
          onClick=${() => chrome.runtime.openOptionsPage()}
        >
          <img src="/images/cog.svg" />
        </button>
      </div>

      ${options.show_advanced_filters === 'true' &&
      html`<${AdvancedFilters} options=${options} setOptions=${setOptions} />`}
    </div>

    <div ref=${imagesCacheRef} class="hidden">
      ${allImages.map(
        (url) => html`<img src=${encodeURI(url)} onLoad=${filterImages} />`
      )}
    </div>

    <${Images}
      options=${options}
      visibleImages=${visibleImages}
      selectedImages=${selectedImages}
      imagesToDownload=${imagesToDownload}
      setSelectedImages=${setSelectedImages}
    />

    <div
      id="downloads_container"
      style=${{
        gridTemplateColumns: `${
          options.show_file_renaming === 'true' ? 'minmax(100px, 1fr)' : ''
        } minmax(100px, 1fr) 80px`,
      }}
    >
      <input
        type="text"
        placeholder="Save to subfolder"
        title="Set the name of the subfolder you want to download the images to."
        value=${options.folder_name}
        onChange=${({ currentTarget: input }) => {
          const savedSelectionStart = removeSpecialCharacters(
            input.value.slice(0, input.selectionStart)
          ).length;

          runAfterUpdate(() => {
            input.selectionStart = input.selectionEnd = savedSelectionStart;
          });

          setOptions((options) => ({
            ...options,
            folder_name: removeSpecialCharacters(input.value),
          }));
        }}
      />

      ${options.show_file_renaming === 'true' &&
      html`
        <input
          type="text"
          placeholder="Rename files"
          title="Set a new file name for the images you want to download."
          value=${options.new_file_name}
          onChange=${({ currentTarget: input }) => {
            const savedSelectionStart = removeSpecialCharacters(
              input.value.slice(0, input.selectionStart)
            ).length;

            runAfterUpdate(() => {
              input.selectionStart = input.selectionEnd = savedSelectionStart;
            });

            setOptions((options) => ({
              ...options,
              new_file_name: removeSpecialCharacters(input.value),
            }));
          }}
        />
      `}

      <!-- TODO: Implement loading animation -->
      <input
        type="button"
        class="accent ${downloadIsInProgress ? 'loading' : ''}"
        value=${downloadIsInProgress ? '•••' : 'Download'}
        disabled=${imagesToDownload.length === 0 || downloadIsInProgress}
        onClick=${downloadImages}
      />

      ${downloadConfirmationIsShown &&
      html`
        <${DownloadConfirmation}
          onCheckboxChange=${({ currentTarget: { checked } }) => {
            setOptions((options) => ({
              ...options,
              show_download_confirmation: (!checked).toString(),
            }));
          }}
          onClose=${() => setDownloadConfirmationIsShown(false)}
          onConfirm=${startDownload}
        />
      `}
    </div>
  `;
};

render(html`<${Popup} />`, document.querySelector('main'));
