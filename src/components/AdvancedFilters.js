import html, { useEffect, useRef } from '../html.js';
import { Checkbox } from './Checkbox.js';

export function AdvancedFilters({ options, setOptions }) {
	const widthSliderRef = useSlider('width', options, setOptions);
	const heightSliderRef = useSlider('height', options, setOptions);

	const setCheckboxOption =
		(key) =>
		({ currentTarget: { checked } }) => {
			setOptions((options) => ({ ...options, [key]: checked }));
		};

	return html`
		<div class="p-2 pt-0">
			<table class="w-full tabular-nums">
				<colgroup>
					<col class="w-10" />
					<col class="w-18" />
					<col />
					<col class="w-18" />
				</colgroup>

				<tr>
					<td class="pb-0.5">Width:</td>

					<td>
						<label
							class="${options.filter_min_width_enabled ? '' : 'light'} flex items-center justify-end"
							title=${getSliderCheckboxTooltip(options.filter_min_width_enabled)}
						>
							<small>${options.filter_min_width}px ≤</small>
							<${SliderCheckbox}
								options=${options}
								optionKey="filter_min_width_enabled"
								setCheckboxOption=${setCheckboxOption}
							/>
						</label>
					</td>

					<td class="px-4 py-1.5">
						<div ref=${widthSliderRef}></div>
					</td>

					<td>
						<label
							class="${options.filter_max_width_enabled ? '' : 'light'} flex items-center justify-start"
							title=${getSliderCheckboxTooltip(options.filter_max_width_enabled)}
						>
							<${SliderCheckbox}
								options=${options}
								optionKey="filter_max_width_enabled"
								setCheckboxOption=${setCheckboxOption}
							/>
							<small>≤ ${options.filter_max_width}px</small>
						</label>
					</td>
				</tr>

				<tr>
					<td class="pb-0.5">Height:</td>

					<td>
						<label
							class="${options.filter_min_height_enabled ? '' : 'light'} flex items-center justify-end"
							title=${getSliderCheckboxTooltip(options.filter_min_height_enabled)}
						>
							<small>${options.filter_min_height}px ≤</small>
							<${SliderCheckbox}
								options=${options}
								optionKey="filter_min_height_enabled"
								setCheckboxOption=${setCheckboxOption}
							/>
						</label>
					</td>

					<td class="px-4 py-1.5">
						<div ref=${heightSliderRef}></div>
					</td>

					<td>
						<label
							class="${options.filter_max_height_enabled ? '' : 'light'} flex items-center justify-start"
							title=${getSliderCheckboxTooltip(options.filter_max_height_enabled)}
						>
							<${SliderCheckbox}
								options=${options}
								optionKey="filter_max_height_enabled"
								setCheckboxOption=${setCheckboxOption}
							/>
							<small>≤ ${options.filter_max_height}px</small>
						</label>
					</td>
				</tr>
			</table>

			<div class="flex justify-between gap-2">
				<${Checkbox}
					class="py-1"
					title="Only show images from direct links on the page; useful on sites like Reddit"
					checked=${options.only_images_from_links}
					onChange=${setCheckboxOption('only_images_from_links')}
				>
					Only images from links
				<//>
			</div>
		</div>
	`;
}

function SliderCheckbox({ options, optionKey, setCheckboxOption, ...props }) {
	const enabled = options[optionKey];
	return html`
		<input type="checkbox" checked=${enabled} onChange=${setCheckboxOption(optionKey, setCheckboxOption)} ...${props} />
	`;
}

function useSlider(dimension, options, setOptions) {
	const sliderRef = useRef(null);

	useEffect(() => {
		const slider = sliderRef.current;
		if (!slider) return;

		noUiSlider.create(slider, {
			behaviour: 'extend-tap',
			connect: true,
			format: {
				from: (value) => parseInt(value, 10),
				to: (value) => parseInt(value, 10).toString(),
			},
			range: {
				min: parseInt(options[`filter_min_${dimension}_default`], 10),
				max: parseInt(options[`filter_max_${dimension}_default`], 10),
			},
			step: 10,
			start: [options[`filter_min_${dimension}`], options[`filter_max_${dimension}`]],
		});

		slider.noUiSlider.on('update', ([min, max]) => {
			setOptions((options) => ({
				...options,
				[`filter_min_${dimension}`]: min,
				[`filter_max_${dimension}`]: max,
			}));
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

		if (options[`filter_min_${dimension}_enabled`] || options[`filter_max_${dimension}_enabled`]) {
			slider.removeAttribute('disabled');
		} else {
			slider.setAttribute('disabled', true);
		}
	}, [options[`filter_min_${dimension}_enabled`], options[`filter_max_${dimension}_enabled`]]);

	useDisableSliderHandle(
		() => (sliderRef.current ? sliderRef.current.querySelectorAll('.noUi-origin')[0] : undefined),
		options[`filter_min_${dimension}_enabled`]
	);

	useDisableSliderHandle(
		() => (sliderRef.current ? sliderRef.current.querySelectorAll('.noUi-origin')[1] : undefined),
		options[`filter_max_${dimension}_enabled`]
	);

	return sliderRef;
}

function useDisableSliderHandle(
	getHandle,
	option,
	tooltipText = 'Click the checkbox next to this slider to enable it'
) {
	useEffect(() => {
		const handle = getHandle();
		if (!handle) return;

		if (option) {
			handle.removeAttribute('disabled');
			handle.removeAttribute('title');
		} else {
			handle.setAttribute('disabled', true);
			handle.setAttribute('title', tooltipText);
		}
	}, [option]);
}

const getSliderCheckboxTooltip = (option) =>
	`Click this checkbox to ${option ? 'disable' : 'enable'} filtering by this value`;
