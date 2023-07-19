# Table of Contents
- [Image Downloader](#image-downloader)
- [Code Blue](#code-blue)

## Image Downloader
### What information does Image Downloader access?
In order to extract images from a web page, the extension needs to read all the content on that web page when you click the extension icon. You can see the code responsible for that here: [src/Popup/sendImages.js](https://github.com/PactInteractive/image-downloader/blob/master/src/Popup/sendImages.js)

In addition, some websites like Instagram try to prevent access to their content from the outside, so upon opening the popup Image Downloader will request the images as if they're coming from the website itself. You can see the relevant code here: [src/Popup/setReferrer.js](https://github.com/PactInteractive/image-downloader/blob/master/src/Popup/setReferrer.js)

### How does Image Downloader use that information?
Image Downloader only uses the extracted information to display the images in a popup, then download them. The downloads run in the background so you don't need to keep the extension open. You can see the code here: [src/background/downloadImages.js](https://github.com/PactInteractive/image-downloader/blob/master/src/background/downloadImages.js)

Also, Image Downloader stores some settings locally in your browser. The stored data is automatically removed if you uninstall the extension.

### Does Image Downloader share any information?
The extension does not modify, store, send, or sell your data in any way! No data leaves your computer!

## Code Blue
### What information does Code Blue access?
In order to render code blocks in a tweet, the extension needs to read all the content of the page when you open twitter.com - it does not have access to any other domains. You can see the code responsible for that here: [src/highlightCodeBlocks.js](https://github.com/vdsabev/code-blue/blob/master/src/highlightCodeBlocks.js)

### How does Code Blue use that information?
Code Blue only uses the extracted information to process code blocks starting with ``` in tweets, then replaces the original tweet HTML with the processed HTML, providing syntax highlighting for code and rendering math formulae using LaTeX.

### Does Code Blue share any information?
The extension does not store, send, or sell your data in any way! No data leaves your computer!
