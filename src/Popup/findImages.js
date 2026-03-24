export function findImages() {
  // Source: https://support.google.com/webmasters/answer/2598805?hl=en
  const imageUrlRegex =
    /(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*\.(?:bmp|gif|ico|jfif|jpe?g|png|svg|tiff?|webp|avif))(?:\?([^#]*))?(?:#(.*))?/i;

  /** @returns {string[]} */
  function extractImagesFromSelector(selector) {
    return unique(
      toArray(document.querySelectorAll(selector))
        .flatMap(extractImageFromElement)
        .filter(isTruthy)
        .map(relativeUrlToAbsolute),
    );
  }

  function extractImageFromElement(element) {
    if (element.tagName.toLowerCase() === 'img') {
      const images = [];

      // Extract src
      const src = element.src;
      if (src && !isNonImageDataURI(src)) {
        const hashIndex = src.indexOf('#');
        images.push(hashIndex >= 0 ? src.substr(0, hashIndex) : src);
      }

      // Extract data-src for lazy loading
      const dataSrc = element.getAttribute?.('data-src');
      if (dataSrc) {
        const hashIndex = dataSrc.indexOf('#');
        images.push(hashIndex >= 0 ? dataSrc.substr(0, hashIndex) : dataSrc);
      }

      // Extract srcset URLs
      const srcset = element.getAttribute?.('srcset');
      if (srcset) {
        const srcsetUrls = extractSrcsetURLs(srcset);
        images.push(...srcsetUrls);
      }

      // Extract data-srcset URLs for lazy loading
      const dataSrcset = element.getAttribute?.('data-srcset');
      if (dataSrcset) {
        const dataSrcsetUrls = extractSrcsetURLs(dataSrcset);
        images.push(...dataSrcsetUrls);
      }

      return images.length > 0 ? images : null;
    }

    if (element.tagName.toLowerCase() === 'image') {
      const src = element.getAttribute('xlink:href');
      const hashIndex = src.indexOf('#');
      return hashIndex >= 0 ? src.substr(0, hashIndex) : src;
    }

    if (element.tagName.toLowerCase() === 'use') {
      // <use> elements in SVG reference external images via xlink:href
      const href = element.getAttribute?.('xlink:href');
      if (href) {
        const hashIndex = href.indexOf('#');
        return hashIndex >= 0 ? href.substr(0, hashIndex) : href;
      }
      return null;
    }

    if (element.tagName.toLowerCase() === 'source') {
      // <source> elements in <picture> use srcset for responsive images
      const srcset = element.getAttribute?.('srcset');
      if (srcset) {
        return extractSrcsetURLs(srcset);
      }
      return null;
    }

    if (element.tagName.toLowerCase() === 'a') {
      const href = element.href;
      if (isImageURL(href)) {
        return href;
      }
    }

    const backgroundImage = window.getComputedStyle(element).backgroundImage;
    if (backgroundImage) {
      const parsedURLs = extractURLsFromStyle(backgroundImage);
      // For background images, accept any valid URL (not just ones with image extensions)
      // since the browser will load whatever image is specified
      const validURLs = parsedURLs.filter(
        (url) => isImageURL(url) || isValidBackgroundImageURL(url),
      );
      if (validURLs.length > 0) {
        return validURLs;
      }
    }
  }

  function isImageURL(url) {
    return url.indexOf('data:image') === 0 || imageUrlRegex.test(url);
  }

  function isNonImageDataURI(url) {
    // Check if URL is a data URI but not an image (e.g., data:text/plain, data:application/json)
    return url.indexOf('data:') === 0 && url.indexOf('data:image') !== 0;
  }

  function extractSrcsetURLs(srcset) {
    // Parse srcset format: "url1 1x, url2 2x, url3 100w"
    // Each candidate has a URL followed by an optional descriptor (width or pixel density)
    return srcset
      .split(',')
      .map((candidate) => {
        const url = candidate.trim().split(/\s+/)[0];
        const hashIndex = url.indexOf('#');
        return hashIndex >= 0 ? url.substr(0, hashIndex) : url;
      })
      .filter((url) => url.length > 0);
  }

  function isValidBackgroundImageURL(url) {
    // Accept any URL that looks like it could be a background image
    // (has a protocol or is protocol-relative or is a blob URL)
    return /^https?:\/\//.test(url) || /^\/\//.test(url) || /^blob:/.test(url);
  }

  function extractURLsFromStyle(style) {
    // Extract all URLs from CSS functions like url() - handles multiple values
    const urls = [];
    const urlRegex = /url\(["']?([^"')]+)["']?\)/g;
    let match;
    while ((match = urlRegex.exec(style)) !== null) {
      urls.push(match[1]);
    }
    return urls;
  }

  function relativeUrlToAbsolute(url) {
    // Only convert root-relative URLs (single /), not protocol-relative URLs (//)
    return url.indexOf('/') === 0 && url.indexOf('//') !== 0
      ? `${window.location.origin}${url}`
      : url;
  }

  function unique(values) {
    return toArray(new Set(values));
  }

  function toArray(values) {
    return [...values];
  }

  function isTruthy(value) {
    return !!value;
  }

  return {
    allImages: extractImagesFromSelector(
      'img, image, source, use, a, [class], [style]',
    ),
    linkedImages: extractImagesFromSelector('a'),
    origin: window.location.origin,
  };
}
