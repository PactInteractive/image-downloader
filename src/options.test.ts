import * as $ from 'jquery'
import { createElement, mockChrome } from './utils'

declare var global: any

beforeEach(() => {
  global.$ = $
  localStorage.clear()
})

const checkboxOptions = {
  prop: 'checked',
  values: [true, false],
  trigger($el: JQuery<HTMLElement>, value: any) {
    if (value) {
      $el.trigger('click')
    }
  },
}

const inputOptions = {
  prop: 'value',
  trigger($el: JQuery<HTMLElement>, value: any) {
    $el.val(value)
  },
}

const options = [
  {
    props: { id: 'show_download_confirmation_checkbox', type: 'checkbox' },
    key: 'show_download_confirmation',
    ...checkboxOptions,
  },
  {
    props: { id: 'show_download_notification_checkbox', type: 'checkbox' },
    key: 'show_download_notification',
    ...checkboxOptions,
  },
  {
    props: { id: 'show_file_renaming_checkbox', type: 'checkbox' },
    key: 'show_file_renaming',
    ...checkboxOptions,
  },
  {
    props: { id: 'show_url_filter_checkbox', type: 'checkbox' },
    key: 'show_url_filter',
    ...checkboxOptions,
  },
  {
    props: { id: 'show_image_width_filter_checkbox', type: 'checkbox' },
    key: 'show_image_width_filter',
    ...checkboxOptions,
  },
  {
    props: { id: 'show_image_height_filter_checkbox', type: 'checkbox' },
    key: 'show_image_height_filter',
    ...checkboxOptions,
  },
  {
    props: { id: 'show_only_images_from_links_checkbox', type: 'checkbox' },
    key: 'show_only_images_from_links',
    ...checkboxOptions,
  },
  {
    props: { id: 'show_image_url_checkbox', type: 'checkbox' },
    key: 'show_image_url',
    ...checkboxOptions,
  },
  {
    props: { id: 'show_open_image_button_checkbox', type: 'checkbox' },
    key: 'show_open_image_button',
    ...checkboxOptions,
  },
  {
    props: { id: 'show_download_image_button_checkbox', type: 'checkbox' },
    key: 'show_download_image_button',
    ...checkboxOptions,
  },
  {
    props: { id: 'columns_numberbox', type: 'number' },
    key: 'columns',
    values: ['1', '2', '3'],
    ...inputOptions,
  },
  {
    props: { id: 'image_min_width_numberbox', type: 'number' },
    key: 'image_min_width',
    values: ['100', '200', '300'],
    ...inputOptions,
  },
  {
    props: { id: 'image_max_width_numberbox', type: 'number' },
    key: 'image_max_width',
    values: ['200', '400', '600'],
    ...inputOptions,
  },
  {
    props: { id: 'image_border_width_numberbox', type: 'number' },
    key: 'image_border_width',
    values: ['1', '2', '3'],
    ...inputOptions,
  },
  {
    props: { id: 'image_border_color_picker', type: 'color' },
    key: 'image_border_color',
    values: ['#ff0000', '#00ff00', '#0000ff'],
    ...inputOptions,
  },
]

describe(`initialize control values`, () => {
  options.forEach((option) => {
    option.values.forEach((value) => {
      describe(option.key, () => {
        it(value.toString(), () => {
          const input = createElement('input', option.props)
          document.body.append(input)
          localStorage[option.key] = value.toString()

          require('./options')

          expect(input[option.prop]).toBe(value)
          input.remove()
        })
      })
    })
  })
})

describe(`save`, () => {
  options.forEach((option) => {
    describe(option.key, () => {
      option.values.forEach((value) => {
        it(value.toString(), () => {
          const input = createElement('input', option.props)
          document.body.append(input)

          const saveButton = createElement('input', {
            id: 'save_button',
            type: 'button',
          })
          document.body.append(saveButton)

          require('./options')

          option.trigger($(`#${input.id}`), value)
          $(`#${saveButton.id}`).trigger('click')

          expect(localStorage[option.key]).toBe(value.toString())
        })
      })
    })
  })
})

describe(`reset`, () => {
  beforeEach(() => {
    global.chrome = mockChrome()
  })

  options.forEach((option) => {
    describe(option.key, () => {
      option.values.forEach((value) => {
        it(value.toString(), () => {
          const input = createElement('input', option.props)
          document.body.append(input)

          const saveButton = createElement('input', {
            id: 'save_button',
            type: 'button',
          })
          document.body.append(saveButton)

          const resetButton = createElement('input', {
            id: 'reset_button',
            type: 'button',
          })
          document.body.append(resetButton)

          require('./defaults')
          require('./options')

          option.trigger($(`#${input.id}`), value)
          $(`#${resetButton.id}`).trigger('click')
          $(`#${saveButton.id}`).trigger('click')

          expect(localStorage[option.key]).toBe(
            localStorage[`${option.key}_default`]
          )
        })
      })
    })
  })
})

describe(`clear data`, () => {
  beforeEach(() => {
    global.chrome = mockChrome()
    global.confirm = () => true
    delete global.window.location
    global.window.location = { reload() {} }
  })

  options.forEach((option) => {
    describe(option.key, () => {
      option.values.forEach((value) => {
        it(value.toString(), () => {
          const input = createElement('input', option.props)
          document.body.append(input)

          const saveButton = createElement('input', {
            id: 'save_button',
            type: 'button',
          })
          document.body.append(saveButton)

          const clearDataButton = createElement('input', {
            id: 'clear_data_button',
            type: 'button',
          })
          document.body.append(clearDataButton)

          require('./defaults')
          require('./options')

          option.trigger($(`#${input.id}`), value)
          $(`#${saveButton.id}`).trigger('click')
          $(`#${clearDataButton.id}`).trigger('click')

          expect(localStorage[option.key]).toBe(
            localStorage[`${option.key}_default`]
          )
        })
      })
    })
  })
})
