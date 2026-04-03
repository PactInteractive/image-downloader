import htm from '../lib/htm.js';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from '../lib/preact-hooks.module.js';
import { Fragment, h, render } from '../lib/preact.module.js';
import { useComputed, useSignal, useSignalEffect } from '../lib/signals.module.js';
export { computed, effect, signal } from '../../lib/signals-core.module.js';

const html = htm.bind(h);
export default html;

// React-compatible hooks (from preact/hooks — drop-in replacement)
export { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState };

// Signals
export { useComputed, useSignal, useSignalEffect };

// DOM
export { render };

// Utilities
export { For };

/**
 * @template T
 * @param {{ each: import('./html.js').Signal<T[]> | import('./html.js').ReadonlySignal<T[]> | (() => T[] | import('./html.js').Signal<T[]> | import('./html.js').ReadonlySignal<T[]>), fallback?: any, getKey?: (item: T, index: number) => string | number, children: (value: T, index: number) => any }} props
 */
function For({ each, fallback, getKey, children }) {
	const cache = useMemo(() => new Map(), []);
	const list = typeof each === 'function' ? each() : each;
	const listValue = list && typeof list.value !== 'undefined' ? list.value : list;

	if (!listValue || !listValue.length) return fallback || null;

	const removed = new Set(cache.keys());

	const items = listValue.map((value, index) => {
		removed.delete(value);
		if (!cache.has(value)) {
			const key = getKey ? getKey(value, index) : index;
			const result = h(Item, { key, v: value, i: index, children });
			cache.set(value, result);
			return result;
		}
		return cache.get(value);
	});

	removed.forEach((value) => {
		cache.delete(value);
	});

	return h(Fragment, null, ...items);
}

/**
 * @param {{ v: any, i: number, children: (value: any, index: number) => any }} props
 */
function Item({ v, i, children }) {
	return typeof children === 'function' ? children(v, i) : children;
}
