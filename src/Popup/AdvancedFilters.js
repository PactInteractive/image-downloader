import html, { useEffect, useRef } from '../html.js';
import { Checkbox } from '../components/Checkbox.js';

// Currently a singleton. Should rewrite once we switch to a full-fledged rendering library
export const AdvancedFilters = ({ options, setOptions }) => {
  const widthSliderRef = useSlider('width', options, setOptions);
  const heightSliderRef = useSlider('height', options, setOptions);

  // TODO: Extract and reuse in `Options.js` and other components
  const setCheckboxOption = (key) => ({ currentTarget: { checked } }) => {
    setOptions((options) => ({ ...options, [key]: checked.toString() }));
  };

  return html`
    <div>
      <table class="grid">
        <colgroup>
          <col style=${{ width: '45px' }} />
          <col style=${{ width: '70px' }} />
          <col />
          <col style=${{ width: '70px' }} />
        </colgroup>

        <tr id="image_width_filter">
          <td>Width:</td>

          <td>
            <label
              class=${options.filter_min_width_enabled === 'true'
                ? ''
                : 'light'}
              style=${{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
              title=${getSliderCheckboxTooltip(
                options.filter_min_width_enabled
              )}
            >
              <small>≥ ${options.filter_min_width}px</small>
              <${SliderCheckbox}
                options=${options}
                optionKey="filter_min_width_enabled"
                setCheckboxOption=${setCheckboxOption}
              />
            </label>
          </td>

          <td style=${{ padding: '1px 8px 0 8px' }}>
            <div ref=${widthSliderRef}></div>
          </td>

          <td>
            <label
              class=${options.filter_max_width_enabled === 'true'
                ? ''
                : 'light'}
              style=${{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              title=${getSliderCheckboxTooltip(
                options.filter_max_width_enabled
              )}
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

        <tr id="image_height_filter">
          <td>Height:</td>

          <td>
            <label
              class=${options.filter_min_height_enabled === 'true'
                ? ''
                : 'light'}
              style=${{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
              title=${getSliderCheckboxTooltip(
                options.filter_min_height_enabled
              )}
            >
              <small>≥ ${options.filter_min_height}px</small>
              <${SliderCheckbox}
                options=${options}
                optionKey="filter_min_height_enabled"
                setCheckboxOption=${setCheckboxOption}
              />
            </label>
          </td>

          <td style=${{ padding: '1px 8px 0 8px' }}>
            <div ref=${heightSliderRef}></div>
          </td>

          <td>
            <label
              class=${options.filter_max_height_enabled === 'true'
                ? ''
                : 'light'}
              style=${{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              title=${getSliderCheckboxTooltip(
                options.filter_max_height_enabled
              )}
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

      <${Checkbox}
        title="Only show images from direct links on the page; useful on sites like Reddit"
        checked=${options.only_images_from_links === 'true'}
        onChange=${setCheckboxOption('only_images_from_links')}
      >
        Only images from links
      <//>
    </div>
  `;
};

const SliderCheckbox = ({
  options,
  optionKey,
  setCheckboxOption,
  ...props
}) => {
  const enabled = options[optionKey] === 'true';
  return html`
    <input
      type="checkbox"
      checked=${enabled}
      onChange=${setCheckboxOption(optionKey, setCheckboxOption)}
      ...${props}
    />
  `;
};

const useSlider = (dimension, options, setOptions) => {
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
      start: [
        options[`filter_min_${dimension}`],
        options[`filter_max_${dimension}`],
      ],
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

    if (
      options[`filter_min_${dimension}_enabled`] === 'true' ||
      options[`filter_max_${dimension}_enabled`] === 'true'
    ) {
      slider.removeAttribute('disabled');
    } else {
      slider.setAttribute('disabled', true);
    }
  }, [
    options[`filter_min_${dimension}_enabled`],
    options[`filter_max_${dimension}_enabled`],
  ]);

  useDisableSliderHandle(
    () =>
      sliderRef.current
        ? sliderRef.current.querySelectorAll('.noUi-origin')[0]
        : undefined,
    options[`filter_min_${dimension}_enabled`]
  );

  useDisableSliderHandle(
    () =>
      sliderRef.current
        ? sliderRef.current.querySelectorAll('.noUi-origin')[1]
        : undefined,
    options[`filter_max_${dimension}_enabled`]
  );

  return sliderRef;
};

const useDisableSliderHandle = (
  getHandle,
  option,
  tooltipText = 'Click the checkbox next to this slider to enable it'
) => {
  useEffect(() => {
    const handle = getHandle();
    if (!handle) return;

    if (option === 'true') {
      handle.removeAttribute('disabled');
      handle.removeAttribute('title');
    } else {
      handle.setAttribute('disabled', true);
      handle.setAttribute('title', tooltipText);
    }
  }, [option]);
};

const getSliderCheckboxTooltip = (option) =>
  `Click this checkbox to ${
    option === 'true' ? 'disable' : 'enable'
  } filtering by this value`;
