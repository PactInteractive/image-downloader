import { asMockedFunction, mockChrome } from './test-utils';

declare var global: any;

global.React = require('react');
jest.mock('../lib/react-17.0.2.min.js', () => require('react'));

global.ReactDOM = require('react-dom');
jest.mock('../lib/react-dom-17.0.2.min.js', () => require('react-dom'));

const { default: html, render } = require('./html.js');

const expectExtractedImages = (elements?: React.ReactNode) => {
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
    `).toEqual({
      images: ['http://example.com/image-src.png'],
      linkedImages: {},
      origin: 'http://localhost',
    });
  });

  it(`removes the hash from the 'src' property`, () => {
    expectExtractedImages(html`
      <img src="http://example.com/image-with-hash.png#irrelevant-hash" />
    `).toEqual({
      images: ['http://example.com/image-with-hash.png'],
      linkedImages: {},
      origin: 'http://localhost',
    });
  });
});

describe(`'a' elements`, () => {
  it(`extracts the 'href' property if it links to an image`, () => {
    expectExtractedImages(html`
      <a href="http://example.com/image-link.png" />
    `).toEqual({
      images: ['http://example.com/image-link.png'],
      linkedImages: { 'http://example.com/image-link.png': '0' },
      origin: 'http://localhost',
    });
  });

  it(`doesn't extract the 'href' property if it doesn't link to an image`, () => {
    expectExtractedImages(html`
      <a href="http://example.com/not-an-image.html" />
    `).toEqual({
      images: [],
      linkedImages: {},
      origin: 'http://localhost',
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
    `).toEqual({
      images: ['http://example.com/background-image-double-quotes.png'],
      linkedImages: {},
      origin: 'http://localhost',
    });
  });

  it(`extracts the background image from computed style with single quotes`, () => {
    expectExtractedImages(html`
      <div
        style=${{
          backgroundImage: `url('http://example.com/background-image-single-quotes.png')`,
        }}
      />
    `).toEqual({
      images: ['http://example.com/background-image-single-quotes.png'],
      linkedImages: {},
      origin: 'http://localhost',
    });
  });

  it(`extracts the background image from computed style with no quotes`, () => {
    expectExtractedImages(html`
      <div
        style=${{
          backgroundImage: `url(http://example.com/background-image-no-quotes.png)`,
        }}
      />
    `).toEqual({
      images: ['http://example.com/background-image-no-quotes.png'],
      linkedImages: {},
      origin: 'http://localhost',
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
  expectExtractedImages().toEqual({
    images: ['http://example.com/background-image-from-css-rules.png'],
    linkedImages: {},
    origin: 'http://localhost',
  });
});

it(`removes duplicates`, () => {
  expectExtractedImages(html`
    <img key="img" src="http://example.com/image-src.png" />
    <div
      key="div"
      style=${{ backgroundImage: 'url("http://example.com/image-src.png")' }}
    />
  `).toEqual({
    images: ['http://example.com/image-src.png'],
    linkedImages: {},
    origin: 'http://localhost',
  });
});

it(`removes empty images`, () => {
  expectExtractedImages(html`<img key="img1" /><img key="img2" />`).toEqual({
    images: [],
    linkedImages: {},
    origin: 'http://localhost',
  });
});

it(`maps relative URLs to absolute`, () => {
  expectExtractedImages(html`<img src="/image-relative.png" />`).toEqual({
    images: ['http://localhost/image-relative.png'],
    linkedImages: {},
    origin: 'http://localhost',
  });
});
