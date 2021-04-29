const watch = require('glob-watcher');
const { filesToCopy, paths } = require('./config');
const tasks = require('./tasks');

const logAndExecute = (message, fn) => async (path, ...args) => {
  const result = await fn(path, ...args);
  console.log(`[${new Date().toLocaleTimeString()}]`, message, result || path);
};

watch(paths.package).on('change', tasks.updateManifestVersion);
watch(paths.package).on(
  'change',
  logAndExecute('Update', tasks.updatePackageLockVersion)
);

watch(filesToCopy)
  .on('add', logAndExecute('Add', tasks.copyFile))
  .on('change', logAndExecute('Update', tasks.copyFile))
  .on('unlink', logAndExecute('Remove', tasks.removeFile));
