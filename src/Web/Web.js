import { App } from '../components/App.js';
import { OptionsProvider } from '../components/OptionsProvider.js';
import html, { render, useCallback, useEffect, useRef, useState } from '../html.js';

function Wrapper() {
	const iframeRef = useRef(null);
	const [iframeUrl, setIframeUrl] = useState(`${window.location.origin}/src/Options/index.html`);
	const [inputUrl, setInputUrl] = useState(iframeUrl);

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
			setIframeUrl(url && !/^https?:\/\//i.test(url) ? `https://${url}` : url);
		},
		[inputUrl]
	);

	return html`
		<div class="flex h-screen w-screen flex-col bg-slate-900">
			<form class="flex items-center gap-2 border-b border-slate-700 bg-slate-800 px-3 py-2" onSubmit=${navigate}>
				<span class="shrink-0 text-xs font-medium tracking-wider text-slate-400 uppercase">Target URL</span>
				<input
					class="flex-1 rounded bg-slate-700 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-400 outline-none focus:ring-1 focus:ring-blue-500"
					type="text"
					value=${inputUrl}
					onInput=${(e) => setInputUrl(e.target.value)}
					placeholder="Enter URL..."
				/>

				<button type="submit" class="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500">
					Go
				</button>
			</div>

			<div class="flex-1 flex overflow-hidden">
				<div class="flex-1 border-r border-slate-700">
					<iframe
						ref=${iframeRef}
						src=${iframeUrl}
						class="h-full w-full bg-white"
						same-origin-referrerpolicy="no-referrer"
					/>
				</div>

				<div class="flex-1 overflow-y-auto flex flex-col bg-slate-50">
					<${App} />
				</div>
			</div>
		</div>
	`;
}

render(html`<${OptionsProvider}><${Wrapper} /><//>`, document.querySelector('main'));
