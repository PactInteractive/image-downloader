Image Downloader
================
If you need to bulk download images from a web page, with this extension you can:
- See images that the page contains and links to
- Filter them by URL; also supports regular expressions
- Select which images to download either by using checkboxes or by clicking directly on the image
- Customize display width, border and sorting of images

Unfortunately it's not possible to control Chrome's download manager. Google does not give developers that kind of access...yet. These features are experimental and do not work properly. For more information on Chrome's progress on the development, please refer to this page: http://code.google.com/chrome/extensions/experimental.downloads.html

When you finally press the "Download" button, all selected images are saved to the default download directory of Chrome. If you don't have one, you will have to manually choose the save location for each image

WARNING: it is not recommended to attempt to download too many images at once if you haven't set up a default download directory for Chrome.

Known Issues
================
This extension can't always extract the full-resolution images that open when you click a photo (e.g. in Facebook albums). If you need that kind of functionality, even if you can't download many photos at once with it, I highly recommend the Hover Zoom extension: https://chrome.google.com/webstore/detail/nonjdcjchghhkdoolnlbekcfllmednbl

In the developer version of Google Chrome (v21), pressing "Download" used to cause a crash because of an issue in the browser itself. There is no known workaround, but only developers and experienced users should be using this version anyway. I apologize to any affected users for the inconvenience. This issue has been fixed in Chrome as of version 21.0.1163.0 dev-m.

Change Log
================
1.1:
- Added the URL above the image itself and a checkbox in options to toggle it
- Added wildcard filter mode (alongside normal and regex)
- The state of the selected filters will now be saved
- Moved the "Sort by URL" option to the filters
- Added a "Clear Data" button to options page. While the extension does not use a lot of local storage yet, someone might appreciate the option.
- Refactored a lot of code, especially the use of local storage

1.0.13:
- Added a notification to let the user know that download has started
- Added some animations and polished the options notifications a bit more
- Fixed some event handlers that were being attached multiple times

1.0.12:
- Migrated to jQuery
- Implemented indeterminate state for "All" checkbox
- The "Download" button will now be disabled if no images are checked
- Fixed a bug with reseting options - now the user can choose to save the reset values or simply cancel the reset by reloading the page - just like it says in the notification

1.0.11:
- Changed the download mechanism to support Chrome v21+
- Added an "Only show linked images" filter option that can be useful when you only want to download images that are in a URL on the page.

1.0.10:
- Added a download confirmation

1.0.9:
- The number of images will now be displayed next to the "All" checkbox

1.0.8:
- Added detection of image URLs in anchor tags; note that this feature will not detect URLs that don't have .jpg, .jpeg, .gif or .png file extensions - it relies on a regular expression as to avoid possibly sending hundreds of requests to external servers

1.0.7:
- Removed the desktop notification system that popped up when you press "Download" in favor of a text description that should feel easier to control (through Options) and less intrusive; this should also require less permissions for the extension
- Added an option to hide the download notification; most people should understand the download process after only reading it once
- Made some minor UI tweaks

1.0.6:
- Fixed an issue with multiple unnecessary empty images

1.0.5:
- Elements that display an image using the "background-image" CSS property will now also be extracted

1.0.4:
- Added a notification that alerts the user when the download process has begun and explains where to look for the files

Credits
================
Based on the Google Chrome Extension sample "Download Selected Links":
http://code.google.com/chrome/extensions/samples.html#9e4fd06300ee2b3a171e1f30d1b70f8f10152c2b
