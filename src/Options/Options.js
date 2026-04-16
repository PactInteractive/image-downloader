// @ts-check
import { useTheme } from '../components/useTheme.js';
import html, { render } from '../html.js';
import { About } from './About.js';

function Options() {
	useTheme();
	return html`<${About} />`;
}

render(html`<${Options} />`, /** @type {HTMLElement} */ (document.querySelector('main')));
