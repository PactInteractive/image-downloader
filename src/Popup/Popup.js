// @ts-check
import { App } from '../components/App.js';
import html, { render } from '../html.js';

render(html`<${App} />`, /** @type {HTMLElement} */ (document.querySelector('main')));
