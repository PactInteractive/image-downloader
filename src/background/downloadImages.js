chrome.runtime.onMessage.addListener(startDownload);

// TODO: Handle the case where this is called again before the previous downloads have finished.
// We need to only have 1 handler, so make it global and figure out a way to communicate images to download and options.
async function startDownload(message, sender, reply) {
  if (message?.type !== 'downloadImages') return;

  const { imagesToDownload, options } = message;

  chrome.downloads.onDeterminingFilename.addListener(suggestNewFilename);
  let currentImageNumber = 1;

  for (const image of imagesToDownload) {
    await new Promise((resolve) => {
      chrome.downloads.download({ url: image }, resolve);
    });
  }

  console.log(
    `currentImageNumber ${currentImageNumber} === images.length ${imagesToDownload.length}`
  );
  // Check if suggest has been called enough time before unsubscribing, but make sure it's reliable!
  // If this doesn't work, try subscribing to `onCreated` for each item and unsubscribe after they're all done.
  chrome.downloads.onDeterminingFilename.removeListener(suggestNewFilename);
  reply();

  function suggestNewFilename(item, suggest) {
    let newFilename = '';
    if (options.folder_name) {
      newFilename += `${options.folder_name}/`;
    }
    if (options.new_file_name) {
      const regex = /(?:\.([^.]+))?$/;
      const extension = regex.exec(item.filename)[1];
      if (imagesToDownload.length === 1) {
        newFilename += `${options.new_file_name}.${extension}`;
      } else {
        const numberOfDigits = imagesToDownload.length.toString().length;
        const formattedImageNumber = `${currentImageNumber}`.padStart(
          numberOfDigits,
          '0'
        );
        newFilename += `${options.new_file_name}${formattedImageNumber}.${extension}`;
        currentImageNumber += 1;
      }
    } else {
      newFilename += item.filename;
    }
    suggest({ filename: newFilename });
  }
}
