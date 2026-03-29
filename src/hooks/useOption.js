import { useState } from '../html.js';

export function useOption(key) {
	const [value, setValue] = useState(localStorage[key]);

	function setOption(newValue) {
		localStorage[key] = newValue;
		setValue(newValue);
	}

	return [value, setOption];
}
