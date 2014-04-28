(function (ls) {
  /* globals $, jss */
  'use strict';

  window.onload = function () {
    initializeControlValues();
    initializeControlStyles();
    initializeControlEvents();
  };

  function initializeControlValues(reset) {
    // General
    if ((reset ? ls.show_download_confirmation_default : ls.show_download_confirmation) === 'true') {
      $('#show_download_confirmation_checkbox').prop('checked', true);
    }
    if ((reset ? ls.show_download_notification_default : ls.show_download_notification) === 'true') {
      $('#show_download_notification_checkbox').prop('checked', true);
    }

    // Filters
    if ((reset ? ls.show_filter_mode_default : ls.show_filter_mode) === 'true') {
      $('#show_filter_mode_checkbox').prop('checked', true);
    }
    if ((reset ? ls.show_only_images_from_links_default : ls.show_only_images_from_links) === 'true') {
      $('#show_only_images_from_links_checkbox').prop('checked', true);
    }
    if ((reset ? ls.show_sort_by_url_default : ls.show_sort_by_url) === 'true') {
      $('#show_sort_by_url_checkbox').prop('checked', true);
    }

    // Images
    if ((reset ? ls.show_image_url_default : ls.show_image_url) === 'true') {
      $('#show_image_url_checkbox').prop('checked', true);
    }
    if ((reset ? ls.show_open_image_button_default : ls.show_open_image_button) === 'true') {
      $('#show_open_image_button_checkbox').prop('checked', true);
    }
    if ((reset ? ls.show_download_image_button_default : ls.show_download_image_button) === 'true') {
      $('#show_download_image_button_checkbox').prop('checked', true);
    }
    $('#columns_numberbox').val(reset ? ls.columns_default : ls.columns);
    $('#image_min_width_numberbox').val(reset ? ls.image_min_width_default : ls.image_min_width);
    $('#image_max_width_numberbox').val(reset ? ls.image_max_width_default : ls.image_max_width);
    $('#image_border_width_numberbox').val(reset ? ls.image_border_width_default : ls.image_border_width);
    $('#image_border_color_picker').val(reset ? ls.image_border_color_default : ls.image_border_color);
  }

  function initializeControlStyles(reset) {
    jss.set('body', { width: (reset ? ls.body_width_default : ls.body_width) + 'px' });
    jss.set('img', {
      'min-width': (reset ? ls.image_min_width_default : ls.image_min_width) + 'px',
      'max-width': (reset ? ls.image_max_width_default : ls.image_max_width) + 'px',
      'border-width': (reset ? ls.image_border_width_default : ls.image_border_width) + 'px',
      'border-style': 'solid',
      'border-color': 'transparent'
    });
    jss.set('img:hover', {
      'border-style': 'dashed',
      'border-color': reset ? ls.image_border_color_default : ls.image_border_color
    });
    jss.set('img.checked', {
      'border-style': 'solid',
      'border-color': reset ? ls.image_border_color_default : ls.image_border_color
    });
  }

  function initializeControlEvents() {
    $('#columns_numberbox')
      .on('change', function () {
        jss.set('body', { 'width': (this.value || parseInt(ls.columns_default)) * parseInt(ls.image_max_width) + 'px' });
      });

    $('#image_min_width_numberbox')
      .on('change', function () {
        jss.set('img', { 'min-width': (this.value || ls.image_min_width_default) + 'px' });
      });

    $('#image_max_width_numberbox')
      .on('change', function () {
        jss.set('img', { 'max-width': (this.value || ls.image_max_width_default) + 'px' });
      });

    $('#image_border_width_numberbox')
      .on('change', function () {
        jss.set('img', { 'border-width': (this.value || ls.image_border_width_default) + 'px' });
      });

    $('#image_border_color_picker')
      .on('change', function () {
        jss.set('img.checked', { 'border-color': this.value || ls.image_border_color_default });
      });

    // Buttons
    $('#save_button').on('click', saveOptions);
    $('#reset_button').on('click', resetOptions);
    $('#clear_data_button').on('click', clearData);
  }

  function saveOptions() {
    // General
    ls.show_download_confirmation = $('#show_download_confirmation_checkbox').prop('checked');
    ls.show_download_notification = $('#show_download_notification_checkbox').prop('checked');

    // Filters
    ls.show_filter_mode = $('#show_filter_mode_checkbox').prop('checked');
    ls.show_only_images_from_links = $('#show_only_images_from_links_checkbox').prop('checked');
    ls.show_sort_by_url = $('#show_sort_by_url_checkbox').prop('checked');

    // Images
    ls.show_image_url = $('#show_image_url_checkbox').prop('checked');
    ls.show_open_image_button = $('#show_open_image_button_checkbox').prop('checked');
    ls.show_download_image_button = $('#show_download_image_button_checkbox').prop('checked');

    ls.columns = $('#columns_numberbox').val();
    ls.image_min_width = $('#image_min_width_numberbox').val();
    ls.image_max_width = $('#image_max_width_numberbox').val();
    ls.image_border_width = $('#image_border_width_numberbox').val();
    ls.image_border_color = $('#image_border_color_picker').val();
    ls.sort_images = $('#sort_images_checkbox').prop('checked');

    ls.body_width = parseInt(ls.columns) * parseInt(ls.image_max_width);

    addNotification('Options saved.', 'success');
  }

  function resetOptions() {
    initializeControlValues(true);
    initializeControlStyles(true);
    addNotification('All options have been reset to their default values. You can now save the changes you made or discard them by closing this page.', 'warning');
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
}(localStorage));
