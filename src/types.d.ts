interface Window {
	__observer?: MutationObserver;
	__idleDomTimer?: ReturnType<typeof setTimeout>;
}

declare global {
	const noUiSlider: NoUiSliderStatic;

	interface HTMLElement {
		noUiSlider?: NoUiSliderInstance;
	}
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

interface NoUiSliderStatic {
	create(element: HTMLElement, options: NoUiSliderOptions): void;
}
