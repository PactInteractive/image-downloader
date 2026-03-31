import { describe, expect, it } from 'bun:test';
import { deduplicateImages } from './deduplicateImages.js';

describe('deduplicateImages', () => {
	const images: Record<string, { naturalWidth: number; naturalHeight: number }> = {
		'https://example.com/photo-512w.avif': { naturalWidth: 512, naturalHeight: 384 },
		'https://example.com/photo-512w.bmp': { naturalWidth: 512, naturalHeight: 384 },
		'https://example.com/photo-512w.jpeg': { naturalWidth: 512, naturalHeight: 384 },
		'https://example.com/photo-512w.jpg': { naturalWidth: 512, naturalHeight: 384 },
		'https://example.com/photo-512w.png': { naturalWidth: 512, naturalHeight: 384 },
		'https://example.com/photo-512w.webp': { naturalWidth: 512, naturalHeight: 384 },
		'https://example.com/photo-800w.avif': { naturalWidth: 800, naturalHeight: 600 },
		'https://example.com/photo-800w.bmp': { naturalWidth: 800, naturalHeight: 600 },
		'https://example.com/photo-800w.jpeg': { naturalWidth: 800, naturalHeight: 600 },
		'https://example.com/photo-800w.jpg': { naturalWidth: 800, naturalHeight: 600 },
		'https://example.com/photo-800w.png': { naturalWidth: 800, naturalHeight: 600 },
		'https://example.com/photo-800w.webp': { naturalWidth: 800, naturalHeight: 600 },
		'https://example.com/photo-1024w.avif': { naturalWidth: 1024, naturalHeight: 768 },
		'https://example.com/photo-1024w.bmp': { naturalWidth: 1024, naturalHeight: 768 },
		'https://example.com/photo-1024w.jpeg': { naturalWidth: 1024, naturalHeight: 768 },
		'https://example.com/photo-1024w.jpg': { naturalWidth: 1024, naturalHeight: 768 },
		'https://example.com/photo-1024w.png': { naturalWidth: 1024, naturalHeight: 768 },
		'https://example.com/photo-1024w.webp': { naturalWidth: 1024, naturalHeight: 768 },
		[`https://tailwindcss.com/_next/image?url=${encodeURIComponent('/_next/static/media/course-promo.d3d6bc78.jpg&w=256&q=75')}`]:
			{ naturalWidth: 256, naturalHeight: 144 },
		[`https://tailwindcss.com/_next/image?url=${encodeURIComponent('/_next/static/media/course-promo.d3d6bc78.jpg&w=384&q=75')}`]:
			{ naturalWidth: 384, naturalHeight: 216 },
	};

	const imagesCache = {
		querySelector(selector: string): { naturalWidth: number; naturalHeight: number } | null {
			const match = selector.match(/src="([^"]+)"/);
			const url = match?.[1] ?? selector;
			return images[url] ?? null;
		},
	};

	it('should handle empty array', () => {
		expect(deduplicateImages([], imagesCache)).toEqual([]);
	});

	it('should handle single image', () => {
		const urls = ['https://example.com/photo.png'];
		expect(deduplicateImages(urls, imagesCache)).toEqual(['https://example.com/photo.png']);
	});

	it('should deduplicate exact same URLs', () => {
		const urls = ['https://example.com/photo.jpg', 'https://example.com/photo.jpg', 'https://example.com/photo.jpg'];
		expect(deduplicateImages(urls, imagesCache)).toEqual(['https://example.com/photo.jpg']);
	});

	it('should keep images with different base names', () => {
		const urls = ['https://example.com/bird.avif', 'https://example.com/cat.bmp', 'https://example.com/dog.jpeg'];
		expect(deduplicateImages(urls, imagesCache)).toEqual(urls);
	});

	it('should keep different filenames without extension', () => {
		const urls = ['https://example.com/abcd123', 'https://example.com/xyz789'];
		expect(deduplicateImages(urls, imagesCache)).toEqual(urls);
	});

	it('should prefer png over all other formats', () => {
		const urls = [
			'https://example.com/photo.avif',
			'https://example.com/photo.bmp',
			'https://example.com/photo.jpeg',
			'https://example.com/photo.jpg',
			'https://example.com/photo.png',
			'https://example.com/photo.webp',
		];
		expect(deduplicateImages(urls, imagesCache)).toEqual(['https://example.com/photo.png']);
	});

	it('should prefer jpg over webp and avif for same base name', () => {
		const urls = [
			'https://example.com/photo-1024w.avif',
			'https://example.com/photo-1024w.jpg',
			'https://example.com/photo-1024w.webp',
		];
		expect(deduplicateImages(urls, imagesCache)).toEqual(['https://example.com/photo-1024w.jpg']);
	});

	it('should prefer jpg over jpeg, bmp, webp, avif', () => {
		const urls = [
			'https://example.com/photo.avif',
			'https://example.com/photo.bmp',
			'https://example.com/photo.jpeg',
			'https://example.com/photo.jpg',
			'https://example.com/photo.webp',
		];
		expect(deduplicateImages(urls, imagesCache)).toEqual(['https://example.com/photo.jpg']);
	});

	it('should prefer jpeg over bmp, webp, avif', () => {
		const urls = [
			'https://example.com/photo.avif',
			'https://example.com/photo.bmp',
			'https://example.com/photo.jpeg',
			'https://example.com/photo.webp',
		];
		expect(deduplicateImages(urls, imagesCache)).toEqual(['https://example.com/photo.jpeg']);
	});

	it('should prefer bmp over webp and avif', () => {
		const urls = ['https://example.com/photo.avif', 'https://example.com/photo.bmp', 'https://example.com/photo.webp'];
		expect(deduplicateImages(urls, imagesCache)).toEqual(['https://example.com/photo.bmp']);
	});

	it('should prefer webp over avif', () => {
		const urls = ['https://example.com/photo.avif', 'https://example.com/photo.webp'];
		expect(deduplicateImages(urls, imagesCache)).toEqual(['https://example.com/photo.webp']);
	});

	it('should pick the highest resolution when the extensions are the same', () => {
		const urls = [
			'https://example.com/photo-512w.png',
			'https://example.com/photo-800w.png',
			'https://example.com/photo-1024w.png',
		];
		expect(deduplicateImages(urls, imagesCache)).toEqual(['https://example.com/photo-1024w.png']);
	});

	it('should pick the highest resolution when the extensions are different', () => {
		const urls = [
			'https://example.com/photo-512w.png',
			'https://example.com/photo-800w.jpg',
			'https://example.com/photo-1024w.webp',
		];
		expect(deduplicateImages(urls, imagesCache)).toEqual(['https://example.com/photo-1024w.webp']);
	});

	it('should pick the highest resolution png of all resolutions and extensions', () => {
		const urls = Object.keys(images).filter((url) => url.startsWith('https://example.com/photo-'));
		expect(deduplicateImages(urls, imagesCache)).toEqual(['https://example.com/photo-1024w.png']);
	});

	it('should NOT group images with same path but different url query params', () => {
		const urls = [
			`https://www.reddit.com/media?url=${encodeURIComponent('https://i.redd.it/abc123.jpeg')}`,
			`https://www.reddit.com/media?url=${encodeURIComponent('https://i.redd.it/def456.jpeg')}`,
		];
		expect(deduplicateImages(urls, imagesCache)).toEqual(urls);
	});

	it('should recursively parse query params', () => {
		const urls = [
			`https://tailwindcss.com/_next/image?url=${encodeURIComponent('/_next/static/media/course-promo.d3d6bc78.jpg&w=256&q=75')}`,
			`https://tailwindcss.com/_next/image?url=${encodeURIComponent('/_next/static/media/course-promo.d3d6bc78.jpg&w=384&q=75')}`,
		];
		expect(deduplicateImages(urls, imagesCache)).toEqual([urls[1]]);
	});

	it('should deduplicate based on special query params', () => {
		const urls = [
			'https://example.com/photo.jpg',
			`https://example.com/image?url=${encodeURIComponent('https://example.com/photo.jpg')}`,
		];
		expect(deduplicateImages(urls, imagesCache)).toEqual([urls[0]]);
	});

	it('should deduplicate based on same filename across subdomains', () => {
		const urls = [
			'https://preview.redd.it/abc123.jpeg?width=1080&crop=smart&auto=webp&s=7cf1d33c34ab20623b04dfc4f05b9a2320c44cad',
			'https://i.redd.it/abc123.jpeg',
		];
		expect(deduplicateImages(urls, imagesCache)).toEqual([urls[0]]);
	});

	it('should deduplicate based on same filename ending across subdomains', () => {
		const urls = [
			'https://preview.redd.it/favorite-character-that-fits-this-trope-v0-7qulxnmlw8sg1.jpeg?auto=webp&s=353f09a2df4a7e9209907dcdd844f6236682440a',
			'https://i.redd.it/7qulxnmlw8sg1.jpeg',
		];
		expect(deduplicateImages(urls, imagesCache)).toEqual([urls[0]]);
	});
});
