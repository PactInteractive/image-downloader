import { beforeEach, describe, expect, it } from 'bun:test';

type UseImageStatsReturn = {
	data: {
		width: number;
		height: number;
		size: { bytes: number; formatted: string; fromCache: boolean } | null;
		extension: string;
		status: 'idle' | 'loaded' | 'error';
	};
	onLoad: (event: { currentTarget: HTMLImageElement }) => void;
	onError: () => void;
	resetStats: () => void;
};

declare global {
	var React: any;
	var ReactDOM: any;
}

// Set up React globals before importing the hook (required by html.js at module load time)
global.React = require('../../lib/react-18.3.1.min');
global.ReactDOM = require('../../lib/react-dom-18.3.1.min');

// Import the hook after React globals are set
const { useImageStats, getImageExtension } = require('./useImageStats.js') as {
	useImageStats: () => UseImageStatsReturn;
	getImageExtension: (url: string) => string;
};

beforeEach(() => {
	// Set up happy-dom for DOM mocking
	const { Window } = require('happy-dom');
	const window = new Window();
	global.document = window.document;
	global.window = window;

	document.body.innerHTML = '<div id="root"></div>';
});

// Helper to test hooks by rendering a component that captures the result
async function testHook<T>(hookFn: () => T): Promise<T> {
	let result: T | undefined;
	const TestComponent = () => {
		result = hookFn();
		return null;
	};

	const rootElement = document.getElementById('root');
	const root = global.ReactDOM.createRoot(rootElement);

	// Render the component
	root.render(global.React.createElement(TestComponent));

	// React 18's concurrent rendering uses MessageChannel for scheduling
	// Wait for React to finish rendering and effects to run
	await new Promise((resolve) => setTimeout(resolve, 50));

	root.unmount();

	if (!result) {
		throw new Error('Hook result was not captured');
	}

	return result;
}

describe('useImageStats', () => {
	it('should initialize with default data state', async () => {
		const result = (await testHook(useImageStats)) as UseImageStatsReturn;

		expect(result.data.width).toBe(0);
		expect(result.data.height).toBe(0);
		expect(result.data.size).toBe(null);
		expect(result.data.extension).toBe('');
		expect(result.data.status).toBe('idle');
	});

	it('should have callable onLoad handler', async () => {
		const result = (await testHook(useImageStats)) as UseImageStatsReturn;
		expect(typeof result.onLoad).toBe('function');
	});

	it('should have callable onError handler', async () => {
		const result = (await testHook(useImageStats)) as UseImageStatsReturn;
		expect(typeof result.onError).toBe('function');
	});

	it('should have callable resetStats handler', async () => {
		const result = (await testHook(useImageStats)) as UseImageStatsReturn;
		expect(typeof result.resetStats).toBe('function');
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

	it('handles complex file extensions', () => {
		expect(getImageExtension('http://example.com/image.jfif')).toBe('jfif');
		expect(getImageExtension('http://example.com/image.ico')).toBe('ico');
		expect(getImageExtension('http://example.com/image.bmp')).toBe('bmp');
		expect(getImageExtension('http://example.com/image.tiff')).toBe('tiff');
		expect(getImageExtension('http://example.com/image.tif')).toBe('tif');
	});
});
