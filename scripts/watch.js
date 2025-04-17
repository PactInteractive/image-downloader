import watch from 'glob-watcher';

import { filesToCopy, paths } from './config';
import { updateManifest, copyFile, removeFile } from './tasks';

const logAndExecute =
  (message, fn) =>
  async (path, ...args) => {
    const result = await fn(path, ...args);
    console.log(
      `[${new Date().toLocaleTimeString()}]`,
      message,
      result || path,
    );
  };

watch(paths.package).on('change', updateManifest);

watch(filesToCopy)
  .on('add', logAndExecute('Add', copyFile))
  .on('change', logAndExecute('Update', copyFile))
  .on('unlink', logAndExecute('Remove', removeFile));
