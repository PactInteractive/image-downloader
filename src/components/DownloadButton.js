import html from '../html.js';
import { Checkbox } from './Checkbox.js';

export function DownloadButton({ disabled, loading, ...props }) {
	const tooltipText = disabled
		? 'Select some images to download first'
		: loading
			? 'If you want, you can close the extension popup\nwhile the images are downloading!'
			: '';

	return html`
    <button
			class="bg-sky-600 text-white px-2 ${loading ? 'loading' : ''}"
      type="button"
      disabled=${disabled || loading}
      title=${tooltipText}
      ...${props}
    >${loading ? '•••' : 'Download'}</button>
  `;
};
