(function () {
  /* globals chrome */
  'use strict';

  var imageDownloader = {
    imageRegex: /(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*\.(?:jpe?g|gif|png|webm))(?:\?([^#]*))?(?:#(.*))?/i,
    mapElement: function (element) {
      if (element.tagName.toLowerCase() === 'img') {
        var src = element.src;
        var hashIndex = src.indexOf('#');
        if (hashIndex >= 0) {
          src = src.substr(0, hashIndex);
        }
        return src;
      }

      if (element.tagName.toLowerCase() === 'a') {
        var href = element.href;
        if (imageDownloader.isImageURL(href)) {
          imageDownloader.linkedImages[href] = '0';
          return href;
        }
      }

      var backgroundImage = window.getComputedStyle(element)['background-image'];
      if (backgroundImage) {
        var parsedURL = imageDownloader.extractURLFromStyle(backgroundImage);
        if (imageDownloader.isImageURL(parsedURL)) {
          return parsedURL;
        }
      }

      return '';
    },

    extractURLFromStyle: function (url) {
      return url.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    },

    isImageURL: function (url) {
      return url.substring(0, 10) === 'data:image' || imageDownloader.imageRegex.test(url);
    },

    removeDuplicateOrEmpty: function (images) {
      var result = [],
          hash = {};

      for (var i = 0; i < images.length; i++) {
        hash[images[i]] = 0;
      }
      for (var key in hash) {
        if (key !== '') {
          result.push(key);
        }
      }
      return result;
    }
  };

  imageDownloader.linkedImages = {};
  imageDownloader.images = [].slice.apply(document.getElementsByTagName('*'));
  imageDownloader.images = imageDownloader.images.map(imageDownloader.mapElement);

  for (var i = 0; i < document.styleSheets.length; i++) { // Extract images from styles
    var cssRules = document.styleSheets[i].cssRules;
    if (cssRules) {
      for (var j = 0; j < cssRules.length; j++) {
        var style = cssRules[j].style;
        if (style && style['background-image']) {
          var url = imageDownloader.extractURLFromStyle(style['background-image']);
          if (imageDownloader.isImageURL(url)) {
            imageDownloader.images.push(url);
          }
        }
      }
    }
  }

  imageDownloader.images = imageDownloader.removeDuplicateOrEmpty(imageDownloader.images);
  chrome.extension.sendMessage({ linkedImages: imageDownloader.linkedImages, images: imageDownloader.images });

  imageDownloader.linkedImages = null;
  imageDownloader.images = null;
}());
