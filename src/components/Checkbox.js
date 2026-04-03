// @ts-check
import html from '../html.js';

export function Checkbox(
	/** @type {{
		children: any;
		class: string;
		indeterminate: boolean;
		title: string;
	}} */ { children, class: className, indeterminate, title, ...props }
) {
	return html`
		<label ...${{ class: className, title }}>
			<input class="mb-px" ref=${setIndeterminate(indeterminate)} type="checkbox" ...${props} />
			${children}
		</label>
	`;
}

// Source: https://davidwalsh.name/react-indeterminate
const setIndeterminate =
	(/** @type {boolean?} */ indeterminate) => (/** @type {HTMLInputElement | null} */ element) => {
		if (element) {
			element.indeterminate = !!indeterminate;
		}
	};
