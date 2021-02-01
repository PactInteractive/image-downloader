const glob = require('glob');
const { filesToCopy } = require('./config');
const tasks = require('./tasks');

const build = async () => {
  await tasks.clean();
  await tasks.updateManifestVersion();
  await Promise.all(
    filesToCopy
      .map((filePattern) => glob.sync(filePattern))
      .reduce((parent, child) => [...parent, ...child], [])
      .map(tasks.copyFile)
      .map((promise) =>
        promise.catch((error) => {
          if (error.code === 'EEXIST') {
            // Ignore already existing file error
          } else {
            throw error;
          }
        })
      )
  );
};

build();
