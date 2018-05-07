import { h } from '../dom';

// TODO: Show title as a styled tooltip
export const Actions = () => (
  <div id="buttons">
    <input type="button" id="save_button" class="primary" value="SAVE" title="Saves the current settings" />
    <input type="button" id="reset_button" class="warning" value="RESET" title="Resets all settings to their defaults; save afterwards to preserve the changes" />
    <input type="button" id="clear_data_button" class="danger right" value="CLEAR DATA" title="Clears all data this extension has stored on your machine" />
  </div>
);
