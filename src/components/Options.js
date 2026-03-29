import html, { useState } from '../html.js';

import { Checkbox } from '../components/Checkbox.js';

const getInitialOptions = () =>
  Object.fromEntries(
    Object.keys(localStorage)
      .filter((key) => !key.endsWith('_default'))
      .map((key) => [key, localStorage[key]])
  );

export const Options = () => {
  const [options, setOptions] = useState(getInitialOptions);

  const setCheckboxOption =
    (key) =>
      ({ currentTarget: { checked } }) => {
        const value = checked.toString();
        setOptions((options) => ({ ...options, [key]: value }));
        localStorage.setItem(key, value);
      };

  const setValueOption =
    (key) =>
      ({ currentTarget: { value } }) => {
        setOptions((options) => ({ ...options, [key]: value }));
        localStorage.setItem(key, value);
      };

  return html`
		<fieldset>
			<div class="flex flex-col gap-2 px-3 py-2">
				<${Checkbox}
					id="show_download_confirmation_checkbox"
					title="Requires confirmation when you press the Download button"
					checked="${options.show_download_confirmation === 'true'}"
					onChange=${setCheckboxOption('show_download_confirmation')}
				>
					<span>Show download confirmation</span>
				<//>

				<${Checkbox}
					id="show_file_renaming_checkbox"
					title="Lets you specify a new file name for downloaded files"
					checked="${options.show_file_renaming === 'true'}"
					onChange=${setCheckboxOption('show_file_renaming')}
				>
					<span>Show file renaming textbox</span>
				<//>
			</div>

			<hr class="border-slate-300" />

			<div class="flex flex-col gap-2 px-3 py-2">
				<${Checkbox}
					id="show_image_url_checkbox"
					title="Displays the URL above each image"
					checked="${options.show_image_url === 'true'}"
					onChange=${setCheckboxOption('show_image_url')}
				>
					<span>Show the <b>URL</b> on hover</span>
				<//>

				<${Checkbox}
					id="show_image_resolution_checkbox"
					title="Displays the natural resolution (e.g., 1920×1080) of each image"
					checked="${options.show_image_resolution === 'true'}"
					onChange=${setCheckboxOption('show_image_resolution')}
				>
					<span>Show the <b>resolution</b></span>
				<//>

				<${Checkbox}
					id="show_open_image_button_checkbox"
					title="Displays a button next to each image to open it in a new tab"
					checked="${options.show_open_image_button === 'true'}"
					onChange=${setCheckboxOption('show_open_image_button')}
				>
					<span>Show the <b>Open</b> button on hover</span>
				<//>

				<${Checkbox}
					id="show_download_image_button_checkbox"
					title="Displays a button next to each image to individually download it. This download does not require confirmation, even if you've enabled the confirmation option."
					checked="${options.show_download_image_button === 'true'}"
					onChange=${setCheckboxOption('show_download_image_button')}
				>
					<span>Show the <b>Download</b> button on hover</span>
				<//>
			</div>

      <hr class="border-slate-300" />

      <div class="flex flex-col gap-2 px-3 py-2">
        <label>
          Columns:
          <input
            id="columns_numberbox"
            type="number"
            required
            min="1"
            max="10"
            class="w-20 rounded border border-slate-300 px-2 py-1"
            value="${options.columns}"
            onChange=${setValueOption('columns')}
          />
        </label>
      </div>
		</fieldset>
	`;
};
