const watch = require('glob-watcher');
const { filesToCopy, paths } = require('./config');
const tasks = require('./tasks');

const logAndExecute = (message, fn) => (path, ...args) => {
  console.log(`[${new Date().toLocaleTimeString()}]`, message, path);
  return fn(path, ...args);
};

watch(paths.package, logAndExecute('Update', tasks.updateManifestVersion));

watch(filesToCopy)
  .on('add', logAndExecute('Add', tasks.copyFile))
  .on('change', logAndExecute('Update', tasks.copyFile))
  .on('unlink', logAndExecute('Remove', tasks.removeFile));
