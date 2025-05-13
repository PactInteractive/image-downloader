## Image Downloader
## Privacy Policy
### What information does Image Downloader access?
In order to extract images from a web page, the extension needs to read all the content on that web page when you click the extension icon. You can see the code responsible for that here: [src/Popup/Popup.js#findImages](https://github.com/PactInteractive/image-downloader/blob/master/src/Popup/Popup.js#L301)

In addition, some websites like Instagram try to restrict access to their content, so when opening the popup Image Downloader requests the images as if they're coming from the website itself. You can see the relevant code here: [src/background/serviceWorker.js#setupRefererRule](https://github.com/PactInteractive/image-downloader/blob/master/src/background/serviceWorker.js#L4)

### How does Image Downloader use that information?
Image Downloader only uses the extracted information to display the images in a popup, then download them. The downloads run in the background so you don't need to keep the extension open. You can see the code here: [src/background/serviceWorker.js#startDownload](https://github.com/PactInteractive/image-downloader/blob/master/src/background/serviceWorker.js#L198)

Also, Image Downloader stores some settings locally in your browser. The stored data is automatically removed if you uninstall the extension.

### Does Image Downloader share any information?
The extension does not modify, store, send, or sell your data in any way! No data leaves your computer!
