import html from './html.js';
import { asMockedFunction, mockChrome } from './utils';

declare var global: any;

const expectExtractedImages = (...elements: HTMLElement[]) => {
  document.body.append(...elements);
  require('./send_images');
  return expect(asMockedFunction(chrome.runtime.sendMessage).mock.calls[0][0]);
};

beforeEach(() => {
  global.chrome = mockChrome();
  document.body.innerHTML = '';
});

describe(`'img' elements`, () => {
  it(`extracts image URLs from the 'src' property`, () => {
    expectExtractedImages(
      html`<img src="http://example.com/image-src.png" />`
    ).toEqual({
      linkedImages: {},
      images: ['http://example.com/image-src.png'],
    });
  });

  it(`removes the hash from the 'src' property`, () => {
    expectExtractedImages(
      html`<img src="http://example.com/image-with-hash.png#irrelevant-hash" />`
    ).toEqual({
      linkedImages: {},
      images: ['http://example.com/image-with-hash.png'],
    });
  });
});

describe(`'a' elements`, () => {
  it(`extracts the 'href' property if it links to an image`, () => {
    expectExtractedImages(
      html`<a href="http://example.com/image-link.png" />`
    ).toEqual({
      linkedImages: { 'http://example.com/image-link.png': '0' },
      images: ['http://example.com/image-link.png'],
    });
  });

  it(`doesn't extract the 'href' property if it doesn't link to an image`, () => {
    expectExtractedImages(
      html`<a href="http://example.com/not-an-image.html" />`
    ).toEqual({
      linkedImages: {},
      images: [],
    });
  });
});

describe(`background images`, () => {
  it(`extracts the background image from computed style with double quotes`, () => {
    expectExtractedImages(
      html`<div
        style=${{
          backgroundImage: `url("http://example.com/background-image-double-quotes.png")`,
        }}
      />`
    ).toEqual({
      linkedImages: {},
      images: ['http://example.com/background-image-double-quotes.png'],
    });
  });

  it(`extracts the background image from computed style with single quotes`, () => {
    expectExtractedImages(
      html`<div
        style=${{
          backgroundImage: `url('http://example.com/background-image-single-quotes.png')`,
        }}
      />`
    ).toEqual({
      linkedImages: {},
      images: ['http://example.com/background-image-single-quotes.png'],
    });
  });

  it(`extracts the background image from computed style with no quotes`, () => {
    expectExtractedImages(
      html`<div
        style=${{
          backgroundImage: `url(http://example.com/background-image-no-quotes.png)`,
        }}
      />`
    ).toEqual({
      linkedImages: {},
      images: ['http://example.com/background-image-no-quotes.png'],
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
    linkedImages: {},
    images: ['http://example.com/background-image-from-css-rules.png'],
  });
});

it(`removes duplicates`, () => {
  expectExtractedImages(
    html`<img src="http://example.com/image-src.png" />`,
    html`<div
      style=${{
        backgroundImage: `url("http://example.com/image-src.png")`,
      }}
    />`
  ).toEqual({
    linkedImages: {},
    images: ['http://example.com/image-src.png'],
  });
});

it(`removes empty images`, () => {
  expectExtractedImages(html`<img />`, html`<img />`).toEqual({
    linkedImages: {},
    images: [],
  });
});

it(`maps relative URLs to absolute`, () => {
  expectExtractedImages(html`<img src="/image-relative.png" />`).toEqual({
    linkedImages: {},
    images: ['http://localhost/image-relative.png'],
  });
});
