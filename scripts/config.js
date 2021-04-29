const packagePath = './package.json';
const packageLockPath = './package-lock.json';
const manifestPath = './manifest.json';

module.exports = {
  filesToCopy: [
    manifestPath,
    './images/**/*',
    './lib/**/*',
    './src/**/!(test-utils.ts|*.test.ts)',
    './stylesheets/**/*',
    './views/**/*',
  ],
  paths: {
    package: packagePath,
    packageLock: packageLockPath,
    manifest: manifestPath,
  },
  outputDirectory: 'build',
};
