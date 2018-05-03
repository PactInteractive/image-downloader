import { Chrome } from './chrome.d';

// Popup
export const defaults: Record<string, string | number | boolean> = {
  // Filters
  folder_name: '',
  new_file_name: '',
  filter_url: '',
  filter_url_mode: 'normal',
  filter_min_width: 0,
  filter_min_width_enabled: false,
  filter_max_width: 3000,
  filter_max_width_enabled: false,
  filter_min_height: 0,
  filter_min_height_enabled: false,
  filter_max_height: 3000,
  filter_max_height_enabled: false,
  only_images_from_links: false,
  // Options
  // General
  show_download_confirmation: true,
  show_download_notification: true,
  show_file_renaming: false,
  // Filters
  show_url_filter: true,
  show_image_width_filter: true,
  show_image_height_filter: true,
  show_only_images_from_links: true,
  // Images
  show_image_url: true,
  show_open_image_button: true,
  show_download_image_button: true,
  columns: 2,
  image_min_width: 50,
  image_max_width: 200,
  image_border_width: 3,
  image_border_color: '#3498db',
};

export const setDefaults = ({ localStorage, chrome }: { localStorage: Storage; chrome: Chrome }) => {
  // TODO: Extract
  // One-time reset of settings
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      // Open the options page after install
      chrome.tabs.create({ url: '/views/options.html' });
    } else if (
      details.reason === 'update' &&
      details.previousVersion &&
      /^(((0|1)\..*)|(2\.(0|1)(\..*)?))$/.test(details.previousVersion)
    ) {
      // Clear data from versions <= 2.1
      localStorage.clear();
    }
  });

  // Global
  localStorage.animation_duration = '500';

  const options = Object.keys(defaults);
  options.forEach((option) => {
    if (localStorage[option] === undefined) {
      localStorage[option] = defaults[option];
    }
    localStorage[`${option}_default`] = defaults[option];
  });

  localStorage.options = JSON.stringify(options);
};

setDefaults({ localStorage: window.localStorage, chrome: window.chrome });
