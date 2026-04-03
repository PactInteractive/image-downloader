import { App } from '../components/App.js';
import html, { render, useCallback, useEffect, useRef, useState } from '../html.js';
import { add } from '../utils.js';

function Wrapper() {
	const iframeRef = useRef(null);
	const [iframeUrl, setIframeUrl] = useState('/src/Options/index.html');
	const [inputUrl, setInputUrl] = useState(iframeUrl);
	const [iframeLoaded, setIframeLoaded] = useState(0);

	useEffect(() => {
		window.__devIframe = iframeRef.current;
		return () => {
			window.__devIframe = null;
		};
	}, []);

	const navigate = useCallback(
		(e) => {
			e.preventDefault();
			const url = inputUrl.trim();
			setIframeUrl(url ? (url.startsWith('/') ? window.location.origin + url : `https://${url}`) : url);
		},
		[inputUrl]
	);

	return html`
		<div class="flex" style=${{ width: '100dvw', height: '100dvh' }}>
			<div class="flex-1 overflow-hidden">
				<form id="url_form" class="flex items-center gap-2 bg-slate-800 px-3 py-2" onSubmit=${navigate}>
					<span class="shrink-0 text-xs font-medium tracking-wider text-slate-400 uppercase">URL</span>
					<input
						class="flex-1 rounded bg-slate-700 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-400 outline-none focus:ring-1 focus:ring-blue-500"
						type="text"
						value=${inputUrl}
						onInput=${(e) => setInputUrl(e.target.value)}
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
					ref=${iframeRef}
					src=${iframeUrl}
					same-origin-referrerpolicy="no-referrer"
					onLoad=${() => setIframeLoaded(add(1))}
				/>
			</div>

			<div
				class="flex flex-1 flex-col overflow-auto bg-slate-50"
				style=${{ borderLeft: '1px', borderStyle: 'solid', borderColor: 'lightgrey' }}
			>
				<${App} key=${iframeLoaded} />
			</div>
		</div>
	`;
}

render(html`<${Wrapper} />`, document.querySelector('main'));
