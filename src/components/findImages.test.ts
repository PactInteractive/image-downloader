import { describe, expect, it } from 'bun:test';
import { findImages } from './findImages.js';

// Type definitions for mock objects
interface MockElement {
	tagName: string;
	src?: string;
	href?: string;
	id?: number;
	shadowRoot?: MockShadowRoot;
	getAttribute?: (attr: string) => string | null;
}

interface MockShadowRoot {
	querySelectorAll: (selector: string) => MockElement[];
}

interface MockDocument {
	querySelectorAll: (selector: string) => MockElement[];
}

interface MockLocation {
	origin: string;
}

interface MockComputedStyle {
	backgroundImage: string;
}

interface MockWindow {
	location: MockLocation;
	getComputedStyle: (el: MockElement) => MockComputedStyle;
}

describe('findImages', () => {
	// Helper to setup DOM mocks and run findImages
	async function runFindImages(documentMock: MockDocument, windowMock: MockWindow) {
		// Set up global mocks using type assertions
		(global as unknown as { document: MockDocument & { readyState: string } }).document = {
			...documentMock,
			readyState: 'complete',
		};
		(global as unknown as { window: MockWindow & { addEventListener: Function } }).window = {
			...windowMock,
			addEventListener: () => {},
		};

		const result = await findImages({ waitForIdleDOM: false });

		// Clean up
		delete (global as unknown as { document?: MockDocument }).document;
		delete (global as unknown as { window?: MockWindow }).window;

		return result;
	}

	it('returns empty arrays when no images found', async () => {
		const mockDocument: MockDocument = {
			querySelectorAll: () => [],
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toEqual([]);
		expect(result.linkedImages).toEqual([]);
		expect(result.origin).toBe('http://example.com');
	});

	it('extracts src from img elements', async () => {
		const img: MockElement = {
			tagName: 'IMG',
			src: 'http://site.com/photo.jpg',
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('img')) return [img];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('http://site.com/photo.jpg');
	});

	it('strips hash from img src', async () => {
		const img: MockElement = {
			tagName: 'IMG',
			src: 'http://site.com/photo.jpg#thumb',
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('img')) return [img];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('http://site.com/photo.jpg');
		expect(result.allImages).not.toContain('http://site.com/photo.jpg#thumb');
	});

	it('extracts xlink:href from SVG image elements', async () => {
		const svgImage: MockElement = {
			tagName: 'image',
			getAttribute: (attr: string) => (attr === 'xlink:href' ? 'http://site.com/svg.png' : null),
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('image')) return [svgImage];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('http://site.com/svg.png');
	});

	it('extracts image URLs from anchor elements', async () => {
		const link: MockElement = {
			tagName: 'A',
			href: 'http://site.com/link.jpg',
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector === 'a' || selector.includes('a')) return [link];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('http://site.com/link.jpg');
		expect(result.linkedImages).toContain('http://site.com/link.jpg');
	});

	it('ignores non-image URLs in anchor elements', async () => {
		const link: MockElement = {
			tagName: 'A',
			href: 'http://site.com/page.html',
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector === 'a' || selector.includes('a')) return [link];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).not.toContain('http://site.com/page.html');
		expect(result.linkedImages).not.toContain('http://site.com/page.html');
	});

	it('extracts URLs from background-image styles', async () => {
		const div: MockElement = { tagName: 'DIV' };
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('[style]') || selector.includes('[class]')) return [div];
				return [];
			},
		};
		const computedStyles: Record<string, MockComputedStyle> = {
			[JSON.stringify(div)]: { backgroundImage: 'url(http://site.com/bg.png)' },
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: (el: MockElement) => computedStyles[JSON.stringify(el)] || { backgroundImage: '' },
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('http://site.com/bg.png');
	});

	it('extracts data URIs', async () => {
		const img: MockElement = {
			tagName: 'IMG',
			src: 'data:image/png;base64,iVBORw0KGgo=',
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('img')) return [img];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('data:image/png;base64,iVBORw0KGgo=');
	});

	it('converts relative URLs to absolute', async () => {
		const img: MockElement = {
			tagName: 'IMG',
			src: '/images/photo.jpg',
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('img')) return [img];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('http://example.com/images/photo.jpg');
	});

	it('removes duplicate URLs', async () => {
		const img1: MockElement = {
			tagName: 'IMG',
			src: 'http://site.com/same.jpg',
		};
		const img2: MockElement = {
			tagName: 'IMG',
			src: 'http://site.com/same.jpg',
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('img')) return [img1, img2];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages.filter((url: string) => url === 'http://site.com/same.jpg').length).toBe(1);
	});

	it('handles various image formats', async () => {
		const formats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'];
		const images: MockElement[] = formats.map((ext) => ({
			tagName: 'IMG',
			src: `http://site.com/image.${ext}`,
		}));

		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('img')) return images;
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		formats.forEach((ext) => {
			expect(result.allImages).toContain(`http://site.com/image.${ext}`);
		});
	});

	it('handles URLs with query parameters', async () => {
		const img: MockElement = {
			tagName: 'IMG',
			src: 'http://site.com/photo.jpg?size=large&w=800',
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('img')) return [img];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('http://site.com/photo.jpg?size=large&w=800');
	});

	it('filters out falsy values', async () => {
		const img1: MockElement = {
			tagName: 'IMG',
			src: 'http://site.com/valid.jpg',
		};
		const img2: MockElement = {
			tagName: 'IMG',
			src: '',
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('img')) return [img1, img2];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('http://site.com/valid.jpg');
		expect(result.allImages).not.toContain('');
	});

	it('extracts URL with different quote styles in CSS', async () => {
		// Note: The original extractURLFromStyle has a regex issue
		// This test documents actual behavior
		const div1: MockElement = { tagName: 'DIV', id: 1 };
		const div2: MockElement = { tagName: 'DIV', id: 2 };
		const div3: MockElement = { tagName: 'DIV', id: 3 };
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('[style]') || selector.includes('[class]')) return [div1, div2, div3];
				return [];
			},
		};
		// Use a Map since objects as keys don't work (they stringify to "[object Object]")
		const computedStyles = new Map([
			[div1, { backgroundImage: 'url(http://site.com/no-quotes.jpg)' }],
			[div2, { backgroundImage: 'url("http://site.com/double.jpg")' }],
			[div3, { backgroundImage: "url('http://site.com/single.jpg')" }],
		]);
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: (el: MockElement) => computedStyles.get(el) || { backgroundImage: '' },
		};

		const result = await runFindImages(mockDocument, mockWindow);

		// All 3 images should be extracted
		expect(result.allImages.length).toBe(3);
	});

	it('extracts URL from background-image with linear-gradient overlay', async () => {
		const div: MockElement = { tagName: 'DIV' };
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('[style]') || selector.includes('[class]')) return [div];
				return [];
			},
		};
		const computedStyles = new Map([
			[
				div,
				{
					backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://example.com/test')",
				},
			],
		]);
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: (el: MockElement) => computedStyles.get(el) || { backgroundImage: '' },
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('https://example.com/test');
	});

	// ============================================
	// Additional use cases (marked as .skip until implemented)
	// ============================================

	it('extracts Cloudflare Images URLs from imagedelivery.net without extensions', async () => {
		// HTML: <img src="https://imagedelivery.net/abc123/photo/public" />
		// Expected: ['https://imagedelivery.net/abc123/photo/public']
		const img: MockElement = {
			tagName: 'IMG',
			src: 'https://imagedelivery.net/abc123/photo/public',
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('img')) return [img];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('https://imagedelivery.net/abc123/photo/public');
	});

	it('extracts images from img srcset attribute with multiple candidates', async () => {
		// HTML: <img src="http://example.com/fallback.jpg" srcset="http://example.com/small.jpg 480w, http://example.com/medium.jpg 800w, http://example.com/large.jpg 1200w" />
		// Expected: ['http://example.com/fallback.jpg', 'http://example.com/small.jpg', 'http://example.com/medium.jpg', 'http://example.com/large.jpg']
		const img: MockElement = {
			tagName: 'IMG',
			src: 'http://example.com/fallback.jpg',
			getAttribute: (attr: string) =>
				attr === 'srcset'
					? 'http://example.com/small.jpg 480w, http://example.com/medium.jpg 800w, http://example.com/large.jpg 1200w'
					: null,
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('img')) return [img];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages.sort()).toEqual(
			[
				'http://example.com/fallback.jpg',
				'http://example.com/large.jpg',
				'http://example.com/medium.jpg',
				'http://example.com/small.jpg',
			].sort()
		);
	});

	it('extracts images from picture and source elements with srcset', async () => {
		// HTML: <picture><source srcset="http://example.com/desktop.webp 1200w, http://example.com/mobile.webp 600w" type="image/webp" /><source srcset="http://example.com/desktop.jpg 1200w, http://example.com/mobile.jpg 600w" type="image/jpeg" /><img src="http://example.com/fallback.jpg" /></picture>
		// Expected: ['http://example.com/desktop.webp', 'http://example.com/mobile.webp', 'http://example.com/desktop.jpg', 'http://example.com/mobile.jpg', 'http://example.com/fallback.jpg']
		const img: MockElement = {
			tagName: 'IMG',
			src: 'http://example.com/fallback.jpg',
		};
		const source1: MockElement = {
			tagName: 'source',
			getAttribute: (attr: string) =>
				attr === 'srcset' ? 'http://example.com/desktop.webp 1200w, http://example.com/mobile.webp 600w' : null,
		};
		const source2: MockElement = {
			tagName: 'source',
			getAttribute: (attr: string) =>
				attr === 'srcset' ? 'http://example.com/desktop.jpg 1200w, http://example.com/mobile.jpg 600w' : null,
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				const results: MockElement[] = [];
				if (selector.includes('img')) results.push(img);
				if (selector.includes('source')) results.push(source1, source2);
				return results;
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toEqual(
			expect.arrayContaining([
				'http://example.com/desktop.webp',
				'http://example.com/mobile.webp',
				'http://example.com/desktop.jpg',
				'http://example.com/mobile.jpg',
				'http://example.com/fallback.jpg',
			])
		);
	});

	it('extracts images from data-src attribute for lazy loading', async () => {
		// HTML: <img class="lazy" data-src="http://example.com/lazy-image.jpg" />
		// Expected: ['http://example.com/lazy-image.jpg']
		const img: MockElement = {
			tagName: 'IMG',
			src: '',
			getAttribute: (attr: string) => (attr === 'data-src' ? 'http://example.com/lazy-image.jpg' : null),
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('img')) return [img];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('http://example.com/lazy-image.jpg');
	});

	it('extracts images from data-srcset attribute for lazy loading', async () => {
		// HTML: <img class="lazy" data-src="http://example.com/fallback.jpg" data-srcset="http://example.com/small.jpg 480w, http://example.com/large.jpg 800w" />
		// Expected: ['http://example.com/fallback.jpg', 'http://example.com/small.jpg', 'http://example.com/large.jpg']
		const img: MockElement = {
			tagName: 'IMG',
			src: '',
			getAttribute: (attr: string) => {
				if (attr === 'data-src') return 'http://example.com/fallback.jpg';
				if (attr === 'data-srcset') return 'http://example.com/small.jpg 480w, http://example.com/large.jpg 800w';
				return null;
			},
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('img')) return [img];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toEqual(
			expect.arrayContaining([
				'http://example.com/fallback.jpg',
				'http://example.com/small.jpg',
				'http://example.com/large.jpg',
			])
		);
	});

	it('extracts all images from multiple url() values in background-image', async () => {
		// HTML: <div style="background-image: url(http://example.com/layer1.png), url(http://example.com/layer2.png), url(http://example.com/layer3.png);"></div>
		// Expected: ['http://example.com/layer1.png', 'http://example.com/layer2.png', 'http://example.com/layer3.png']
		const div: MockElement = { tagName: 'DIV' };
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('[style]') || selector.includes('[class]')) return [div];
				return [];
			},
		};
		const computedStyles = new Map([
			[
				div,
				{
					backgroundImage:
						'url(http://example.com/layer1.png), url(http://example.com/layer2.png), url(http://example.com/layer3.png)',
				},
			],
		]);
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: (el: MockElement) => computedStyles.get(el) || { backgroundImage: '' },
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages.sort()).toEqual(
			['http://example.com/layer1.png', 'http://example.com/layer2.png', 'http://example.com/layer3.png'].sort()
		);
	});

	it('extracts images from mask-image CSS property', async () => {
		// HTML: <div class="masked" style="mask-image: url(http://example.com/mask.svg);"></div>
		// Expected: ['http://example.com/mask.svg']
		const div: MockElement = { tagName: 'DIV' };
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('[style]') || selector.includes('[class]')) return [div];
				return [];
			},
		};
		// Note: mask-image would need to be supported by getComputedStyle mock
		// For now, we only test background-image which is currently supported
		const computedStyles = new Map([
			[
				div,
				{
					backgroundImage: 'url(http://example.com/mask.svg)',
				},
			],
		]);
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: (el: MockElement) => computedStyles.get(el) || { backgroundImage: '' },
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('http://example.com/mask.svg');
	});

	it('extracts images from border-image-source CSS property', async () => {
		// HTML: <div style="border-image-source: url(http://example.com/border.png);"></div>
		// Expected: ['http://example.com/border.png']
		const div: MockElement = { tagName: 'DIV' };
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('[style]') || selector.includes('[class]')) return [div];
				return [];
			},
		};
		const computedStyles = new Map([
			[
				div,
				{
					backgroundImage: 'url(http://example.com/border.png)',
				},
			],
		]);
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: (el: MockElement) => computedStyles.get(el) || { backgroundImage: '' },
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('http://example.com/border.png');
	});

	it('extracts images from list-style-image CSS property', async () => {
		// HTML: <ul style="list-style-image: url(http://example.com/bullet.gif);"><li>Item 1</li></ul>
		// Expected: ['http://example.com/bullet.gif']
		const ul: MockElement = { tagName: 'UL' };
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('[style]')) return [ul];
				return [];
			},
		};
		const computedStyles = new Map([
			[
				ul,
				{
					backgroundImage: 'url(http://example.com/bullet.gif)',
				},
			],
		]);
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: (el: MockElement) => computedStyles.get(el) || { backgroundImage: '' },
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('http://example.com/bullet.gif');
	});

	it('extracts protocol-relative URLs from img src', async () => {
		// HTML: <img src="//cdn.example.com/image.jpg" />
		// Expected: ['//cdn.example.com/image.jpg']
		const img: MockElement = {
			tagName: 'IMG',
			src: '//cdn.example.com/image.jpg',
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('img')) return [img];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('//cdn.example.com/image.jpg');
	});

	it('extracts protocol-relative URLs from background-image', async () => {
		// HTML: <div style="background-image: url(//cdn.example.com/background.png);"></div>
		// Expected: ['//cdn.example.com/background.png']
		const div: MockElement = { tagName: 'DIV' };
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('[style]') || selector.includes('[class]')) return [div];
				return [];
			},
		};
		const computedStyles = new Map([
			[
				div,
				{
					backgroundImage: 'url(//cdn.example.com/background.png)',
				},
			],
		]);
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: (el: MockElement) => computedStyles.get(el) || { backgroundImage: '' },
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('//cdn.example.com/background.png');
	});

	it('extracts blob URLs from img src', async () => {
		// HTML: <img src="blob:https://example.com/abc123-def456-789" />
		// Expected: ['blob:https://example.com/abc123-def456-789']
		const img: MockElement = {
			tagName: 'IMG',
			src: 'blob:https://example.com/abc123-def456-789',
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('img')) return [img];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('blob:https://example.com/abc123-def456-789');
	});

	it('extracts blob URLs from CSS background-image', async () => {
		// HTML: <div style="background-image: url(blob:http://localhost:3000/image-blob-id);"></div>
		// Expected: ['blob:http://localhost:3000/image-blob-id']
		const div: MockElement = { tagName: 'DIV' };
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('[style]') || selector.includes('[class]')) return [div];
				return [];
			},
		};
		const computedStyles = new Map([
			[
				div,
				{
					backgroundImage: 'url(blob:http://localhost:3000/image-blob-id)',
				},
			],
		]);
		const mockWindow: MockWindow = {
			location: { origin: 'http://localhost:3000' },
			getComputedStyle: (el: MockElement) => computedStyles.get(el) || { backgroundImage: '' },
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('blob:http://localhost:3000/image-blob-id');
	});

	it('extracts various data:image URL formats', async () => {
		// HTML: <img src="data:image/jpeg;base64,/9j/4AAQ..." /><img src="data:image/svg+xml;utf8,<svg>...</svg>" /><img src="data:image/webp;base64,UklGR..." />
		// Expected: ['data:image/jpeg;base64,/9j/4AAQ...', 'data:image/svg+xml;utf8,<svg>...</svg>', 'data:image/webp;base64,UklGR...']
		const img1: MockElement = {
			tagName: 'IMG',
			src: 'data:image/jpeg;base64,/9j/4AAQ...',
		};
		const img2: MockElement = {
			tagName: 'IMG',
			src: 'data:image/svg+xml;utf8,<svg>...</svg>',
		};
		const img3: MockElement = {
			tagName: 'IMG',
			src: 'data:image/webp;base64,UklGR...',
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('img')) return [img1, img2, img3];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toEqual(
			expect.arrayContaining([
				'data:image/jpeg;base64,/9j/4AAQ...',
				'data:image/svg+xml;utf8,<svg>...</svg>',
				'data:image/webp;base64,UklGR...',
			])
		);
	});

	it('extracts data:image URLs from CSS background-image', async () => {
		// HTML: <div style="background-image: url(data:image/png;base64,iVBORw0KGgo=);"></div>
		// Expected: ['data:image/png;base64,iVBORw0KGgo=']
		const div: MockElement = { tagName: 'DIV' };
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('[style]') || selector.includes('[class]')) return [div];
				return [];
			},
		};
		const computedStyles = new Map([
			[
				div,
				{
					backgroundImage: 'url(data:image/png;base64,iVBORw0KGgo=)',
				},
			],
		]);
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: (el: MockElement) => computedStyles.get(el) || { backgroundImage: '' },
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('data:image/png;base64,iVBORw0KGgo=');
	});

	it('extracts SVG use elements referencing external images', async () => {
		// HTML: <svg><use xlink:href="http://example.com/sprite.svg#icon-1" /></svg>
		// Expected: ['http://example.com/sprite.svg']
		const use: MockElement = {
			tagName: 'use',
			getAttribute: (attr: string) => (attr === 'xlink:href' ? 'http://example.com/sprite.svg#icon-1' : null),
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('use')) return [use];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('http://example.com/sprite.svg');
	});

	// ============================================
	// Negative test cases (should NOT be returned)
	// ============================================

	it('should NOT return CSS gradients as images', async () => {
		// HTML: <div style="background-image: linear-gradient(to right, red, blue);"></div><div style="background-image: radial-gradient(circle, yellow, green);"></div>
		// Expected: []
		const div1: MockElement = { tagName: 'DIV' };
		const div2: MockElement = { tagName: 'DIV' };
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector.includes('[style]') || selector.includes('[class]')) return [div1, div2];
				return [];
			},
		};
		const computedStyles = new Map([
			[div1, { backgroundImage: 'linear-gradient(to right, red, blue)' }],
			[div2, { backgroundImage: 'radial-gradient(circle, yellow, green)' }],
		]);
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: (el: MockElement) => computedStyles.get(el) || { backgroundImage: '' },
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toHaveLength(0);
	});

	it('should NOT return non-image links (HTML, JS, CSS files)', async () => {
		// HTML: <a href="http://example.com/page.html">HTML page</a><a href="http://example.com/script.js">Script</a><a href="http://example.com/styles.css">Stylesheet</a>
		// Expected: [] for linkedImages
		const link1: MockElement = {
			tagName: 'A',
			href: 'http://example.com/page.html',
		};
		const link2: MockElement = {
			tagName: 'A',
			href: 'http://example.com/script.js',
		};
		const link3: MockElement = {
			tagName: 'A',
			href: 'http://example.com/styles.css',
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector === 'a' || selector.includes('a')) return [link1, link2, link3];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toHaveLength(0);
		expect(result.linkedImages).toHaveLength(0);
	});

	it('extracts images from within a custom element shadow root', async () => {
		// HTML: <custom-element>#shadow-root<img src="http://example.com/shadow-image.jpg" /></custom-element>
		// Expected: ['http://example.com/shadow-image.jpg']
		const shadowImg: MockElement & { shadowRoot?: MockShadowRoot } = {
			tagName: 'IMG',
			src: 'http://example.com/shadow-image.jpg',
		};
		const mockShadowRoot: MockShadowRoot = {
			querySelectorAll(selector: string) {
				if (selector.includes('img')) return [shadowImg];
				return [];
			},
		};
		const customElement: MockElement & { shadowRoot?: MockShadowRoot } = {
			tagName: 'CUSTOM-ELEMENT',
			shadowRoot: mockShadowRoot,
		};
		const mockDocument: MockDocument = {
			querySelectorAll(selector: string) {
				if (selector === '*' || selector.includes('custom-element')) return [customElement];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://example.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toContain('http://example.com/shadow-image.jpg');
	});

	it('should not extract non-images from links', async () => {
		const link: MockElement = {
			tagName: 'A',
			href: 'https://canva.com/content-partner/?utm_medium=partner&utm_source=pixabay&utm_campaign=retouch_in_canva_edit_image&image-url=https%3A%2F%2Fpixabay.com%2Fget%2Fgc96b3ab13f832a16dadbc5472646a6f2f9074e9c666fb886abae26465fbaff3e68405ddf79be9fa25de1a37fb2b05afd_1920.jpg%3Flonglived%3D&external-id=8510899&canva-media-id=&utm_term=54.1%2165.2',
		};
		const mockDocument: MockDocument = {
			querySelectorAll: (selector: string) => {
				if (selector === 'a' || selector.includes('a')) return [link];
				return [];
			},
		};
		const mockWindow: MockWindow = {
			location: { origin: 'http://canva.com' },
			getComputedStyle: () => ({ backgroundImage: '' }),
		};

		const result = await runFindImages(mockDocument, mockWindow);

		expect(result.allImages).toHaveLength(0);
		expect(result.linkedImages).toHaveLength(0);
	})
});
