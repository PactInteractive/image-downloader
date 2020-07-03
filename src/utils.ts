const htm = require('htm') // NOTE: Looks like Jest doesn't handle ES6 imports for this library
import { mockRecursivePartial, RecursivePartial } from 'sneer'

export const mockChrome = () =>
  mockRecursivePartial<typeof chrome>({
    downloads: {
      onDeterminingFilename: {
        addListener: jest.fn(),
      },
    },
    runtime: {
      onInstalled: {
        addListener: jest.fn(),
      },
      onMessage: {
        addListener: jest.fn(),
      },
      sendMessage: jest.fn(),
    },
    tabs: {
      create: jest.fn(),
      query: jest.fn(),
    },
    windows: {
      getCurrent: () => ({ id: 'window' }),
    },
  })

export const asMockedFunction = <T extends (...args: any[]) => any>(fn: T) =>
  fn as jest.MockedFunction<T>

const createElement = <T extends keyof HTMLElementTagNameMap>(
  tagName: T,
  allProps: RecursivePartial<HTMLElementTagNameMap[T]>
) => {
  const element: HTMLElementTagNameMap[T] = document.createElement(tagName)
  const { style, ...props } = allProps || {}
  Object.assign(element, props)
  Object.assign(element.style, style)

  return element
}

export const html = htm.bind(createElement)
