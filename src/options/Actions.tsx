import * as React from 'react';
import { Component } from '../dom';

// TODO: Show title as a styled tooltip
export class Actions extends Component<{ save: () => any, reset: () => any, clear: () => any }> {
  render() {
    const { props } = this;
    return (
      <div>
        <input
          type="button"
          className="primary"
          value="SAVE"
          title="Saves the current settings"
          data-test="save"
          onClick={props.save}
        />

        <input
          type="button"
          className="warning"
          value="RESET"
          title="Resets all settings to their defaults; save afterwards to preserve the changes"
          data-test="reset"
          onClick={props.reset}
        />

        <input
          type="button"
          className="danger right"
          value="CLEAR DATA"
          title="Clears all data this extension has stored on your machine"
          data-test="clear"
          onClick={props.clear}
        />
      </div>
    );
  }
}
