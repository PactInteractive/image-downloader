import { mockPartial, mockRecursivePartial } from 'sneer';
import { Chrome } from './chrome.d';

let localStorage: Storage;
let chrome: Chrome;

const setup = () => {
  localStorage = (window as any).localStorage = mockPartial<Storage>({
    clear() {},
  });

  chrome = (window as any).chrome = mockRecursivePartial<Chrome>({
    runtime: {
      onInstalled: {
        addListener() {},
      },
    },
    tabs: {
      create() {},
    },
  });
};

setup(); // Setup before import to prevent errors

import { defaults, setDefaults } from './defaults';

describe(`setDefaults`, () => {
  beforeEach(setup);

  it(`should add listener on install`, () => {
    const addListener = jest.spyOn(chrome.runtime.onInstalled, 'addListener').mockImplementationOnce((fn) => fn({}));
    setDefaults({ localStorage, chrome });

    expect(addListener).toHaveBeenCalled();
  });

  it(`should open the options page after install`, () => {
    jest.spyOn(chrome.runtime.onInstalled, 'addListener').mockImplementationOnce((fn) => fn({ reason: 'install' }));
    const create = jest.spyOn(chrome.tabs, 'create');
    setDefaults({ localStorage, chrome });

    expect(create).toHaveBeenCalledWith({ url: '/views/options.html' });
  });

  it(`should clear data when updating from version 2.1`, () => {
    jest
      .spyOn(chrome.runtime.onInstalled, 'addListener')
      .mockImplementationOnce((fn) => fn({ reason: 'update', previousVersion: '2.1' }));
    const clear = jest.spyOn(localStorage, 'clear');
    setDefaults({ localStorage, chrome });

    expect(clear).toHaveBeenCalled();
    clear.mockClear();
  });

  it(`should not clear data when updating from version 2.2`, () => {
    jest
      .spyOn(chrome.runtime.onInstalled, 'addListener')
      .mockImplementationOnce((fn) => fn({ reason: 'update', previousVersion: '2.2' }));
    const clear = jest.spyOn(localStorage, 'clear');
    setDefaults({ localStorage, chrome });

    expect(clear).not.toHaveBeenCalled();
    clear.mockClear();
  });

  it(`should set animation_duration to 500`, () => {
    setDefaults({ localStorage, chrome });
    expect(localStorage.animation_duration).toBe('500');
  });

  it(`should set value to default if undefined`, () => {
    expect(localStorage.columns).not.toBe(defaults.columns);
    setDefaults({ localStorage, chrome });
    expect(localStorage.columns).toBe(defaults.columns);
  });

  it(`should not set value if defined`, () => {
    localStorage.columns = 1;
    expect(localStorage.columns).not.toBe(defaults.columns);
    setDefaults({ localStorage, chrome });
    expect(localStorage.columns).toBe(1);
  });

  it(`should set default value`, () => {
    expect(localStorage.columns_default).not.toBe(defaults.columns);
    setDefaults({ localStorage, chrome });
    expect(localStorage.columns_default).toBe(defaults.columns);
  });

  it(`should set options`, () => {
    expect(localStorage.options).not.toBeDefined();
    setDefaults({ localStorage, chrome });
    expect(localStorage.options).toBeDefined();
  });
});
