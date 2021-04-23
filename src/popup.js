import html from './html.js';
import { Checkbox } from './Checkbox.js';
import { AdvancedFilters } from './AdvancedFilters.js';
import {
  DownloadImageButton,
  ImageUrlTextbox,
  OpenImageButton,
} from './ImageActions.js';

const ls = localStorage;

const allImages = [];
let visibleImages = [];
const linkedImages = {};

// Add images to `allImages` and trigger filtration
// `send_images.js` is injected into all frames of the active tab, so this listener may be called multiple times
chrome.runtime.onMessage.addListener((result) => {
  Object.assign(linkedImages, result.linkedImages);
  result.images.forEach((image) => {
    if (!allImages.includes(image)) {
      allImages.push(image);
    }
  });
  filterImages();
});

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

// TODO: Use debounce
let filterImagesTimeoutId;
function filterImages() {
  clearTimeout(filterImagesTimeoutId); // Cancel pending filtration
  filterImagesTimeoutId = setTimeout(() => {
    const images_cache = $('#images_cache');
    const numberOfCachedImages = images_cache.children().length;
    if (numberOfCachedImages < allImages.length) {
      for (
        let index = numberOfCachedImages;
        index < allImages.length;
        index++
      ) {
        // Refilter the images after they're loaded in cache
        images_cache.append(
          html`
            <img src=${encodeURI(allImages[index])} onLoad=${filterImages} />
          `
        );
      }
    }

    // Copy all images initially
    visibleImages = allImages.slice(0);

    let filterValue = $('#filter_textbox').val();
    if (filterValue) {
      switch (ls.filter_url_mode) {
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

    if (ls.only_images_from_links === 'true') {
      visibleImages = visibleImages.filter((url) => linkedImages[url]);
    }

    visibleImages = visibleImages.filter((url) => {
      const image = images_cache.children(`img[src="${encodeURI(url)}"]`)[0];
      return (
        (ls.filter_min_width_enabled !== 'true' ||
          ls.filter_min_width <= image.naturalWidth) &&
        (ls.filter_max_width_enabled !== 'true' ||
          image.naturalWidth <= ls.filter_max_width) &&
        (ls.filter_min_height_enabled !== 'true' ||
          ls.filter_min_height <= image.naturalHeight) &&
        (ls.filter_max_height_enabled !== 'true' ||
          image.naturalHeight <= ls.filter_max_height)
      );
    });

    displayImages();
  }, 200);
}

function displayImages() {
  $('#download_button').prop('disabled', true);

  const imagesContainer = $('#images_container');
  imagesContainer.empty();

  const columns = parseInt(ls.columns, 10);
  imagesContainer.css({
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    width: `calc(2 * var(--images-container-padding) + ${columns} * ${
      ls.image_max_width
    }px + ${columns - 1} * var(--images-container-gap))`,
  });

  const selectAllCheckbox = html`
    <div style=${{ gridColumn: '1 / -1', fontWeight: 'bold' }}>
      <${Checkbox}
        id="select_all_checkbox"
        onChange=${(e) => {
          $('#download_button').prop('disabled', !e.currentTarget.checked);
          for (let index = 0; index < visibleImages.length; index++) {
            $(`#card_${index}`).toggleClass('checked', e.currentTarget.checked);
          }
        }}
      >
        Select all (${visibleImages.length})
      <//>
    </div>
  `;
  imagesContainer.append(selectAllCheckbox);

  // Actions
  const show_image_url = ls.show_image_url === 'true';
  const show_open_image_button = ls.show_open_image_button === 'true';
  const show_download_image_button = ls.show_download_image_button === 'true';

  // Images
  visibleImages.forEach((imageUrl, index) => {
    const image = html`
      <div
        id=${`card_${index}`}
        class="card"
        style=${{ minHeight: `${ls.image_max_width}px` }}
        onClick=${(e) => {
          $(e.currentTarget).toggleClass(
            'checked',
            !$(e.currentTarget).hasClass('checked')
          );

          let allAreChecked = true;
          let allAreUnchecked = true;
          for (let index = 0; index < visibleImages.length; index++) {
            if ($(`#card_${index}`).hasClass('checked')) {
              allAreUnchecked = false;
            } else {
              allAreChecked = false;
            }
            // Exit the loop early
            if (!(allAreChecked || allAreUnchecked)) break;
          }

          $('#download_button').prop('disabled', allAreUnchecked);

          const select_all_checkbox = $('#select_all_checkbox');
          select_all_checkbox.prop(
            'indeterminate',
            !(allAreChecked || allAreUnchecked)
          );
          if (allAreChecked) {
            select_all_checkbox.prop('checked', true);
          } else if (allAreUnchecked) {
            select_all_checkbox.prop('checked', false);
          }
        }}
      >
        <img
          src=${imageUrl}
          style=${{
            minWidth: `${ls.image_min_width}px`,
            maxWidth: `${ls.image_max_width}px`,
          }}
        />
        <div key=${index} class="checkbox"></div>
        ${(show_open_image_button || show_download_image_button) &&
        html`<div class="actions">
          ${show_open_image_button &&
          html`<${OpenImageButton}
            imageUrl=${imageUrl}
            onClick=${(e) => e.stopPropagation()}
          />`}
          ${show_download_image_button &&
          html`<${DownloadImageButton}
            imageUrl=${imageUrl}
            onClick=${(e) => e.stopPropagation()}
          />`}
        </div>`}
        ${show_image_url &&
        html`<div class="image_url_container">
          <${ImageUrlTextbox}
            value=${imageUrl}
            onClick=${(e) => e.stopPropagation()}
          />
        </div>`}
      </div>
    `;
    imagesContainer.append(image);
  });
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

$('main').append(html`
  <div id="filters_container">
    <div style=${{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <input
        type="text"
        id="filter_textbox"
        placeholder="Filter by URL"
        title="Filter by parts of the URL or regular expressions."
        value=${ls.filter_url}
        style=${{ flex: '1' }}
        onKeyUp=${filterImages}
        onChange=${(e) => {
          ls.filter_url = $.trim(e.currentTarget.value);
        }}
      />

      <select
        value=${ls.filter_url_mode}
        onChange=${(e) => {
          ls.filter_url_mode = e.currentTarget.value;
          filterImages();
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
        class=${ls.show_advanced_filters === 'true' ? '' : 'collapsed'}
        title="Advanced filters"
        onClick=${(e) => {
          const slider = $(`#${AdvancedFilters.id}`);
          if (slider.length > 0) {
            ls.show_advanced_filters = false;
            e.currentTarget.classList.add('collapsed');
            slider.remove();
          } else {
            ls.show_advanced_filters = true;
            e.currentTarget.classList.remove('collapsed');
            $('#filters_container').append(
              html`<${AdvancedFilters}
                filterImages=${filterImages}
                state=${ls}
              />`
            );
            AdvancedFilters.initializeFilters();
          }
        }}
      >
        <div class="chevron"></div>
      </button>
    </div>

    ${ls.show_advanced_filters === 'true' &&
    html`<${AdvancedFilters} filterImages=${filterImages} state=${ls} />`}
  </div>

  <div id="images_cache"></div>

  <div id="images_container"></div>

  <div
    id="downloads_container"
    style=${{
      gridTemplateColumns: `${
        ls.show_file_renaming === 'true' ? 'minmax(100px, 1fr)' : ''
      } minmax(100px, 1fr) 80px`,
    }}
  >
    <input
      type="text"
      placeholder="Save to subfolder"
      title="Set the name of the subfolder you want to download the images to."
      value=${ls.folder_name}
      onChange=${(e) => {
        ls.folder_name = $.trim(e.currentTarget.value);
      }}
    />

    ${ls.show_file_renaming === 'true' &&
    html`
      <input
        type="text"
        placeholder="Rename files"
        title="Set a new file name for the images you want to download."
        value=${ls.new_file_name}
        onChange=${(e) => {
          ls.new_file_name = $.trim(e.currentTarget.value);
        }}
      />
    `}

    <input
      type="button"
      id="download_button"
      class="accent"
      value="Download"
      disabled="true"
      onClick=${downloadImages}
    />
  </div>
`);

AdvancedFilters.initializeFilters?.();

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
