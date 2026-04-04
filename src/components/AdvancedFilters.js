// @ts-check
import html, { useEffect, useRef } from '../html.js';
import { setToCheckboxValue } from '../utils.js';

import noUiSlider from '../../lib/nouislider.mjs';
import { Checkbox } from './Checkbox.js';
import {
	defaults,
	filterMaxHeight,
	filterMaxHeightEnabled,
	filterMaxWidth,
	filterMaxWidthEnabled,
	filterMinHeight,
	filterMinHeightEnabled,
	filterMinWidth,
	filterMinWidthEnabled,
	onlyImagesFromLinks,
	onlyUniqueImages,
} from './data.js';

export function AdvancedFilters() {
	const widthSliderRef = useSlider('width');
	const heightSliderRef = useSlider('height');

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
							class="${filterMinWidthEnabled.value ? '' : 'text-slate-500'} flex items-center justify-end"
							title=${getSliderCheckboxTooltip(filterMinWidthEnabled.value)}
						>
							<small>${filterMinWidth.value}px ≤</small>
							<input
								type="checkbox"
								checked=${filterMinWidthEnabled.value}
								onChange=${setToCheckboxValue(filterMinWidthEnabled)}
							/>
						</label>
					</td>

					<td class="px-4 py-1.5">
						<div ref=${widthSliderRef}></div>
					</td>

					<td>
						<label
							class="${filterMaxWidthEnabled.value ? '' : 'text-slate-500'} flex items-center justify-start text-nowrap"
							title=${getSliderCheckboxTooltip(filterMaxWidthEnabled.value)}
						>
							<input
								type="checkbox"
								checked=${filterMaxWidthEnabled.value}
								onChange=${setToCheckboxValue(filterMaxWidthEnabled)}
							/>
							<small>≤ ${filterMaxWidth.value}px</small>
						</label>
					</td>
				</tr>

				<tr>
					<td class="pb-0.5">Height:</td>

					<td>
						<label
							class="${filterMinHeightEnabled.value ? '' : 'text-slate-500'} flex items-center justify-end text-nowrap"
							title=${getSliderCheckboxTooltip(filterMinHeightEnabled.value)}
						>
							<small>${filterMinHeight.value}px ≤</small>
							<input
								type="checkbox"
								checked=${filterMinHeightEnabled.value}
								onChange=${setToCheckboxValue(filterMinHeightEnabled)}
							/>
						</label>
					</td>

					<td class="px-4 py-1.5">
						<div ref=${heightSliderRef}></div>
					</td>

					<td>
						<label
							class="${filterMaxHeightEnabled.value
								? ''
								: 'text-slate-500'} flex items-center justify-start text-nowrap"
							title=${getSliderCheckboxTooltip(filterMaxHeightEnabled.value)}
						>
							<input
								type="checkbox"
								checked=${filterMaxHeightEnabled.value}
								onChange=${setToCheckboxValue(filterMaxHeightEnabled)}
							/>
							<small>≤ ${filterMaxHeight.value}px</small>
						</label>
					</td>
				</tr>
			</table>

			<div class="flex gap-3">
				<${Checkbox}
					class="py-1"
					title="Attempt to deduplicate images by keeping only the highest resolution and best format"
					checked=${onlyUniqueImages.value}
					onChange=${setToCheckboxValue(onlyUniqueImages)}
				>
					Only unique
				<//>

				<${Checkbox}
					class="py-1"
					title="Only show images from direct links on the page; useful on some websites"
					checked=${onlyImagesFromLinks.value}
					onChange=${setToCheckboxValue(onlyImagesFromLinks)}
				>
					Only links
				<//>
			</div>
		</div>
	`;
}

/** @typedef {HTMLDivElement & { noUiSlider?: { on(event: string, callback: Function): void; destroy(): void } }} SliderElement */
function useSlider(/** @type {'width' | 'height'} */ dimension) {
	const sliderRef = useRef(/** @type {SliderElement | null} */ (null));

	useEffect(() => {
		const slider = sliderRef.current;
		if (!slider) return;

		const minDefault = dimension === 'width' ? defaults.filter_min_width : defaults.filter_min_height;
		const maxDefault = dimension === 'width' ? defaults.filter_max_width : defaults.filter_max_height;
		const minSignal = dimension === 'width' ? filterMinWidth : filterMinHeight;
		const maxSignal = dimension === 'width' ? filterMaxWidth : filterMaxHeight;

		noUiSlider.create(slider, {
			behaviour: 'extend-tap',
			connect: true,
			format: {
				from: (/** @type {string} */ value) => parseInt(value, 10),
				to: (/** @type {string} */ value) => parseInt(value, 10).toString(),
			},
			range: {
				min: minDefault,
				max: maxDefault,
			},
			step: 10,
			start: [minSignal.value, maxSignal.value],
		});

		slider.noUiSlider?.on('update', (/** @type [number, number] */ [min, max]) => {
			minSignal.value = min;
			maxSignal.value = max;
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

		const minEnabled = dimension === 'width' ? filterMinWidthEnabled.value : filterMinHeightEnabled.value;
		const maxEnabled = dimension === 'width' ? filterMaxWidthEnabled.value : filterMaxHeightEnabled.value;

		if (minEnabled || maxEnabled) {
			slider.removeAttribute('disabled');
		} else {
			slider.setAttribute('disabled', 'true');
		}
	}, [
		filterMinWidthEnabled.value,
		filterMaxWidthEnabled.value,
		filterMinHeightEnabled.value,
		filterMaxHeightEnabled.value,
	]);

	useDisableSliderHandle(
		() => sliderRef.current?.querySelectorAll('.noUi-origin')[0],
		dimension === 'width' ? filterMinWidthEnabled.value : filterMinHeightEnabled.value
	);

	useDisableSliderHandle(
		() => sliderRef.current?.querySelectorAll('.noUi-origin')[1],
		dimension === 'width' ? filterMaxWidthEnabled.value : filterMaxHeightEnabled.value
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
