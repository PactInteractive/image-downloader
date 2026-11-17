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
		<div class="-m-2 bg-amber-100 p-2 text-amber-900 dark:bg-amber-950 dark:text-amber-100" ...${props}>
			<div class="flex items-start gap-2">
				<svg class="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" viewBox="0 0 512 512" aria-hidden="true">
					<path
						d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"
					/>
				</svg>

				<div>
					<p class="my-0.5 font-medium">Please take a quick look at your browser settings.</p>
					<p class="my-0.5">
						If the <b>Ask where to save each file before downloading</b> option is checked you will get${' '}
						<b>${numberOfImages} popup windows</b>!
					</p>
					<p class="my-0.5">For easier downloading we recommend you uncheck that option.</p>
					<p class="my-0.5">Continue with the download?</p>
				</div>
			</div>

			<div class="mt-2 flex items-center gap-1 border-t border-amber-200 pt-2 dark:border-amber-900">
				<${Checkbox} class="mr-auto accent-sky-600 dark:accent-sky-400" onChange=${onCheckboxChange}>
					Got it, don't show again
				<//>

				<button
					type="button"
					class="border-amber-300 bg-white px-2 text-amber-950 shadow-sm hover:bg-amber-50 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-50 dark:hover:bg-amber-800"
					value="Cancel"
					onClick=${onClose}
				>
					Cancel
				</button>

				<button
					type="button"
					class="border-sky-800 bg-sky-700 px-2 text-white shadow-sm hover:bg-sky-800 active:bg-sky-900 dark:border-sky-500 dark:bg-sky-600 dark:hover:bg-sky-500"
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
