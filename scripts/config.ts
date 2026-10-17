export const packageJson = './package.json';

export const manifestJson = './manifest.json';

export const style = './src/style.css';

export const build = 'build';

// `build` stays loadable in Chromium and passes the Edge store, which rejects `background.scripts`.
export const firefox = {
	build: 'build-firefox',
	manifest: {
		background: { scripts: ['src/background/serviceWorker.js'] },
		browser_specific_settings: {
			gecko: {
				id: 'image-downloader@vdsabev',
				strict_min_version: '140.0',
				data_collection_permissions: { required: ['none'] },
			},
		},
	},
};

export const copy = {
	include: [manifestJson, './images/**/*', './src/**'],
	exclude: [style, './src/Web/**', './src/**/*.ts'],
};

export const icons = {
	svg: './images/logo.svg',
	output: 'images',
	prefix: 'icon_',
	sizes: [16, 32, 48, 128],
};

export const importmap = {
	'"@preact/signals-core"': '"/lib/preact-signals-core.mjs"',
	"'@preact/signals-core'": "'/lib/preact-signals-core.mjs'",
	'"@preact/signals"': '"/lib/preact-signals.mjs"',
	"'@preact/signals'": "'/lib/preact-signals.mjs'",
	'"@preact/signals/utils"': '"/lib/preact-signals-utils.mjs"',
	"'@preact/signals/utils'": "'/lib/preact-signals-utils.mjs'",
	'"htm"': '"/lib/htm.mjs"',
	"'htm'": "'/lib/htm.mjs'",
	'"htm/preact"': '"/lib/htm-preact.mjs"',
	"'htm/preact'": "'/lib/htm-preact.mjs'",
	'"nouislider"': '"/lib/nouislider.mjs"',
	"'nouislider'": "'/lib/nouislider.mjs'",
	'"preact"': '"/lib/preact.mjs"',
	"'preact'": "'/lib/preact.mjs'",
	'"preact/hooks"': '"/lib/preact-hooks.mjs"',
	"'preact/hooks'": "'/lib/preact-hooks.mjs'",
};
