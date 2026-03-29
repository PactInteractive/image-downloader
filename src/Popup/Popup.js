import html, { render } from '../html.js';
import { App } from '../components/App.js';

async function openSidebar() {
  try {
    const currentWindow = await new Promise((resolve) => {
      chrome.windows.getCurrent(resolve);
    });

    await chrome.sidePanel.open({ windowId: currentWindow.id });
    window.close();
  } catch (error) {
    console.error('Error opening side panel:', error);
  }
}

render(html`<${App} openSidebar=${openSidebar} />`, document.querySelector('main'));
