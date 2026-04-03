export interface Signal<T> {
	value: T;
	peek(): T;
	subscribe(cb: (value: T) => void): () => void;
}

export interface ReadonlySignal<T> {
	readonly value: T;
	peek(): T;
	subscribe(cb: (value: T) => void): () => void;
}

export function signal<T>(initialValue: T): Signal<T>;
export function computed<T>(fn: () => T): ReadonlySignal<T>;
export function effect(fn: () => void): () => void;

export function useSignal<T>(initialValue: T): Signal<T>;
export function useRef<T>(initialValue: T): { current: T };
export function useEffect(callback: () => void | (() => void), deps?: readonly any[]): void;
export function useLayoutEffect(callback: () => void | (() => void), deps?: readonly any[]): void;

export function html(strings: TemplateStringsArray, ...values: any[]): any;
export default html;

export interface ForProps<T> {
	each: Signal<T[]> | ReadonlySignal<T[]> | (() => T[] | Signal<T[]> | ReadonlySignal<T[]>);
	fallback?: any;
	getKey?: (item: T, index: number) => string | number;
	children: (value: T, index: number) => any;
}

export function For<T>(props: ForProps<T>): any;

export function render(vnode: any, parent: HTMLElement, replaceNode?: HTMLElement | HTMLElement[]): void;
