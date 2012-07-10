var image_downloader = {
  image_regex: /(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*\.(?:jpe?g|gif|png))(?:\?([^#]*))?(?:#(.*))?/,
  map_element: function (element) {
    if (element.tagName.toLowerCase() == 'img') {
      var src = element.src;
      var hash_index = src.indexOf('#');
      if (hash_index >= 0) {
        src = src.substr(0, hash_index);
      }
      return src;
    }
    
    if (element.tagName.toLowerCase() == 'a') {
      var href = element.href;
      if (image_downloader.image_regex.test(href)) {
        return href;
      }
    }
    
    var background_image = element.style['background-image'];
    if (background_image) {
      var parsed_url = background_image.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
      if (image_downloader.image_regex.test(parsed_url)) {
        return parsed_url;
      }
    }
    
    return '';
  },
  
  remove_duplicate_or_empty: function (a) {
    var index,
        result = [],
        hash = {};
    
    for (index = 0; index < a.length; index++) {
      hash[a[index]] = 0;
    }
    for (key in hash) {
      if (key != '') {
        result.push(key);
      }
    }
    return result;
  },
  
  download_images: function (images) {
    var images_container = document.getElementById('image_downloader_images_container');
    if (!images_container) {
      images_container = document.createElement('div');
      images_container.id = 'image_downloader_images_container';
      images_container.style.display = 'none';
    }
    document.body.appendChild(images_container);
    
    while (images_container.children.length > 1) {
    	images_container.removeChild(images_container.children[images_container.children.length - 1])
    }
    
    for (var i = 0; i < images.length; i++) {
    	var anchor = document.createElement('a');
    	anchor.id = 'image_downloader_anchor' + i;
    	anchor.href = images[i];
    	anchor.download = '';
    	images_container.appendChild(anchor);
      anchor.click();
    }
    
    document.body.removeChild(images_container);
  }
};

image_downloader.images = [].slice.apply(document.getElementsByTagName('*'));
image_downloader.images = image_downloader.images.map(image_downloader.map_element);
image_downloader.images = image_downloader.remove_duplicate_or_empty(image_downloader.images);
chrome.extension.sendRequest(image_downloader.images);