import { describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { h, render } from '../../lib/preact.module.js';

import { formatFileSize, getImageExtension, getImageResourceSize, useImageStats } from './useImageStats.js';

// Set up DOM globals
const window = new Window();
(globalThis as any).document = window.document;
(globalThis as any).window = window;
if (!window.SyntaxError) window.SyntaxError = SyntaxError;

async function testHook<T>(hookFn: () => T): Promise<T> {
	let result: T | undefined;
	const TestComponent = () => {
		result = hookFn();
		return null;
	};

	const rootElement = document.createElement('div');
	document.body.appendChild(rootElement);
	render(h(TestComponent, null), rootElement);

	await new Promise((resolve) => setTimeout(resolve, 50));

	if (!result) {
		throw new Error('Hook result was not captured');
	}

	return result;
}

describe('useImageStats', () => {
	it('should initialize with default data state', async () => {
		const result = await testHook(() => useImageStats('http://example.com/test.jpg'));

		expect(result.data.value.width).toBe(0);
		expect(result.data.value.height).toBe(0);
		expect(result.data.value.size).toBe(null);
		expect(result.data.value.extension).toBe('');
		expect(result.data.value.status).toBe('idle');
	});

	it('should have callable onLoad handler', async () => {
		const result = await testHook(() => useImageStats('http://example.com/test.jpg'));
		expect(typeof result.onLoad).toBe('function');
	});

	it('should have callable onError handler', async () => {
		const result = await testHook(() => useImageStats('http://example.com/test.jpg'));
		expect(typeof result.onError).toBe('function');
	});

	it('should have callable reset handler', async () => {
		const result = await testHook(() => useImageStats('http://example.com/test.jpg'));
		expect(typeof result.reset).toBe('function');
	});
});

describe('getImageExtension', () => {
	it('returns empty string for null or undefined', () => {
		expect(getImageExtension('')).toBe('');
		expect(getImageExtension(null as unknown as string)).toBe('');
		expect(getImageExtension(undefined as unknown as string)).toBe('');
	});

	it('extracts extension from simple URLs', () => {
		expect(getImageExtension('http://example.com/image.jpg')).toBe('jpg');
		expect(getImageExtension('http://example.com/image.jpeg')).toBe('jpeg');
		expect(getImageExtension('http://example.com/image.png')).toBe('png');
		expect(getImageExtension('http://example.com/image.gif')).toBe('gif');
		expect(getImageExtension('http://example.com/image.webp')).toBe('webp');
		expect(getImageExtension('http://example.com/image.svg')).toBe('svg');
		expect(getImageExtension('http://example.com/image.avif')).toBe('avif');
	});

	it('extracts extension from URLs with query parameters', () => {
		expect(getImageExtension('http://example.com/image.jpg?v=123')).toBe('jpg');
		expect(getImageExtension('http://example.com/image.png?w=800&h=600')).toBe('png');
		expect(getImageExtension('http://example.com/image.webp?size=large&format=webp')).toBe('webp');
	});

	it('extracts extension from URLs with hash fragments', () => {
		expect(getImageExtension('http://example.com/image.jpg#thumbnail')).toBe('jpg');
		expect(getImageExtension('http://example.com/image.png#section1')).toBe('png');
	});

	it('extracts extension from URLs with both query and hash', () => {
		expect(getImageExtension('http://example.com/image.jpg?v=1#thumb')).toBe('jpg');
	});

	it('handles data URIs', () => {
		expect(getImageExtension('data:image/png;base64,iVBORw0KGgo=')).toBe('png');
		expect(getImageExtension('data:image/jpeg;base64,/9j/4AAQ...')).toBe('jpeg');
		expect(getImageExtension('data:image/webp;base64,UklGR...')).toBe('webp');
		expect(getImageExtension('data:image/svg+xml;utf8,<svg>...</svg>')).toBe('svg');
		expect(getImageExtension('data:image/gif;base64,R0lGODlh...')).toBe('gif');
	});

	it('returns empty string for data URIs without MIME type', () => {
		expect(getImageExtension('data:text/plain;base64,SGVsbG8=')).toBe('');
	});

	it('handles URLs without extensions', () => {
		expect(getImageExtension('http://example.com/image')).toBe('');
		expect(getImageExtension('http://example.com/path/')).toBe('');
		expect(getImageExtension('http://example.com')).toBe('');
	});

	it('handles relative URLs', () => {
		expect(getImageExtension('/images/photo.jpg')).toBe('jpg');
		expect(getImageExtension('./assets/icon.png')).toBe('png');
		expect(getImageExtension('../img/logo.svg')).toBe('svg');
	});

	it('converts extensions to lowercase', () => {
		expect(getImageExtension('http://example.com/image.JPG')).toBe('jpg');
		expect(getImageExtension('http://example.com/image.PNG')).toBe('png');
		expect(getImageExtension('http://example.com/image.WEBP')).toBe('webp');
		expect(getImageExtension('http://example.com/image.AvIf')).toBe('avif');
	});

	it('handles protocol-relative URLs', () => {
		expect(getImageExtension('//cdn.example.com/image.jpg')).toBe('jpg');
		expect(getImageExtension('//cdn.example.com/photo.png')).toBe('png');
	});

	it('handles blob URLs', () => {
		expect(getImageExtension('blob:https://example.com/abc123-def456-789')).toBe('');
	});

	it('extracts extension from query parameter format indicators', () => {
		expect(getImageExtension('http://cdn.example.com/images/abc123?format=jpg')).toBe('jpg');
		expect(getImageExtension('http://cdn.example.com/images/abc123?type=webp')).toBe('webp');
		expect(getImageExtension('http://cdn.example.com/images/abc123?output=png')).toBe('png');
	});

	it('prefers pathname extension over query parameter', () => {
		expect(getImageExtension('http://example.com/image.jpg?format=png')).toBe('jpg');
	});

	it('handles complex file extensions', () => {
		expect(getImageExtension('http://example.com/image.jfif')).toBe('jfif');
		expect(getImageExtension('http://example.com/image.ico')).toBe('ico');
		expect(getImageExtension('http://example.com/image.bmp')).toBe('bmp');
		expect(getImageExtension('http://example.com/image.tiff')).toBe('tiff');
		expect(getImageExtension('http://example.com/image.tif')).toBe('tif');
	});

	it('does not match underscores in pathname extension', () => {
		expect(getImageExtension('http://example.com/image.png_bak')).toBe('');
		expect(getImageExtension('http://example.com/photo.jpg_old')).toBe('');
	});

	it('does not match underscores in query parameter extension', () => {
		expect(getImageExtension('http://example.com/image?format=png_bak')).toBe('');
		expect(getImageExtension('http://example.com/image?output=jpg_old')).toBe('');
	});
});

describe('getImageResourceSize', () => {
	it('returns null for empty src', () => {
		expect(getImageResourceSize({ src: '' } as HTMLImageElement)).toBe(null);
	});

	it('estimates size from base64 data URI (PNG)', () => {
		const url = `data:image/png;base64,${btoa('PNG image data')}`;
		const result = getImageResourceSize({ src: url } as HTMLImageElement);
		expect(result).toEqual({
			bytes: 14,
			formatted: '0KB',
			fromCache: false,
		});
	});

	it('estimates size from base64 data URI (SVG)', () => {
		const svgContent = '<svg></svg>';
		const url = `data:image/svg+xml;base64,${btoa(svgContent)}`;
		const result = getImageResourceSize({ src: url } as HTMLImageElement);
		expect(result).toEqual({
			bytes: 11,
			formatted: '0KB',
			fromCache: false,
		});
	});

	it('estimates size from base64 data URI (JPEG)', () => {
		const url = `data:image/jpeg;base64,${btoa('fake jpeg bytes')}`;
		const result = getImageResourceSize({ src: url } as HTMLImageElement);
		expect(result).toEqual({
			bytes: 15,
			formatted: '0KB',
			fromCache: false,
		});
	});

	it('estimates size from base64 data URI (GIF)', () => {
		const url = `data:image/gif;base64,${btoa('GIF89a')}`;
		const result = getImageResourceSize({ src: url } as HTMLImageElement);
		expect(result).toEqual({
			bytes: 6,
			formatted: '0KB',
			fromCache: false,
		});
	});

	it('estimates size from base64 data URI (WebP)', () => {
		const url = `data:image/webp;base64,${btoa('webp data here')}`;
		const result = getImageResourceSize({ src: url } as HTMLImageElement);
		expect(result).toEqual({
			bytes: 14,
			formatted: '0KB',
			fromCache: false,
		});
	});

	it('estimates size from text-encoded data URI (SVG)', () => {
		const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
		const url = `data:image/svg+xml;utf8,${svgContent}`;
		const result = getImageResourceSize({ src: url } as HTMLImageElement);
		expect(result).toEqual({
			bytes: svgContent.length,
			formatted: '0KB',
			fromCache: false,
		});
	});

	it('estimates size from URL-encoded data URI', () => {
		const content = 'hello%20world';
		const url = `data:image/svg+xml,${content}`;
		const result = getImageResourceSize({ src: url } as HTMLImageElement);
		expect(result).toEqual({
			bytes: 11,
			formatted: '0KB',
			fromCache: false,
		});
	});

	it('returns null for invalid base64 data URI', () => {
		const url = 'data:image/png;base64,!!!invalid!!!';
		const result = getImageResourceSize({ src: url } as HTMLImageElement);
		expect(result).toBe(null);
	});

	it('formats larger base64 data URIs correctly', () => {
		const largeContent = 'x'.repeat(2048);
		const url = `data:image/png;base64,${btoa(largeContent)}`;
		const result = getImageResourceSize({ src: url } as HTMLImageElement);
		expect(result?.bytes).toBe(2048);
		expect(result?.formatted).toBe('2KB');
		expect(result?.fromCache).toBe(false);
	});
});

describe('formatFileSize', () => {
	it('returns empty string for zero or null', () => {
		expect(formatFileSize(0)).toBe('');
		expect(formatFileSize(null as unknown as number)).toBe('');
		expect(formatFileSize(undefined as unknown as number)).toBe('');
		expect(formatFileSize(NaN)).toBe('');
	});

	it('formats bytes under 1024 as fractional KB', () => {
		expect(formatFileSize(1)).toBe('0KB');
		expect(formatFileSize(512)).toBe('0.5KB');
		expect(formatFileSize(1023)).toBe('1KB');
	});

	it('formats kilobytes', () => {
		expect(formatFileSize(1024)).toBe('1KB');
		expect(formatFileSize(1536)).toBe('1.5KB');
		expect(formatFileSize(10240)).toBe('10KB');
	});

	it('formats megabytes', () => {
		expect(formatFileSize(1048576)).toBe('1MB');
		expect(formatFileSize(1572864)).toBe('1.5MB');
	});

	it('formats gigabytes', () => {
		expect(formatFileSize(1073741824)).toBe('1GB');
	});
});
