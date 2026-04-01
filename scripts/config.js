const packagePath = './package.json';
const manifestPath = './manifest.json';

export const outputDirectory = 'build';

export const icons = {
	inputSvg: './images/logo.svg',
	outputDirectory: 'images',
	prefix: 'icon_',
	sizes: [16, 32, 48, 128],
};

export const filesToCopy = [
	manifestPath,
	'./images/**/*',
	'./lib/**/*',
	'!./lib/eruda.min.js',
	'./src/**',
	'!./src/Web/**',
	'!./src/style.css',
	'!./src/test.ts',
	'!./src/test-helpers.ts',
	'!./src/**/*.test.ts',
];

export const paths = {
	package: packagePath,
	manifest: manifestPath,
};
