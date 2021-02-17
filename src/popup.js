import html from './html.js';
import { Checkbox } from './Checkbox.js';
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

function toggleDimensionFilter(element, option, value) {
  if (value !== undefined) {
    ls[option] = value;
  }
  $(element).toggleClass('light', ls[option] !== 'true');
  filterImages();
}

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
      newFilename += `${ls.new_file_name}${ls.image_number}.${extension}`;
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
    if (
      ls.show_image_width_filter === 'true' ||
      ls.show_image_height_filter === 'true'
    ) {
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
    }

    // Copy all images initially
    visibleImages = allImages.slice(0);

    if (ls.show_url_filter === 'true') {
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
    }

    if (
      ls.show_only_images_from_links === 'true' &&
      ls.only_images_from_links === 'true'
    ) {
      visibleImages = visibleImages.filter((url) => linkedImages[url]);
    }

    if (
      ls.show_image_width_filter === 'true' ||
      ls.show_image_height_filter === 'true'
    ) {
      visibleImages = visibleImages.filter((url) => {
        const image = images_cache.children(`img[src="${encodeURI(url)}"]`)[0];
        return (
          (ls.show_image_width_filter !== 'true' ||
            ((ls.filter_min_width_enabled !== 'true' ||
              ls.filter_min_width <= image.naturalWidth) &&
              (ls.filter_max_width_enabled !== 'true' ||
                image.naturalWidth <= ls.filter_max_width))) &&
          (ls.show_image_height_filter !== 'true' ||
            ((ls.filter_min_height_enabled !== 'true' ||
              ls.filter_min_height <= image.naturalHeight) &&
              (ls.filter_max_height_enabled !== 'true' ||
                image.naturalHeight <= ls.filter_max_height)))
        );
      });
    }

    displayImages();
  }, 200);
}

