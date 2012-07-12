window.onload = function () {
  initializeControlValues();
  initializeControlStyles();
  initializeControlEvents();
};

function initializeControlValues(reset) {
  //General
  $('#body_width_numberbox').val(reset ? localStorage.body_width_default : localStorage.body_width);
  if ((reset ? localStorage.show_download_notification_default : localStorage.show_download_notification) == 'true') {
    $('#show_download_notification_checkbox').prop('checked', true);
  }
  
  //Images
  if ((reset ? localStorage.show_image_url_default : localStorage.show_image_url) == 'true') {
    $('#show_image_url_checkbox').prop('checked', true);
  }
  $('#image_min_width_numberbox').val(reset ? localStorage.image_min_width_default : localStorage.image_min_width);
  $('#image_max_width_numberbox').val(reset ? localStorage.image_max_width_default : localStorage.image_max_width);
  $('#image_border_width_numberbox').val(reset ? localStorage.image_border_width_default : localStorage.image_border_width);
  $('#image_border_style_dropdown').val(reset ? localStorage.image_border_style_default : localStorage.image_border_style);
  $('#image_border_color_picker').val(reset ? localStorage.image_border_color_default : localStorage.image_border_color);
}

function initializeControlStyles(reset) {
  jss('body', { width: reset ? localStorage.body_width_default : localStorage.body_width });
  jss('img', {
      'min-width': (reset ? localStorage.image_min_width_default : localStorage.image_min_width) + 'px',
      'max-width': (reset ? localStorage.image_max_width_default : localStorage.image_max_width) + 'px',
      'border-width': (reset ? localStorage.image_border_width_default : localStorage.image_border_width) + 'px',
      'border-style': reset ? localStorage.image_border_style_default : localStorage.image_border_style,
      'border-color': reset ? localStorage.image_border_color_default : localStorage.image_border_color
  });
}

function initializeControlEvents() {
  //General
  $('#body_width_numberbox')
    .on('change', function () {
      jss('body', { 'width': (this.value || localStorage.body_width_default) + 'px' });
    });
  
  //Images
  $('#image_min_width_numberbox')
    .on('change', function () {
      jss('img', { 'min-width': (this.value || localStorage.image_min_width_default) + 'px' });
    });
  
  $('#image_max_width_numberbox')
    .on('change', function () {
      jss('img', { 'max-width': (this.value || localStorage.image_max_width_default) + 'px' });
    });
  
  $('#image_border_width_numberbox')
    .on('change', function () {
      jss('img', { 'border-width': (this.value || localStorage.image_border_width_default) + 'px' });
    });
  
  $('#image_border_style_dropdown')
    .on('change', function () {
      jss('img', { 'border-style': this.value || localStorage.image_border_style_default });
    });
  
  $('#image_border_color_picker')
    .on('change', function () {
      jss('img', { 'border-color': this.value || localStorage.image_border_color_default });
    });
  
  //Buttons
  $('#save_button').on('click', saveOptions);
  $('#reset_button').on('click', resetOptions);
  $('#clear_data_button').on('click', clearData);
}

function saveOptions() {
  //General
  localStorage.body_width = $('#body_width_numberbox').val();
  localStorage.show_download_notification = $('#show_download_notification_checkbox').prop('checked');
  
  //Images
  
  localStorage.show_image_url = $('#show_image_url_checkbox').prop('checked');
  localStorage.image_min_width = $('#image_min_width_numberbox').val();
  localStorage.image_max_width = $('#image_max_width_numberbox').val();
  localStorage.image_border_width = $('#image_border_width_numberbox').val();
  localStorage.image_border_style = $('#image_border_style_dropdown').val();
  localStorage.image_border_color = $('#image_border_color_picker').val();
  localStorage.sort_images = $('#sort_images_checkbox').prop('checked');
  
  addNotification('Options saved.', 'success');
}

function resetOptions() {
  initializeControlValues(true);
  initializeControlStyles(true);
  addNotification('Options have been reset to their defaults. You can now save the changes you made or discard them by reloading the page.', 'warning');
}

function clearData() {
  var result = confirm('Are you sure you want to clear all data for this extension?');
  if (result) {
    localStorage.clear();
    window.location.reload();
  }
}

function addNotification(message, cssClass) {
  var animation_duration = parseInt(localStorage.animation_duration);
  var container =
    $('<div></div>')
      .prependTo('#notifications')
      .toggle(false)
      .html(message)
      .addClass(cssClass)
      .fadeIn(animation_duration, function () {
        setTimeout(function () {
          container.fadeOut(animation_duration, function () { container.remove() });
        }, 10000);
      });
}
