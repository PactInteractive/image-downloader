// HACK: An incredibly hacky way of exporting functions,
// allowing it to run as a content script and be unit tested
declare const module: any;
declare const require: any;
declare const exports: any;
declare const define: any;

((factory) => {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    var v = factory(require, exports);
    if (v !== undefined) module.exports = v;
  }
  else if (typeof define === 'function' && define.amd) {
    define(['require', 'exports'], factory);
  }
  else {
    factory(null, {});
  }
})((require: any, exports: any) => {
  const extractImagesFromTags = (): string[] => {
    return [].slice.apply(document.querySelectorAll('img, a, [style]')).map(extractImageFromElement);
  };

  const extractImageFromElement = (element: Element): string => {
    if (isElement(element, 'img')) {
      let src = element.src;
      const hashIndex = src.indexOf('#');
      if (hashIndex >= 0) {
        src = src.substr(0, hashIndex);
      }
      return src;
    }

    if (isElement(element, 'a')) {
      const href = element.href;
      if (isImageURL(href)) {
        linkedImages[href] = '0';
        return href;
      }
    }

    const backgroundImage = window.getComputedStyle(element).backgroundImage;
    if (backgroundImage) {
      const parsedURL = extractURLFromStyle(backgroundImage);
      if (isImageURL(parsedURL)) {
        return parsedURL;
      }
    }

    return '';
  };

  const extractImagesFromStyles = (styleSheets: CSSStyleSheet[]): string[] => {
    const imagesFromStyles = [];
    for (let i = 0; i < styleSheets.length; i++) {
      const styleSheet = styleSheets[i];
      // Prevents `Failed to read the 'cssRules' property from 'CSSStyleSheet': Cannot access rules` error. Also see:
      // https://github.com/vdsabev/image-downloader/issues/37
      // https://github.com/odoo/odoo/issues/22517
      if (styleSheet.hasOwnProperty('cssRules')) {
        const { cssRules } = styleSheet;
        for (let j = 0; j < cssRules.length; j++) {
          const style = (cssRules[j] as CSSStyleRule).style; // TODO: Try with deconstruction
          if (style && style.backgroundImage) {
            const url = extractURLFromStyle(style.backgroundImage);
            if (isImageURL(url)) {
              imagesFromStyles.push(url);
            }
          }
        }
      }
    }

    return imagesFromStyles;
  };

  const extractURLFromStyle = (url: string): string => {
    return url.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
  };

  // Source: https://support.google.com/webmasters/answer/2598805?hl=en
  const imageRegex = /(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*\.(?:bmp|gif|jpe?g|png|svg|webp))(?:\?([^#]*))?(?:#(.*))?/i;
  const isImageURL = (url: string): boolean => {
    return url.indexOf('data:image') === 0 || imageRegex.test(url);
  };

  const isElement = <K extends keyof HTMLElementTagNameMap>(
    element: Element,
    tagName: K
  ): element is HTMLElementTagNameMap[K] => {
    return element.tagName.toLowerCase() === tagName;
  };

  const relativeUrlToAbsolute = (url: string) => {
    return url.indexOf('/') === 0 ? `${window.location.origin}${url}` : url;
  };

  const removeDuplicateOrEmpty = (images: string[]): string[] => {
    const hash: Record<string, number> = {};
    for (let i = 0; i < images.length; i++) {
      hash[images[i]] = 0;
    }

    const result = [];
    for (let key in hash) {
      if (key !== '') {
        result.push(key);
      }
    }

    return result;
  };

  let linkedImages: Record<string, string> = {}; // TODO: Avoid mutating this object in `extractImageFromElement`
  const images = removeDuplicateOrEmpty(
    [
      ...extractImagesFromTags(),
      ...extractImagesFromStyles(document.styleSheets as any as CSSStyleSheet[]),
    ].map(relativeUrlToAbsolute)
  );

  chrome.runtime.sendMessage({ linkedImages, images });

  exports.extractImagesFromTags = extractImagesFromTags;
  exports.extractImageFromElement = extractImageFromElement;
  exports.extractImagesFromStyles = extractImagesFromStyles;
  exports.extractURLFromStyle = extractURLFromStyle;
  exports.isImageURL = isImageURL;
  exports.relativeUrlToAbsolute = relativeUrlToAbsolute;
  exports.removeDuplicateOrEmpty = removeDuplicateOrEmpty;
});
