import html from './html';
import { mockChrome } from './utils';

declare var global: any;

beforeEach(() => {
  localStorage.clear();
  require('../lib/zepto');
  ($.fn as any).fadeIn = function (duration, fn) {
    setTimeout(duration, fn);
    return this;
  };
  ($.fn as any).fadeOut = function (duration, fn) {
    setTimeout(duration, fn);
    return this;
  };
  document.body.innerHTML = '';
});

const checkboxOptions = {
  prop: 'checked',
  values: [true, false],
  trigger($el: JQuery<HTMLElement>, value: any) {
    if (value) {
      $el.trigger('click');
    }
  },
};

const inputOptions = {
  prop: 'value',
  trigger($el: JQuery<HTMLElement>, value: any) {
    $el.val(value);
  },
};

const options = [
  {
    input: html`<input
      id="show_download_confirmation_checkbox"
      type="checkbox"
    />`,
    key: 'show_download_confirmation',
    ...checkboxOptions,
  },
  {
    input: html`<input
      id="show_download_notification_checkbox"
      type="checkbox"
    />`,
    key: 'show_download_notification',
    ...checkboxOptions,
  },
  {
    input: html`<input id="show_file_renaming_checkbox" type="checkbox" />`,
    key: 'show_file_renaming',
    ...checkboxOptions,
  },
  {
    input: html`<input id="show_url_filter_checkbox" type="checkbox" />`,
    key: 'show_url_filter',
    ...checkboxOptions,
  },
  {
    input: html`<input
      id="show_image_width_filter_checkbox"
      type="checkbox"
    />`,
    key: 'show_image_width_filter',
    ...checkboxOptions,
  },
  {
    input: html`<input
      id="show_image_height_filter_checkbox"
      type="checkbox"
    />`,
    key: 'show_image_height_filter',
    ...checkboxOptions,
  },
  {
    input: html`<input
      id="show_only_images_from_links_checkbox"
      type="checkbox"
    />`,
    key: 'show_only_images_from_links',
    ...checkboxOptions,
  },
  {
    input: html`<input id="show_image_url_checkbox" type="checkbox" />`,
    key: 'show_image_url',
    ...checkboxOptions,
  },
  {
    input: html`<input id="show_open_image_button_checkbox" type="checkbox" />`,
    key: 'show_open_image_button',
    ...checkboxOptions,
  },
  {
    input: html`<input
      id="show_download_image_button_checkbox"
      type="checkbox"
    />`,
    key: 'show_download_image_button',
    ...checkboxOptions,
  },
  {
    input: html`<input id="columns_numberbox" type="number" />`,
    key: 'columns',
    values: ['1', '2', '3'],
    ...inputOptions,
  },
  {
    input: html`<input id="image_min_width_numberbox" type="number" />`,
    key: 'image_min_width',
    values: ['100', '200', '300'],
    ...inputOptions,
  },
  {
    input: html`<input id="image_max_width_numberbox" type="number" />`,
    key: 'image_max_width',
    values: ['200', '400', '600'],
    ...inputOptions,
  },
  {
    input: html`<input id="image_border_width_numberbox" type="number" />`,
    key: 'image_border_width',
    values: ['1', '2', '3'],
    ...inputOptions,
  },
  {
    input: html`<input id="image_border_color_picker" type="color" />`,
    key: 'image_border_color',
    values: ['#ff0000', '#00ff00', '#0000ff'],
    ...inputOptions,
  },
];

describe(`initialize control values`, () => {
  options.forEach((option) => {
    option.values.forEach((value) => {
      describe(option.key, () => {
        it(value.toString(), () => {
          document.body.append(option.input);
          localStorage[option.key] = value.toString();

          require('./options');

          expect(option.input[option.prop]).toBe(value);
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
          document.body.append(option.input);

          const saveButton = html`<input id="save_button" type="button" />`;
          document.body.append(saveButton);

          require('./options');

          option.trigger($(`#${option.input.id}`), value);
          $(`#${saveButton.id}`).trigger('click');

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
          document.body.append(option.input);

          const saveButton = html`<input id="save_button" type="button" />`;
          document.body.append(saveButton);

          const resetButton = html`<input id="reset_button" type="button" />`;
          document.body.append(resetButton);

          require('./defaults');
          require('./options');

          option.trigger($(`#${option.input.id}`), value);
          $(`#${resetButton.id}`).trigger('click');
          $(`#${saveButton.id}`).trigger('click');

          expect(localStorage[option.key]).toBe(
            localStorage[`${option.key}_default`]
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
          document.body.append(option.input);

          const saveButton = html`<input id="save_button" type="button" />`;
          document.body.append(saveButton);

          const clearDataButton = html`<input
            id="clear_data_button"
            type="button"
          />`;
          document.body.append(clearDataButton);

          require('./defaults');
          require('./options');

          option.trigger($(`#${option.input.id}`), value);
          $(`#${saveButton.id}`).trigger('click');
          $(`#${clearDataButton.id}`).trigger('click');

          expect(localStorage[option.key]).toBe(
            localStorage[`${option.key}_default`]
          );
        });
      });
    });
  });
});
