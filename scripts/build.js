import fs from 'fs-extra';
import { sync } from 'glob';

import { filesToCopy } from './config';
import { buildCss, clean, copyFile, updateManifest } from './tasks';

async function build() {
	await clean();
	await updateManifest();
	await buildCss();

	const patterns = filesToCopy.filter((pattern) => !pattern.startsWith('!'));
	const ignore = filesToCopy.filter((pattern) => pattern.startsWith('!')).map((pattern) => pattern.slice(1));

	const allFiles = patterns
		.map((filePattern) => sync(filePattern, { ignore }))
		.reduce((parent, child) => [...parent, ...child], [])
		.filter((file) => !fs.statSync(file).isDirectory());

	await Promise.all(
		allFiles.map(copyFile).map((promise) =>
			promise.catch((error) => {
				if (error.code === 'EEXIST') {
					// Ignore already existing file error
				} else {
					throw error;
				}
			})
		)
	);
}

build();
