import { h } from '../dom';
import { Fieldset } from './Fieldset';
import { Checkbox } from './Checkbox';

export const Images = () => (
  <Fieldset legend="Images">
    <Checkbox title="Displays the URL above each image">
      Show the URL textbox
    </Checkbox>

    <br/>

    <Checkbox title="Displays a button next to each image to open it in a new tab">
      Show the <b>open</b> button
    </Checkbox>

    <br/>

    <Checkbox title="Displays a button next to each image to individually download it. This download does not require confirmation, even if you've enabled the confirmation option.">
      Show the <b>download</b> button
    </Checkbox>

    <table>
      <tr title="The number of columns">
        <td><label for="columns_numberbox">Columns:</label></td>
        <td><input type="number" id="columns_numberbox" min="1" max="10" required /></td>
      </tr>

      <tr title="Setting the minimum width can be useful for images that are too small to make out">
        <td><label for="image_min_width_numberbox">Minimum Display Width:</label></td>
        <td><input type="number" id="image_min_width_numberbox" min="0" max="720" required />px</td>
      </tr>

      <tr title="Setting the maximum width prevents bigger images from taking too much space, and also changes the size of the popup">
        <td><label for="image_max_width_numberbox">Maximum Display Width:</label></td>
        <td><input type="number" id="image_max_width_numberbox" min="30" max="720" required />px</td>
      </tr>

      <tr>
        <td><label for="image_border_width_numberbox">Border Width:</label></td>
        <td><input type="number" id="image_border_width_numberbox" min="1" max="10" required />px</td>
      </tr>

      <tr>
        <td><label for="image_border_color_picker">Border Color:</label></td>
        <td><input type="color" id="image_border_color_picker" /></td>
      </tr>
    </table>
  </Fieldset>
);
