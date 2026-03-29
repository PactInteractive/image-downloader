import html from '../html.js';

export function Checkbox({ children, class: className, indeterminate, title, ...props }) {
	return html`
		<label ...${{ class: className, title }}>
			<input class="mb-px" ref=${setIndeterminate(indeterminate)} type="checkbox" ...${props} />
			${children}
		</label>
	`;
}

// Source: https://davidwalsh.name/react-indeterminate
const setIndeterminate = (indeterminate) => (element) => {
	if (element) {
		element.indeterminate = indeterminate;
	}
};
