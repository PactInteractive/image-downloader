import { beforeEach, describe, expect, it } from 'bun:test';
import { mockChrome } from '../test-helpers';

let chrome: ReturnType<typeof mockChrome>;

beforeEach(() => {
	chrome = mockChrome();
	(globalThis as any).chrome = chrome;
});

describe('openImage', () => {
	it('opens a regular image URL as is', async () => {
		const { openImage } = await import('./actions.js');
		await openImage('https://example.com/a.png');

		expect(chrome.tabs.create.mock.calls).toEqual([[{ url: 'https://example.com/a.png', active: false }]]);
	});

	it('opens a data: URL as a blob, because browsers refuse data: URLs in tabs', async () => {
		const { openImage } = await import('./actions.js');
		await openImage(`data:image/webp;base64,${btoa('webp bytes')}`);

		const { url } = chrome.tabs.create.mock.calls[0][0];
		expect(url).toStartWith('blob:');
		const blob = await (await fetch(url)).blob();
		expect([blob.type, await blob.text()]).toEqual(['image/webp', 'webp bytes']);
	});
});
