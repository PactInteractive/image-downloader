window.onload = function () {
  initializeOptions();
  initializeStyles();
};

function initializeOptions(reset) {
  //General
  $('#body_width_numberbox')
    .val(reset ? localStorage.body_width_default : localStorage.body_width || localStorage.body_width_default)
    .on('change', function () {
      jss('body', { 'width': (this.value || localStorage.body_width_default) + 'px' });
    });
  
  if ((reset ? localStorage.show_download_notification_default : localStorage.show_download_notification || localStorage.show_download_notification_default) == 'true') {
    $('#show_download_notification_checkbox').prop('checked', true);
  }
  
  //Images
  $('#image_min_width_numberbox')
    .val(reset ? localStorage.image_min_width_default : localStorage.image_min_width || localStorage.image_min_width_default)
    .on('change', function () {
      jss('img', { 'min-width': (this.value || localStorage.image_min_width_default) + 'px' });
    });
  
  $('#image_max_width_numberbox')
    .val(reset ? localStorage.image_max_width_default : localStorage.image_max_width || localStorage.image_max_width_default)
    .on('change', function () {
      jss('img', { 'max-width': (this.value || localStorage.image_max_width_default) + 'px' });
    });
  
  $('#image_border_width_numberbox')
    .val(reset ? localStorage.image_border_width_default : localStorage.image_border_width || localStorage.image_border_width_default)
    .on('change', function () {
      jss('img', { 'border-width': (this.value || localStorage.image_border_width_default) + 'px' });
    });
  
  $('#image_border_style_dropdown')
    .val(reset ? localStorage.image_border_style_default : localStorage.image_border_style || localStorage.image_border_style_default)
    .on('change', function () {
      jss('img', { 'border-style': this.value || localStorage.image_border_style_default });
    });
  
  $('#image_border_color_picker')
    .val(reset ? localStorage.image_border_color_default : localStorage.image_border_color || localStorage.image_border_color_default)
    .on('change', function () {
      jss('img', { 'border-color': this.value || localStorage.image_border_color_default });
    });
  
  if ((reset ? localStorage.sort_images_default : localStorage.sort_images || localStorage.sort_images_default) == 'true') {
    $('#sort_images_checkbox').prop('checked', true);
  }
  
  //Buttons
  $('#save_button').on('click', saveOptions);
  $('#reset_button').on('click', resetOptions);
}

function initializeStyles(reset) {
  jss('body', { width: reset ? localStorage.body_width_default : localStorage.body_width || localStorage.body_width_default });
  jss('img', {
      'min-width': (reset ? localStorage.image_min_width_default : localStorage.image_min_width || localStorage.image_min_width_default) + 'px',
      'max-width': (reset ? localStorage.image_max_width_default : localStorage.image_max_width || localStorage.image_max_width_default) + 'px',
      'border-width': (reset ? localStorage.image_border_width_default : localStorage.image_border_width || localStorage.image_border_width_default) + 'px',
      'border-style': reset ? localStorage.image_border_style_default : localStorage.image_border_style || localStorage.image_border_style_default,
      'border-color': reset ? localStorage.image_border_color_default : localStorage.image_border_color || localStorage.image_border_color_default
  });
}

function saveOptions() {
  //General
  localStorage.body_width = $('#body_width_numberbox').val();
  localStorage.show_download_notification = $('#show_download_notification_checkbox').prop('checked');
  
  //Images
  localStorage.image_border_width = $('#image_border_width_numberbox').val();
  localStorage.image_border_style = $('#image_border_style_dropdown').val();
  localStorage.image_border_color = $('#image_border_color_picker').val();
  localStorage.sort_images = $('#sort_images_checkbox').prop('checked');
  
  showNotification('Options saved.', 'success_container', 'warning_container');
}

function resetOptions() {
  initializeOptions(true);
  initializeStyles(true);
  showNotification('The options have been reset to their default values. You can now save the changes you made or discard them by reloading this page.', 'warning_container', 'success_container');
}

function showNotification(message, active_container_id, inactive_container_id) {
  //Hide inactive container
  $('#' + inactive_container_id).empty();
  
  //Show active container
  var active_container = $('#' + active_container_id);
  active_container.html(message);
  setTimeout(function () {
    active_container.empty();
  }, 10000);
}
