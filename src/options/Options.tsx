import * as React from 'react';
import { Component } from '../dom';
import { css } from '../style';

import { About } from './About';
import { Actions } from './Actions';
import { Filters, FiltersOptions } from './Filters';
import { General, GeneralOptions } from './General';
import { Images, ImagesOptions } from './Images';
import { Notification, Notifications } from './Notifications';
import { SetOption } from './SetOption';

interface State {
  notifications: Notification[];
  options: Options;
}

export class Options implements GeneralOptions, FiltersOptions, ImagesOptions {
  static save(values: Record<string, number | boolean>, saveValue: (key: string, value: string) => any): void {
    Object.keys(values).forEach((key) => saveValue(key, values[key].toString()));
  }

  static load<T extends Record<string, any>>(savedValues: Record<string, string>, defaultValues: T): T {
    return Object.keys(defaultValues).reduce<T>(
      (result, key) => {
        const savedValue = savedValues[key];
        const defaultValue = defaultValues[key];
        result[key] = savedValue === undefined
          ? defaultValue
          : Options.convertValueToType(savedValue, typeof defaultValue);

        return result;
      },
      {} as T
    );
  }

  static convertValueToType(value: any, type: string): any {
    switch (type) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return parseInt(value, 10);
      case 'string':
        return value;
    }
  }

  // Values
  folder_name = '';
  new_file_name = '';
  filter_url = '';
  filter_url_mode = 'normal';
  filter_min_width = 0;
  filter_min_width_enabled = false;
  filter_max_width = 3000;
  filter_max_width_enabled = false;
  filter_min_height = 0;
  filter_min_height_enabled = false;
  filter_max_height = 3000;
  filter_max_height_enabled = false;
  only_images_from_links = false;

  // Options
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

export class App extends Component<{}, State> {
  private readonly notificationDuration = 10000;
  private readonly defaultOptions = new Options();

  readonly state: State = {
    notifications: [],
    options: Options.load(localStorage, this.defaultOptions),
  };

  render() {
    const { state } = this;
    return (
      <div>
        <h2>Image Downloader</h2>

        <About />
        <General options={state.options} setOption={this.setOption} />
        <Filters options={state.options} setOption={this.setOption} />
        <Images options={state.options} setOption={this.setOption} />

        <Actions save={this.saveOptions} reset={this.resetOptions} clear={this.clearData} />

        <Notifications notifications={state.notifications} />
      </div>
    );
  }

  private saveOptions = () => {
    Options.save(this.state.options as any, localStorage.setItem.bind(localStorage));
    this.addNotification({ type: 'success', message: 'Options saved.' });
  };

  private resetOptions = () => {
    this.setState({ options: this.defaultOptions });
    this.addNotification({
      type: 'warning',
      message:
        'All options have been reset to their default values. You can now save the changes you made or discard them by closing this page.',
    });
  };

  private clearData = () => {
    const result = window.confirm(
      'Are you sure you want to clear all data for this extension? This includes filters, options and the name of the default folder where files are saved.'
    );
    if (result) {
      localStorage.clear();
      this.setState({ options: this.defaultOptions });
      this.addNotification({ type: 'success', message: 'All data cleared.' });
    }
  };

  private setOption: SetOption = (key, value) => {
    this.setState((state: State) => ({ options: { ...state.options, [key]: value } }));
  };

  private addNotification = (notificationData: Notification) => {
    const notification: Notification = notificationData;

    this.setState((state: State) => ({ notifications: [...state.notifications, notification] }));

    setTimeout(() => {
      this.setState((state: State) => ({
        notifications: state.notifications.filter((n) => n !== notification),
      }));
    }, this.notificationDuration);
  };
}
