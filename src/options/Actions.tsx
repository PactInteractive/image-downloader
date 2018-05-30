import * as React from 'react';
import { Button } from '../components';
import { Component } from '../dom';

// TODO: Show title as a styled tooltip
export class Actions extends Component<{ save: () => any; reset: () => any; clear: () => any }> {
  render() {
    const { props } = this;
    return (
      <div>
        <Button
          className="primary"
          title="Saves the current settings"
          data-test="save"
          onClick={props.save}
        >
          SAVE
        </Button>

        <Button
          className="warning"
          title="Resets all settings to their defaults; save afterwards to preserve the changes"
          data-test="reset"
          onClick={props.reset}
        >
          RESET
        </Button>

        <Button
          className="danger right"
          title="Clears all data this extension has stored on your machine"
          data-test="clear"
          onClick={props.clear}
        >
          CLEAR DATA
        </Button>
      </div>
    );
  }
}
