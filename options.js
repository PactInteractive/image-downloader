window.onload = function () {
  initializeOptions();
  initializeStyles();
};

function initializeOptions() {
  //General
  var body_width_numberbox = document.getElementById('body_width_numberbox');
  body_width_numberbox.value = localStorage.body_width || localStorage.body_width_default;
  body_width_numberbox.onchange = function () {
    jss('body', { 'width': (this.value || localStorage.body_width_default) + 'px' });
  }
  
  var show_download_notification_checkbox = document.getElementById('show_download_notification_checkbox');
  if ((localStorage.show_download_notification || localStorage.show_download_notification_default) == 'true') {
    show_download_notification_checkbox.checked = true;
  }
  
  //Images
  var image_min_width_numberbox = document.getElementById('image_min_width_numberbox');
  image_min_width_numberbox.value = localStorage.image_min_width || localStorage.image_min_width_default;
  image_min_width_numberbox.onchange = function () {
    jss('img', { 'min-width': (this.value || localStorage.image_min_width_default) + 'px' });
  }
  
  var image_max_width_numberbox = document.getElementById('image_max_width_numberbox');
  image_max_width_numberbox.value = localStorage.image_max_width || localStorage.image_max_width_default;
  image_max_width_numberbox.onchange = function () {
    jss('img', { 'max-width': (this.value || localStorage.image_max_width_default) + 'px' });
  }
  
  var image_border_width_numberbox = document.getElementById('image_border_width_numberbox');
  image_border_width_numberbox.value = localStorage.image_border_width || localStorage.image_border_width_default;
  image_border_width_numberbox.onchange = function () {
    jss('img', { 'border-width': (this.value || localStorage.image_border_width_default) + 'px' });
  }
  
  var image_border_style_dropdown = document.getElementById('image_border_style_dropdown');
  image_border_style_dropdown.value = localStorage.image_border_style || localStorage.image_border_style_default;
  image_border_style_dropdown.onchange = function () {
    jss('img', { 'border-style': this.value || localStorage.image_border_style_default });
  }
  
  var image_border_color_picker = document.getElementById('image_border_color_picker');
  image_border_color_picker.value = localStorage.image_border_color || localStorage.image_border_color_default;
  image_border_color_picker.onchange = function () {
    jss('img', { 'border-color': this.value || localStorage.image_border_color_default });
  }
  
  var sort_images_checkbox = document.getElementById('sort_images_checkbox');
  if ((localStorage.sort_images || localStorage.sort_images_default) == 'true') {
    sort_images_checkbox.checked = true;
  }
  
  //Buttons
  var save_button = document.getElementById('save_button');
  save_button.onclick = saveOptions;
  
  var reset_button = document.getElementById('reset_button');
  reset_button.onclick = resetOptions;
}

function initializeStyles() {
  jss('body', { width: localStorage.body_width || localStorage.body_width_default });
  jss('img', {
      'min-width': (localStorage.image_min_width || localStorage.image_min_width_default) + 'px',
      'max-width': (localStorage.image_max_width || localStorage.image_max_width_default) + 'px',
      'border-width': (localStorage.image_border_width || localStorage.image_border_width_default) + 'px',
      'border-style': localStorage.image_border_style || localStorage.image_border_style_default,
      'border-color': localStorage.image_border_color || localStorage.image_border_color_default
  });
}

function saveOptions() {
  //General
  var body_width_numberbox = document.getElementById('body_width_numberbox');
  localStorage.body_width = body_width_numberbox.value;
  
  var show_download_notification_checkbox = document.getElementById('show_download_notification_checkbox');
  localStorage.show_download_notification = show_download_notification_checkbox.checked;
  
  //Images
  var image_border_width_numberbox = document.getElementById('image_border_width_numberbox');
  localStorage.image_border_width = image_border_width_numberbox.value;
   
  var image_border_style_dropdown = document.getElementById('image_border_style_dropdown');
  localStorage.image_border_style = image_border_style_dropdown.value;
  
  var image_border_color_picker = document.getElementById('image_border_color_picker');
  localStorage.image_border_color = image_border_color_picker.value;
  
  var sort_images_checkbox = document.getElementById('sort_images_checkbox');
  localStorage.sort_images = sort_images_checkbox.checked;
  
  showNotification('Options saved.', 'success_container', 'warning_container');
}

function resetOptions() {
  //General
  localStorage.body_width = localStorage.body_width_default;
  localStorage.show_download_notification = localStorage.show_download_notification_default;
  
  //Images
  localStorage.image_min_width = localStorage.image_min_width_default;
  localStorage.image_max_width = localStorage.image_max_width_default;
  localStorage.image_border_width = localStorage.image_border_width_default;
  localStorage.image_border_style = localStorage.image_border_style_default;
  localStorage.image_border_color = localStorage.image_border_color_default;
  localStorage.sort_images = localStorage.sort_images_default;
  
  initializeOptions();
  initializeStyles();
  showNotification('The options have been reset to their default values. You can now save the changes you made or discard them by reloading this page.', 'warning_container', 'success_container');
}

function showNotification(message, active_container_id, inactive_container_id) {
  //Hide inactive container
  var inactive_container = document.getElementById(inactive_container_id);
  inactive_container.innerHTML = '';
  
  //Show active container
  var active_container = document.getElementById(active_container_id);
  active_container.innerHTML = message;
  setTimeout(function () {
    active_container.innerHTML = '';
  }, 10000);
}
