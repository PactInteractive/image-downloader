import * as $ from 'jquery'
import { html, asMockedFunction, mockChrome } from './utils'

jest.useFakeTimers()

declare var global: any

beforeEach(() => {
  ;($ as any).Link = jest.fn()
  ;($.fn as any).noUiSlider = jest.fn()
  global.$ = $
  global.jss = { set: jest.fn() }
  global.chrome = mockChrome()
  global.html = html
  document.body.innerHTML = ''
})

it(`renders images`, () => {
  require('./defaults')
  require('./popup')
  asMockedFunction(chrome.runtime.onMessage.addListener).mock.calls[0][0](
    {
      linkedImages: {},
      images: [
        'http://example.com/image-1.png',
        'http://example.com/image-2.png',
        'http://example.com/image-3.png',
      ],
    },
    {},
    () => {}
  )
  jest.runOnlyPendingTimers()

  expect(
    document.querySelectorAll('img[src^="http://example.com/image-"]').length
  ).toBe(3)
})
