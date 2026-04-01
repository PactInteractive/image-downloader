import fs from 'fs-extra';
import { sync } from 'glob';

import * as config from './config';
import { buildCss, clean, copyFile, updateManifest } from './tasks';

async function build() {
	await clean();
	await updateManifest();

	await Promise.all(
		config.copy.include
			.map((pattern) => sync(pattern, { ignore: config.copy.exclude }))
			.reduce((parent, child) => [...parent, ...child], [])
			.filter((file) => !fs.statSync(file).isDirectory())
			.map(copyFile)
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
