import html from '../html.js';

export function ExternalLink({ children, ...props }) {
	return html`<a rel="nofollow noopener" target="_blank" ...${props}>${children || props.href}</a>`;
}
