// Style
import '../stylesheets/main.css';
import './options.css';

// Application
import { Component, h, render } from './dom';
import { About } from './options/About';
import { Actions } from './options/Actions';
import { Filters, FiltersOptions } from './options/Filters';
import { General, GeneralOptions } from './options/General';
import { Images, ImagesOptions } from './options/Images';
import { Notifications } from './options/Notifications';
import { SetOption } from './options/SetOption';
import { css } from './style';

class State implements GeneralOptions, FiltersOptions, ImagesOptions {
  static save(values: Record<string, number | boolean>, saveValue: (key: string, value: string) => any): void {
    Object.keys(values).forEach((key) => saveValue(key, values[key].toString()));
  }

  static load(savedValues: Record<string, string>, defaultValues: any): State {
    return Object.keys(defaultValues).reduce<State>(
      (result, key) => {
        const defaultValue = defaultValues[key];
        const savedValue = savedValues[key];
        switch (typeof defaultValue) {
          case 'boolean':
            (result as any)[key] = savedValue === undefined ? defaultValue : savedValue === 'true';
            break;
          case 'number':
            (result as any)[key] = savedValue === undefined ? defaultValue : parseInt(savedValue, 10);
            break;
        }
        return result;
      },
      {} as any
    );
  }

  // General
  show_download_confirmation = true;
  show_download_notification = true;
  show_file_renaming = false;

  // Filters
  show_url_filter = true;
  show_image_width_filter = true;
  show_image_height_filter = true;
  show_only_images_from_links = true;

  // Images
  show_image_url = true;
  show_open_image_button = true;
  show_download_image_button = true;
  columns = 2;
  image_min_width = 50;
  image_max_width = 200;
  image_border_width = 3;
  image_border_color = css.primary;
}

class App extends Component<{}, State> {
  state = State.load(localStorage, new State());

  private saveOptions = () => {
    State.save(this.state as any, localStorage.setItem.bind(localStorage));
    // TODO: addNotification('Options saved.', 'success');
  };

  private resetOptions = () => {
    // TODO: Reset options
    // var options = JSON.parse(ls.options);
    // var values = {};
    // for (var i = 0; i < options.length; i++) {
    //   values[options[i]] = ls[options[i] + '_default'];
    // }
    // TODO: addNotification('All options have been reset to their default values. You can now save the changes you made or discard them by closing this page.', 'warning');
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

  private setOption: SetOption = (key, value) => {
    this.setState({ [key]: value } as any);
  };

  render(props: {}, state: State) {
    return (
      <div>
        <h2>Image Downloader</h2>

        <About />
        <General options={state} setOption={this.setOption} />
        <Filters options={state} setOption={this.setOption} />
        <Images options={state} setOption={this.setOption} />

        <Actions save={this.saveOptions} reset={this.resetOptions} clear={this.clearData} />

        <Notifications />
      </div>
    );
  }
}

render(<App />, document.body);
