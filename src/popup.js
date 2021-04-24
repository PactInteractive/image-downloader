import html, {
  render,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from './html.js';

import { Checkbox } from './components/Checkbox.js';
import { AdvancedFilters } from './AdvancedFilters.js';
import { Images } from './Images.js';

const initialOptions = localStorage;
const ls = localStorage; // TODO: Remove
const allImages = []; // TODO: Remove
const visibleImages = []; // TODO: Remove
const linkedImages = {}; // TODO: Remove

function suggestNewFilename(item, suggest) {
  let newFilename = '';
  if (ls.folder_name) {
    newFilename = `${ls.folder_name}/`;
  }
  if (ls.new_file_name) {
    const regex = /(?:\.([^.]+))?$/;
    const extension = regex.exec(item.filename)[1];
    if (parseInt(ls.image_count, 10) === 1) {
      newFilename += `${ls.new_file_name}.${extension}`;
    } else {
      const numberOfDigits = Math.floor(1 + Math.log10(ls.image_count));
      const formattedImageNumber = `${ls.image_number}`.padStart(
        numberOfDigits,
        '0'
      );
      newFilename += `${ls.new_file_name}${formattedImageNumber}.${extension}`;
      ls.image_number++;
    }
  } else {
    newFilename += item.filename;
  }
  suggest({ filename: newFilename });
}

function downloadImages() {
  if (ls.show_download_confirmation === 'true') {
    showDownloadConfirmation(startDownload);
  } else {
    startDownload();
  }

  async function startDownload() {
    const checkedImages = visibleImages.filter((image, index) => {
      return $(`#card_${index}`).hasClass('checked');
    });

    ls.image_count = checkedImages.length;
    ls.image_number = 1;

    flashDownloadingNotification(ls.image_count);

    for (const image of checkedImages) {
      await new Promise((resolve) => {
        chrome.downloads.download({ url: image }, resolve);
      });
    }
  }
}

function showDownloadConfirmation(startDownload) {
  const saveDontShowAgainState = () => {
    ls.show_download_confirmation = !$('#dont_show_again_checkbox').prop(
      'checked'
    );
  };

  const removeNotificationContainer = () => {
    notification_container.remove();
  };

  const notification_container = html`
    <div style=${{ gridColumn: '1 / -1' }}>
      <div>
        <hr />
        Take a quick look at your browser settings and search for
        <b> download location</b>.
        <span class="danger">
          If the <b>Ask where to save each file before downloading</b> option is
          checked, proceeding might open a lot of popup windows. Proceed with
          the download?
        </span>
      </div>

      <div style=${{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <div style=${{ marginRight: 'auto' }}>
          <${Checkbox} id="dont_show_again_checkbox">
            Got it, don't show again
          <//>
        </div>

        <input
          type="button"
          class="neutral ghost"
          value="Cancel"
          onClick=${() => {
            saveDontShowAgainState();
            removeNotificationContainer();
          }}
        />

        <input
          type="button"
          class="success"
          value="Yes, Download"
          onClick=${() => {
            saveDontShowAgainState();
            removeNotificationContainer();
            startDownload();
          }}
        />
      </div>
    </div>
  `;

  $('#downloads_container').append(notification_container);
}

function flashDownloadingNotification(imageCount) {
  if (ls.show_download_notification !== 'true') return;

  const downloading_notification = $(html`
    <div class="success" style=${{ gridColumn: '1 / -1' }}>
      Downloading ${imageCount} ${imageCount > 1 ? 'images' : 'image'}...
    </div>
  `);

  $('#downloads_container').prepend(downloading_notification);

  flash(downloading_notification, 3.5, 0, () => {
    downloading_notification.remove();
  });
}

function flash(element, flashes, interval, callback) {
  if (!interval) interval = parseInt(ls.animation_duration, 10);

  const fade = (fadeIn) => {
    if (flashes > 0) {
      flashes -= 0.5;
      if (fadeIn) {
        element.fadeIn(interval, () => fade(false));
      } else {
        element.fadeOut(interval, () => fade(true));
      }
    } else if (callback) {
      callback();
    }
  };
  fade(false);
}

const Popup = () => {
  const [options, setOptions] = useState(initialOptions);

  useEffect(() => {
    Object.assign(localStorage, options);
  }, [options]);

  const [allImages, setAllImages] = useState([]);
  const [linkedImages, setLinkedImages] = useState({});
  const [selectedImages, setSelectedImages] = useState([]); // TODO: Use
  const [visibleImages, setVisibleImages] = useState([]);
  useEffect(() => {
    // Add images to state and trigger filtration.
    // `send_images.js` is injected into all frames of the active tab, so this listener may be called multiple times.
    chrome.runtime.onMessage.addListener((result) => {
      setLinkedImages((linkedImages) => ({
        ...linkedImages,
        ...result.linkedImages,
      }));

      setAllImages((allImages) => [
        ...allImages,
        ...result.images.filter((image) => !allImages.includes(image)),
      ]);
    });
  }, []);

  const imagesCacheRef = useRef(null); // Not displayed; only used for filtering by natural width / height
  const filterImages = useCallback(() => {
    // TODO: Debounce
    let visibleImages = allImages;
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
            } catch (e) {
              return false;
            }
          });
          break;
      }
    }

    if (options.only_images_from_links === 'true') {
      visibleImages = visibleImages.filter((url) => linkedImages[url]);
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
  }, [visibleImages, linkedImages, options]);

  useEffect(filterImages, [allImages, linkedImages]);

  const anyImagesCanBeDownloaded = useMemo(() => {
    return (
      visibleImages.length > 0 &&
      selectedImages.length > 0 &&
      visibleImages.some((imageUrl) => selectedImages.includes(imageUrl))
    );
  }, [visibleImages, selectedImages]);

  return html`
    <div id="filters_container">
      <div style=${{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <input
          type="text"
          id="filter_textbox"
          placeholder="Filter by URL"
          title="Filter by parts of the URL or regular expressions."
          value=${options.filter_url}
          style=${{ flex: '1' }}
          onChange=${(e) => {
            setOptions((options) => ({
              ...options,
              filter_url: $.trim(e.currentTarget.value),
            }));
          }}
        />

        <select
          value=${options.filter_url_mode}
          onChange=${(e) => {
            setOptions((options) => ({
              ...options,
              filter_url_mode: e.currentTarget.value,
            }));
          }}
        >
          <option value="normal" title="A plain text search">
            Normal
          </option>

          <option
            value="wildcard"
            title="You can also use these special symbols:
* → zero or more characters
? → zero or one character
+ → one or more characters"
          >
            Wildcard
          </option>

          <option
            value="regex"
            title=${`Regular expressions (advanced):
