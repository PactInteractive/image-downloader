// @ts-check
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open the options page after install
    chrome.tabs.create({ url: '/src/Options/index.html' });
  } else if (
    details.reason === 'update' &&
    /^(((0|1)\..*)|(2\.(0|1)(\..*)?))$/.test(details.previousVersion)
  ) {
    // Clear data from versions before 2.1 after update
    localStorage.clear();
  }
});
