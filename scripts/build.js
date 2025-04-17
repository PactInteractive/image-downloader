import { sync } from 'glob';

import { filesToCopy } from './config';
import { clean, copyFile, updateManifest } from './tasks';

async function build() {
  await clean();
  await updateManifest();
  await Promise.all(
    filesToCopy
      .map((filePattern) => sync(filePattern))
      .reduce((parent, child) => [...parent, ...child], [])
      .map(copyFile)
      .map((promise) =>
        promise.catch((error) => {
          if (error.code === 'EEXIST') {
            // Ignore already existing file error
          } else {
            throw error;
          }
        }),
      ),
  );
}

build();
