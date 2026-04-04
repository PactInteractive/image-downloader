// @ts-check
import html, { For, useEffect } from '../html.js';

import {
	allImages,
	erroredImages,
	imagesCache,
	initialize,
	initialized,
	loadedImages,
	loadImagesFromActiveTab,
	reloadImagesWhenPageLoads,
} from './data.js';
import { Footer } from './Footer.js';
import { Header } from './Header.js';
import { Images } from './Images.js';

export function App() {
	useEffect(() => {
		chrome.tabs.onUpdated.addListener(reloadImagesWhenPageLoads);
		chrome.tabs.onActivated.addListener(({ tabId }) => reloadImagesWhenPageLoads(tabId, {}, null));

		initialize().then(() => loadImagesFromActiveTab({ waitForIdleDOM: false }));
	}, []);

	if (!initialized.value) {
		return html`<div class="p-4">Initializing...</div>`;
	}

	return html`
		<${Header} class="sticky top-0 z-1 bg-white shadow-md" />

		<div id="images_cache" ref=${(/** @type {HTMLDivElement} */ element) => (imagesCache.value = element)} hidden>
			<${For} each=${allImages.value}>
				${(/** @type {string} */ url) => html`
					<img
						key=${url}
						src=${url}
						onLoad=${() => (loadedImages.value = [...loadedImages.value, url])}
						onError=${() => (erroredImages.value = [...erroredImages.value, url])}
					/>
				`}
			<//>
		</div>

		<${Images} id="images_container" />

		<${Footer}
			class="sticky bottom-0 mt-auto bg-white p-2"
			style=${{
				boxShadow:
					'0 -4px 6px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 2px 4px -2px var(--tw-shadow-color, rgb(0 0 0 / 0.1))',
			}}
		/>
	`;
}
