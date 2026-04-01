import watch from 'glob-watcher';

import * as config from './config';
import { buildCss, copyFile, removeFile, updateManifest } from './tasks';

const logAndExecute = (message: string, fn: (path: string) => Promise<string | void>) => async (path: string) => {
	const result = await fn(path);
	console.log(`[${new Date().toLocaleTimeString()}]`, message, result || path);
};

watch(config.packageJson).on('change', updateManifest);

watch(config.copy.include, { ignored: config.copy.exclude })
	.on('add', logAndExecute('Add', copyFile))
	.on('change', logAndExecute('Update', copyFile))
	.on('unlink', logAndExecute('Remove', removeFile));

watch([config.style, './src/**/*.js', './src/**/*.html']).on('change', logAndExecute('CSS', buildCss));