function displayImages() {
  $('#download_button').prop('disabled', true);

  const images_table = $('#images_table');
  images_table.empty();

  const toggle_all_checkbox_row = html`
    <tr>
      <th align="left" colspan=${ls.columns}>
        <${Checkbox}
          id="toggle_all_checkbox"
          onChange=${(e) => {
            $('#download_button').prop('disabled', !e.target.checked);
            for (let index = 0; index < visibleImages.length; index++) {
              $(`#image${index}`).toggleClass('checked', e.target.checked);
            }
          }}
        >
          Select all (${visibleImages.length})
        <//>
      </th>
    </tr>
  `;
  images_table.append(toggle_all_checkbox_row);

  const columns = parseInt(ls.columns, 10);
  const columnWidth = `${Math.round((100 * 100) / columns) / 100}%`;
  const rows = Math.ceil(visibleImages.length / columns);

  // Tools row
  const show_image_url = ls.show_image_url === 'true';
  const show_open_image_button = ls.show_open_image_button === 'true';
  const show_download_image_button = ls.show_download_image_button === 'true';

  const colspan =
    (show_image_url ? 1 : 0) +
      (show_open_image_button ? 1 : 0) +
      (show_download_image_button ? 1 : 0) || 1;

  // Append dummy image row to keep the popup width constant when there are 0 images
  const DummyCell = () => html`
    <td
      colspan=${colspan}
      style=${{
        minWidth: `${ls.image_max_width}px`,
        width: columnWidth,
        verticalAlign: 'top',
      }}
    ></td>
  `;
  const DummyRow = () => html`
    <tr>
      ${Array(columns)
        .fill(undefined)
        .map(() => html`<${DummyCell} />`)}
    </tr>
  `;
  images_table.append(html`<${DummyRow} />`);

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    if (
      show_image_url ||
      show_open_image_button ||
      show_download_image_button
    ) {
      const actions_row = html`
        <tr>
          ${Array(columns)
            .fill(undefined)
            .map((_, columnIndex) => {
              const index = rowIndex * columns + columnIndex;
              if (index === visibleImages.length) return null;

              const imageUrl = visibleImages[index];
              return html`
                ${show_image_url &&
                html`<td><${ImageUrlTextbox} value=${imageUrl} /></td>`}
                ${show_open_image_button &&
                html`<td><${OpenImageButton} imageUrl=${imageUrl} /></td>`}
                ${show_download_image_button &&
                html`<td><${DownloadImageButton} imageUrl=${imageUrl} /></td>`}
              `;
            })}
        </tr>
      `;
      images_table.append(actions_row);
    }

    // Images row
    const images_row = $('<tr></tr>');
    for (let columnIndex = 0; columnIndex < columns; columnIndex++) {
      const index = rowIndex * columns + columnIndex;
      if (index === visibleImages.length) break;

      const imageUrl = visibleImages[index];

      const image = html`
        <td
          colspan=${colspan}
          style=${{
            minWidth: `${ls.image_max_width}px`,
            width: columnWidth,
            verticalAlign: 'top',
          }}
        >
          <img
            id=${`image${index}`}
            src=${imageUrl}
            onClick=${(e) => {
              $(e.target).toggleClass(
                'checked',
                !$(e.target).hasClass('checked')
              );

              let allAreChecked = true;
              let allAreUnchecked = true;
              for (let index = 0; index < visibleImages.length; index++) {
                if ($(`#image${index}`).hasClass('checked')) {
                  allAreUnchecked = false;
                } else {
                  allAreChecked = false;
                }
                // Exit the loop early
                if (!(allAreChecked || allAreUnchecked)) break;
              }

              $('#download_button').prop('disabled', allAreUnchecked);

              const toggle_all_checkbox = $('#toggle_all_checkbox');
              toggle_all_checkbox.prop(
                'indeterminate',
                !(allAreChecked || allAreUnchecked)
              );
              if (allAreChecked) {
                toggle_all_checkbox.prop('checked', true);
              } else if (allAreUnchecked) {
                toggle_all_checkbox.prop('checked', false);
              }
            }}
          />
        </td>
      `;
      images_row.append(image);
    }
    images_table.append(images_row);
  }
}

function downloadImages() {
  if (ls.show_download_confirmation === 'true') {
    showDownloadConfirmation(startDownload);
  } else {
    startDownload();
  }

  function startDownload() {
    const checkedImages = [];
    for (let index = 0; index < visibleImages.length; index++) {
      if ($(`#image${index}`).hasClass('checked')) {
        checkedImages.push(visibleImages[index]);
      }
    }
    ls.image_count = checkedImages.length;
    ls.image_number = 1;
    checkedImages.forEach((checkedImage) => {
      chrome.downloads.download({ url: checkedImage });
    });

    flashDownloadingNotification(ls.image_count);
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
    <div>
      <div>
        <hr />
        Take a quick look at your Chrome settings and search for
        <b> download location</b>.
        <span class="danger">
          If the <b>Ask where to save each file before downloading</b> option is
          checked, proceeding might open a lot of popup windows. Are you sure
          you want to do this?
        </span>
      </div>

      <input
        type="button"
        class="success"
        value="YES"
        onClick=${() => {
          saveDontShowAgainState();
          removeNotificationContainer();
          startDownload();
        }}
      />

      &nbsp;

      <input
        type="button"
        class="danger"
        value="NO"
        onClick=${() => {
          saveDontShowAgainState();
          removeNotificationContainer();
        }}
      />

      <${Checkbox} id="dont_show_again_checkbox">
        Don't show this again
      <//>
    </div>
  `;

  $('#filters_container').append(notification_container);
}

function flashDownloadingNotification(imageCount) {
  if (ls.show_download_notification !== 'true') return;

  const downloading_notification = html`
    <div class="success">
      Downloading ${imageCount} image${imageCount > 1 ? 's' : ''}...
    </div>
  `;

  $('#filters_container').append(downloading_notification);

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
      callback(element);
    }
  };
  fade(false);
}

$('main').append(html`
  <div id="filters_container">
    <table id="filter_inputs_container" class="grid">
      <colgroup>
        <col />
        <col style=${{ width: '100px' }} />
      </colgroup>

      <tr>
        <td>
          <input
            type="text"
            placeholder="SAVE TO SUBFOLDER"
            title="Set the name of the subfolder you want to download the images to."
            value=${ls.folder_name}
            onChange=${(e) => {
              ls.folder_name = $.trim(e.target.value);
            }}
          />
        </td>

        <td>
          <input
            type="button"
            id="download_button"
            class="accent"
            value="DOWNLOAD"
            disabled="true"
            onClick=${downloadImages}
          />
        </td>
      </tr>

      ${ls.show_file_renaming === 'true' &&
      html`
        <tr>
          <td colspan="{2}">
            <input
              type="text"
              placeholder="RENAME FILES"
              title="Set a new file name for the images you want to download."
              value=${ls.new_file_name}
              onChange=${(e) => {
                ls.new_file_name = $.trim(e.target.value);
              }}
            />
          </td>
        </tr>
      `}
      ${ls.show_url_filter === 'true' &&
      html`
        <tr>
          <td>
            <input
              type="text"
              id="filter_textbox"
              placeholder="FILTER BY URL"
              title="Filter by parts of the URL or regular expressions."
              value=${ls.filter_url}
              onKeyUp=${ls.show_url_filter === 'true' && filterImages}
              onChange=${(e) => {
                ls.filter_url = $.trim(e.target.value);
              }}
            />
          </td>

          <td>
            <select
              value=${ls.filter_url_mode}
              onChange=${(e) => {
                ls.filter_url_mode = e.target.value;
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
          </td>
        </tr>
      `}
    </table>

    <table class="grid">
      <colgroup>
        <col style=${{ width: '45px' }} />
        <col style=${{ width: '40px' }} />
        <col style=${{ width: '10px' }} />
        <col />
        <col style=${{ width: '10px' }} />
        <col style=${{ width: '40px' }} />
      </colgroup>

      ${ls.show_image_width_filter === 'true' &&
      html`
        <tr id="image_width_filter">
          <td>Width:</td>

          <td style=${{ textAlign: 'right' }}>
            <label for="image_width_filter_min_checkbox">
              <small id="image_width_filter_min"></small>
            </label>
          </td>

          <td>
            <input
              type="checkbox"
              id="image_width_filter_min_checkbox"
              checked=${ls[`filter_min_width_enabled`] === 'true'}
              onChange=${(e) => {
                toggleDimensionFilter(
                  e.target,
                  `filter_min_width_enabled`,
                  e.target.checked
                );
              }}
            />
          </td>

          <td>
            <div id="image_width_filter_slider"></div>
          </td>

          <td>
            <input
              type="checkbox"
              id="image_width_filter_max_checkbox"
              checked=${ls[`filter_max_width_enabled`] === 'true'}
              onChange=${(e) => {
                toggleDimensionFilter(
                  e.target,
                  `filter_max_width_enabled`,
                  e.target.checked
                );
              }}
            />
          </td>

          <td style=${{ textAlign: 'right' }}>
            <label for="image_width_filter_max_checkbox">
              <small id="image_width_filter_max"></small>
            </label>
          </td>
        </tr>
      `}
      ${ls.show_image_height_filter === 'true' &&
      html`
        <tr id="image_height_filter">
          <td>Height:</td>

          <td style=${{ textAlign: 'right' }}>
            <label for="image_height_filter_min_checkbox">
              <small id="image_height_filter_min"></small>
            </label>
          </td>

          <td>
            <input
              type="checkbox"
              id="image_height_filter_min_checkbox"
              checked=${ls[`filter_min_height_enabled`] === 'true'}
              onChange=${(e) => {
                toggleDimensionFilter(
                  e.target,
                  `filter_min_height_enabled`,
                  e.target.checked
                );
              }}
            />
          </td>

          <td>
            <div id="image_height_filter_slider"></div>
          </td>

          <td>
            <input
              type="checkbox"
              id="image_height_filter_max_checkbox"
              checked=${ls[`filter_max_height_enabled`] === 'true'}
              onChange=${(e) => {
                toggleDimensionFilter(
                  e.target,
                  `filter_max_height_enabled`,
                  e.target.checked
                );
              }}
            />
          </td>

          <td style=${{ textAlign: 'right' }}>
            <label for="image_height_filter_max_checkbox">
              <small id="image_height_filter_max"></small>
            </label>
          </td>
        </tr>
      `}
    </table>

    ${ls.show_only_images_from_links === 'true' &&
    html`
      <${Checkbox}
        title="Only show images from direct links on the page; this can be useful on sites like Reddit"
        checked=${ls.only_images_from_links === 'true'}
        onChange=${(e) => {
          ls.only_images_from_links = e.target.checked;
          filterImages();
        }}
      >
        Only images from links
      <//>
    `}
  </div>

  <div id="images_cache"></div>

  <table id="images_table" class="grid"></table>
