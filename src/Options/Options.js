import html, { render } from '../html.js';
import { About } from './About.js';

render(html`<${About} />`, document.querySelector('main'));