[abc] → A single character of: a, b or c
[^abc] → Any single character except: a, b, or c
[a-z] → Any single character in the range a-z
[a-zA-Z] → Any single character in the range a-z or A-Z
^ → Start of line
$ → End of line
A → Start of string
z → End of string
. → Any single character
s → Any whitespace character
S → Any non-whitespace character
d → Any digit
D → Any non-digit
w → Any word character (letter, number, underscore)
W → Any non-word character
 → Any word boundary character
(...) → Capture everything enclosed
(a|b) → a or b
a? → Zero or one of a
a* → Zero or more of a
a+ → One or more of a
a{3} → Exactly 3 of a
a{3,} → 3 or more of a
a{3,6} → Between 3 and 6 of a`}
          >
            Regex
          </option>
        </select>

        <button
          id="toggle_advanced_filters_button"
          class=${options.show_advanced_filters === 'true' ? '' : 'collapsed'}
          title="Advanced filters"
          onClick=${(e) => {
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
        onChange=${(e) => {
          setOptions((options) => ({
            ...options,
            folder_name: $.trim(e.currentTarget.value),
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
          onChange=${(e) => {
            setOptions((options) => ({
              ...options,
              new_file_name: $.trim(e.currentTarget.value),
            }));
          }}
        />
      `}

      <input
        type="button"
        id="download_button"
        class="accent"
        value="Download"
        disabled=${!anyImagesCanBeDownloaded}
        onClick=${downloadImages}
      />
    </div>
  `;
};

render(html`<${Popup} />`, document.querySelector('main'));

chrome.downloads.onDeterminingFilename.addListener(suggestNewFilename);

// Get images on the page
chrome.windows.getCurrent((currentWindow) => {
  chrome.tabs.query(
    { active: true, windowId: currentWindow.id },
    (activeTabs) => {
      chrome.tabs.executeScript(activeTabs[0].id, {
        file: '/src/send_images.js',
        allFrames: true,
      });
    }
  );
});
