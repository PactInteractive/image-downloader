import { mockRecursivePartial } from 'sneer'

declare var global: any

const asMockedFunction = <T extends (...args: any[]) => any>(fn: T) =>
  fn as jest.MockedFunction<T>

beforeEach(() => {
  global.chrome = mockRecursivePartial<typeof chrome>({
    runtime: {
      onInstalled: {
        addListener: jest.fn(),
      },
    },
    tabs: {
      create: jest.fn(),
    },
  })

  global.localStorage = {
    clear: jest.fn(),
  }
})

describe(`defaults`, () => {
  it(`adds a listener on install or update`, () => {
    require('./defaults')
    expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalledTimes(1)
  })

  it(`opens options page on install`, () => {
    require('./defaults')
    const handler = asMockedFunction(chrome.runtime.onInstalled.addListener)
      .mock.calls[0][0]
    handler({ reason: 'install' })
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: '/views/options.html',
    })
  })

  it(`clears data from versions before 2.1`, () => {
    require('./defaults')
    const handler = asMockedFunction(chrome.runtime.onInstalled.addListener)
      .mock.calls[0][0]
    handler({ reason: 'update', previousVersion: '1.3' })
    expect(localStorage.clear).toHaveBeenCalled()
  })

  it(`should preserve existing options in 'localStorage'`, () => {
    localStorage.folder_name = 'test'
    require('./defaults')
    expect(localStorage.folder_name).toBe('test')
  })

  it(`should set undefined options in 'localStorage' to default`, () => {
    localStorage.folder_name = undefined
    require('./defaults')
    expect(localStorage.folder_name).not.toBe(undefined)
  })

  it(`matches 'localStorage' snapshot`, () => {
    require('./defaults')
    expect(global.localStorage).toMatchInlineSnapshot(`
      Object {
        "animation_duration": "500",
        "clear": [MockFunction],
        "columns": 2,
        "columns_default": 2,
        "filter_max_height": 3000,
        "filter_max_height_default": 3000,
        "filter_max_height_enabled": false,
        "filter_max_height_enabled_default": false,
        "filter_max_width": 3000,
        "filter_max_width_default": 3000,
        "filter_max_width_enabled": false,
        "filter_max_width_enabled_default": false,
        "filter_min_height": 0,
        "filter_min_height_default": 0,
        "filter_min_height_enabled": false,
        "filter_min_height_enabled_default": false,
        "filter_min_width": 0,
        "filter_min_width_default": 0,
        "filter_min_width_enabled": false,
        "filter_min_width_enabled_default": false,
        "filter_url": "",
        "filter_url_default": "",
        "filter_url_mode": "normal",
        "filter_url_mode_default": "normal",
        "folder_name": "",
        "folder_name_default": "",
        "image_border_color": "#3498db",
        "image_border_color_default": "#3498db",
        "image_border_width": 3,
        "image_border_width_default": 3,
        "image_max_width": 200,
        "image_max_width_default": 200,
        "image_min_width": 50,
        "image_min_width_default": 50,
        "new_file_name": "",
        "new_file_name_default": "",
        "only_images_from_links": false,
        "only_images_from_links_default": false,
        "options": "[\\"folder_name\\",\\"new_file_name\\",\\"filter_url\\",\\"filter_url_mode\\",\\"filter_min_width\\",\\"filter_min_width_enabled\\",\\"filter_max_width\\",\\"filter_max_width_enabled\\",\\"filter_min_height\\",\\"filter_min_height_enabled\\",\\"filter_max_height\\",\\"filter_max_height_enabled\\",\\"only_images_from_links\\",\\"show_download_confirmation\\",\\"show_download_notification\\",\\"show_file_renaming\\",\\"show_url_filter\\",\\"show_image_width_filter\\",\\"show_image_height_filter\\",\\"show_only_images_from_links\\",\\"show_image_url\\",\\"show_open_image_button\\",\\"show_download_image_button\\",\\"columns\\",\\"image_min_width\\",\\"image_max_width\\",\\"image_border_width\\",\\"image_border_color\\"]",
        "show_download_confirmation": true,
        "show_download_confirmation_default": true,
        "show_download_image_button": true,
        "show_download_image_button_default": true,
        "show_download_notification": true,
        "show_download_notification_default": true,
        "show_file_renaming": false,
        "show_file_renaming_default": false,
        "show_image_height_filter": true,
        "show_image_height_filter_default": true,
        "show_image_url": true,
        "show_image_url_default": true,
        "show_image_width_filter": true,
        "show_image_width_filter_default": true,
        "show_only_images_from_links": true,
        "show_only_images_from_links_default": true,
        "show_open_image_button": true,
        "show_open_image_button_default": true,
        "show_url_filter": true,
        "show_url_filter_default": true,
      }
    `)
  })
})
