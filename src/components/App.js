// @ts-check
import html, { For, useEffect } from '../html.js';

import {
	allImages,
	imageErrored,
	imageLoaded,
	imagesCache,
	initialize,
	initialized,
	loadImagesFromActiveTab,
	reloadImagesWhenPageLoads,
} from './data.js';
import { ErrorBoundary } from './ErrorBoundary.js';
import { Footer } from './Footer.js';
import { Header } from './Header.js';
import { Images } from './Images.js';
import { useTheme } from './useTheme.js';

export function App() {
	return html`<${ErrorBoundary}><${AppWithoutErrorBoundary} /><//>`;
}

function AppWithoutErrorBoundary() {
	useTheme();

	useEffect(() => {
		chrome.tabs.onUpdated.addListener(reloadImagesWhenPageLoads);
		chrome.tabs.onActivated.addListener(({ tabId }) => reloadImagesWhenPageLoads(tabId, {}, null));

		initialize().then(() => loadImagesFromActiveTab({ waitForIdleDOM: false }));
	}, []);

	if (!initialized.value) {
		return html`<div class="p-4">Initializing...</div>`;
	}

	return html`
		<${Header}
			class="material sticky top-0 z-1 border-b border-black/8 dark:border-white/8"
			style=${{ boxShadow: '0 1px 8px -2px rgb(0 0 0 / 0.08)' }}
		/>

		<div id="images_cache" ref=${(/** @type {HTMLDivElement} */ element) => (imagesCache.value = element)} hidden>
			<${For} each=${allImages}>
				${(/** @type {string} */ url) => html`
					<img key=${url} src=${url} onLoad=${() => imageLoaded(url)} onError=${() => imageErrored(url)} />
				`}
			<//>
		</div>

		<${Images} id="images_container" />

		<${Footer}
			class="material sticky bottom-0 mt-auto border-t border-black/8 p-2 dark:border-white/8"
			style=${{ boxShadow: '0 -1px 8px -2px rgb(0 0 0 / 0.08)' }}
		/>
	`;
}
