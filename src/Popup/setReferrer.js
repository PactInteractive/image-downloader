// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer
const referrerHeaderName = 'Referer';

// Modify the referrer header so images can be requested using the original website's origin
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const extensionOrigin = window.location.origin;
    if (details.initiator === extensionOrigin) {
      const activeTabOrigin = localStorage.active_tab_origin;
      const referrerHeader = details.requestHeaders.find(
        (header) => header.name === referrerHeaderName
      );

      if (referrerHeader) {
        referrerHeader.value = activeTabOrigin;
      } else {
        details.requestHeaders.push({
          name: referrerHeaderName,
          value: activeTabOrigin,
        });
      }
    }

    return {
      requestHeaders: details.requestHeaders,
    };
  },
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType
  // `imageset` isn't supported in all browsers, and we're not using it yet anyway
  { types: ['image', /* 'imageset', */ 'media', 'object'], urls: [] },
  ['blocking', 'requestHeaders', 'extraHeaders']
);
