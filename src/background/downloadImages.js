(() => {
  const images; // TODO: Set from outside
  const options; // TODO: Set from outside
  let currentImageNumber;
  
  async function startDownload() {
    // TODO: Start loading
    chrome.downloads.onDeterminingFilename.addListener(suggestNewFilename);
    currentImageNumber = 1;
    
    for (const image of images) {
      await new Promise((resolve) => {
        chrome.downloads.download({ url: image }, resolve);
      });
    }

    chrome.downloads.onDeterminingFilename.removeListener(suggestNewFilename);
    // TODO: Stop loading
  }

  function suggestNewFilename(item, suggest) {
    let newFilename = '';
    if (options.folder_name) {
      newFilename += `${options.folder_name}/`;
    }
    if (options.new_file_name) {
      const regex = /(?:\.([^.]+))?$/;
      const extension = regex.exec(item.filename)[1];
      if (images.length === 1) {
        newFilename += `${options.new_file_name}.${extension}`;
      } else {
        const numberOfDigits = images.length.toString().length;
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
})();
