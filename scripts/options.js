(function (ls) {
  /* globals $ */
  'use strict';

  function initializeControlValues(values) {
    if (!values) values = ls;

    // General
    $('#show_download_confirmation_checkbox').prop('checked', values.show_download_confirmation === 'true');
    $('#show_download_notification_checkbox').prop('checked', values.show_download_notification === 'true');
    $('#show_file_renaming_checkbox').prop('checked', values.show_file_renaming === 'true');

    // Filters
    $('#show_url_filter_checkbox').prop('checked', values.show_url_filter === 'true');
    $('#show_image_width_filter_checkbox').prop('checked', values.show_image_width_filter === 'true');
    $('#show_image_height_filter_checkbox').prop('checked', values.show_image_height_filter === 'true');
    $('#show_only_images_from_links_checkbox').prop('checked', values.show_only_images_from_links === 'true');

    // Images
    $('#show_image_url_checkbox').prop('checked', values.show_image_url === 'true');
    $('#show_open_image_button_checkbox').prop('checked', values.show_open_image_button === 'true');
    $('#show_download_image_button_checkbox').prop('checked', values.show_download_image_button === 'true');

    $('#columns_numberbox').val(values.columns);
    $('#image_min_width_numberbox').val(values.image_min_width);
    $('#image_max_width_numberbox').val(values.image_max_width);
    $('#image_border_width_numberbox').val(values.image_border_width);
    $('#image_border_color_picker').val(values.image_border_color);
  }

  function initializeControlEvents() {
    // Buttons
    $('#save_button').on('click', saveOptions);
    $('#reset_button').on('click', resetOptions);
    $('#clear_data_button').on('click', clearData);
  }

  function saveOptions() {
    // General
    ls.show_download_confirmation = $('#show_download_confirmation_checkbox').prop('checked');
    ls.show_download_notification = $('#show_download_notification_checkbox').prop('checked');
    ls.show_file_renaming = $('#show_file_renaming_checkbox').prop('checked');

    // Filters
    ls.show_url_filter = $('#show_url_filter_checkbox').prop('checked');
    ls.show_image_width_filter = $('#show_image_width_filter_checkbox').prop('checked');
    ls.show_image_height_filter = $('#show_image_height_filter_checkbox').prop('checked');
    ls.show_only_images_from_links = $('#show_only_images_from_links_checkbox').prop('checked');

    // Images
    ls.show_image_url = $('#show_image_url_checkbox').prop('checked');
    ls.show_open_image_button = $('#show_open_image_button_checkbox').prop('checked');
    ls.show_download_image_button = $('#show_download_image_button_checkbox').prop('checked');

    ls.columns = $('#columns_numberbox').val();
    ls.image_min_width = $('#image_min_width_numberbox').val();
    ls.image_max_width = $('#image_max_width_numberbox').val();
    ls.image_border_width = $('#image_border_width_numberbox').val();
    ls.image_border_color = $('#image_border_color_picker').val();

    addNotification('Options saved.', 'success');
  }

  function resetOptions() {
    resetToDefault();
    addNotification('All options have been reset to their default values. You can now save the changes you made or discard them by closing this page.', 'warning');
  }

  function resetToDefault() {
    var options = JSON.parse(ls.options);
    var values = {};
    for (var i = 0; i < options.length; i++) {
      values[options[i]] = ls[options[i] + '_default'];
    }
    initializeControlValues(values);
  }

  function clearData() {
    var result = window.confirm('Are you sure you want to clear all data for this extension? This includes filters, options and the name of the default folder where files are saved.');
    if (result) {
      ls.clear();
      window.location.reload();
    }
  }

  function addNotification(message, cssClass) {
    var animation_duration = parseInt(ls.animation_duration);
    var container =
      $('<div></div>')
        .prependTo('#notifications')
        .toggle(false)
        .html(message)
        .addClass(cssClass)
        .fadeIn(animation_duration, function () {
          setTimeout(function () {
            container.fadeOut(animation_duration, function () { container.remove(); });
          }, 10000);
        });
  }

  $(function () {
    initializeControlValues();
    initializeControlEvents();
  });
}(localStorage));
