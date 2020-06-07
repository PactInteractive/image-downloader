import { RecursivePartial } from 'sneer'

export const asMockedFunction = <T extends (...args: any[]) => any>(fn: T) =>
  fn as jest.MockedFunction<T>

export const createElement = <T extends keyof HTMLElementTagNameMap>(
  tagName: T,
  { style, ...props }: RecursivePartial<HTMLElementTagNameMap[T]>
) => {
  const element: HTMLElementTagNameMap[T] = document.createElement(tagName)
  Object.assign(element, props)
  Object.assign(element.style, style)

  return element
}
