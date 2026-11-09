import { afterEach, expect, it, mock, spyOn } from 'bun:test';
import { unzipSync } from 'fflate';

import { buildZip, fetchImageFiles, imageLabel, imageOrigins, zipEntries } from './zip.js';

const realFetch = globalThis.fetch;
let consoleError: ReturnType<typeof spyOn> | undefined;

afterEach(() => {
	globalThis.fetch = realFetch;
	consoleError?.mockRestore();
	consoleError = undefined;
});

it('packs files into a zip archive', async () => {
	const blob = buildZip([{ name: 'one.png', data: new Uint8Array([1, 2, 3]) }]);

	expect(blob.type).toBe('application/zip');
	const entries = unzipSync(new Uint8Array(await blob.arrayBuffer()));
	expect(entries['one.png']).toEqual(new Uint8Array([1, 2, 3]));
});

it('names entries like individual downloads and avoids collisions', () => {
	const files = [
		{ url: 'https://example.com/a.png', mime: 'image/png', data: new Uint8Array([1]) },
		{ url: 'https://cdn.example.net/a.png', mime: 'image/png', data: new Uint8Array([2]) },
		{ url: 'https://example.com/no-extension', mime: 'image/jpeg', data: new Uint8Array([3]) },
		{ url: 'data:image/webp;base64,AAAA', mime: 'image/webp', data: new Uint8Array([4]) },
	];

	expect(zipEntries(files, { new_file_name: '' }).map((entry) => entry.name)).toEqual([
		'a.png',
		'a (1).png',
		'no-extension',
		'image.webp',
	]);

	expect(zipEntries(files, { new_file_name: 'photo' }).map((entry) => entry.name)).toEqual([
		'photo1.png',
		'photo2.png',
		'photo3.jpg',
		'photo4.webp',
	]);
});

it('numbers entries by their selected position when a middle image fails', () => {
	const files = [
		{ url: 'https://example.com/a.png', mime: 'image/png', data: new Uint8Array([1]), index: 0 },
		{ url: 'https://example.com/c.png', mime: 'image/png', data: new Uint8Array([2]), index: 2 },
	];

	expect(zipEntries(files, { new_file_name: 'photo', count: 3 }).map((entry) => entry.name)).toEqual([
		'photo1.png',
		'photo3.png',
	]);
});

it('derives readable extensions from MIME types', () => {
	const files = [
		{ url: 'data:image/svg+xml;base64,AAAA', mime: 'image/svg+xml', data: new Uint8Array([1]) },
		{ url: 'data:image/x-icon;base64,AAAA', mime: 'image/x-icon', data: new Uint8Array([2]) },
		{ url: 'data:image/vnd.microsoft.icon;base64,AAAA', mime: 'image/vnd.microsoft.icon', data: new Uint8Array([3]) },
		{ url: 'data:image/png;base64,AAAA', mime: 'image/png', data: new Uint8Array([4]) },
	];

	expect(zipEntries(files, { new_file_name: '' }).map((entry) => entry.name)).toEqual([
		'image.svg',
		'image.ico',
		'image (1).ico',
		'image.png',
	]);
});

it('falls back to the MIME extension when a URL filename ends with a dot', () => {
	const files = [{ url: 'https://example.com/photo.', mime: 'image/png', data: new Uint8Array([1]) }];

	expect(zipEntries(files, { new_file_name: 'photo' }).map((entry) => entry.name)).toEqual(['photo1.png']);
});

it('renames __proto__ entries so zip creation succeeds', async () => {
	const entries = zipEntries([{ url: 'https://example.com/__proto__', mime: 'image/png', data: new Uint8Array([1]) }], {
		new_file_name: '',
	});

	expect(entries.map((entry) => entry.name)).toEqual(['___proto__']);

	const blob = buildZip(entries);
	const unzipped = unzipSync(new Uint8Array(await blob.arrayBuffer()));
	expect(unzipped['___proto__']).toEqual(new Uint8Array([1]));
});

it('turns image URLs into host permissions without ports or non-http schemes', () => {
	expect(
		imageOrigins([
			'https://example.com:8443/a.png',
			'http://localhost:3000/a.png',
			'https://example.com/b.png',
			'data:image/png;base64,AAAA',
			'blob:https://example.net/id',
		])
	).toEqual(['https://example.com/*', 'http://localhost/*']);
});

it('skips hosts that match patterns would treat as wildcards or reject', () => {
	expect(
		imageOrigins([
			'https://*/a.png',
			'https://*.example.com/a.png',
			'https://exa_mple.com/a.png',
			'https://example.com./a.png',
			'https://sub.example.com/a.png',
		])
	).toEqual(['https://sub.example.com/*']);
});

it('keeps the images that load when some fail', async () => {
	consoleError = spyOn(console, 'error').mockImplementation(() => {});
	globalThis.fetch = mock(async (url: any) => {
		if (String(url).endsWith('missing.png')) return new Response('', { status: 404 });
		if (String(url).endsWith('broken.png')) throw new Error('network error');
		return new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/png' } });
	}) as any;

	const { files, failed } = await fetchImageFiles([
		'https://example.com/a.png',
		'https://example.com/missing.png',
		'https://example.com/broken.png',
		'https://cdn.example.net/b.png',
	]);

	expect(files.map((file) => file.url)).toEqual(['https://example.com/a.png', 'https://cdn.example.net/b.png']);
	expect(files.map((file) => file.index)).toEqual([0, 3]);
	expect(failed).toEqual(['https://example.com/missing.png', 'https://example.com/broken.png']);
});

it('labels failed images with a filename or host', () => {
	expect(imageLabel('https://example.com/path/photo.jpg?size=large')).toBe('photo.jpg');
	expect(imageLabel('https://example.com/')).toBe('example.com');
	expect(imageLabel('data:image/png;base64,AAAA')).toBe('Embedded image');
	expect(imageLabel('not a url')).toBe('not a url');
});

it('fails only when no image can be fetched', async () => {
	consoleError = spyOn(console, 'error').mockImplementation(() => {});
	globalThis.fetch = mock(async () => new Response('', { status: 404 })) as any;

	await expect(fetchImageFiles(['https://example.com/missing.png'])).rejects.toThrow(
		'Could not download any of the selected images.'
	);
});

it('makes entry names safe to extract on Windows', () => {
	const files = [
		{ url: 'https://example.com/photo%3F.png', mime: 'image/png', data: new Uint8Array([1]) },
		{ url: 'https://example.com/name%3A.png', mime: 'image/png', data: new Uint8Array([2]) },
		{ url: 'https://example.com/CON.png', mime: 'image/png', data: new Uint8Array([3]) },
		{ url: 'https://example.com/CON%20.png', mime: 'image/png', data: new Uint8Array([4]) },
		{ url: 'https://example.com/NUL%20%20.png', mime: 'image/png', data: new Uint8Array([5]) },
		{ url: 'https://example.com/..%2Ftraversal.png', mime: 'image/png', data: new Uint8Array([6]) },
		{ url: 'https://example.com/trailing.%20', mime: 'image/png', data: new Uint8Array([7]) },
	];

	expect(zipEntries(files, { new_file_name: '' }).map((entry) => entry.name)).toEqual([
		'photo.png',
		'name.png',
		'_CON.png',
		'_CON .png',
		'_NUL  .png',
		'traversal.png',
		'trailing',
	]);
});
