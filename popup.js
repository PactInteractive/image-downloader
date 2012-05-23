window.onload = function() {
  initializePopup();
  initializeStyles();
};

function initializePopup() {
  document.getElementById('filter_textbox').onkeyup = filterImages;
  document.getElementById('regex_checkbox').onchange = filterImages;
  document.getElementById('toggle_all_checkbox').onchange = toggleAll;
  document.getElementById('download_button').onclick = downloadCheckedImages;
  
  chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query({ active: true, windowId: currentWindow.id }, function(activeTabs) {
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
}

var allImages = [];
var visibleImages = [];

function showImages() {
  var imagesTable = document.getElementById('imagesTable');
  while (imagesTable.children.length > 1) {
    imagesTable.removeChild(imagesTable.children[imagesTable.children.length - 1])
  }
  
  for (var i = 0; i < visibleImages.length; i++) {
    var checkbox = document.createElement('input');
    checkbox.checked = true;
    checkbox.type = 'checkbox';
    checkbox.id = 'checkbox' + i;
    var col0 = document.createElement('td');
    col0.appendChild(checkbox);
    
    var image = document.createElement('img');
    image.src = visibleImages[i];
    image.index = i;
    image.onclick = function() {
      var checkbox = document.getElementById('checkbox' + this.index);
      checkbox.checked = !checkbox.checked;
    };
    
    var col1 = document.createElement('td');
    col1.appendChild(image);
    
    var anchor = document.createElement('a');
    anchor.id = 'anchor' + i;
    anchor.href = visibleImages[i];
    anchor.download = '';
    
    var col2 = document.createElement('td');
    col2.appendChild(anchor);
    
    var row = document.createElement('tr');
    row.appendChild(col0);
    row.appendChild(col1);
    row.appendChild(col2);
    
    imagesTable.appendChild(row);
  }
}

//Toggle the checked state of all visible images.
function toggleAll() {
  var checked = document.getElementById('toggle_all_checkbox').checked;
  for (var i = 0; i < visibleImages.length; i++) {
    document.getElementById('checkbox' + i).checked = checked;
  }
}

//Download all visible checked images.
function downloadCheckedImages() {
  var download_container = document.getElementById('download_container');
  for (var i = 0; i < visibleImages.length; i++) {
    if (document.getElementById('checkbox' + i).checked) {
      document.getElementById('anchor' + i).click();
    }
  }
}

//Re-filter allImages into visibleImages and reshow visibleImages.
function filterImages() {
  var filterValue = document.getElementById('filter_textbox').value;
  if (document.getElementById('regex_checkbox').checked) {
    visibleImages = allImages.filter(function(image) {
      return image.match(filterValue);
    });
  }
  else {
    var terms = filterValue.split(' ');
    visibleImages = allImages.filter(function(image) {
      for (var termI = 0; termI < terms.length; termI++) {
        var term = terms[termI];
        if (term.length != 0) {
          var expected = (term[0] != '-');
          if (!expected) {
            term = term.substr(1);
            if (term.length == 0) {
              continue;
            }
          }
          var found = (-1 !== image.indexOf(term));
          if (found != expected) {
            return false;
          }
        }
      }
      return true;
    });
  }
  showImages();
}

//Add images to allImages and visibleImages, sort and show them.  send_images.js is
//injected into all frames of the active tab, so this listener may be called
//multiple times.
chrome.extension.onRequest.addListener(function(images) {
  for (var index in images) {
    allImages.push(images[index]);
  }
  
  if (localStorage.sort_images == 'true') {
    allImages.sort();
  }
  
  visibleImages = allImages;
  showImages();
});