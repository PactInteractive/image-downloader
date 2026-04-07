// @ts-check
import { useLayoutEffect, useRef } from '../html.js';

export function useScrollToEnd() {
	const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

	function scrollToEnd() {
		const input = inputRef.current;
		if (input) {
			input.scrollLeft = input.scrollWidth;
		}
	}

	useLayoutEffect(scrollToEnd, []);

	return inputRef;
}
