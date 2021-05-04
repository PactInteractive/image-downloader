import './setReferrer.js';

import html, {
  render,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from '../html.js';

import { useRunAfterUpdate } from '../hooks/useRunAfterUpdate.js';
import { isIncludedIn, removeSpecialCharacters, unique } from '../utils.js';

import * as actions from './actions.js';
import { AdvancedFilters } from './AdvancedFilters.js';
import { DownloadButton } from './DownloadButton.js';
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
    const updatePopupData = (message) => {
      if (message.type !== 'sendImages') return;

      setAllImages((allImages) => unique([...allImages, ...message.allImages]));

      setLinkedImages((linkedImages) =>
        unique([...linkedImages, ...message.linkedImages])
      );

      localStorage.active_tab_origin = message.origin;
    };

    // Add images to state and trigger filtration.
    // `sendImages.js` is injected into all frames of the active tab, so this listener may be called multiple times.
    chrome.runtime.onMessage.addListener(updatePopupData);

    // Get images on the page
    chrome.windows.getCurrent((currentWindow) => {
      chrome.tabs.query(
        { active: true, windowId: currentWindow.id },
        (activeTabs) => {
          chrome.tabs.executeScript(activeTabs[0].id, {
            file: '/src/Popup/sendImages.js',
            allFrames: true,
          });
        }
      );
    });

    return () => {
      chrome.runtime.onMessage.removeListener(updatePopupData);
    };
  }, []);

  const imagesCacheRef = useRef(null); // Not displayed; only used for filtering by natural width / height
  const filterImages = useCallback(() => {
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
  }, [allImages, linkedImages, options]);

  useEffect(filterImages, [allImages, linkedImages, options]);

  const [downloadIsInProgress, setDownloadIsInProgress] = useState(false);
  const imagesToDownload = useMemo(
    () => visibleImages.filter(isIncludedIn(selectedImages)),
    [visibleImages, selectedImages]
  );

  const [
    downloadConfirmationIsShown,
    setDownloadConfirmationIsShown,
  ] = useState(false);

  function maybeDownloadImages() {
    if (options.show_download_confirmation === 'true') {
      setDownloadConfirmationIsShown(true);
    } else {
      downloadImages();
    }
  }

  async function downloadImages() {
    setDownloadIsInProgress(true);
    await actions.downloadImages(imagesToDownload, options);
    setDownloadIsInProgress(false);
  }

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

      <${DownloadButton}
        disabled=${imagesToDownload.length === 0}
        loading=${downloadIsInProgress}
        onClick=${maybeDownloadImages}
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
          onConfirm=${downloadImages}
        />
      `}
    </div>
  `;
};

render(html`<${Popup} />`, document.querySelector('main'));
