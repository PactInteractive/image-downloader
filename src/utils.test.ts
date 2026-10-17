import { describe, expect, it } from 'bun:test';

import { getReferralUrl } from './utils.js';

describe('getReferralUrl', () => {
	it('builds referral URLs without a redundant trailing slash', () => {
		expect(
			getReferralUrl('https://cutoutmagic.com/library', {
				url: 'https://example.com/a.jpg',
				utm_content: 'remove_background_button',
			})
		).toBe(
			'https://cutoutmagic.com/library?utm_source=image_downloader&utm_medium=chrome_extension&utm_campaign=internal_referral&url=https%3A%2F%2Fexample.com%2Fa.jpg&utm_content=remove_background_button'
		);

		expect(getReferralUrl('https://cutoutmagic.com', { utm_content: 'about_page' })).toBe(
			'https://cutoutmagic.com/?utm_source=image_downloader&utm_medium=chrome_extension&utm_campaign=internal_referral&utm_content=about_page'
		);
	});
});
