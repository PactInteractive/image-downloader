import watch from 'glob-watcher';
import * as config from './config';
import { buildCss, copyFile, removeFile, rewriteModuleImports, updateManifest } from './tasks';

function logAndExecute(message: string, ...fns: ((input: string) => Promise<string | void>)[]) {
	return async (path: string) => {
		let result: string | void = path;
		for (const fn of fns) {
			result = await fn(typeof result === 'string' ? result : path);
		}
		console.log(`[${new Date().toLocaleTimeString()}]`, message, result || path);
	};
}

watch(config.packageJson).on('change', updateManifest);

watch(config.copy.include, { ignored: config.copy.exclude })
	.on('add', logAndExecute('Add', copyFile, rewriteModuleImports))
	.on('change', logAndExecute('Update', copyFile, rewriteModuleImports))
	.on('unlink', logAndExecute('Remove', removeFile));

watch([config.style, './src/**/*.{js,mjs,html}']).on('change', logAndExecute('CSS', buildCss));
