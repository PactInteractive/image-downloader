import { asMockedFunction, mockChrome } from '../test';

declare var global: any;

beforeEach(() => {
  global.chrome = mockChrome();
  localStorage.clear();
});

it(`adds a listener on install or update`, () => {
  require('./handleUpdates');
  expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalledTimes(1);
});

it(`opens options page on install`, () => {
  require('./handleUpdates');
  const handler = asMockedFunction(chrome.runtime.onInstalled.addListener).mock
    .calls[0][0];
  handler({ reason: 'install' });
  expect(chrome.tabs.create).toHaveBeenCalledWith({
    url: '/src/Options/index.html',
  });
});

it(`clears data from versions before 2.1`, () => {
  // https://github.com/facebook/jest/issues/6798#issuecomment-412871616
  const clearSpy = jest.spyOn(Storage.prototype, 'clear');
  require('./handleUpdates');
  const handler = asMockedFunction(chrome.runtime.onInstalled.addListener).mock
    .calls[0][0];
  handler({ reason: 'update', previousVersion: '1.3' });
  expect(clearSpy).toHaveBeenCalled();
  clearSpy.mockRestore();
});

it(`doesn't clear data from versions after 2.1`, () => {
  // https://github.com/facebook/jest/issues/6798#issuecomment-412871616
  const clearSpy = jest.spyOn(Storage.prototype, 'clear');
  require('./handleUpdates');
  const handler = asMockedFunction(chrome.runtime.onInstalled.addListener).mock
    .calls[0][0];
  handler({ reason: 'update', previousVersion: '2.3' });
  expect(clearSpy).not.toHaveBeenCalled();
  clearSpy.mockRestore();
});
