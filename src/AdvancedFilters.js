import html, { useEffect, useRef, useState } from './html.js';
import { Checkbox } from './components/Checkbox.js';

// Currently a singleton. Should rewrite once we switch to a full-fledged rendering library
export const AdvancedFilters = ({ options, setOptions }) => {
  const widthSliderRef = useRef(null);
  useEffect(() => {
    initializeFilter(widthSliderRef.current, 'width');
  }, []);

  const heightSliderRef = useRef(null);
  useEffect(() => {
    initializeFilter(heightSliderRef.current, 'height');
  }, []);

  const initializeFilter = (slider, dimension) => {
    if (!slider) return;

    slider.noUiSlider?.destroy();

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
  };

  // TODO: Extract and reuse in `options.js` and other components
  const setCheckboxOption = (key) => ({ currentTarget: { checked } }) => {
    setOptions((options) => ({ ...options, [key]: checked.toString() }));
  };

  return html`
    <div>
      <table class="grid">
        <colgroup>
          <col style=${{ width: '45px' }} />
          <col style=${{ width: '40px' }} />
          <col style=${{ width: '10px' }} />
          <col />
          <col style=${{ width: '10px' }} />
          <col style=${{ width: '40px' }} />
        </colgroup>

        <tr id="image_width_filter">
          <td>Width:</td>

          <td style=${{ textAlign: 'right' }}>
            <label
              for="image_width_filter_min_checkbox"
              class=${options.filter_min_width_enabled === 'true'
                ? ''
                : 'light'}
            >
              <small>${options.filter_min_width}px</small>
            </label>
          </td>

          <td>
            <input
              type="checkbox"
              id="image_width_filter_min_checkbox"
              checked=${options.filter_min_width_enabled === 'true'}
              onChange=${setCheckboxOption('filter_min_width_enabled')}
            />
          </td>

          <td style=${{ padding: '0 8px' }}>
            <div ref=${widthSliderRef}></div>
          </td>

          <td>
            <input
              type="checkbox"
              id="image_width_filter_max_checkbox"
              checked=${options.filter_max_width_enabled === 'true'}
              onChange=${setCheckboxOption('filter_max_width_enabled')}
            />
          </td>

          <td style=${{ textAlign: 'right' }}>
            <label
              for="image_width_filter_max_checkbox"
              class=${options.filter_max_width_enabled === 'true'
                ? ''
                : 'light'}
            >
              <small>${options.filter_max_width}px</small>
            </label>
          </td>
        </tr>

        <tr id="image_height_filter">
          <td>Height:</td>

          <td style=${{ textAlign: 'right' }}>
            <label
              for="image_height_filter_min_checkbox"
              class=${options.filter_min_height_enabled === 'true'
                ? ''
                : 'light'}
            >
              <small>${options.filter_min_height}px</small>
            </label>
          </td>

          <td>
            <input
              type="checkbox"
              id="image_height_filter_min_checkbox"
              checked=${options.filter_min_height_enabled === 'true'}
              onChange=${setCheckboxOption('filter_min_height_enabled')}
            />
          </td>

          <td style=${{ padding: '0 8px' }}>
            <div ref=${heightSliderRef}></div>
          </td>

          <td>
            <input
              type="checkbox"
              id="image_height_filter_max_checkbox"
              checked=${options.filter_max_height_enabled === 'true'}
              onChange=${setCheckboxOption('filter_max_height_enabled')}
            />
          </td>

          <td style=${{ textAlign: 'right' }}>
            <label
              for="image_height_filter_max_checkbox"
              class=${options.filter_max_height_enabled === 'true'
                ? ''
                : 'light'}
            >
              <small>${options.filter_max_height}px</small>
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
