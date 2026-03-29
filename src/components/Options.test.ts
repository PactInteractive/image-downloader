import { mockChrome } from '../test-helpers';
import { beforeEach, describe, it, expect } from 'bun:test';

declare var global: any;

beforeEach(() => {
  localStorage.clear();
  global.chrome = mockChrome();
  global.$ = require('../../lib/jquery-3.5.1.min');
  ($.fn as any).fadeIn = function (duration: any, fn: any) {
    setTimeout(duration, fn);
    return this;
  };
  ($.fn as any).fadeOut = function (duration: any, fn: any) {
    setTimeout(duration, fn);
    return this;
  };
  const originalTrigger = $.fn.trigger;
  ($.fn as any).trigger = function (eventName: string, ...args: any[]) {
    if (this.length > 0 && this[0].dispatchEvent) {
      const EventConstructor =
        eventName === 'click' || eventName === 'dblclick' ? MouseEvent : Event;
      this[0].dispatchEvent(
        new EventConstructor(eventName, { bubbles: true, cancelable: true }),
      );
      return this;
    }
    return originalTrigger.call(this, eventName, ...args);
  };

  const originalDispatch = HTMLElement.prototype.dispatchEvent;
  HTMLElement.prototype.dispatchEvent = function (event: Event) {
    if (event.type === 'change') {
      return originalDispatch.call(
        this,
        new Event('input', { bubbles: true, cancelable: true }),
      );
    }
    return originalDispatch.call(this, event);
  };

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set;
  const originalVal = $.fn.val as Function;
  ($.fn as any).val = function (value?: any) {
    if (value !== undefined && nativeInputValueSetter && this[0]) {
      nativeInputValueSetter.call(this[0], value);
      return this;
    }
    return originalVal.call(this, value);
  };

  document.body.innerHTML = '<main></main>';
  global.React = require('../../lib/react-18.3.1.min');
  global.ReactDOM = require('../../lib/react-dom-18.3.1.min');
});

const checkboxOptions = {
  prop: 'checked',
  values: [true, false],
  trigger($el: JQuery<HTMLInputElement>, value: any) {
    $el.prop('checked', !value).trigger('click');
  },
};

const inputOptions = {
  prop: 'value',
  trigger($el: JQuery<HTMLInputElement>, value: any) {
    $el.val(value);
    $el[0].dispatchEvent(new CustomEvent('change'));
  },
};

const options = [
  {
    input: '#show_download_confirmation_checkbox',
    key: 'show_download_confirmation',
    ...checkboxOptions,
  },
  {
    input: '#show_file_renaming_checkbox',
    key: 'show_file_renaming',
    ...checkboxOptions,
  },
  {
    input: '#show_image_url_checkbox',
    key: 'show_image_url',
    ...checkboxOptions,
  },
  {
    input: '#show_open_image_button_checkbox',
    key: 'show_open_image_button',
    ...checkboxOptions,
  },
  {
    input: '#show_download_image_button_checkbox',
    key: 'show_download_image_button',
    ...checkboxOptions,
  },
  {
    input: '#columns_numberbox',
    key: 'columns',
    values: ['1', '2', '3'],
    ...inputOptions,
  },
  {
    input: '#image_min_width_numberbox',
    key: 'image_min_width',
    values: ['100', '200', '300'],
    ...inputOptions,
  },
  {
    input: '#image_max_width_numberbox',
    key: 'image_max_width',
    values: ['200', '400', '600'],
    ...inputOptions,
  },
];

describe(`initialize control values`, () => {
  options.forEach((option) => {
    option.values.forEach((value) => {
      describe(option.key, () => {
        it(value.toString(), () => {
          localStorage[option.key] = value.toString();
          delete require.cache[require.resolve('./Options')];
          require('./Options');
          expect($(option.input).prop(option.prop)).toBe(value);
        });
      });
    });
  });
});

describe(`save`, () => {
  options.forEach((option) => {
    describe(option.key, () => {
      option.values.forEach((value) => {
        it(value.toString(), () => {
          delete require.cache[require.resolve('./Options')];
          require('./Options');

          option.trigger($(option.input), value);
          $('#save_button').trigger('click');

          expect(localStorage[option.key]).toBe(value.toString());
        });
      });
    });
  });
});

describe(`reset`, () => {
  beforeEach(() => {
    global.chrome = mockChrome();
  });

  options.forEach((option) => {
    describe(option.key, () => {
      option.values.forEach((value) => {
        it(value.toString(), () => {
          delete require.cache[require.resolve('../defaults')];
          require('../defaults');
          delete require.cache[require.resolve('./Options')];
          require('./Options');

          option.trigger($(option.input), value);
          $('#reset_button').trigger('click');
          $('#save_button').trigger('click');

          expect(localStorage[option.key]).toBe(
            localStorage[`${option.key}_default`],
          );
        });
      });
    });
  });
});

describe(`clear data`, () => {
  beforeEach(() => {
    global.chrome = mockChrome();
    global.confirm = () => true;
    delete global.window.location;
    global.window.location = { reload() {} };
  });

  options.forEach((option) => {
    describe(option.key, () => {
      option.values.forEach((value) => {
        it(value.toString(), () => {
          delete require.cache[require.resolve('../defaults')];
          require('../defaults');
          delete require.cache[require.resolve('./Options')];
          require('./Options');

          option.trigger($(option.input), value);
          $('#save_button').trigger('click');
          $('#clear_data_button').trigger('click');

          expect(localStorage[option.key]).toBe(
            localStorage[`${option.key}_default`],
          );
        });
      });
    });
  });
});
