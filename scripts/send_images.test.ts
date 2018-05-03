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

import {
  extractImagesFromTags,
  extractImageFromElement,
  extractImagesFromStyles,
  extractURLFromStyle,
  isImageURL,
  isElement,
  relativeUrlToAbsolute,
  removeDuplicateOrEmpty,
} from './send_images';

describe(`sendImages`, () => {
  beforeEach(setup);

  describe(`extractImagesFromTags`, () => {
    // TODO
  });

  describe(`extractImageFromElement`, () => {
    const imageUrl = 'http://example.com/img.jpg';

    it(`should return img src`, () => {
      const element = mockPartial<HTMLImageElement>({ tagName: 'img', src: imageUrl });
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
  });

  describe(`extractImagesFromStyles`, () => {
    // TODO
  });

  describe(`extractURLFromStyle`, () => {
    // TODO
  });

  describe(`isImageURL`, () => {
    // TODO
  });

  describe(`isElement`, () => {
    // TODO
  });

  describe(`relativeUrlToAbsolute`, () => {
    // TODO
  });

  describe(`removeDuplicateOrEmpty`, () => {
    // TODO
  });
});
