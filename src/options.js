import html, { render, useState } from './html.js';

import { Checkbox } from './components/Checkbox.js';
import { SupportList } from './Support.js';
import { isNotStrictEqual } from './utils.js';

const initialOptions = Object.keys(localStorage)
  .filter((key) => !key.endsWith('_default'))
  .reduce((options, key) => ({ ...options, [key]: localStorage[key] }), {});

const defaultOptions = Object.keys(localStorage)
  .filter((key) => key.endsWith('_default'))
  .reduce(
    (options, key) => ({
      ...options,
      [key.replace('_default', '')]: localStorage[key],
    }),
    {}
  );

const useNotifications = (initialNotifications = []) => {
  const [notifications, setNotifications] = useState(initialNotifications);

  function addNotification(type, message) {
    setNotifications((notifications) => {
      const notification = { message, type };
      const removeNotificationAfterMs = 10_000;

      setTimeout(() => {
        setNotifications((notifications) =>
          notifications.filter(isNotStrictEqual(notification))
        );
      }, removeNotificationAfterMs);

      return [notification, ...notifications];
    });
  }

  return { notifications, addNotification };
};

const Options = () => {
  const [options, setOptions] = useState(initialOptions);

  const setCheckboxOption = (key) => ({ currentTarget: { checked } }) => {
    setOptions((options) => ({ ...options, [key]: checked.toString() }));
  };

  const setValueOption = (key) => ({ currentTarget: { value } }) => {
    setOptions((state) => ({ ...state, [key]: value }));
  };

  function saveOptions() {
    Object.assign(localStorage, options);
    addNotification('success', 'Options saved');
  }

  function resetOptions() {
    setOptions(defaultOptions);
    addNotification(
      'accent',
      'All options have been reset to their default values. You can now save the changes you made or discard them by closing this page.'
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

  const { notifications, addNotification } = useNotifications();

  return html`
    <h1>
      <img src="/images/icon_128.png" />
      Image Downloader
    </h1>

    <fieldset>
      <legend>About</legend>
      <${SupportList} />
    </fieldset>

    <fieldset>
      <legend>General options</legend>

      <${Checkbox}
        id="show_download_confirmation_checkbox"
        title="Requires confirmation when you press the Download button"
        checked="${options.show_download_confirmation === 'true'}"
        onChange=${setCheckboxOption('show_download_confirmation')}
      >
        <span>Show download confirmation</span>
      <//>

      <br />
      <${Checkbox}
        id="show_file_renaming_checkbox"
        title="Lets you specify a new file name for downloaded files"
        checked="${options.show_file_renaming === 'true'}"
        onChange=${setCheckboxOption('show_file_renaming')}
      >
        <span>Show file renaming textbox</span>
      <//>
    </fieldset>

    <fieldset>
      <legend>Image options</legend>

      <${Checkbox}
        id="show_image_url_checkbox"
        title="Displays the URL above each image"
        checked="${options.show_image_url === 'true'}"
        onChange=${setCheckboxOption('show_image_url')}
      >
        <span>Show the <b>URL</b> on hover</span>
      <//>

      <br />
      <${Checkbox}
        id="show_open_image_button_checkbox"
        title="Displays a button next to each image to open it in a new tab"
        checked="${options.show_open_image_button === 'true'}"
        onChange=${setCheckboxOption('show_open_image_button')}
      >
        <span>Show the <b>Open</b> button on hover</span>
      <//>

      <br />
      <${Checkbox}
        id="show_download_image_button_checkbox"
        title="Displays a button next to each image to individually download it. This download does not require confirmation, even if you've enabled the confirmation option."
        checked="${options.show_download_image_button === 'true'}"
        onChange=${setCheckboxOption('show_download_image_button')}
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
              value="${options.columns}"
              onChange=${setValueOption('columns')}
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
              value="${options.image_min_width}"
              onChange=${setValueOption('image_min_width')}
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
              value="${options.image_max_width}"
              onChange=${setValueOption('image_max_width')}
            />px
          </td>
        </tr>
      </table>
    </fieldset>

    <div style=${{ display: 'flex', gap: '4px' }}>
      <input
        type="button"
        id="clear_data_button"
        class="danger ghost"
        value="Clear Data"
        title="Clears all data this extension has stored on your machine"
        onClick=${clearData}
      />

      <input
        type="button"
        id="reset_button"
        class="neutral ghost"
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

    <!-- TODO: Animate -->
    <div id="notifications">
      ${notifications.map(
        (notification) => html`
          <div class="notification ${`bg-${notification.type}`} inverse">
            ${notification.message}
          </div>
        `
      )}
    </div>
  `;
};

render(html`<${Options} />`, document.querySelector('main'));
