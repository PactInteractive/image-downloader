interface Window {
	__devIframe?: { current?: HTMLIframeElement };
	__observer?: MutationObserver;
	__idleDomTimer?: ReturnType<typeof setTimeout>;
}

declare global {
	interface HTMLElement {
		noUiSlider?: NoUiSliderInstance;
	}
}

declare module '../lib/nouislider.mjs' {
	export function create(element: HTMLElement, options: NoUiSliderOptions): void;
	export const cssClasses: Record<string, string>;
}

interface NoUiSliderInstance {
	on(event: string, callback: (values: [number, number]) => void): void;
	destroy(): void;
}

interface NoUiSliderOptions {
	behaviour?: string;
	connect?: boolean;
	format?: {
		from: (value: string) => number;
		to: (value: string) => string;
	};
	range?: {
		min: number;
		max: number;
	};
	step?: number;
	start?: [number, number];
}
