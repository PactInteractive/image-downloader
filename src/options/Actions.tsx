import { h } from '../dom';

// TODO: Show title as a styled tooltip
export const Actions = (props: { save: () => any, reset: () => any, clear: () => any }) => (
  <div>
    <input
      type="button"
      class="primary"
      value="SAVE"
      title="Saves the current settings"
      onClick={props.save}
    />

    <input
      type="button"
      class="warning"
      value="RESET"
      title="Resets all settings to their defaults; save afterwards to preserve the changes"
      onClick={props.reset}
    />

    <input
      type="button"
      class="danger right"
      value="CLEAR DATA"
      title="Clears all data this extension has stored on your machine"
      onClick={props.clear}
    />
  </div>
);
