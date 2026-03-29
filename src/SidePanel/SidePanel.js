import html, { render, useState, useCallback } from '../html.js';
import { App } from '../components/App.js';

render(html`<${App} />`, document.querySelector('main'));
