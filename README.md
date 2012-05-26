Image Downloader
================
If you need to bulk download images from a web page, with this extension you can:
- see all images that the page contains
- filter them by URL; also supports regular expressions
- select which images to download by either using the check box or clicking directly on the image
- customize display width, border and sorting of images
- when you finally press the "Download" button, all selected images are saved to the default download directory of Chrome; if you don't have one, you will have to manually choose the save location for each image

For questions, issues or other feedback, you can contact me here: vdsabev@gmail.com

======== KNOWN ISSUES ========
In the developer version of Google Chrome (v21), pressing "Download" causes a crash because of an issue in the browser itself. There is no known workaround, but only developers and experienced users should be using this version anyway. I apologize for the inconvenience.

========= CHANGE LOG =========
1.0.7:
- removed the desktop notification system that popped up when you press "Download" in favor of a text description that should feel easier to control (through Options) and less intrusive; this should also require less permissions for the extension
- added an option to hide the download notification; most people should understand the download process after only reading it once
- made some minor UI tweaks

1.0.6:
- fixed an issue with multiple unnecessary empty images

1.0.5:
- elements that display an image using the "background-image" CSS property will now also be extracted

1.0.4:
- added a notification that alerts the user when the download process has begun and explains where to look for the files

==============================
Image Downloader uses the tiny (and free) JSS library: https://github.com/Box9/jss

Based on the Google Chrome Extension sample "Download Selected Links":
http://code.google.com/chrome/extensions/samples.html#9e4fd06300ee2b3a171e1f30d1b70f8f10152c2b