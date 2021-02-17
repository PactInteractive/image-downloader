const packagePath = './package.json';
const manifestPath = './manifest.json';

module.exports = {
  filesToCopy: [
    manifestPath,
    './images/**/*',
    './lib/**/*',
    './src/**/!(test)',
    './stylesheets/**/*',
    './views/**/*',
  ],
  paths: {
    package: packagePath,
    manifest: manifestPath,
  },
  outputDirectory: 'build',
};
