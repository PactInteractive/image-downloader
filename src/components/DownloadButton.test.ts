import { afterEach, beforeEach, expect, it, mock } from 'bun:test';
import { h, render } from 'preact';
import { mockChrome, mockDOM } from '../test-helpers';

mockDOM();

import { DownloadButton } from './DownloadButton.js';

let root: HTMLDivElement;

beforeEach(() => {
	(globalThis as any).chrome = mockChrome();
	root = document.createElement('div');
	document.body.append(root);
});

afterEach(() => {
	render(null, root);
	root.remove();
});

function renderButton(overrides: Record<string, any> = {}) {
	const props = {
		loading: false,
		selectedCount: 1,
		selectedImages: ['https://example.com/a.png'],
		mode: 'individual' as 'individual' | 'zip',
		onClick: mock(),
		onSelectMode: mock(),
		...overrides,
	};
	render(h(DownloadButton, props), root);
	return props;
}

function button(text: string) {
	return [...root.querySelectorAll('button')].find((element) => element.textContent?.trim().includes(text));
}

it('does not start another download when the selected mode is clicked again', () => {
	const props = renderButton({ mode: 'zip' });
	button('Download as .zip')?.click();

	expect(props.onSelectMode).not.toHaveBeenCalled();
});

it('selects a different download mode', () => {
	const props = renderButton({ mode: 'individual' });
	button('Download as .zip')?.click();

	expect(props.onSelectMode).toHaveBeenCalledWith('zip');
});

it('announces when the zip download has started', () => {
	renderButton({ mode: 'zip', loading: true, preparing: false });

	expect(root.textContent).toContain('Downloading .zip');
});

it('announces that the zip is still being prepared', () => {
	renderButton({ mode: 'zip', loading: true, preparing: true });

	expect(root.textContent).toContain('Preparing download');
});
