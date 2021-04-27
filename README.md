<h1 align="center">
  <img src="images/icon_48.png" alt="Image Downloader logo" height="40" valign="middle" />
  &nbsp;Image Downloader
</h1>

<h2 align="center">
  Browse and download images on the web
  <br />
  <br />
</h2>

Welcome! If you're here to learn more about how to use this extension check out the [Changelog](CHANGELOG.md)

If you're a developer interested in running the extension locally instead of installing it from the Chrome Web Store - keep reading!

## Local development
1. First, install the dependencies:
    ```bash
    npm install
    ```
2. Then you can start the development server which watches for file changes automatically:
    ```bash
    npm start
    ```
    Or alternatively - only run the build once:
    ```bash
    npm run build
    ```
3. Open the extension list in your browser settings: [chrome://extensions](chrome://extensions)
4. Enable **Developer mode**
5. Click the **Load unpacked** button, navigate to the extension root folder and pick the `build` folder
6. Enjoy!

## Test
Run and watch tests related to locally changed files - useful during development:
```bash
npm test
```

Or run all the tests without watching and generate a coverage report:
```bash
npm run test.all
```
