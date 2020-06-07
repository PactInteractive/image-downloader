import * as $ from 'jquery'

declare var global: any

beforeEach(() => {
  global.$ = $
})

describe(`options`, () => {
  describe(`initializes control values`, () => {
    const options = [
      {
        id: 'show_download_confirmation_checkbox',
        key: 'show_download_confirmation',
        prop: 'checked',
        values: [true, false],
      },
      {
        id: 'show_download_notification_checkbox',
        key: 'show_download_notification',
        prop: 'checked',
        values: [true, false],
      },
      {
        id: 'show_file_renaming_checkbox',
        key: 'show_file_renaming',
        prop: 'checked',
        values: [true, false],
      },
      {
        id: 'show_url_filter_checkbox',
        key: 'show_url_filter',
        prop: 'checked',
        values: [true, false],
      },
      {
        id: 'show_image_width_filter_checkbox',
        key: 'show_image_width_filter',
        prop: 'checked',
        values: [true, false],
      },
      {
        id: 'show_image_height_filter_checkbox',
        key: 'show_image_height_filter',
        prop: 'checked',
        values: [true, false],
      },
      {
        id: 'show_only_images_from_links_checkbox',
        key: 'show_only_images_from_links',
        prop: 'checked',
        values: [true, false],
      },
      {
        id: 'show_image_url_checkbox',
        key: 'show_image_url',
        prop: 'checked',
        values: [true, false],
      },
      {
        id: 'show_open_image_button_checkbox',
        key: 'show_open_image_button',
        prop: 'checked',
        values: [true, false],
      },
      {
        id: 'show_download_image_button_checkbox',
        key: 'show_download_image_button',
        prop: 'checked',
        values: [true, false],
      },
      {
        id: 'columns_numberbox',
        key: 'columns',
        prop: 'value',
        values: ['1', '2', '3'],
      },
      {
        id: 'image_min_width_numberbox',
        key: 'image_min_width',
        prop: 'value',
        values: ['100', '200', '300'],
      },
      {
        id: 'image_max_width_numberbox',
        key: 'image_max_width',
        prop: 'value',
        values: ['200', '400', '600'],
      },
      {
        id: 'image_border_width_numberbox',
        key: 'image_border_width',
        prop: 'value',
        values: ['1', '2', '3'],
      },
      {
        id: 'image_border_color_picker',
        key: 'image_border_color',
        prop: 'value',
        values: ['#ff0000', '#00ff00', '#0000ff'],
      },
    ]

    options.forEach((option) => {
      option.values.forEach((value) => {
        describe(option.id, () => {
          it(value.toString(), () => {
            const input = document.createElement('input')
            input.type = 'checkbox'
            input.id = option.id
            document.body.append(input)
            ;(localStorage as any)[option.key] = value.toString()

            require('./options')

            expect(input[option.prop]).toBe(value)
            input.remove()
          })
        })
      })
    })
  })
})
