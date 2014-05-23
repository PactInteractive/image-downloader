(function (ls) {
  'use strict';

  // One-time reset of settings
  chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'update' && chrome.runtime.getManifest().version === '2.1') {
      ls.clear();
    }
  });

  // Global
  ls.animation_duration = '500';

  // Popup
  var defaults = {
    // Filters
    show_donation_link: true,
    folder_name: '',
    filter_url_mode: 'normal',
    filter_min_width: 0,
    filter_min_width_enabled: true,
    filter_max_width: 3000,
    filter_max_width_enabled: true,
    filter_min_height: 0,
    filter_min_height_enabled: true,
    filter_max_height: 3000,
    filter_max_height_enabled: true,
    only_images_from_links: false,
    // Options
    // General
    show_download_confirmation: true,
    show_download_notification: true,
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
    image_border_color: '#3498db'
  };

  defaults.body_width = Math.max(250, defaults.columns * defaults.image_max_width);

  for (var option in defaults) {
    if (ls[option] === undefined) ls[option] = defaults[option];
    ls[option + '_default'] = defaults[option];
  }

  ls.options = JSON.stringify(Object.keys(defaults));
}(localStorage));
