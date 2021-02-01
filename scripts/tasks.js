const { join } = require('path');
const fs = require('fs-extra');
const { paths, outputDirectory } = require('./config');

exports.clean = async () => {
  await fs.emptyDir(outputDirectory);
};

exports.updateManifestVersion = async () => {
  const [packageJson, manifestJson] = await Promise.all([
    fs.readJson(paths.package),
    fs.readJsonSync(paths.manifest),
  ]);

  await fs.writeJson(
    './manifest.json',
    { ...manifestJson, version: packageJson.version },
    { spaces: 2 }
  );
};

exports.copyFile = async (path) => {
  await fs.copy(path, join(outputDirectory, path), { recursive: true });
};

exports.removeFile = async (path) => {
  await fs.remove(join(outputDirectory, path));
};
