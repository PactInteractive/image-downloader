import { h } from '../dom';
import { Fieldset } from './Fieldset';
import { Checkbox } from './Checkbox';

export const Filters = () => (
  <Fieldset legend="Filters">
    <Checkbox title="Enables filtering by image URL; supports wildcard and regex">
      Show image URL filter
    </Checkbox>

    <br/>

    <Checkbox title="Enables filtering by image width">
      Show image width filter
    </Checkbox>

    <br/>

    <Checkbox title="Enables filtering by image height">
      Show image height filter
    </Checkbox>

    <br/>

    <Checkbox title="Enables the option to only show images from direct links on the page; this can be useful on sites like Reddit">
      Show <b>Only images from links</b> option
    </Checkbox>
  </Fieldset>
);
