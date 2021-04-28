<h1 align="center">
  <img src="images/icon_48.png" alt="Image Downloader logo" height="40" valign="middle" />
  &nbsp;Image Downloader
</h1>

<h2 align="center">
  Browse and download images on the web
  <br />
  <br />
</h2>

Welcome! If you're here to learn more about how to use this extension check out the [User Guide](USERGUIDE)

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

## License
```
Copyright (c) 2012-2021 Vladimir Sabev

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
```
