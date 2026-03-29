import html, { render, useCallback } from '../html.js';
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

const openSidebarButton = html`
  <button
    id="open_sidebar_button"
    title="Open in Sidebar"
    onClick=${openSidebar}
  >
    <img src="/images/sidebar.svg" />
  </button>
`;

render(html`<${App} sidebarButton=${openSidebarButton} />`, document.querySelector('main'));
