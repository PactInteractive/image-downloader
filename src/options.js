import html from './html.js';
import { Checkbox } from './Checkbox.js';

const ls = localStorage;

function render(values = ls) {
  $('main').html(html`
    <h2>Image Downloader</h2>

    <fieldset>
      <legend>About</legend>

      This extension is and always will be free, open-source, and without
      targeted ads or tracking algorithms.
      <br />
      The source code can be found on GitHub:
      <a href="https://github.com/vdsabev/image-downloader" target="_blank">
        https://github.com/vdsabev/image-downloader
      </a>
    </fieldset>

    <fieldset>
      <legend>General</legend>

      <${Checkbox}
        id="show_download_confirmation_checkbox"
        checked="${values.show_download_confirmation === 'true'}"
        title="Requires confirmation when you press the Download button"
      >
        <span>Show download confirmation</span>
      <//>

      <br />
      <${Checkbox}
        id="show_download_notification_checkbox"
        checked="${values.show_download_notification === 'true'}"
        title="Flashes a message to let you know your download is starting"
      >
        <span>Show <b>downloading</b> message</span>
      <//>

      <br />
      <${Checkbox}
        id="show_file_renaming_checkbox"
        checked="${values.show_file_renaming === 'true'}"
        title="Lets you specify a new file name for downloaded files"
      >
        <span>Show file renaming textbox</span>
      <//>
    </fieldset>

    <fieldset>
      <legend>Filters</legend>

      <${Checkbox}
        id="show_url_filter_checkbox"
        checked="${values.show_url_filter === 'true'}"
        title="Enables filtering by image URL; supports wildcard and regex"
      >
        <span>Show image URL filter</span>
      <//>

      <br />
      <${Checkbox}
        id="show_image_width_filter_checkbox"
        checked="${values.show_image_width_filter === 'true'}"
        title="Enables filtering by image width"
      >
        <span>Show image width filter</span>
      <//>

      <br />
      <${Checkbox}
        id="show_image_height_filter_checkbox"
        checked="${values.show_image_height_filter === 'true'}"
        title="Enables filtering by image height"
      >
        <span>Show image height filter</span>
      <//>

      <br />
      <${Checkbox}
        id="show_only_images_from_links_checkbox"
        checked="${values.show_only_images_from_links === 'true'}"
        title="Enables the option to only show images from direct links on the page; this can be useful on sites like Reddit"
      >
        <span>Show <b>Only images from links</b> option</span>
      <//>
    </fieldset>

    <fieldset>
      <legend>Images</legend>

      <${Checkbox}
        id="show_image_url_checkbox"
        checked="${values.show_image_url === 'true'}"
        title="Displays the URL above each image"
      >
        <span>Show the URL textbox</span>
      <//>

      <br />
      <${Checkbox}
        id="show_open_image_button_checkbox"
        checked="${values.show_open_image_button === 'true'}"
        title="Displays a button next to each image to open it in a new tab"
      >
        <span>Show the <b>open</b> button</span>
      <//>

      <br />
      <${Checkbox}
        id="show_download_image_button_checkbox"
        checked="${values.show_download_image_button === 'true'}"
        title="Displays a button next to each image to individually download it. This download does not require confirmation, even if you've enabled the confirmation option."
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
              min="1"
              max="10"
              value="${values.columns}"
              required
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
              min="0"
              max="720"
              value="${values.image_min_width}"
              required
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
              min="30"
              max="720"
              value="${values.image_max_width}"
              required
            />px
          </td>
        </tr>

        <tr>
          <td>
            <label for="image_border_width_numberbox">Border Width:</label>
          </td>
          <td>
            <input
              id="image_border_width_numberbox"
              type="number"
              min="1"
              max="10"
              value="${values.image_border_width}"
              required
            />px
          </td>
        </tr>

        <tr>
          <td><label for="image_border_color_picker">Border Color:</label></td>
          <td>
            <input
              id="image_border_color_picker"
              type="color"
              value="${values.image_border_color}"
            />
          </td>
        </tr>
      </table>
    </fieldset>

    <div id="buttons">
      <input
        type="button"
        id="save_button"
        class="accent"
        value="SAVE"
        title="Saves the current settings"
        onClick=${saveOptions}
      />
      <input
        type="button"
        id="reset_button"
        class="warning"
        value="RESET"
        title="Resets all settings to their defaults; save afterwards to preserve the changes"
        onClick=${resetOptions}
      />
      <input
        type="button"
        id="clear_data_button"
        class="danger right"
        value="CLEAR DATA"
        title="Clears all data this extension has stored on your machine"
        onClick=${clearData}
      />
    </div>

    <div id="notifications"></div>
  `);
}

function saveOptions() {
  // General
  ls.show_download_confirmation = $(
    '#show_download_confirmation_checkbox'
  ).prop('checked');
  ls.show_download_notification = $(
    '#show_download_notification_checkbox'
  ).prop('checked');
  ls.show_file_renaming = $('#show_file_renaming_checkbox').prop('checked');

  // Filters
  ls.show_url_filter = $('#show_url_filter_checkbox').prop('checked');
  ls.show_image_width_filter = $('#show_image_width_filter_checkbox').prop(
    'checked'
  );
  ls.show_image_height_filter = $('#show_image_height_filter_checkbox').prop(
    'checked'
  );
  ls.show_only_images_from_links = $(
    '#show_only_images_from_links_checkbox'
  ).prop('checked');

  // Images
  ls.show_image_url = $('#show_image_url_checkbox').prop('checked');
  ls.show_open_image_button = $('#show_open_image_button_checkbox').prop(
    'checked'
  );
  ls.show_download_image_button = $(
    '#show_download_image_button_checkbox'
  ).prop('checked');

  ls.columns = $('#columns_numberbox').val();
  ls.image_min_width = $('#image_min_width_numberbox').val();
  ls.image_max_width = $('#image_max_width_numberbox').val();
  ls.image_border_width = $('#image_border_width_numberbox').val();
  ls.image_border_color = $('#image_border_color_picker').val();

  addNotification('Options saved.', 'success');
}

function resetOptions() {
  resetToDefault();
  addNotification(
    'All options have been reset to their default values. You can now save the changes you made or discard them by closing this page.',
    'warning'
  );
}

function resetToDefault() {
  var options = JSON.parse(ls.options);
  var values = {};
  for (var i = 0; i < options.length; i++) {
    values[options[i]] = ls[options[i] + '_default'];
  }
  render(values);
}

function clearData() {
  var result = window.confirm(
    'Are you sure you want to clear all data for this extension? This includes filters, options and the name of the default folder where files are saved.'
  );
  if (result) {
    ls.clear();
    window.location.reload();
  }
}

function addNotification(message, cssClass) {
  var animation_duration = parseInt(ls.animation_duration);
  var container = $('<div></div>')
    .prependTo('#notifications')
    .toggle(false)
    .html(message)
    .addClass(cssClass)
    .fadeIn(animation_duration, () => {
      setTimeout(() => {
        container.fadeOut(animation_duration, () => {
          container.remove();
        });
      }, 10000);
    });
}

render();
