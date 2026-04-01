export const packageJson = './package.json';

export const manifestJson = './manifest.json';

export const style = './src/style.css';

export const build = 'build';

export const copy = {
	include: [manifestJson, './images/**/*', './lib/**/*', './src/**'],
	exclude: [style, './src/Web/**', './src/test.ts', './src/test-helpers.ts', './src/**/*.test.ts'],
};

export const icons = {
	svg: './images/logo.svg',
	output: 'images',
	prefix: 'icon_',
	sizes: [16, 32, 48, 128],
};
