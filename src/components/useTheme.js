// @ts-check
import { effect, useEffect } from '../html.js';
import { theme } from './data.js';

export function useTheme() {
	useEffect(() => {
		effect(applyDarkMode);

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', applyDarkMode);
		return () => mediaQuery.removeEventListener('change', applyDarkMode);
	}, []);
}

function applyDarkMode() {
	const isDark =
		theme.value === 'dark' || (theme.value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
	document.documentElement.classList.toggle('dark', isDark);
}
