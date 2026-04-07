// @ts-check
import { useLayoutEffect, useRef } from '../html.js';

export function useRunAfterUpdate() {
	const handlersRef = useRef(/** @type {(() => void)[]} */ ([]));

	useLayoutEffect(() => {
		handlersRef.current.forEach((handler) => handler());
		handlersRef.current = [];
	});

	return (/** @type {() => void} */ handler) => {
		handlersRef.current.push(handler);
	};
}
