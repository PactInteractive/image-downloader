import { h } from '../dom';
import { Checkbox } from './Checkbox';
import { Fieldset } from './Fieldset';
import { InputEvent } from './InputEvent';
import { SetOption } from './SetOption';

export interface FiltersOptions {
  show_url_filter: boolean;
  show_image_width_filter: boolean;
  show_image_height_filter: boolean;
  show_only_images_from_links: boolean;
}

export const Filters = (props: { options: FiltersOptions, setOption: SetOption }) => (
  <Fieldset legend="Filters">
    <Checkbox
      checked={props.options.show_url_filter}
      onChange={(e: InputEvent) => props.setOption('show_url_filter', e.currentTarget.checked)}
      title="Enables filtering by image URL; supports wildcard and regex"
    >
      Show image URL filter
    </Checkbox>

    <br />

    <Checkbox
      checked={props.options.show_image_width_filter}
      onChange={(e: InputEvent) => props.setOption('show_image_width_filter', e.currentTarget.checked)}
      title="Enables filtering by image width"
    >
      Show image width filter
    </Checkbox>

    <br />

    <Checkbox
      checked={props.options.show_image_height_filter}
      onChange={(e: InputEvent) => props.setOption('show_image_height_filter', e.currentTarget.checked)}
      title="Enables filtering by image height"
    >
      Show image height filter
    </Checkbox>

    <br />

    <Checkbox
      checked={props.options.show_only_images_from_links}
      onChange={(e: InputEvent) => props.setOption('show_only_images_from_links', e.currentTarget.checked)}
      title="Enables the option to only show images from direct links on the page; this can be useful on sites like Reddit"
    >
      Show <b>Only images from links</b> option
    </Checkbox>
  </Fieldset>
);
