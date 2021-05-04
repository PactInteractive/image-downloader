import { asMockedFunction, mockChrome } from './test';

declare var global: any;

beforeEach(() => {
  global.chrome = mockChrome();
  localStorage.clear();
});

it(`preserves existing options in 'localStorage'`, () => {
  localStorage.folder_name = 'test';
  require('./defaults');
  expect(localStorage.folder_name).toBe('test');
});

it(`sets undefined options in 'localStorage' to default`, () => {
  localStorage.folder_name = undefined;
  require('./defaults');
  expect(localStorage.folder_name).not.toBe(undefined);
});

it(`matches 'localStorage' snapshot`, () => {
  require('./defaults');
  expect(global.localStorage).toMatchInlineSnapshot(`
    Storage {
      "columns": "2",
      "columns_default": "2",
      "filter_max_height": "3000",
      "filter_max_height_default": "3000",
      "filter_max_height_enabled": "false",
      "filter_max_height_enabled_default": "false",
      "filter_max_width": "3000",
      "filter_max_width_default": "3000",
      "filter_max_width_enabled": "false",
      "filter_max_width_enabled_default": "false",
      "filter_min_height": "0",
      "filter_min_height_default": "0",
      "filter_min_height_enabled": "false",
      "filter_min_height_enabled_default": "false",
      "filter_min_width": "0",
      "filter_min_width_default": "0",
      "filter_min_width_enabled": "false",
      "filter_min_width_enabled_default": "false",
      "filter_url": "",
      "filter_url_default": "",
      "filter_url_mode": "normal",
      "filter_url_mode_default": "normal",
      "folder_name": "",
      "folder_name_default": "",
      "image_max_width": "200",
      "image_max_width_default": "200",
      "image_min_width": "50",
      "image_min_width_default": "50",
      "new_file_name": "",
      "new_file_name_default": "",
      "only_images_from_links": "false",
      "only_images_from_links_default": "false",
      "show_advanced_filters": "true",
      "show_advanced_filters_default": "true",
      "show_download_confirmation": "true",
      "show_download_confirmation_default": "true",
      "show_download_image_button": "true",
      "show_download_image_button_default": "true",
      "show_file_renaming": "true",
      "show_file_renaming_default": "true",
      "show_image_url": "true",
      "show_image_url_default": "true",
      "show_open_image_button": "true",
      "show_open_image_button_default": "true",
    }
  `);
});
