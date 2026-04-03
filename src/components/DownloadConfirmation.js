// @ts-check
import html from '../html.js';
import { Checkbox } from './Checkbox.js';

export function DownloadConfirmation(
	/** @type {{ numberOfImages: number; onCheckboxChange: (e: Event) => void; onClose: () => void; onConfirm: () => void; }} */ {
		numberOfImages,
		onCheckboxChange,
		onClose,
		onConfirm,
		...props
	}
) {
	return html`
		<div ...${props}>
			<div>
				<p class="my-0.5">Please take a quick look at your browser settings.</p>
				<p class="my-0.5 text-red-600">
					If the <b>Ask where to save each file before downloading</b> option is checked you will get
					<b>${numberOfImages} popup windows</b>!
				</p>
				<p class="my-0.5">For easier downloading we recommend you uncheck that option.</p>
				<p class="my-0.5">Continue with the download?</p>
			</div>

			<div class="flex items-center gap-1">
				<${Checkbox} class="mr-auto" onChange=${onCheckboxChange}> Got it, don't show again <//>

				<button type="button" class="bg-white px-2 hover:bg-slate-50" value="Cancel" onClick=${onClose}>Cancel</button>

				<button
					type="button"
					class="bg-green-500 px-2 text-white hover:bg-green-600"
					onClick=${() => {
						onClose();
						onConfirm();
					}}
				>
					Yes, download
				</button>
			</div>
		</div>
	`;
}
