import { App } from '../components/App.js';
import { OptionsProvider } from '../components/OptionsProvider.js';
import html, { render } from '../html.js';

render(html`<${OptionsProvider}><${App} /><//>`, document.querySelector('main'));
