(function (ls) {
  /* globals $, jss, chrome */
  /* jshint multistr: true */
  'use strict';

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
      .on('change', '#toggle_all_checkbox', function () {
        $('#download_button').prop('disabled', !this.checked);
        for (var i = 0; i < visibleImages.length; i++) {
          $('#image' + i).toggleClass('checked', this.checked);
        }
      })
      .on('click', 'img', function () {
        $(this).toggleClass('checked', !$(this).hasClass('checked'));

        var allAreChecked = true;
        var allAreUnchecked = true;
        for (var i = 0; i < visibleImages.length; i++) {
          if ($('#image' + i).hasClass('checked')) {
            allAreUnchecked = false;
          }
          else {
            allAreChecked = false;
          }
          // Exit the loop early
          if (!(allAreChecked || allAreUnchecked)) break;
        }

        $('#download_button').prop('disabled', allAreUnchecked);

        var toggle_all_checkbox = $('#toggle_all_checkbox');
        toggle_all_checkbox.prop('indeterminate', !(allAreChecked || allAreUnchecked));
        if (allAreChecked) {
          toggle_all_checkbox.prop('checked', true);
        }
        else if (allAreUnchecked) {
          toggle_all_checkbox.prop('checked', false);
        }
      })
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
    // Filters
    jss.set('#filters_container', {
      'border-bottom-color': ls.image_border_color
    });

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
    jss.set('.image_buttons_container', {
      'margin-top': (ls.show_image_url === 'true' ? 3 : -3) + 'px'
    });

    jss.set('img', {
      'min-width': ls.image_min_width + 'px',
      'max-width': ls.image_max_width + 'px',
      'border-width': ls.image_border_width + 'px',
      'border-style': 'solid',
      'border-color': '#e9e9e9'
    });
    jss.set('img:hover', {
      'border-style': 'dashed',
      'border-color': ls.image_border_color
    });
    jss.set('img.checked', {
      'border-style': 'solid',
      'border-color': ls.image_border_color
    });

    // Finally, set the body width and padding to offset the height of the fixed position filters
    var gridCellPadding = 4; // Magic
    $('body').width(parseInt(ls.body_width) + parseInt(ls.columns) * gridCellPadding).css('padding-top', $('#filters_container').height());
  }

  // Add images to allImages and visibleImages and trigger filtration
  // send_images.js is injected into all frames of the active tab, so this listener may be called multiple times
  var timeoutID;
  chrome.extension.onMessage.addListener(function (result) {
    $.extend(linkedImages, result.linkedImages);
    for (var i = 0; i < result.images.length; i++) {
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
          for (var i = 0; i < terms.length; i++) {
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
    var table = $('#images_table').empty();

    var toggle_all_checkbox_row = '<tr><th align="left" colspan="' + ls.columns + '"><label><input type="checkbox" id="toggle_all_checkbox" />Select all (' + visibleImages.length + ')</label></th></tr>';
    table.append(toggle_all_checkbox_row);

    var columns = parseInt(ls.columns);
    var columnWidth = (Math.round(100 * 100 / columns) / 100) + '%';
    var rows = Math.ceil(visibleImages.length / columns);
    for (var rowIndex = 0; rowIndex < rows; rowIndex++) {
      // Tools row
      var show_image_url = ls.show_image_url === 'true';
      var show_open_image_button = ls.show_open_image_button === 'true';
      var show_download_image_button = ls.show_download_image_button === 'true';
      if (show_image_url || show_open_image_button || show_download_image_button) {
        var tools_row = $('<tr></tr>');
        for (var columnIndex = 0; columnIndex < columns; columnIndex++) {
          var index = rowIndex * columns + columnIndex;
          if (index === visibleImages.length) break;

          if (show_image_url) {
            tools_row.append('<td><input type="text" class="image_url_textbox" value="' + visibleImages[index] + '" readonly /></td>');
          }

          if (show_open_image_button) {
            tools_row.append('<td class="open_image_button" data-url="' + visibleImages[index] + '" title="Open in new tab">&nbsp;</td>');
          }

          if (show_download_image_button) {
            tools_row.append('<td class="download_image_button" data-url="' + visibleImages[index] + '" title="Download">&nbsp;</td>');
          }
        }
        table.append(tools_row);
      }

      // Images row
      var images_row = $('<tr></tr>');
      var colspan = ((show_image_url ? 1 : 0) + (show_open_image_button ? 1 : 0) + (show_download_image_button ? 1 : 0)) || 1;
      for (var columnIndex = 0; columnIndex < columns; columnIndex++) {
        var index = rowIndex * columns + columnIndex;
        if (index === visibleImages.length) break;
        var image = '<td colspan="' + colspan + '" style="width: ' + columnWidth + '; vertical-align: top;"><img id="image' + index + '" src="' + visibleImages[index] + '" /></td>';
        images_row.append(image);
      }
      table.append(images_row);
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
      for (var i = 0; i < visibleImages.length; i++) {
        if ($('#image' + i).hasClass('checked')) {
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
          <input type="button" id="yes_button" class="success" value="YES" />\
          <input type="button" id="no_button" class="danger" value="NO" />\
          <label><input type="checkbox" id="dont_show_again_checkbox" />Don\'t show this again</label>\
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

  $(function () {
    initializePopup();
    initializeStyles();
  });
}(localStorage));
