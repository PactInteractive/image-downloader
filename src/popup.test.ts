import { asMockedFunction, mockChrome } from './utils';

jest.useFakeTimers();

declare var global: any;

beforeEach(() => {
  global.chrome = mockChrome();
  global.this = global;
  global.$ = require('../lib/jquery-3.5.1.min');
  ($.fn as any).fadeIn = function (duration, fn) {
    setTimeout(duration, fn);
    return this;
  };
  ($.fn as any).fadeOut = function (duration, fn) {
    setTimeout(duration, fn);
    return this;
  };
  ($ as any).Link = jest.fn();
  ($.fn as any).noUiSlider = jest.fn();
  document.body.innerHTML = '<main></main>';
  require('./defaults');
  require('./popup');
});

it(`renders images`, () => {
  const renderImages = asMockedFunction(chrome.runtime.onMessage.addListener)
    .mock.calls[0][0];
  renderImages(
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
  );
  jest.runOnlyPendingTimers();

  expect(document.querySelectorAll('#images_container img').length).toBe(3);
});
