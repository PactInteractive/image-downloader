((ls) => {
  'use strict';

  // One-time reset of settings
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      // Open the options page after install
      chrome.tabs.create({ url: '/views/options.html' });
    } else if (
      details.reason === 'update' &&
      /^(((0|1)\..*)|(2\.(0|1)(\..*)?))$/.test(details.previousVersion)
    ) {
      // Clear data from versions before 2.1
      ls.clear();
    }
  });

  // Popup
  const defaults = {
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
    show_file_renaming: true,
    // Images
    show_image_url: true,
    show_open_image_button: true,
    show_download_image_button: true,
    columns: 2,
    image_min_width: 50,
    image_max_width: 200,
  };

  Object.keys(defaults).forEach((option) => {
    if (ls[option] === undefined) {
      ls[option] = defaults[option];
    }
    ls[`${option}_default`] = defaults[option];
  });
})(localStorage);
