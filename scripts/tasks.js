const { join, normalize } = require('path');
const fs = require('fs-extra');
const { paths, outputDirectory } = require('./config');

exports.clean = async () => {
  await fs.emptyDir(outputDirectory);
};

exports.updateManifestVersion = async () => {
  const [packageJson, manifestJson] = await Promise.all([
    fs.readJson(paths.package),
    fs.readJson(paths.manifest),
  ]);

  await fs.writeJson(
    paths.manifest,
    { ...manifestJson, version: packageJson.version },
    { spaces: 2 }
  );

  return normalize(paths.manifest);
};

exports.updatePackageLockVersion = async () => {
  const [packageJson, packageLockJson] = await Promise.all([
    fs.readJson(paths.package),
    fs.readJson(paths.packageLock),
  ]);

  await fs.writeJson(
    paths.packageLock,
    { ...packageLockJson, version: packageJson.version },
    { spaces: 2 }
  );

  return normalize(paths.packageLock);
};

exports.copyFile = async (path) => {
  await fs.copy(path, join(outputDirectory, path), { recursive: true });
};

exports.removeFile = async (path) => {
  await fs.remove(join(outputDirectory, path));
};
