import { html, asMockedFunction, mockChrome } from './utils'

declare var global: any

const expectExtractedImages = (...elements: HTMLElement[]) => {
  document.body.append(...elements)
  require('./send_images')
  return expect(asMockedFunction(chrome.runtime.sendMessage).mock.calls[0][0])
}

beforeEach(() => {
  global.chrome = mockChrome()
  document.body.innerHTML = ''
})

describe(`'img' elements`, () => {
  it(`collects the 'src' property`, () => {
    expectExtractedImages(
      html`<img src="http://www.example.com/image-src.png" />`
    ).toEqual({
      linkedImages: {},
      images: ['http://www.example.com/image-src.png'],
    })
  })

  it(`removes the hash from the 'src' property`, () => {
    expectExtractedImages(
      html`<img
        src="http://www.example.com/image-with-hash.png#irrelevant-hash"
      />`
    ).toEqual({
      linkedImages: {},
      images: ['http://www.example.com/image-with-hash.png'],
    })
  })
})

describe(`'a' elements`, () => {
  it(`collects the 'href' property if it links to an image`, () => {
    expectExtractedImages(
      html`<a href="http://www.example.com/image-link.png" />`
    ).toEqual({
      linkedImages: { 'http://www.example.com/image-link.png': '0' },
      images: ['http://www.example.com/image-link.png'],
    })
  })

  it(`doesn't collect the 'href' property if it doesn't link to an image`, () => {
    expectExtractedImages(
      html`<a href="http://www.example.com/not-an-image.html" />`
    ).toEqual({
      linkedImages: {},
      images: [],
    })
  })
})

describe(`background images`, () => {
  it(`collects the background image from computed style with double quotes`, () => {
    expectExtractedImages(
      html`<div
        style=${{
          backgroundImage: `url("http://www.example.com/background-image-double-quotes.png")`,
        }}
      />`
    ).toEqual({
      linkedImages: {},
      images: ['http://www.example.com/background-image-double-quotes.png'],
    })
  })

  it(`collects the background image from computed style with single quotes`, () => {
    expectExtractedImages(
      html`<div
        style=${{
          backgroundImage: `url('http://www.example.com/background-image-single-quotes.png')`,
        }}
      />`
    ).toEqual({
      linkedImages: {},
      images: ['http://www.example.com/background-image-single-quotes.png'],
    })
  })

  it(`collects the background image from computed style with no quotes`, () => {
    expectExtractedImages(
      html`<div
        style=${{
          backgroundImage: `url(http://www.example.com/background-image-no-quotes.png)`,
        }}
      />`
    ).toEqual({
      linkedImages: {},
      images: ['http://www.example.com/background-image-no-quotes.png'],
    })
  })
})

it(`removes duplicates`, () => {
  expectExtractedImages(
    html`<img src="http://www.example.com/image-src.png" />`,
    html`<div
      style=${{
        backgroundImage: `url("http://www.example.com/image-src.png")`,
      }}
    />`
  ).toEqual({
    linkedImages: {},
    images: ['http://www.example.com/image-src.png'],
  })
})

it(`removes empty images`, () => {
  expectExtractedImages(html`<img />`, html`<img />`).toEqual({
    linkedImages: {},
    images: [],
  })
})

it(`maps relative URLs to absolute`, () => {
  expectExtractedImages(html`<img src="/image-relative.png" />`).toEqual({
    linkedImages: {},
    images: ['http://localhost/image-relative.png'],
  })
})
