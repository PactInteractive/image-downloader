(function (ls) {
  'use strict';

  // Global
  ls.animation_duration = '500';

  // Popup
  // Filters
  ls.folder_name = ls.folder_name || '';
  ls.filter_mode = ls.filter_mode || 'normal';
  ls.only_images_from_links = ls.only_images_from_links || 'false';

  // Options
  // General
  ls.show_download_confirmation_default = 'true';
  ls.show_download_confirmation = ls.show_download_confirmation || ls.show_download_confirmation_default;

  ls.show_download_notification_default = 'true';
  ls.show_download_notification = ls.show_download_notification || ls.show_download_notification_default;

  // Filters
  ls.show_filter_mode_default = 'true';
  ls.show_filter_mode = ls.show_filter_mode || ls.show_filter_mode_default;

  ls.show_only_images_from_links_default = 'true';
  ls.show_only_images_from_links = ls.show_only_images_from_links || ls.show_only_images_from_links_default;

  ls.show_sort_by_url_default = 'true';
  ls.show_sort_by_url = ls.show_sort_by_url || ls.show_sort_by_url_default;

  // Images
  ls.show_image_url_default = 'true';
  ls.show_image_url = ls.show_image_url || ls.show_image_url_default;

  ls.show_open_image_button_default = 'true';
  ls.show_open_image_button = ls.show_open_image_button || ls.show_open_image_button_default;

  ls.show_download_image_button_default = 'true';
  ls.show_download_image_button = ls.show_download_image_button || ls.show_download_image_button_default;

  ls.columns_default = '2';
  ls.columns = ls.columns || ls.columns_default;

  ls.image_min_width_default = '50';
  ls.image_min_width = ls.image_min_width || ls.image_min_width_default;

  ls.image_max_width_default = '150';
  ls.image_max_width = ls.image_max_width || ls.image_max_width_default;

  ls.image_border_width_default = '3';
  ls.image_border_width = ls.image_border_width || ls.image_border_width_default;

  ls.image_border_color_default = '#3498db';
  ls.image_border_color = ls.image_border_color || ls.image_border_color_default;

  ls.body_width_default = parseInt(ls.columns_default) * parseInt(ls.image_max_width_default);
  ls.body_width = ls.body_width || ls.body_width_default;
}(localStorage));
