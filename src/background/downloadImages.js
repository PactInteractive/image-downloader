/** @type {Set<{ currentImageNumber: number, imagesToDownload: string[], options: any }>} */
const tasks = new Set();

// NOTE: Don't directly use an `async` function as a listener:
// https://stackoverflow.com/a/56483156
chrome.runtime.onMessage.addListener(startDownload);
chrome.downloads.onDeterminingFilename.addListener(suggestNewFilename);

function startDownload(message, sender, resolve) {
  if (message?.type !== 'downloadImages') return;

  downloadImages({
    currentImageNumber: 1,
    imagesToDownload: message.imagesToDownload,
    options: message.options,
  }).then(resolve);

  return true;
}

async function downloadImages(task) {
  tasks.add(task);
  for (const image of task.imagesToDownload) {
    await new Promise((resolve) => {
      chrome.downloads.download({ url: image }, resolve);
    });
  }
}

function suggestNewFilename(item, suggest) {
  const task = [...tasks][0];
  if (!task) return;

  if (task.currentImageNumber === task.imagesToDownload.length) {
    tasks.delete(task); // Task will be done after this run, remove from queue
  }

  let newFilename = '';
  if (task.options.folder_name) {
    newFilename += `${task.options.folder_name}/`;
  }
  if (task.options.new_file_name) {
    const regex = /(?:\.([^.]+))?$/;
    const extension = regex.exec(item.filename)[1];
    if (task.imagesToDownload.length === 1) {
      newFilename += `${task.options.new_file_name}.${extension}`;
    } else {
      const numberOfDigits = task.imagesToDownload.length.toString().length;
      const formattedImageNumber = `${task.currentImageNumber}`.padStart(
        numberOfDigits,
        '0'
      );
      newFilename += `${task.options.new_file_name}${formattedImageNumber}.${extension}`;
      task.currentImageNumber += 1;
    }
  } else {
    newFilename += item.filename;
  }

  suggest({ filename: normalizeSlashes(newFilename) });
}

function normalizeSlashes(filename) {
  return filename.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
}
