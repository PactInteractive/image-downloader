import { OptionsProvider } from '../components/OptionsProvider.js';
import html, { render } from '../html.js';
import { About } from './About.js';

render(html`<${OptionsProvider}><${About} /><//>`, document.querySelector('main'));
