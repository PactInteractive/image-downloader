import fs from 'fs-extra';
import { sync } from 'glob';
import { join } from 'path';

import * as config from './config';
import { buildCss, clean, copyFile, rewriteModuleImports, updateManifest } from './tasks';

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

	await Promise.all(files.map(copyFile));

	// Rewrite bare imports to absolute lib paths in all JS files
	const allJsFiles = sync(join(config.build, '**/*.{js,mjs}'));
	await Promise.all(allJsFiles.map(rewriteModuleImports));

	await buildCss();
}

build();
