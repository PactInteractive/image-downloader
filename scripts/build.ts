import fs from 'fs-extra';
import { sync } from 'glob';
import { join } from 'path';

import * as config from './config';
import { buildCss, clean, copyFile, updateManifest } from './tasks';

const importmap = {
	'"@preact/signals-core"': '"/lib/preact-signals-core.mjs"',
	'"@preact/signals"': '"/lib/preact-signals.mjs"',
	'"@preact/signals/utils"': '"/lib/preact-signals-utils.mjs"',
	'"htm"': '"/lib/htm.mjs"',
	'"htm/preact"': '"/lib/htm-preact.mjs"',
	'"nouislider"': '"/lib/nouislider.mjs"',
	'"preact"': '"/lib/preact.mjs"',
	'"preact/hooks"': '"/lib/preact-hooks.mjs"',
	"'@preact/signals-core'": "'/lib/preact-signals-core.mjs'",
	"'@preact/signals'": "'/lib/preact-signals.mjs'",
	"'@preact/signals/utils'": "'/lib/preact-signals-utils.mjs'",
	"'htm'": "'/lib/htm.mjs'",
	"'htm/preact'": "'/lib/htm-preact.mjs'",
	"'nouislider'": "'/lib/nouislider.mjs'",
	"'preact'": "'/lib/preact.mjs'",
	"'preact/hooks'": "'/lib/preact-hooks.mjs'",
};

function rewriteImports(filePath: string) {
	let content = fs.readFileSync(filePath, 'utf8');
	for (const [from, to] of Object.entries(importmap)) {
		content = content.split(from).join(to);
	}
	fs.writeFileSync(filePath, content);
}

async function build() {
	await clean();
	await updateManifest();

	// Copy library files from node_modules to build/lib/
	const libs = [
		['node_modules/@preact/signals-core/dist/signals-core.mjs', 'lib/preact-signals-core.mjs'],
		['node_modules/@preact/signals/dist/signals.mjs', 'lib/preact-signals.mjs'],
		['node_modules/@preact/signals/utils/dist/utils.mjs', 'lib/preact-signals-utils.mjs'],
		['node_modules/htm/dist/htm.mjs', 'lib/htm.mjs'],
		['node_modules/htm/preact/index.mjs', 'lib/htm-preact.mjs'],
		['node_modules/nouislider/dist/nouislider.min.css', 'lib/nouislider.min.css'],
		['node_modules/nouislider/dist/nouislider.mjs', 'lib/nouislider.mjs'],
		['node_modules/preact/dist/preact.mjs', 'lib/preact.mjs'],
		['node_modules/preact/hooks/dist/hooks.mjs', 'lib/preact-hooks.mjs'],
	];

	await Promise.all(libs.map(([src, dest]) => fs.copy(src, join(config.build, dest))));

	// Copy all source files
	const files = config.copy.include
		.map((pattern) => sync(pattern, { ignore: config.copy.exclude }))
		.reduce((parent, child) => [...parent, ...child], [])
		.filter((file) => !fs.statSync(file).isDirectory());

	await Promise.all(files.map((file) => copyFile(file)));

	// Rewrite bare imports to absolute lib paths in all JS files
	const allJsFiles = sync(join(config.build, '**/*.{js,mjs}'));
	for (const file of allJsFiles) {
		rewriteImports(file);
	}

	await buildCss();
}

build();
