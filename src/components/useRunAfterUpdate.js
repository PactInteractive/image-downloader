// @ts-check
import { useLayoutEffect, useRef } from '../html.js';

// TODO: Rewrite with signals or get rid of this
export function useRunAfterUpdate() {
	const handlersRef = useRef(/** @type {(() => void)[]} */ ([]));

	useLayoutEffect(() => {
		handlersRef.current.forEach((handler) => handler());
		handlersRef.current = [];
	});

	/** @param {() => void} handler */
	return (handler) => {
		handlersRef.current.push(handler);
	};
}
