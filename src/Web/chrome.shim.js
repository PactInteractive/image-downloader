// Chrome API shim for running the extension as a standalone web app.
// Loaded via <script> tag before any module scripts.
// Relies on window.__devIframe being set by Web.js after the iframe is created.

(function () {
	function noop() {}
	function noopAsync() {
		return Promise.resolve();
	}

	function createEventTarget() {
		return {
			addListener: noop,
			removeListener: noop,
			hasListener: () => false,
			hasListeners: () => false,
		};
	}

	// --- Storage backed by localStorage ---

	const storage = {
		local: {
			get(keys) {
				return new Promise((resolve) => {
					if (keys === null || keys === undefined) {
						const result = {};
						for (let i = 0; i < localStorage.length; i++) {
							const key = localStorage.key(i);
							try {
								result[key] = JSON.parse(localStorage.getItem(key));
							} catch {
								result[key] = localStorage.getItem(key);
							}
						}
						resolve(result);
						return;
					}

					const keyList = typeof keys === 'string' ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys);
					const result = {};
					for (const key of keyList) {
						const raw = localStorage.getItem(key);
						if (raw !== null) {
							try {
								result[key] = JSON.parse(raw);
							} catch {
								result[key] = raw;
							}
						} else if (typeof keys === 'object' && !Array.isArray(keys) && key in keys) {
							result[key] = keys[key];
						}
					}
					resolve(result);
				});
			},
			set(items) {
				return new Promise((resolve) => {
					for (const [key, value] of Object.entries(items)) {
						localStorage.setItem(key, JSON.stringify(value));
					}
					resolve();
				});
			},
			remove(keys) {
				return new Promise((resolve) => {
					const keyList = typeof keys === 'string' ? [keys] : keys;
					for (const key of keyList) {
						localStorage.removeItem(key);
					}
					resolve();
				});
			},
			clear() {
				return new Promise((resolve) => {
					localStorage.clear();
					resolve();
				});
			},
		},
		onChanged: createEventTarget(),
	};

	// --- Tabs ---

	const tabs = {
		query(query, callback) {
			const iframe = window.__devIframe;
			const url = iframe ? iframe.src : window.location.href;
			callback([{ id: 1, url, active: true }]);
		},
		create({ url }) {
			window.open(url, '_blank');
		},
		onUpdated: createEventTarget(),
		onActivated: createEventTarget(),
	};

	// --- Scripting ---

	const scripting = {
		executeScript({ target, func, args }) {
			const iframe = window.__devIframe;
			if (!iframe) {
				return Promise.resolve([{ result: { allImages: [], linkedImages: [], origin: '' } }]);
			}

			const iframeDocument = iframe.contentDocument;
			const iframeWindow = iframe.contentWindow;
			if (!iframeDocument || !iframeWindow) {
				return Promise.resolve([
					{
						result: { allImages: [], linkedImages: [], origin: '' },
					},
				]);
			}

			// Call findImages with the iframe's document as root
			const options = { ...args[0], document: iframeDocument, window: iframeDocument.defaultView };
			return func(options).then((result) => [{ result }]);
		},
	};

	// --- Runtime ---

	const runtime = {
		sendMessage: noop,
		getManifest() {
			return { version: 'Dev' };
		},
		onInstalled: createEventTarget(),
		onMessage: createEventTarget(),
		lastError: null,
	};

	// --- Action ---

	const action = {
		setPopup: noopAsync,
		openPopup: noopAsync,
		onClick: createEventTarget(),
	};

	// --- Side Panel ---

	const sidePanel = {
		open: noopAsync,
	};

	// --- Downloads ---

	const downloads = {
		download(options, callback) {
			if (callback) callback(0);
			return Promise.resolve(0);
		},
		onDeterminingFilename: createEventTarget(),
		onChanged: createEventTarget(),
	};

	// --- Windows ---

	const windows = {
		getCurrent(callback) {
			callback({ id: 1 });
		},
	};

	// --- Assemble ---

	window.chrome = {
		action,
		downloads,
		runtime,
		scripting,
		sidePanel,
		storage,
		tabs,
		windows,
	};
})();
