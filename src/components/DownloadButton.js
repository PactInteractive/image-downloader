import html from '../html.js';

export function DownloadButton({ class: className = '', disabled, loading, ...props }) {
	const tooltipText = disabled
		? 'Select some images to download first'
		: loading
			? 'If you want, you can close the extension popup\nwhile the images are downloading!'
			: '';

	return html`
		<button
			class="${loading ? 'animate-pulse' : ''} ${className} bg-sky-600 px-2 text-white hover:bg-sky-700"
			type="button"
			disabled=${disabled || loading}
			title=${tooltipText}
			...${props}
		>
			${loading ? '•••' : 'Download'}
		</button>
	`;
}
