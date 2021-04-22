import html from './html.js';
import { Checkbox } from './Checkbox.js';
import { SupportList } from './Support.js';

let state = Object.keys(localStorage).reduce(
  (newState, key) =>
    key.endsWith('_default')
      ? newState
      : { ...newState, [key]: localStorage[key] },
  {}
);

function render() {
  $('main').html(html`
    <h1>
      <img src="/images/icon_128.png" />
      Image Downloader
    </h1>

    <fieldset>
      <legend>About</legend>
      <${SupportList} />
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
      <legend>Images</legend>

      <${Checkbox}
        id="show_image_url_checkbox"
        title="Displays the URL above each image"
        checked="${state.show_image_url === 'true'}"
        onChange=${(e) => {
          state.show_image_url = e.currentTarget.checked.toString();
        }}
      >
        <span>Show the <b>URL</b> on hover</span>
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
        <span>Show the <b>Open</b> button on hover</span>
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
        <span>Show the <b>Download</b> button on hover</span>
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
  addNotification('Options saved.', 'bg-success inverse');
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
    'bg-accent inverse'
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
  const animation_duration = parseInt(localStorage.animation_duration, 10);
  // TODO: Figure out how to animate and move to state
  const container = $('<div class="notification"></div>')
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