`);

chrome.downloads.onDeterminingFilename.addListener(suggestNewFilename);

if (
  ls.show_image_width_filter === 'true' ||
  ls.show_image_height_filter === 'true'
) {
  // Image dimension filters
  const serializeSliderValue = (label, option) => {
    return $.Link({
      target(value) {
        $(`#${label}`).html(`${value}px`);
        ls[option] = value;
        filterImages();
      },
    });
  };

  const initializeFilter = (dimension) => {
    $(`#image_${dimension}_filter_slider`).noUiSlider({
      behaviour: 'extend-tap',
      connect: true,
      range: {
        min: parseInt(ls[`filter_min_${dimension}_default`], 10),
        max: parseInt(ls[`filter_max_${dimension}_default`], 10),
      },
      step: 10,
      start: [ls[`filter_min_${dimension}`], ls[`filter_max_${dimension}`]],
      serialization: {
        lower: [
          serializeSliderValue(
            `image_${dimension}_filter_min`,
            `filter_min_${dimension}`
          ),
        ],
        upper: [
          serializeSliderValue(
            `image_${dimension}_filter_max`,
            `filter_max_${dimension}`
          ),
        ],
        format: { decimals: 0 },
      },
    });

    toggleDimensionFilter(
      $(`image_${dimension}_filter_min`),
      `filter_min_${dimension}_enabled`
    );

    toggleDimensionFilter(
      $(`image_${dimension}_filter_max`),
      `filter_max_${dimension}_enabled`
    );
  };

  // Image width filter
  if (ls.show_image_width_filter === 'true') {
    initializeFilter('width');
  }

  // Image height filter
  if (ls.show_image_height_filter === 'true') {
    initializeFilter('height');
  }
}

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

// Images
jss.set('img', {
  'min-width': `${ls.image_min_width}px`,
  'max-width': `${ls.image_max_width}px`,
  'border-width': `${ls.image_border_width}px`,
  'border-style': 'solid',
  'border-color': '#f6f6f6',
});
jss.set('img.checked', {
  'border-color': ls.image_border_color,
});

// Periodically set the body padding to offset the height of the fixed position filters
setInterval(() => {
  $('body').css('padding-top', $('#filters_container').height());
}, 200);
