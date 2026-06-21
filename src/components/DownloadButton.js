// @ts-check
import html from '../html.js';
import { Icon } from './Icon.js';

export function DownloadButton(
	/** @type {{ class: string, disabled: boolean; loading: boolean; }} */ {
		class: className = '',
		disabled,
		loading,
		...props
	}
) {
	const tooltip = disabled
		? 'Select some images to download first'
		: loading
			? 'If you want, you can close the extension popup\nwhile the images are downloading!'
			: '';

	return html`
		<button
			class="${loading
				? 'animate-pulse'
				: ''} ${className} inline-flex items-center justify-center gap-1.5 border-sky-700/50 bg-sky-600 px-3 font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_color-mix(in_srgb,var(--color-sky-600)_45%,transparent)] hover:bg-sky-500 active:bg-sky-700 dark:border-sky-400/30"
			type="button"
			disabled=${disabled || loading}
			title=${tooltip}
			...${props}
		>
			${loading
				? '•••'
				: html`<${Icon} name="download" size=${15} /><span>Download</span>`}
		</button>
	`;
}
