// @ts-check
import html, { render } from '../html.js';
import { About } from './About.js';

render(html`<${About} />`, /** @type {HTMLElement} */ (document.querySelector('main')));
