window.onload = function () {
  initializePopup();
  initializeStyles();
};

function initializePopup() {
  $('#filter_textbox').on('keyup', filterImages);
  
  $('input[name="filter_mode"][value="' + localStorage.filter_mode + '"]').prop('checked', true);
  $('input[name="filter_mode"]').on('change', function () {
    localStorage.filter_mode = this.value;
    filterImages();
  });
  
  $('#only_images_from_links_checkbox')
    .prop('checked', localStorage.only_images_from_links == 'true')
    .on('change', function () {
      localStorage.only_images_from_links = this.checked;
      filterImages();
    });
  
  $('#sort_by_url_checkbox')
    .prop('checked', localStorage.sort_by_url == 'true')
    .on('change', function () {
      localStorage.sort_by_url = this.checked;
      filterImages();
    });
  
  $('#download_button').on('click', downloadImages);
  
  $('#images_table')
    .on('change', 'input[type="checkbox"]', toggleCheckBox)
    .on('click', 'img', function () {
      var checkbox = $('#checkbox' + $(this).data('index'));
      checkbox.prop('checked', !checkbox.prop('checked'));
      checkbox.change();
    })
    .on('click', '.open_image_button', function () {
      chrome.tabs.create({ url: $(this).data('url'), active: false });
    })
    ;
  
  chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query({ active: true, windowId: currentWindow.id }, function (activeTabs) {
      chrome.tabs.executeScript(activeTabs[0].id, { file: 'send_images.js', allFrames: true });
    });
  });
}

function initializeStyles() {
  jss('body', { width: localStorage.body_width + 'px' });
  jss('#filters_container', {
    'border-bottom-width': localStorage.image_border_width + 'px',
    'border-bottom-style': localStorage.image_border_style,
    'border-bottom-color': localStorage.image_border_color
  });
  jss('.image_url_textbox', { width: (localStorage.image_max_width - 2) + 'px' });
  jss('.image_buttons_container', { 'margin-top': (localStorage.show_image_url == 'true' ? 3 : -3) + 'px' });
  jss('img', {
      'min-width': localStorage.image_min_width + 'px',
      'max-width': localStorage.image_max_width + 'px',
      'border-width': localStorage.image_border_width + 'px',
      'border-style': localStorage.image_border_style,
      'border-color': localStorage.image_border_color
  });
}

//Add images to allImages and visibleImages and trigger filtration
//send_images.js is injected into all frames of the active tab, so this listener may be called multiple times
chrome.extension.onRequest.addListener(function (result) {
  linkedImages = result.linked_images;
  for (var i in result.images) {
    allImages.push(result.images[i]);
  }
  filterImages();
});

var allImages = [];
var visibleImages = [];
var linkedImages = {};

function filterImages() {
  var filterValue = $('#filter_textbox').val();
  switch (localStorage.filter_mode) {
    case 'normal':
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
      break;
    case 'wildcard':
      filterValue = filterValue.replace(/([.^$[\]\\(){}|-])/g, '\\$1').replace(/([?*+])/, '.\$1');
    case 'regex':
      visibleImages = allImages.filter(function (url) {
        try {
          return url.match(filterValue);
        }
        catch (e) {
          return false;
        }
      });
      break;
  }
  
  if (localStorage.only_images_from_links == 'true') {
    visibleImages = visibleImages.filter(function (url) {
      return linkedImages[url];
    });
  }
  
  if (localStorage.sort_by_url == 'true') {
    visibleImages.sort();
  }
  
  displayImages();
}

function displayImages() {
  var images_table = $('#images_table').empty();
  
  var toggle_all_checkbox = '<input type="checkbox" id="toggle_all_checkbox" />';
  var toggle_all_checkbox_label = '<label id="toggle_all_checkbox_label" for="toggle_all_checkbox">All (' + visibleImages.length + ')</label>';
  images_table.append('<tr><th>' + toggle_all_checkbox + '</th><th align="left">' + toggle_all_checkbox_label + '</th></tr>');
  
  for (var i in visibleImages) {
    var image_url_textbox = '';
    if (localStorage.show_image_url == 'true') {
      image_url_textbox = '<input type="text" class="image_url_textbox" value="' + visibleImages[i] + '" readonly />';
    }
    images_table.append(
      '<tr>\
        <td valign="top">\
          <div class="image_buttons_container">\
            <input type="checkbox" id="checkbox' + i + '" class="image_checkbox" />\
            <a class="download_image" href="' + visibleImages[i] + '" download><div class="download_image_button"></div></a>\
            <div class="open_image_button" data-url="' + visibleImages[i] + '"></div>\
          </div>\
        </td>\
        <td>\
          ' + image_url_textbox + '\
          <img src="' + visibleImages[i] + '" data-index="' + i + '" />\
        </td>\
      </tr>'
    );
  }
}

function toggleCheckBox() {
  if (this.id == 'toggle_all_checkbox') {
    $('#download_button').prop('disabled', !this.checked);
    for (var i in visibleImages) {
      $('#checkbox' + i).prop('checked', this.checked);
    }
    return;
  }
  
  var checkboxes = $('#images_table input[type="checkbox"]:not(#toggle_all_checkbox)');
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

function downloadImages() {
  if (localStorage.show_download_notification == 'true') {
    showDownloadConfirmation();
  }
  else {
    startDownload();
  }
}

function showDownloadConfirmation() {
  var notification_container =
    $(
      '<div>\
        <div class="notification">If you have set up a default download location for Chrome, the files will be saved there.</div>\
        <div class="warning">Otherwise, you will have to choose the save location for each file, which might open a lot of Save dialogs. Are you sure you want to do this?</div>\
        <input type="button" id="okay_button" value="OK" />\
        <input type="button" id="cancel_button" value="Cancel" />\
        <label><input type="checkbox" id="dont_show_again_checkbox" />Don\'t show this again</label>\
      </div>'
    )
    .appendTo('#filters_container');
  
  $('#okay_button, #cancel_button').on('click', function () {
    localStorage.show_download_notification = !$('#dont_show_again_checkbox').prop('checked');
    notification_container.remove();
  });
  $('#okay_button').on('click', startDownload);
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
  
  var downloading_notification = $('<div class="notification">Downloading ' + checkedImages.length + ' image' + (checkedImages.length > 1 ? 's' : '') + '...</div>').appendTo('#filters_container');
  flash(downloading_notification, 3.5, 0, function () { downloading_notification.remove() });
}

function flash(element, flashes, interval, callback) {
  if (!element.jquery) element = $(element);
  if (!interval) interval = parseInt(localStorage.animation_duration);
  
  var fade = function (fadeIn) {
    if (flashes > 0) {
      flashes -= 0.5;
      if (fadeIn) {
        element.fadeIn(interval, function () { fade(false) });
      }
      else {
        element.fadeOut(interval, function () { fade(true) });
      }
    }
    else if (callback) {
      callback(element[0]);
    }
  };
  fade(false);
}
