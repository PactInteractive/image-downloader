import { asMockedFunction, createElement, mockChrome } from './utils'

declare var global: any

type SendMessagePayload = {
  linkedImages: Record<string, '0'>
  images: string[]
}

const expectMessagePayload = (...elements: HTMLElement[]) => {
  document.body.append(...elements)
  require('./send_images')
  return expect(
    asMockedFunction<(payload: SendMessagePayload) => void>(
      chrome.runtime.sendMessage
    ).mock.calls[0][0]
  )
}

beforeEach(() => {
  global.chrome = mockChrome()
  document.body.innerHTML = ''
})

describe(`'img' elements`, () => {
  it(`collects the 'src' property`, () => {
    expectMessagePayload(
      createElement('img', { src: 'http://www.example.com/image-src.png' })
    ).toEqual({
      linkedImages: {},
      images: ['http://www.example.com/image-src.png'],
    })
  })

  it(`removes the hash from the 'src' property`, () => {
    expectMessagePayload(
      createElement('img', {
        src: 'http://www.example.com/image-with-hash.png#irrelevant-hash',
      })
    ).toEqual({
      linkedImages: {},
      images: ['http://www.example.com/image-with-hash.png'],
    })
  })
})

describe(`'a' elements`, () => {
  it(`collects the 'href' property if it links to an image`, () => {
    expectMessagePayload(
      createElement('a', {
        href: 'http://www.example.com/image-link.png',
      })
    ).toEqual({
      linkedImages: { 'http://www.example.com/image-link.png': '0' },
      images: ['http://www.example.com/image-link.png'],
    })
  })

  it(`doesn't collect the 'href' property if it doesn't link to an image`, () => {
    expectMessagePayload(
      createElement('a', {
        href: 'http://www.example.com/not-an-image.html',
      })
    ).toEqual({
      linkedImages: {},
      images: [],
    })
  })
})

describe(`background images`, () => {
  it(`collects the background image from computed style`, () => {
    expectMessagePayload(
      createElement('div', {
        style: {
          backgroundImage: `url("http://www.example.com/background-image.png")`,
        },
      })
    ).toEqual({
      linkedImages: {},
      images: ['http://www.example.com/background-image.png'],
    })
  })
})
