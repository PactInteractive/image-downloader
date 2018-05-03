import { mockPartial, mockRecursivePartial } from 'sneer';
import { Chrome } from './chrome.d';

let chrome: Chrome;
let document: Document;

const setup = () => {
  chrome = (window as any).chrome = mockRecursivePartial<Chrome>({
    runtime: {
      sendMessage() {},
    },
  });

  document = (window as any).document = mockRecursivePartial<Document>({
    querySelectorAll() {},
    styleSheets: [],
  });
};

setup(); // Setup before import to prevent errors

// HACK: Import using `require` to prevent VSCode from changing the order of imports
declare const require: any;
const {
  extractImagesFromTags,
  extractImageFromElement,
  extractImagesFromStyles,
  extractURLFromStyle,
  isImageURL,
  isElement,
  relativeUrlToAbsolute,
  removeDuplicateOrEmpty,
} = require('./send_images');

describe(`sendImages`, () => {
  beforeEach(setup);

  describe(`extractImageFromElement`, () => {
    const imageUrl = 'http://example.com/img.jpg';

    it(`should return img src`, () => {
      const element = mockPartial<HTMLImageElement>({ tagName: 'img', src: imageUrl });
      expect(extractImageFromElement(element)).toBe(imageUrl);
    });


    it(`should remove img src hash`, () => {
      const element = mockPartial<HTMLImageElement>({ tagName: 'img', src: imageUrl + '#abc' });
      expect(extractImageFromElement(element)).toBe(imageUrl);
    });

    it(`should return a href image URL`, () => {
      const element = mockPartial<HTMLAnchorElement>({ tagName: 'a', href: imageUrl });
      expect(extractImageFromElement(element)).toBe(imageUrl);
    });

    it(`should return [style] element background image URL`, () => {
      const backgroundImage = `url(${imageUrl})`;
      jest.spyOn(window, 'getComputedStyle').mockImplementationOnce(() => ({ backgroundImage }));
      const element = mockRecursivePartial<HTMLDivElement>({ tagName: 'div', style: { backgroundImage } });
      expect(extractImageFromElement(element)).toBe(imageUrl);
    });

    it(`should return empty string for other elements`, () => {
      jest.spyOn(window, 'getComputedStyle').mockImplementationOnce(() => ({}));
      const element = mockPartial<HTMLButtonElement>({ tagName: 'button' });
      expect(extractImageFromElement(element)).toBe('');
    });
  });

  describe(`extractImagesFromStyles`, () => {
    it(`should return empty array for empty stylesheets`, () => {
      expect(extractImagesFromStyles([])).toEqual([]);
    });

    it(`should return background images`, () => {
      const imageA = 'http://example.com/a.jpg';
      const imageB = 'http://example.com/b.jpg';
      const imageC = 'http://example.com/c.jpg';
      const stylesheets = [{
        cssRules: [
          { style: { backgroundImage: imageA } },
          { style: { backgroundImage: imageB } },
          { style: { backgroundImage: imageC } },
        ]
      }];
      expect(extractImagesFromStyles(stylesheets)).toEqual([imageA, imageB, imageC]);
    });
  });

  describe(`extractURLFromStyle`, () => {
    it(`should remove url(...)`, () => {
      expect(extractURLFromStyle(`url(a)`)).toBe('a');
    });

    it(`should remove url("...")`, () => {
      expect(extractURLFromStyle(`url("a")`)).toBe('a');
    });

    it(`should remove url('...')`, () => {
      expect(extractURLFromStyle(`url('a')`)).toBe('a');
    });
  });

  describe(`relativeUrlToAbsolute`, () => {
    it(`should convert relative URL to absolute`, () => {
      expect(relativeUrlToAbsolute('/a')).toBe(window.location.origin + '/a');
    });

    it(`should preserve non-relative URL`, () => {
      expect(relativeUrlToAbsolute('a')).toBe('a');
    });
  });

  describe(`removeDuplicateOrEmpty`, () => {
    it(`should remove duplicate`, () => {
      expect(removeDuplicateOrEmpty([
        'a',
        'b',
        'c',
        'b',
        'c',
        'd',
      ])).toEqual([
        'a',
        'b',
        'c',
        'd',
      ]);
    });

    it(`should remove empty`, () => {
      expect(removeDuplicateOrEmpty([
        '',
        'a',
        'b',
        'c',
        'd',
        '',
      ])).toEqual([
        'a',
        'b',
        'c',
        'd',
      ]);
    });
  });
});
