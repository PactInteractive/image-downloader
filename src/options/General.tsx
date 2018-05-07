import { h } from '../dom';
import { Fieldset } from './Fieldset';
import { Checkbox } from './Checkbox';

export const General = () => (
  <Fieldset legend="General">
    <Checkbox title="Requires confirmation when you press the Download button">
      Show download confirmation
    </Checkbox>

    <br/>

    <Checkbox title="Flashes a message to let you know your download is starting">
      Show <b>downloading</b> message
    </Checkbox>

    <br/>

    <Checkbox title="Lets you specify a new file name for downloaded files">
      Show file renaming textbox
    </Checkbox>
  </Fieldset>
);
