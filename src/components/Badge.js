import html from '../html.js';

export function Badge({ class: className, children, ...props }) {
	return html`
		<div class="${className} rounded bg-slate-950/80 px-1 text-white empty:hidden" ...${props}>${children}</div>
	`;
}
