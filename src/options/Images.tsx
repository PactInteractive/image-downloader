import './Images.css';

import { h } from '../dom';
import { Checkbox } from './Checkbox';
import { Color } from './Color';
import { Fieldset } from './Fieldset';
import { InputEvent } from './InputEvent';
import { Number } from './Number';
import { SetOption } from './SetOption';

export interface ImagesOptions {
  show_image_url: boolean;
  show_open_image_button: boolean;
  show_download_image_button: boolean;
  columns: number;
  image_min_width: number;
  image_max_width: number;
  image_border_width: number;
  image_border_color: string;
}

export const Images = (props: { options: ImagesOptions; setOption: SetOption }) => (
  <Fieldset legend="Images">
    <Checkbox
      checked={props.options.show_image_url}
      onChange={(e: InputEvent) => props.setOption('show_image_url', e.currentTarget.checked)}
      title="Displays the URL above each image"
    >
      Show the URL textbox
    </Checkbox>

    <br />

    <Checkbox
      checked={props.options.show_open_image_button}
      onChange={(e: InputEvent) =>
        props.setOption('show_open_image_button', e.currentTarget.checked)
      }
      title="Displays a button next to each image to open it in a new tab"
    >
      Show the <b>open</b> button
    </Checkbox>

    <br />

    <Checkbox
      checked={props.options.show_download_image_button}
      onChange={(e: InputEvent) => props.setOption('show_download_image_button', e.currentTarget.checked)}
      title="Displays a button next to each image to individually download it. This download does not require confirmation, even if you've enabled the confirmation option."
    >
      Show the <b>download</b> button
    </Checkbox>

    <div class="images__options">
      <label title="The number of columns">
        <span>Columns:</span>
        <Number
          value={props.options.columns}
          onInput={(e: InputEvent) => props.setOption('columns', parseInt(e.currentTarget.value, 10))}
          min="1"
          max="10"
          required
        />
      </label>

      <label title="Setting the minimum width can be useful for images that are too small to make out">
        <span>Minimum Display Width:</span>
        <Number
          value={props.options.image_min_width}
          onInput={(e: InputEvent) => props.setOption('image_min_width', parseInt(e.currentTarget.value, 10))}
          min="0"
          max="720"
          required
        />
        <span>px</span>
      </label>

      <label title="Setting the maximum width prevents bigger images from taking too much space, and also changes the size of the popup">
        <span>Maximum Display Width:</span>
        <Number
          value={props.options.image_max_width}
          onInput={(e: InputEvent) => props.setOption('image_max_width', parseInt(e.currentTarget.value, 10))}
          min="30"
          max="720"
          required
        />
        <span>px</span>
      </label>

      <label>
        <span>Border Width:</span>
        <Number
          value={props.options.image_border_width}
          onInput={(e: InputEvent) => props.setOption('image_border_width', parseInt(e.currentTarget.value, 10))}
          min="1"
          max="10"
          required
        />
        <span>px</span>
      </label>

      <label>
        <span>Border Color:</span>
        <Color
          value={props.options.image_border_color}
          onInput={(e: InputEvent) => props.setOption('image_border_color', e.currentTarget.value)}
        />
      </label>
    </div>
  </Fieldset>
);
