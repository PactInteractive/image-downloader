(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    console.log('send_images');
    exports.extractImagesFromTags = () => {
        console.log('extractImagesFromTags');
        return [].slice.apply(document.querySelectorAll('img, a, [style]')).map(exports.extractImageFromElement);
    };
    exports.extractImageFromElement = (element) => {
        if (exports.isElement(element, 'img')) {
            let src = element.src;
            const hashIndex = src.indexOf('#');
            if (hashIndex >= 0) {
                src = src.substr(0, hashIndex);
            }
            return src;
        }
        if (exports.isElement(element, 'a')) {
            const href = element.href;
            if (exports.isImageURL(href)) {
                linkedImages[href] = '0';
                return href;
            }
        }
        const backgroundImage = window.getComputedStyle(element).backgroundImage;
        if (backgroundImage) {
            const parsedURL = exports.extractURLFromStyle(backgroundImage);
            if (exports.isImageURL(parsedURL)) {
                return parsedURL;
            }
        }
        return '';
    };
    exports.extractImagesFromStyles = () => {
        console.log('extractImagesFromStyles');
        const imagesFromStyles = [];
        for (let i = 0; i < document.styleSheets.length; i++) {
            const styleSheet = document.styleSheets[i];
            // Prevents `Failed to read the 'cssRules' property from 'CSSStyleSheet': Cannot access rules` error. Also see:
            // https://github.com/vdsabev/image-downloader/issues/37
            // https://github.com/odoo/odoo/issues/22517
            if (styleSheet.hasOwnProperty('cssRules')) {
                const { cssRules } = styleSheet;
                for (let j = 0; j < cssRules.length; j++) {
                    const style = cssRules[j].style; // TODO: Try with deconstruction
                    if (style && style.backgroundImage) {
                        const url = exports.extractURLFromStyle(style.backgroundImage);
                        if (exports.isImageURL(url)) {
                            imagesFromStyles.push(url);
                        }
                    }
                }
            }
        }
        return imagesFromStyles;
    };
    exports.extractURLFromStyle = (url) => {
        return url.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    };
    // Source: https://support.google.com/webmasters/answer/2598805?hl=en
    const imageRegex = /(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*\.(?:bmp|gif|jpe?g|png|svg|webp))(?:\?([^#]*))?(?:#(.*))?/i;
    exports.isImageURL = (url) => {
        return url.indexOf('data:image') === 0 || imageRegex.test(url);
    };
    exports.isElement = (element, tagName) => {
        return element.tagName.toLowerCase() === tagName;
    };
    exports.relativeUrlToAbsolute = (url) => {
        return url.indexOf('/') === 0 ? `${window.location.origin}${url}` : url;
    };
    exports.removeDuplicateOrEmpty = (images) => {
        const hash = {};
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
    let linkedImages = {}; // TODO: Avoid mutating this object in `extractImageFromElement`
    const images = exports.removeDuplicateOrEmpty([
        ...exports.extractImagesFromTags(),
        ...exports.extractImagesFromStyles(),
    ].map(exports.relativeUrlToAbsolute));
    chrome.runtime.sendMessage({ linkedImages, images });
});
//# sourceMappingURL=send_images.js.map