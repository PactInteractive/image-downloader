import { h } from '../dom';
import { Fieldset } from './Fieldset';
import { Checkbox } from './Checkbox';

export interface FiltersOptions {
  show_url_filter: boolean;
  show_image_width_filter: boolean;
  show_image_height_filter: boolean;
  show_only_images_from_links: boolean;
}

export const Filters = (props: { options: FiltersOptions }) => (
  <Fieldset legend="Filters">
    <Checkbox
      checked={props.options.show_url_filter}
      title="Enables filtering by image URL; supports wildcard and regex"
    >
      Show image URL filter
    </Checkbox>

    <br />

    <Checkbox
      checked={props.options.show_image_width_filter}
      title="Enables filtering by image width"
    >
      Show image width filter
    </Checkbox>

    <br />

    <Checkbox
      checked={props.options.show_image_height_filter}
      title="Enables filtering by image height"
    >
      Show image height filter
    </Checkbox>

    <br />

    <Checkbox
      checked={props.options.show_only_images_from_links}
      title="Enables the option to only show images from direct links on the page; this can be useful on sites like Reddit"
    >
      Show <b>Only images from links</b> option
    </Checkbox>
  </Fieldset>
);
