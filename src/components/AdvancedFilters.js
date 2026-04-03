// @ts-check
import html, { useEffect, useRef } from '../html.js';

import { Checkbox } from './Checkbox.js';
import { defaults, options, updateOption } from './data.js';

export function AdvancedFilters() {
	const widthSliderRef = useSlider('width');
	const heightSliderRef = useSlider('height');

	const setCheckboxOption = (/** @type {keyof import('./data.js').Options} */ key) => (/** @type {Event} */ e) => {
		updateOption(key, /** @type {HTMLInputElement} */ (e.currentTarget).checked);
	};

	return html`
		<div class="p-2 pt-0">
			<table class="w-full tabular-nums">
				<colgroup>
					<col class="w-10" />
					<col class="w-22" />
					<col />
					<col class="w-18" />
				</colgroup>

				<tr>
					<td class="pb-0.5">Width:</td>

					<td>
						<label
							class="${options.value?.filter_min_width_enabled ? '' : 'text-slate-500'} flex items-center justify-end"
							title=${getSliderCheckboxTooltip(options.value?.filter_min_width_enabled)}
						>
							<small>${options.value?.filter_min_width}px ≤</small>
							<input
								type="checkbox"
								checked=${options.value?.filter_min_width_enabled}
								onChange=${setCheckboxOption('filter_min_width_enabled')}
							/>
						</label>
					</td>

					<td class="px-4 py-1.5">
						<div ref=${widthSliderRef}></div>
					</td>

					<td>
						<label
							class="${options.value?.filter_max_width_enabled
								? ''
								: 'text-slate-500'} flex items-center justify-start text-nowrap"
							title=${getSliderCheckboxTooltip(options.value?.filter_max_width_enabled)}
						>
							<input
								type="checkbox"
								checked=${options.value?.filter_max_width_enabled}
								onChange=${setCheckboxOption('filter_max_width_enabled')}
							/>
							<small>≤ ${options.value?.filter_max_width}px</small>
						</label>
					</td>
				</tr>

				<tr>
					<td class="pb-0.5">Height:</td>

					<td>
						<label
							class="${options.value?.filter_min_height_enabled
								? ''
								: 'text-slate-500'} flex items-center justify-end text-nowrap"
							title=${getSliderCheckboxTooltip(options.value?.filter_min_height_enabled)}
						>
							<small>${options.value?.filter_min_height}px ≤</small>
							<input
								type="checkbox"
								checked=${options.value?.filter_min_height_enabled}
								onChange=${setCheckboxOption('filter_min_height_enabled')}
							/>
						</label>
					</td>

					<td class="px-4 py-1.5">
						<div ref=${heightSliderRef}></div>
					</td>

					<td>
						<label
							class="${options.value?.filter_max_height_enabled
								? ''
								: 'text-slate-500'} flex items-center justify-start text-nowrap"
							title=${getSliderCheckboxTooltip(options.value?.filter_max_height_enabled)}
						>
							<input
								type="checkbox"
								checked=${options.value?.filter_max_height_enabled}
								onChange=${setCheckboxOption('filter_max_height_enabled')}
							/>
							<small>≤ ${options.value?.filter_max_height}px</small>
						</label>
					</td>
				</tr>
			</table>

			<div class="flex gap-3">
				<${Checkbox}
					class="py-1"
					title="Attempt to deduplicate images by keeping only the highest resolution and best format"
					checked=${options.value?.only_unique_images}
					onChange=${setCheckboxOption('only_unique_images')}
				>
					Only unique
				<//>

				<${Checkbox}
					class="py-1"
					title="Only show images from direct links on the page; useful on some websites"
					checked=${options.value?.only_images_from_links}
					onChange=${setCheckboxOption('only_images_from_links')}
				>
					Only links
				<//>
			</div>
		</div>
	`;
}

function useSlider(/** @type {'width' | 'height'} */ dimension) {
	const sliderRef = useRef(/** @type {HTMLDivElement | null} */ (null));

	useEffect(() => {
		const slider = sliderRef.current;
		if (!slider) return;

		noUiSlider.create(slider, {
			behaviour: 'extend-tap',
			connect: true,
			format: {
				from: (/** @type {string} */ value) => parseInt(value, 10),
				to: (/** @type {string} */ value) => parseInt(value, 10).toString(),
			},
			range: {
				min: (options.value || defaults)[`filter_min_${dimension}_default`],
				max: (options.value || defaults)[`filter_max_${dimension}_default`],
			},
			step: 10,
			start: [
				(options.value || defaults)[`filter_min_${dimension}`],
				(options.value || defaults)[`filter_max_${dimension}`],
			],
		});

		slider.noUiSlider?.on('update', (/** @type [number, number] */ [min, max]) => {
			// TODO: Batch
			updateOption(`filter_min_${dimension}`, min);
			updateOption(`filter_max_${dimension}`, max);
		});

		return () => {
			if (slider.noUiSlider) {
				slider.noUiSlider.destroy();
			}
		};
	}, []);

	useEffect(() => {
		const slider = sliderRef.current;
		if (!slider) return;

		if (options.value?.[`filter_min_${dimension}_enabled`] || options.value?.[`filter_max_${dimension}_enabled`]) {
			slider.removeAttribute('disabled');
		} else {
			slider.setAttribute('disabled', 'true');
		}
	}, [options.value?.[`filter_min_${dimension}_enabled`], options.value?.[`filter_max_${dimension}_enabled`]]);

	useDisableSliderHandle(
		() => sliderRef.current?.querySelectorAll('.noUi-origin')[0],
		options.value?.[`filter_min_${dimension}_enabled`]
	);

	useDisableSliderHandle(
		() => sliderRef.current?.querySelectorAll('.noUi-origin')[1],
		options.value?.[`filter_max_${dimension}_enabled`]
	);

	return sliderRef;
}

function useDisableSliderHandle(
	/** @type {() => Element | undefined} */ getHandle,
	/** @type {boolean | undefined} */ enabled,
	tooltip = 'Click the checkbox next to this slider to enable it'
) {
	useEffect(() => {
		const handle = getHandle();
		if (!handle) return;

		if (enabled) {
			handle.removeAttribute('disabled');
			handle.removeAttribute('title');
		} else {
			handle.setAttribute('disabled', 'true');
			handle.setAttribute('title', tooltip);
		}
	}, [enabled]);
}

const getSliderCheckboxTooltip = (/** @type {boolean | undefined} */ enabled) =>
	`Click this checkbox to ${enabled ? 'disable' : 'enable'} filtering by this value`;
