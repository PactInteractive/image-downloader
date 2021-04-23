import html from './html.js';
import { Checkbox } from './Checkbox.js';

// Currently a singleton. Should rewrite once we switch to a full-fledged rendering library
export const AdvancedFilters = ({ filterImages, state }) => {
  AdvancedFilters.id = 'advanced_filters_container';

  AdvancedFilters.initializeFilters = () => {
    initializeFilter('width');
    initializeFilter('height');
  };

  const initializeFilter = (dimension) => {
    const slider = document.querySelector(`#image_${dimension}_filter_slider`);
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
        min: parseInt(state[`filter_min_${dimension}_default`], 10),
        max: parseInt(state[`filter_max_${dimension}_default`], 10),
      },
      step: 10,
      start: [
        state[`filter_min_${dimension}`],
        state[`filter_max_${dimension}`],
      ],
    });

    slider.noUiSlider.on('update', ([min, max]) => {
      $(`#image_${dimension}_filter_min`).html(`${min}px`);
      state[`filter_min_${dimension}`] = min;

      $(`#image_${dimension}_filter_max`).html(`${max}px`);
      state[`filter_max_${dimension}`] = max;

      filterImages();
    });

    toggleDimensionFilter(
      document.querySelector(`#image_${dimension}_filter_min`),
      `filter_min_${dimension}_enabled`
    );

    toggleDimensionFilter(
      document.querySelector(`#image_${dimension}_filter_max`),
      `filter_max_${dimension}_enabled`
    );
  };

  const toggleDimensionFilter = (element, option, value) => {
    if (value !== undefined) {
      state[option] = value;
    }
    $(element).toggleClass('light', state[option] !== 'true');
    filterImages();
  };

  return html`
    <div id=${AdvancedFilters.id}>
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
            <label for="image_width_filter_min_checkbox">
              <small id="image_width_filter_min"></small>
            </label>
          </td>

          <td>
            <input
              type="checkbox"
              id="image_width_filter_min_checkbox"
              checked=${state[`filter_min_width_enabled`] === 'true'}
              onChange=${(e) => {
                toggleDimensionFilter(
                  document.querySelector('#image_width_filter_min'),
                  `filter_min_width_enabled`,
                  e.currentTarget.checked
                );
              }}
            />
          </td>

          <td style=${{ padding: '0 8px' }}>
            <div id="image_width_filter_slider"></div>
          </td>

          <td>
            <input
              type="checkbox"
              id="image_width_filter_max_checkbox"
              checked=${state[`filter_max_width_enabled`] === 'true'}
              onChange=${(e) => {
                toggleDimensionFilter(
                  document.querySelector('#image_width_filter_max'),
                  `filter_max_width_enabled`,
                  e.currentTarget.checked
                );
              }}
            />
          </td>

          <td style=${{ textAlign: 'right' }}>
            <label for="image_width_filter_max_checkbox">
              <small id="image_width_filter_max"></small>
            </label>
          </td>
        </tr>

        <tr id="image_height_filter">
          <td>Height:</td>

          <td style=${{ textAlign: 'right' }}>
            <label for="image_height_filter_min_checkbox">
              <small id="image_height_filter_min"></small>
            </label>
          </td>

          <td>
            <input
              type="checkbox"
              id="image_height_filter_min_checkbox"
              checked=${state[`filter_min_height_enabled`] === 'true'}
              onChange=${(e) => {
                toggleDimensionFilter(
                  document.querySelector('#image_height_filter_min'),
                  `filter_min_height_enabled`,
                  e.currentTarget.checked
                );
              }}
            />
          </td>

          <td style=${{ padding: '0 8px' }}>
            <div id="image_height_filter_slider"></div>
          </td>

          <td>
            <input
              type="checkbox"
              id="image_height_filter_max_checkbox"
              checked=${state[`filter_max_height_enabled`] === 'true'}
              onChange=${(e) => {
                toggleDimensionFilter(
                  document.querySelector('#image_height_filter_max'),
                  `filter_max_height_enabled`,
                  e.currentTarget.checked
                );
              }}
            />
          </td>

          <td style=${{ textAlign: 'right' }}>
            <label for="image_height_filter_max_checkbox">
              <small id="image_height_filter_max"></small>
            </label>
          </td>
        </tr>
      </table>

      <${Checkbox}
        title="Only show images from direct links on the page; this can be useful on sites like Reddit"
        checked=${state.only_images_from_links === 'true'}
        onChange=${(e) => {
          state.only_images_from_links = e.currentTarget.checked;
          filterImages();
        }}
      >
        Only images from links
      <//>
    </div>
  `;
};
