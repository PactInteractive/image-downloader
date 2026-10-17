import { expect, it } from 'bun:test';
import { readBlobUrls } from './readBlobUrls.js';

it('turns readable blob URLs into data URLs and keeps unreadable ones', async () => {
	const readable = URL.createObjectURL(new Blob(['webp bytes'], { type: 'image/webp' }));
	const unreadable = 'blob:https://example.com/0f8c3a52-5d1e-4c0b-9a7e-2b6f1d9e4c11';

	expect(await readBlobUrls([readable, unreadable])).toEqual([
		`data:image/webp;base64,${btoa('webp bytes')}`,
		unreadable,
	]);
});
