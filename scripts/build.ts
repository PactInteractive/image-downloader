import fs from 'fs-extra';
import { sync } from 'glob';

import * as config from './config';
import { buildCss, clean, copyAndTransformFile, copyFile, replaceImports, updateManifest } from './tasks';

async function build() {
	await clean();
	await updateManifest();

	const files = config.copy.include
		.map((pattern) => sync(pattern, { ignore: config.copy.exclude }))
		.reduce((parent, child) => [...parent, ...child], [])
		.filter((file) => !fs.statSync(file).isDirectory());

	await Promise.all(
		files
			.map((file) => {
				if (file.startsWith('./lib/') && /\.(m?js)$/.test(file)) {
					return copyAndTransformFile(file, [replaceImports]);
				}
				return copyFile(file);
			})
			.map((promise) =>
				promise.catch((error: NodeJS.ErrnoException) => {
					if (error.code === 'EEXIST') {
						// Ignore already existing file error
					} else {
						throw error;
					}
				})
			)
	);

	await buildCss();
}

build();
