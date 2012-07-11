window.onload = function () {
  initializePopup();
  initializeStyles();
};

function initializePopup() {
  $('#filter_textbox').on('keyup', filterImages);
  $('#regex_checkbox, #linked_images_checkbox').on('change', filterImages);
  $('#download_button').on('click', downloadCheckedImages);
  $('#images_table').on('click', 'img', toggleImageChecked);
  $('#images_table').on('change', 'input[type=checkbox]', toggleCheckBoxes);

  chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query({ active: true, windowId: currentWindow.id }, function (activeTabs) {
      chrome.tabs.executeScript(activeTabs[0].id, { file: 'send_images.js', allFrames: true });
    });
  });
}

function initializeStyles() {
  jss('body', { width: (localStorage.body_width || localStorage.body_width_default) + 'px' });
  jss('img', {
      'min-width': (localStorage.image_min_width || localStorage.image_min_width_default) + 'px',
      'max-width': (localStorage.image_max_width || localStorage.image_max_width_default) + 'px',
      'border-width': (localStorage.image_border_width || localStorage.image_border_width_default) + 'px',
      'border-style': localStorage.image_border_style || localStorage.image_border_style_default,
      'border-color': localStorage.image_border_color || localStorage.image_border_color_default
  });
  jss('#filters_container', {
    'border-bottom-width': (localStorage.image_border_width || localStorage.image_border_width_default) + 'px',
    'border-bottom-style': localStorage.image_border_style || localStorage.image_border_style_default,
    'border-bottom-color': localStorage.image_border_color || localStorage.image_border_color_default
  });
}

var allImages = [];
var visibleImages = [];
var linkedImages = {};

function showImages() {
  var images_table = $('#images_table');
  images_table.empty();
  
  var toggle_all_checkbox = '<input type="checkbox" id="toggle_all_checkbox" checked />';
  var toggle_all_checkbox_label = '<label id="toggle_all_checkbox_label" for="toggle_all_checkbox">All (' + visibleImages.length + ')</label>';
  images_table.append('<tr><th>' + toggle_all_checkbox + '</th><th align="left">' + toggle_all_checkbox_label + '</th></tr>');
  
  for (var i in visibleImages) {
    var checkbox = '<input type="checkbox" id="checkbox' + i + '" checked />';
    var image = '<img src="' + visibleImages[i] + '" data-index="' + i + '" />';
    images_table.append('<tr><td>' + checkbox + '</td><td>' + image + '</td></tr>');
  }
}

function toggleImageChecked() {
  var checkbox = $('#checkbox' + $(this).data('index'));
  checkbox.prop('checked', !checkbox.prop('checked'));
  checkbox.change();
}

function toggleCheckBoxes() {
  if (this.id == 'toggle_all_checkbox') {
    $('#download_button').prop('disabled', !this.checked);
    for (var i in visibleImages) {
      $('#checkbox' + i).prop('checked', this.checked);
    }
    return;
  }
  
  var checkboxes = $('#images_table input[type=checkbox]:not(#toggle_all_checkbox)');
  checkboxes.each(function () {
    if (this.checked) {
      $('#download_button').prop('disabled', false);
      return false;
    }
  });
  
  var allAreChecked = true;
  var allAreUnhecked = true;
  checkboxes.each(function () {
    if (this.checked) {
      allAreUnhecked = false;
    }
    else {
      allAreChecked = false;
    }
  });
  
  $('#download_button').prop('disabled', allAreUnhecked);
  
  var toggle_all_checkbox = $('#toggle_all_checkbox');
  toggle_all_checkbox.prop('indeterminate', !(allAreChecked || allAreUnhecked));
  if (allAreChecked) {
    toggle_all_checkbox.prop('checked', true);
  }
  else if (allAreUnhecked) {
    toggle_all_checkbox.prop('checked', false);
  }
}

function downloadCheckedImages() {
  if ((localStorage.show_download_notification || localStorage.show_download_notification_default) == 'true') {
    showDownloadConfirmation();
  }
  else {
    startDownload();
  }
}

function showDownloadConfirmation() {
  var filters_container = $('#filters_container');
  var notification_container = $('<div></div>').appendTo(filters_container);
  notification_container.html(
    '<div class="notification">' + localStorage.download_notification + '</div>' +
    '<div class="warning">' + localStorage.download_warning + '</div>' +
    '<input type="button" value="OK" id="okay_button" />' +
    '<input type="button" value="Cancel" id="cancel_button" />' +
    '<input type="checkbox" id="dont_show_again_checkbox" />' +
    '<label for="dont_show_again_checkbox">Don\'t show this again</label>'
    );
  
  $('#okay_button, #cancel_button').on('click.removeNotification', function () {
    localStorage.show_download_notification = !$('#dont_show_again_checkbox').prop('checked');
    notification_container.remove();
  });
  $('#okay_button').on('click.startDownload', startDownload);
}

function startDownload() {
  var checkedImages = [];
  for (var i in visibleImages) {
    if ($('#checkbox' + i).prop('checked')) {
      checkedImages.push(visibleImages[i]);
    }
  }
  chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query({ active: true, windowId: currentWindow.id }, function (activeTabs) {
      chrome.tabs.executeScript(
        activeTabs[0].id,
        { code: 'image_downloader.download_images(' + JSON.stringify(checkedImages) + ');' }
      );
    });
  });
}

function filterImages() {
  var filterValue = $('#filter_textbox').val();
  if ($('#regex_checkbox').prop('checked')) {
    visibleImages = allImages.filter(function (url) {
      try {
        return url.match(filterValue);
      }
      catch (e) {
        return false;
      }
    });
  }
  else {
    var terms = filterValue.split(' ');
    visibleImages = allImages.filter(function (url) {
      for (var i in terms) {
        var term = terms[i];
        if (term.length != 0) {
          var expected = (term[0] != '-');
          if (!expected) {
            term = term.substr(1);
            if (term.length == 0) {
              continue;
            }
          }
          var found = (-1 !== url.indexOf(term));
          if (found != expected) {
            return false;
          }
        }
      }
      return true;
    });
  }
  
  var linkedImagesOnly = $('#linked_images_checkbox').prop('checked');
  if (linkedImagesOnly) {
    visibleImages = visibleImages.filter(function (url) {
      return linkedImages[url];
    });
  }
  
  showImages();
}

//Add images to allImages and visibleImages, sort and show them.
//send_images.js is injected into all frames of the active tab, so this listener may be called multiple times
chrome.extension.onRequest.addListener(function (result) {
  linkedImages = result.linked_images;
  for (var i in result.images) {
    allImages.push(result.images[i]);
  }
  
  if (localStorage.sort_images == 'true') {
    allImages.sort();
  }
  
  visibleImages = allImages;
  showImages();
});
