/// <reference types="chrome" />
import { Subscription } from './Subscription';

export const Services = {
  onImageUrlsChanged(listener: (imageUrls: string[]) => any): Subscription {
    // TODO: Uncomment
    // chrome.runtime.onMessage.addListener(listener);
    // TODO: Remove dummy data
    listener([
      'https://www.redditstatic.com/sprite-reddit.bTLvdEETokI.png',
      'https://b.thumbs.redditmedia.com/Pp8AsVq0Urj_XiTGI8sQRJbaPRgFP6YBxUh_-tWNAVc.jpg',
      'https://b.thumbs.redditmedia.com/vV1Q3ZYAapgQweewBCDanO88WcLKjOCUike6LEie9bw.jpg',
      'https://a.thumbs.redditmedia.com/pc-G16ZbyiH9qaVeQfDGCIIvuUICA3w4bpSgzrbEMo4.jpg',
      'https://b.thumbs.redditmedia.com/dO92JemD85BVEUtWBLtEl_wePb_AVx0FJZSs24KMIpk.jpg',
      'https://b.thumbs.redditmedia.com/nckncMZ5pUkbhG48q-QhiGvwX579bBYtrNqo8g3Y7YY.jpg',
      'https://a.thumbs.redditmedia.com/Pyq3lTMr_JXOA_93xSJYSb47ZsTKMuWJWjO5EQzI5e4.jpg',
      'https://b.thumbs.redditmedia.com/U-5b2EkWn-YXNvxi-W7VRqaB4n8fiV7PW7nXdGvDVok.jpg',
      'https://b.thumbs.redditmedia.com/sHYPBKT7zqS-3QEwIMfHyFB7IrWY1Y1IQm2dtJ0KXgo.jpg',
      'https://reddit.com/static/pixel.png',
    ]);

    return {
      unsubscribe() {
        chrome.runtime.onMessage.removeListener(listener);
      },
    };
  },
  loadImages() {
    chrome.tabs.executeScript({ file: '/scripts/send_images.js', allFrames: true });
  },
  openImage(imageUrl: string) {
    chrome.tabs.create({ url: imageUrl, active: false });
  },
  downloadImage(imageUrl: string) {
    chrome.downloads.download({ url: imageUrl });
  },
};
