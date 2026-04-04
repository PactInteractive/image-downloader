// @ts-check
import html, { render, useSignal } from '../html.js';

import { App } from '../components/App.js';
import { loadImagesFromActiveTab } from '../components/data.js';

function Wrapper() {
	const iframeUrl = useSignal('/src/Options/index.html');
	const inputUrl = useSignal(iframeUrl.value);

	return html`
		<div class="flex" style=${{ width: '100dvw', height: '100dvh' }}>
			<div class="flex-1 overflow-hidden">
				<form
					id="url_form"
					class="flex items-center gap-2 bg-slate-800 px-3 py-2"
					onSubmit=${(/** @type {Event} */ e) => {
						e.preventDefault();
						const url = inputUrl.value.trim();
						iframeUrl.value = url ? (url.startsWith('/') ? window.location.origin + url : `https://${url}`) : url;
					}}
				>
					<span class="shrink-0 text-xs font-medium tracking-wider text-slate-400 uppercase">URL</span>
					<input
						class="flex-1 rounded bg-slate-700 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-400 outline-none focus:ring-1 focus:ring-blue-500"
						type="text"
						value=${inputUrl.value}
						onInput=${(/** @type {Event} */ e) => (inputUrl.value = /** @type {HTMLInputElement} */ (e.target).value)}
						placeholder="Enter URL..."
					/>

					<button
						type="submit"
						class="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
					>
						Go
					</button>
				</form>

				<iframe
					class="h-full w-full bg-white"
					ref=${(/** @type {HTMLIFrameElement} */ iframe) => (window.__devIframe = iframe)}
					src=${iframeUrl}
					same-origin-referrerpolicy="no-referrer"
					onLoad=${() => loadImagesFromActiveTab({ waitForIdleDOM: false })}
				/>
			</div>

			<div
				class="flex flex-1 flex-col overflow-auto bg-slate-50"
				style=${{ borderLeft: '1px', borderStyle: 'solid', borderColor: 'lightgrey' }}
			>
				<${App} />
			</div>
		</div>
	`;
}

render(html`<${Wrapper} />`, document.querySelector('main'));
