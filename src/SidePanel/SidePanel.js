import { App } from '../components/App.js';
import html, { render } from '../html.js';

render(html`<${App} />`, document.querySelector('main'));
