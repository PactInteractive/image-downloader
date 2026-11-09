// @ts-check
import { App } from '../components/App.js';
import html, { render } from '../html.js';

render(html`<${App} isPopup=${true} />`, /** @type {HTMLElement} */ (document.querySelector('main')));
