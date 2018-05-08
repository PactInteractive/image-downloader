import { Component, h } from '../dom';

// TODO: Show title as a styled tooltip
export class Actions extends Component<{}, {}> {
  private saveOptions = () => {
    // TODO
  };

  private resetOptions = () => {
    // TODO
  };

  private clearData = () => {
    const result = window.confirm(
      'Are you sure you want to clear all data for this extension? This includes filters, options and the name of the default folder where files are saved.'
    );
    if (result) {
      localStorage.clear();
      // TODO: Just re-render the application instead of doing a hard reload
      window.location.reload();
    }
  };

  render() {
    return (
      <div>
        <input
          type="button"
          class="primary"
          value="SAVE"
          title="Saves the current settings"
          onClick={this.saveOptions}
        />

        <input
          type="button"
          class="warning"
          value="RESET"
          title="Resets all settings to their defaults; save afterwards to preserve the changes"
          onClick={this.resetOptions}
        />

        <input
          type="button"
          class="danger right"
          value="CLEAR DATA"
          title="Clears all data this extension has stored on your machine"
          onClick={this.clearData}
        />
      </div>
    );
  }
}
