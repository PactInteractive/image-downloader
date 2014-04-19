(function (ls) {
  /* globals $, jss, chrome */
  /* jshint multistr: true */
  'use strict';

  window.onload = function () {
    initializePopup();
    initializeStyles();
  };

  function initializePopup() {
    // Register download folder name listener
    $('#folder_name_textbox')
      .val(ls.folder_name)
      .on('change', function () {
        ls.folder_name = $.trim(this.value);
      });

    chrome.downloads.onDeterminingFilename.addListener(function (item, suggest) {
      if (ls.folder_name) {
        suggest({ filename: ls.folder_name + '/' + item.filename});
      }
    });

    $('#download_button').on('click', downloadImages);
    $('#filter_textbox').on('keyup', filterImages);

    $('input[type="radio"][name="filter_mode"][value="' + ls.filter_mode + '"]').prop('checked', true);
    $('input[type="radio"][name="filter_mode"]').on('change', function () {
      ls.filter_mode = this.value;
      filterImages();
    });

    $('#only_images_from_links_checkbox')
      .prop('checked', ls.only_images_from_links === 'true')
      .on('change', function () {
        ls.only_images_from_links = this.checked;
        filterImages();
      });

    $('#sort_by_url_checkbox')
      .prop('checked', ls.sort_by_url === 'true')
      .on('change', function () {
        ls.sort_by_url = this.checked;
        filterImages();
      });

    $('#images_table')
      .on('change', 'input[type="checkbox"]', toggleCheckBox)
      .on('click', '.image_url_textbox', function () {
        this.select();
      })
      .on('click', '.download_image_button', function () {
        chrome.downloads.download({ url: $(this).data('url') });
        flashDownloadingNotification(1);
      })
      .on('click', '.open_image_button', function () {
        chrome.tabs.create({ url: $(this).data('url'), active: false });
      });

    // Get images on the page
    chrome.windows.getCurrent(function (currentWindow) {
      chrome.tabs.query({ active: true, windowId: currentWindow.id }, function (activeTabs) {
        chrome.tabs.executeScript(activeTabs[0].id, { file: '/scripts/send_images.js', allFrames: true });
      });
    });
  }

  function initializeStyles() {
    // General
    $('body').width(parseInt(ls.body_width)).css('padding-top', $('#filters_container').height());

    // Filters
    jss.set('#filters_container', {
      'border-bottom-width': ls.image_border_width + 'px',
      'border-bottom-style': ls.image_border_style,
      'border-bottom-color': ls.image_border_color
    });

    var downloadButtonWidth = $('#download_button').width();
    // var downloadButtonMargin = parseInt($('#download_button').css('margin-left')) + parseInt($('#download_button').css('margin-right'));
    $('#folder_name_textbox').width($('#filters_container').width() - parseInt($('#filters_container').css('padding-left')) - parseInt($('#filters_container').css('padding-right')) - parseInt($('#folder_name_textbox').css('margin-right')) - downloadButtonWidth);

    if (ls.show_filter_mode != 'true') {
      $('#filter_mode_container').toggle(false);
    }

    if (ls.show_only_images_from_links != 'true') {
      $('#only_images_from_links_container').toggle(false);
    }

    if (ls.show_sort_by_url != 'true') {
      $('#sort_by_url_container').toggle(false);
    }

    // Images
    jss.set('.image_url_textbox', {
      width: (parseInt(ls.image_max_width) + 2 * parseInt(ls.image_border_width)) + 'px'
    });

    jss.set('.image_buttons_container', {
      'margin-top': (ls.show_image_url === 'true' ? 3 : -3) + 'px'
    });

    jss.set('img', {
      'min-width': ls.image_min_width + 'px',
      'max-width': ls.image_max_width + 'px',
      'border-width': ls.image_border_width + 'px',
      'border-style': ls.image_border_style,
      'border-color': ls.image_border_color
    });
  }

  // Add images to allImages and visibleImages and trigger filtration
  // send_images.js is injected into all frames of the active tab, so this listener may be called multiple times
  var timeoutID;
  chrome.extension.onMessage.addListener(function (result) {
    $.extend(linkedImages, result.linked_images);
    for (var i in result.images) {
      if (allImages.indexOf(result.images[i]) == -1) {
        allImages.push(result.images[i]);
      }
    }
    clearTimeout(timeoutID); // Cancel pending filtration
    timeoutID = setTimeout(filterImages, 100);
  });

  var allImages = [];
  var visibleImages = [];
  var linkedImages = {};

  function filterImages() {
    var filterValue = $('#filter_textbox').val();
    switch (ls.filter_mode) {
      case 'normal':
        var terms = filterValue.split(' ');
        visibleImages = allImages.filter(function (url) {
          for (var i in terms) {
            var term = terms[i];
            if (term.length !== 0) {
              var expected = (term[0] !== '-');
              if (!expected) {
                term = term.substr(1);
                if (term.length === 0) {
                  continue;
                }
              }
              var found = (url.indexOf(term) !== -1);
              if (found != expected) {
                return false;
              }
            }
          }
          return true;
        });
        break;
      case 'wildcard':
        filterValue = filterValue.replace(/([.^$[\]\\(){}|-])/g, '\\$1').replace(/([?*+])/, '.$1');
        /* fall through */
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

    if (ls.only_images_from_links === 'true') {
      visibleImages = visibleImages.filter(function (url) {
        return linkedImages[url];
      });
    }

    if (ls.sort_by_url === 'true') {
      visibleImages.sort();
    }

    displayImages();
  }

  function displayImages() {
    var images_table = $('#images_table').empty();

    var toggle_all_checkbox = '<input type="checkbox" id="toggle_all_checkbox" />';
    var toggle_all_checkbox_label = '<label for="toggle_all_checkbox">Select all (' + visibleImages.length + ')</label>';
    images_table.append('<tr><th>' + toggle_all_checkbox + '</th><th align="left">' + toggle_all_checkbox_label + '</th></tr>');

    for (var i in visibleImages) {
      var download_image_button = '';
      if (ls.show_download_image_button === 'true') {
        download_image_button = '<div class="download_image_button" data-url="' + visibleImages[i] + '" title="Download"></div>';
      }

      var open_image_button = '';
      if (ls.show_open_image_button === 'true') {
        open_image_button = '<div class="open_image_button" data-url="' + visibleImages[i] + '" title="Open in new tab"></div>';
      }

      var image_url_textbox = '';
      if (ls.show_image_url === 'true') {
        image_url_textbox = '<input type="text" class="image_url_textbox" value="' + visibleImages[i] + '" readonly />';
      }

      images_table.append(
        '<tr>\
          <td valign="top">\
            <div class="image_buttons_container">\
              <input type="checkbox" id="checkbox' + i + '" />' + download_image_button + open_image_button + '\
            </div>\
          </td>\
          <td valign="top">\
            ' + image_url_textbox + '<label for="checkbox' + i + '"><img src="' + visibleImages[i] + '" /></label>\
          </td>\
        </tr>'
      );
    }
  }

  function toggleCheckBox() {
    /* jshint validthis: true */

    if (this.id === 'toggle_all_checkbox') {
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
    var allAreUnchecked = true;
    checkboxes.each(function () {
      if (this.checked) {
        allAreUnchecked = false;
      }
      else {
        allAreChecked = false;
      }
    });

    $('#download_button').prop('disabled', allAreUnchecked);

    var toggle_all_checkbox = $('#toggle_all_checkbox');
    toggle_all_checkbox.prop('indeterminate', !(allAreChecked || allAreUnchecked));
    if (allAreChecked) {
      toggle_all_checkbox.prop('checked', true);
    }
    else if (allAreUnchecked) {
      toggle_all_checkbox.prop('checked', false);
    }
  }

  function downloadImages() {
    if (ls.show_download_confirmation === 'true') {
      showDownloadConfirmation(startDownload);
    }
    else {
      startDownload();
    }

    function startDownload() {
      var checkedImages = 0;
      for (var i in visibleImages) {
        if ($('#checkbox' + i).prop('checked')) {
          checkedImages++;
          chrome.downloads.download({ url: visibleImages[i] });
        }
      }

      flashDownloadingNotification(checkedImages);
    }
  }

  function showDownloadConfirmation(startDownload) {
    var notification_container =
      $(
        '<div>\
          <div>\
            <hr/>\
            Take a quick look at your Chrome settings and search for <b>download location</b>.\
            <span class="danger">If the <b>Ask where to save each file before downloading</b> option is checked, proceeding might open a lot of popup windows. Are you sure you want to do this?</span>\
          </div>\
          <div class="left">\
            <input type="button" id="yes_button" class="success" value="YES" />\
            <input type="button" id="no_button" class="danger" value="NO" />\
          </div>\
          <label class="left"><input type="checkbox" id="dont_show_again_checkbox" />Don\'t show this again</label>\
          <div class="clear"></div>\
        </div>'
      )
      .appendTo('#filters_container');

    $('#yes_button, #no_button').on('click', function () {
      ls.show_download_confirmation = !$('#dont_show_again_checkbox').prop('checked');
      notification_container.remove();
    });
    $('#yes_button').on('click', startDownload);
  }

  function flashDownloadingNotification(imageCount) {
    if (ls.show_download_notification != 'true') return;

    var downloading_notification = $('<div class="success">Downloading ' + imageCount + ' image' + (imageCount > 1 ? 's' : '') + '...</div>').appendTo('#filters_container');
    flash(downloading_notification, 3.5, 0, function () { downloading_notification.remove(); });
  }

  function flash(element, flashes, interval, callback) {
    if (!interval) interval = parseInt(ls.animation_duration);

    var fade = function (fadeIn) {
      if (flashes > 0) {
        flashes -= 0.5;
        if (fadeIn) {
          element.fadeIn(interval, function () { fade(false); });
        }
        else {
          element.fadeOut(interval, function () { fade(true); });
        }
      }
      else if (callback) {
        callback(element);
      }
    };
    fade(false);
  }
}(localStorage));
