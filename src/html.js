import htm from '../lib/htm.js';

const html = (tagName, props, ...children) => {
  // Functional components
  if (typeof tagName === 'function') {
    return tagName({ children, ...props });
  }

  // Elements
  const element = document.createElement(tagName);

  for (let prop in props) {
    // Class
    if (prop === 'class' || prop === 'className') {
      element.className = props.class || props.className || '';
    }
    // Style
    else if (prop === 'style') {
      Object.assign(element.style, props.style);
    }
    // Event handlers
    else if (prop.startsWith('on')) {
      const eventHandler = props[prop];
      if (typeof eventHandler === 'function') {
        const eventName = prop.replace(/^on/, '').toLowerCase();
        element.addEventListener(eventName, eventHandler);
      }
    }
    // Override children coming from functional components
    else if (prop === 'children') {
      children = props.children;
    }
    // Properties
    else if (prop in element) {
      element[prop] = props[prop];
    }
    // Attributes
    else {
      element.setAttribute(prop, props[prop]);
    }
  }

  children
    // Handle the case when there are nested children that use `html`
    .flat(2)
    // Remove falsy values
    .filter((child) => child || child === 0)
    // Append children
    .forEach((child) => {
      if (typeof child === 'string') {
        child = decodeHtml(child);
      }
      element.append(child);
    });

  return element;
};

/** Source: https://stackoverflow.com/questions/7394748/whats-the-right-way-to-decode-a-string-that-has-special-html-entities-in-it/7394787 */
const decodeHtml = (html) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  return textarea.value;
};

export default htm.bind(html);
