export const downloadImages = (imagesToDownload, options) => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'downloadImages', imagesToDownload, options },
      resolve
    );
  });
};
