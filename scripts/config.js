const packagePath = './package.json';
const manifestPath = './manifest.json';

module.exports = {
  outputDirectory: 'build',
  icons: {
    inputSvg: './images/logo.svg',
    outputDirectory: 'images',
    prefix: 'icon_',
    sizes: [16, 32, 48, 128],
  },
  filesToCopy: [
    manifestPath,
    './images/**/*',
    './lib/**/*',
    './src/**/!(test.ts|*.test.ts)',
    './stylesheets/**/*',
  ],
  paths: {
    package: packagePath,
    manifest: manifestPath,
  },
};
