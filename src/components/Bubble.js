// @ts-check
import html from '../html.js';

export function Bubble(
	/** @type {{
		show?: boolean;
		class?: string;
		children: any;
	}} */ { show = true, class: className = '', children, ...props }
) {
	return html`
		<small
			class="${className} ${show
				? 'ease-elastic duration-400'
				: 'scale-0'} corner-round absolute top-0.5 right-0.5 flex h-4 min-w-4 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-sky-600 px-1 pt-0.5 font-bold text-white tabular-nums transition-transform"
			...${props}
		>
			${children}
		</small>
	`;
}
