(function () {
  /* globals chrome */
  'use strict';

  var imageDownloader = {
    // Source: https://support.google.com/webmasters/answer/2598805?hl=en
    imageRegex: /(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*\.(?:bmp|gif|jpe?g|png|svg|webp))(?:\?([^#]*))?(?:#(.*))?/i,

    extractImagesFromTags: function () {
      return [].slice.apply(document.querySelectorAll('img, a, [style]')).map(imageDownloader.extractImageFromElement);
    },

    extractImagesFromStyles: function () {
      var imagesFromStyles = [];
      for (var i = 0; i < document.styleSheets.length; i++) {
        var cssRules = document.styleSheets[i].cssRules;
        if (cssRules) {
          for (var j = 0; j < cssRules.length; j++) {
            var style = cssRules[j].style;
            if (style && style.backgroundImage) {
              var url = imageDownloader.extractURLFromStyle(style.backgroundImage);
              if (imageDownloader.isImageURL(url)) {
                imagesFromStyles.push(url);
              }
            }
          }
        }
      }

      return imagesFromStyles;
    },

    extractImageFromElement: function (element) {
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

      var backgroundImage = window.getComputedStyle(element).backgroundImage;
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
      return url.indexOf('data:image') === 0 || imageDownloader.imageRegex.test(url);
    },

    relativeUrlToAbsolute: function (url) {
      return url.indexOf('/') === 0 ? `${window.location.origin}${url}` : url;
    },

    removeDuplicateOrEmpty: function (images) {
      var result = [];
      var hash = {};

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

  imageDownloader.linkedImages = {}; // TODO: Avoid mutating this object in `extractImageFromElement`
  imageDownloader.images = imageDownloader.removeDuplicateOrEmpty(
    [].concat(
      imageDownloader.extractImagesFromTags(),
      imageDownloader.extractImagesFromStyles()
    ).map(imageDownloader.relativeUrlToAbsolute)
  );

  chrome.runtime.sendMessage({
    linkedImages: imageDownloader.linkedImages,
    images: imageDownloader.images
  });

  imageDownloader.linkedImages = null;
  imageDownloader.images = null;
}());
