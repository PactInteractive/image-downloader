;(function (window) {
  const createElement = (tagName, props, ...children) => {
    const element = document.createElement(tagName)

    for (let prop in props) {
      // Class
      if (prop === 'class' || prop === 'className') {
        element.className = props.class || props.className || ''
      }
      // Style
      else if (prop === 'style') {
        if (typeof props.style === 'string') {
          element.style = props.style
        } else {
          Object.assign(element.style, props.style)
        }
      }
      // Event handlers
      else if (prop.startsWith('on')) {
        const eventHandler = props[prop]
        if (typeof eventHandler === 'function') {
          const eventName = prop.replace(/^on/, '').toLowerCase()
          element.addEventListener(eventName, eventHandler)
        }
      }
      // Properties
      else if (prop in element) {
        element[prop] = props[prop]
      }
      // Attributes
      else {
        element.setAttribute(prop, props[prop])
      }
    }

    // Append children
    // Flattening handles the case when there are nested children that use `html`
    // Filtering by `Boolean` removes falsy values
    children.flat().filter(Boolean).forEach((child) => {
      if (typeof child === 'string') {
        child = decodeHtml(child)
      }
      element.append(child)
    })

    return element
  }

  /** Source: https://stackoverflow.com/questions/7394748/whats-the-right-way-to-decode-a-string-that-has-special-html-entities-in-it/7394787 */
  const decodeHtml = (html) => {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = html
    return textarea.value
  }

  window.html = window.htm.bind(createElement)
})(window)
