import html from './html.js';
import { Checkbox } from './Checkbox.js';

let state = Object.keys(localStorage).reduce(
  (newState, key) =>
    key.endsWith('_default')
      ? newState
      : { ...newState, [key]: localStorage[key] },
  {}
);

function render() {
  $('main').html(html`
    <h2>Image Downloader</h2>

    <fieldset>
      <legend>About</legend>

      This extension is and always will be free, open-source, and without
      targeted ads or tracking algorithms.
      <br />
      The source code can be found on GitHub:${' '}
      <a href="https://github.com/vdsabev/image-downloader" target="_blank">
        https://github.com/vdsabev/image-downloader
      </a>
    </fieldset>

    <fieldset>
      <legend>General</legend>

      <${Checkbox}
        id="show_download_confirmation_checkbox"
        title="Requires confirmation when you press the Download button"
        checked="${state.show_download_confirmation === 'true'}"
        onChange=${(e) => {
          state.show_download_confirmation = e.currentTarget.checked.toString();
        }}
      >
        <span>Show download confirmation</span>
      <//>

      <br />
      <${Checkbox}
        id="show_download_notification_checkbox"
        title="Flashes a message to let you know your download is starting"
        checked="${state.show_download_notification === 'true'}"
        onChange=${(e) => {
          state.show_download_notification = e.currentTarget.checked.toString();
        }}
      >
        <span>Show <b>downloading</b> message</span>
      <//>

      <br />
      <${Checkbox}
        id="show_file_renaming_checkbox"
        title="Lets you specify a new file name for downloaded files"
        checked="${state.show_file_renaming === 'true'}"
        onChange=${(e) => {
          state.show_file_renaming = e.currentTarget.checked.toString();
        }}
      >
        <span>Show file renaming textbox</span>
      <//>
    </fieldset>

    <fieldset>
      <legend>Filters</legend>

      <${Checkbox}
        id="show_url_filter_checkbox"
        title="Enables filtering by image URL; supports wildcard and regex"
        checked="${state.show_url_filter === 'true'}"
        onChange=${(e) => {
          state.show_url_filter = e.currentTarget.checked.toString();
        }}
      >
        <span>Show image URL filter</span>
      <//>

      <br />
      <${Checkbox}
        id="show_image_width_filter_checkbox"
        title="Enables filtering by image width"
        checked="${state.show_image_width_filter === 'true'}"
        onChange=${(e) => {
          state.show_image_width_filter = e.currentTarget.checked.toString();
        }}
      >
        <span>Show image width filter</span>
      <//>

      <br />
      <${Checkbox}
        id="show_image_height_filter_checkbox"
        title="Enables filtering by image height"
        checked="${state.show_image_height_filter === 'true'}"
        onChange=${(e) => {
          state.show_image_height_filter = e.currentTarget.checked.toString();
        }}
      >
        <span>Show image height filter</span>
      <//>

      <br />
      <${Checkbox}
        id="show_only_images_from_links_checkbox"
        title="Enables the option to only show images from direct links on the page; this can be useful on sites like Reddit"
        checked="${state.show_only_images_from_links === 'true'}"
        onChange=${(e) => {
          state.show_only_images_from_links = e.currentTarget.checked.toString();
        }}
      >
        <span>Show <b>Only images from links</b> option</span>
      <//>
    </fieldset>

    <fieldset>
      <legend>Images</legend>

      <${Checkbox}
        id="show_image_url_checkbox"
        title="Displays the URL above each image"
        checked="${state.show_image_url === 'true'}"
        onChange=${(e) => {
          state.show_image_url = e.currentTarget.checked.toString();
        }}
      >
        <span>Show the URL textbox</span>
      <//>

      <br />
      <${Checkbox}
        id="show_open_image_button_checkbox"
        title="Displays a button next to each image to open it in a new tab"
        checked="${state.show_open_image_button === 'true'}"
        onChange=${(e) => {
          state.show_open_image_button = e.currentTarget.checked.toString();
        }}
      >
        <span>Show the <b>open</b> button</span>
      <//>

      <br />
      <${Checkbox}
        id="show_download_image_button_checkbox"
        title="Displays a button next to each image to individually download it. This download does not require confirmation, even if you've enabled the confirmation option."
        checked="${state.show_download_image_button === 'true'}"
        onChange=${(e) => {
          state.show_download_image_button = e.currentTarget.checked.toString();
        }}
      >
        <span>Show the <b>download</b> button</span>
      <//>

      <table>
        <tr title="The number of columns">
          <td><label for="columns_numberbox">Columns:</label></td>
          <td>
            <input
              id="columns_numberbox"
              type="number"
              required
              min="1"
              max="10"
              value="${state.columns}"
              onChange=${(e) => {
                state.columns = e.currentTarget.value;
              }}
            />
          </td>
        </tr>

        <tr
          title="Setting the minimum width can be useful for images that are too small to make out"
        >
          <td>
            <label for="image_min_width_numberbox">
              Minimum Display Width:
            </label>
          </td>
          <td>
            <input
              id="image_min_width_numberbox"
              type="number"
              required
              min="0"
              max="720"
              value="${state.image_min_width}"
              onChange=${(e) => {
                state.image_min_width = e.currentTarget.value;
              }}
            />px
          </td>
        </tr>

        <tr
          title="Setting the maximum width prevents bigger images from taking too much space, and also changes the size of the popup"
        >
          <td>
            <label for="image_max_width_numberbox">
              Maximum Display Width:
            </label>
          </td>
          <td>
            <input
              id="image_max_width_numberbox"
              type="number"
              required
              min="30"
              max="720"
              value="${state.image_max_width}"
              onChange=${(e) => {
                state.image_max_width = e.currentTarget.value;
              }}
            />px
          </td>
        </tr>
      </table>
    </fieldset>

    <div style=${{ display: 'flex', gap: '4px' }}>
      <input
        type="button"
        id="clear_data_button"
        class="danger"
        value="Clear Data"
        title="Clears all data this extension has stored on your machine"
        onClick=${clearData}
      />

      <input
        type="button"
        id="reset_button"
        class="warning"
        style=${{ marginLeft: 'auto' }}
        value="Reset"
        title="Resets all settings to their defaults; save afterwards to preserve the changes"
        onClick=${resetOptions}
      />

      <input
        type="button"
        id="save_button"
        class="accent"
        value="Save"
        title="Saves the current settings"
        onClick=${saveOptions}
      />
    </div>

    <div id="notifications"></div>
  `);
}

function saveOptions() {
  Object.assign(localStorage, state);
  addNotification('Options saved.', 'success');
}

function resetOptions() {
  const options = JSON.parse(localStorage.options);
  state = options.reduce(
    (newState, key) => ({ ...newState, [key]: localStorage[`${key}_default`] }),
    {}
  );
  render();
  addNotification(
    'All options have been reset to their default values. You can now save the changes you made or discard them by closing this page.',
    'warning'
  );
}

function clearData() {
  const userHasConfirmed = window.confirm(
    'This will delete all extension data related to filters, options, and the name of the default folder where files are saved. Continue?'
  );
  if (userHasConfirmed) {
    localStorage.clear();
    window.location.reload();
  }
}

function addNotification(message, cssClass) {
  const animation_duration = parseInt(localStorage.animation_duration);
  // TODO: Figure out how to animate and move to state
  const container = $('<div></div>')
    .prependTo('#notifications')
    .toggle(false)
    .html(message)
    .addClass(cssClass)
    .fadeIn(animation_duration, () => {
      setTimeout(() => {
        container.fadeOut(animation_duration, () => {
          container.remove();
        });
      }, 10_000);
    });
}

render();
