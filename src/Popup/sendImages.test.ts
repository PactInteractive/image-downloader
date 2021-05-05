import { asMockedFunction, mockChrome } from '../test';

declare var global: any;

global.React = require('react');
jest.mock('../../lib/react-17.0.2.min.js', () => require('react'));

global.ReactDOM = require('react-dom');
jest.mock('../../lib/react-dom-17.0.2.min.js', () => require('react-dom'));

const { default: html, render } = require('../html.js');

const expectExtractedImages = (elements?: any) => {
  render(elements, document.querySelector('main'));
  require('./sendImages');
  return expect(asMockedFunction(chrome.runtime.sendMessage).mock.calls[0][0]);
};

beforeEach(() => {
  global.chrome = mockChrome();
  document.body.innerHTML = '<main></main>';
});

describe(`'img' elements`, () => {
  it(`extracts image URLs from the 'src' property`, () => {
    expectExtractedImages(html`
      <img src="http://example.com/image-src.png" />
    `).toMatchObject({
      allImages: ['http://example.com/image-src.png'],
    });
  });

  it(`removes the hash from the 'src' property`, () => {
    expectExtractedImages(html`
      <img src="http://example.com/image-with-hash.png#irrelevant-hash" />
    `).toMatchObject({
      allImages: ['http://example.com/image-with-hash.png'],
    });
  });
});

describe(`'image' elements`, () => {
  // Supress error messages due to React not supporting `image` tags
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it(`extracts image URLs from the 'xlink:href' attribute`, () => {
    expectExtractedImages(html`
      <image xlinkHref="http://example.com/image-src.png" />
    `).toMatchObject({
      allImages: ['http://example.com/image-src.png'],
    });
  });

  it(`removes the hash from the 'src' property`, () => {
    expectExtractedImages(html`
      <image
        xlinkHref="http://example.com/image-with-hash.png#irrelevant-hash"
      />
    `).toMatchObject({
      allImages: ['http://example.com/image-with-hash.png'],
    });
  });
});

describe(`'a' elements`, () => {
  it(`extracts the 'href' property if it links to an image`, () => {
    expectExtractedImages(html`
      <a href="http://example.com/image-link.png" />
    `).toMatchObject({
      allImages: ['http://example.com/image-link.png'],
      linkedImages: ['http://example.com/image-link.png'],
    });
  });

  it(`doesn't extract the 'href' property if it doesn't link to an image`, () => {
    expectExtractedImages(html`
      <a href="http://example.com/not-an-image.html" />
    `).toMatchObject({
      allImages: [],
      linkedImages: [],
    });
  });
});

describe(`background images`, () => {
  it(`extracts the background image from computed style with double quotes`, () => {
    expectExtractedImages(html`
      <div
        style=${{
          backgroundImage: `url("http://example.com/background-image-double-quotes.png")`,
        }}
      />
    `).toMatchObject({
      allImages: ['http://example.com/background-image-double-quotes.png'],
    });
  });

  it(`extracts the background image from computed style with single quotes`, () => {
    expectExtractedImages(html`
      <div
        style=${{
          backgroundImage: `url('http://example.com/background-image-single-quotes.png')`,
        }}
      />
    `).toMatchObject({
      allImages: ['http://example.com/background-image-single-quotes.png'],
    });
  });

  it(`extracts the background image from computed style with no quotes`, () => {
    expectExtractedImages(html`
      <div
        style=${{
          backgroundImage: `url(http://example.com/background-image-no-quotes.png)`,
        }}
      />
    `).toMatchObject({
      allImages: ['http://example.com/background-image-no-quotes.png'],
    });
  });
});

// TODO: Find a way to append the style to `document.styleSheets`
it.skip(`extracts images from CSS rules`, () => {
  const style = document.createElement('link');
  document.body.append(style);
  style.sheet.insertRule(`
    .with-background-image {
      background-image: url('http://example.com/background-image-from-css-rules.png');
    }
  `);
  expectExtractedImages().toMatchObject({
    allImages: ['http://example.com/background-image-from-css-rules.png'],
  });
});

it(`removes duplicates`, () => {
  expectExtractedImages(html`
    <img key="img" src="http://example.com/image-src.png" />
    <div
      key="div"
      style=${{ backgroundImage: 'url("http://example.com/image-src.png")' }}
    />
  `).toMatchObject({
    allImages: ['http://example.com/image-src.png'],
  });
});

it(`removes empty images`, () => {
  expectExtractedImages(
    html`<img key="img1" /><img key="img2" />`
  ).toMatchObject({
    allImages: [],
  });
});

it(`maps relative URLs to absolute`, () => {
  expectExtractedImages(html`<img src="/image-relative.png" />`).toMatchObject({
    allImages: ['http://localhost/image-relative.png'],
  });
});

it(`returns origin`, () => {
  expectExtractedImages(html`
    <img src="http://example.com/image-src.png" />
  `).toMatchObject({
    origin: 'http://localhost',
  });
});
