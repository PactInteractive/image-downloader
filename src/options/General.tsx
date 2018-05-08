import { h } from '../dom';
import { Fieldset } from './Fieldset';
import { Checkbox } from './Checkbox';

export class GeneralOptions {
  show_download_confirmation = true;
  show_download_notification = true;
  show_file_renaming = false;
}

export const General = (props: { options: GeneralOptions }) => (
  <Fieldset legend="General">
    <Checkbox
      checked={props.options.show_download_confirmation}
      title="Requires confirmation when you press the Download button"
    >
      Show download confirmation
    </Checkbox>

    <br />

    <Checkbox
      checked={props.options.show_download_notification}
      title="Flashes a message to let you know your download is starting"
    >
      Show <b>downloading</b> message
    </Checkbox>

    <br />

    <Checkbox
      checked={props.options.show_file_renaming}
      title="Lets you specify a new file name for downloaded files"
    >
      Show file renaming textbox
    </Checkbox>
  </Fieldset>
);
