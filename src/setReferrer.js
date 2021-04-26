chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    console.log(window.location.origin);

    for (let index = 0; index < details.requestHeaders.length; ++index) {
      // console.log(
      //   `${details.requestHeaders[index].name === 'Referer'} && ${
      //     details.initiator === chrome.extension.getURL('')
      //   } && ${details.url.includes('instagram.com')}`
      // );
      if (
        details.requestHeaders[index].name === 'Referer' &&
        // details.initiator === chrome.extension.getURL('') &&
        details.url.includes('cdninstagram.com') // && if it's an external URL?
      ) {
        // TODO: Set referer to the active tab URL's origin
        // console.log(details.url);
        details.requestHeaders[index].value = 'https://www.instagram.com/';
        break;
      }
    }

    return {
      requestHeaders: details.requestHeaders,
    };
  },
  { urls: ['<all_urls>'] },
  ['blocking', 'requestHeaders', 'extraHeaders']
);
