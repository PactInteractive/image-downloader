import * as React from 'react';
import { Button, Checkbox, Text } from '../components';
import { Component, Props } from '../dom';
import { InputEvent } from '../InputEvent';
import { Options } from '../options/Options';
import { Services } from './Services';
import { Subscription } from './Subscription';

class State {
  static setImageUrls = (imageUrls: string[]) => ({
    allImages: imageUrls,
    visibleImages: imageUrls,
  });

  static setOption = (key: keyof Options, value: boolean | number | string) => (
    state: Readonly<State>
  ) => ({
    options: {
      ...state.options,
      [key]: value,
    },
  });

  static toggleImageSelection = (imageUrl: string) => (state: Readonly<State>) => {
    const imageIsSelected = state.selectedImages.indexOf(imageUrl) !== -1;
    return {
      selectedImages: imageIsSelected
        ? state.selectedImages.filter((url) => url !== imageUrl)
        : [...state.selectedImages, imageUrl],
    };
  };

  allImages: string[] = [];
  visibleImages: string[] = [];
  selectedImages: string[] = [];
  options = new Options();
}

export class App extends Component<{}, State> {
  readonly state = new State();
  private readonly subscriptions: Subscription[] = [];

  componentDidMount() {
    this.subscriptions.push(
      // TODO: Filter `visibleImages`
      Services.onImageUrlsChanged((imageUrls) => {
        this.setState(State.setImageUrls(imageUrls));
      })
    );
  }

  componentDidUpdate(prevProps: {}, prevState: State): void {
    // TODO: Save relevant changes to local storage
  }

  componentWillUnmount() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  render() {
    const { options, ...state } = this.state;
    return (
      <>
        <div className="filters">
          <div className="filterInputs">
            <Text
              placeholder="SAVE TO SUBFOLDER"
              title="Set the name of the subfolder you want to download the images to."
              value={options.folder_name}
              onChange={this.setOption('folder_name', 'value')}
            />

            <Button
              className="primary"
              disabled={state.selectedImages.length === 0}
              onClick={this.downloadSelectedImages}
            >
              DOWNLOAD
            </Button>

            <Text
              className="renameTextbox"
              placeholder="RENAME FILES"
              title="Set a new file name for the images you want to download."
              value={options.new_file_name}
              onChange={this.setOption('new_file_name', 'value')}
            />

            <Text
              placeholder="FILTER BY URL"
              title="Filter by parts of the URL or regular expressions."
              value={options.filter_url}
              onChange={this.setOption('filter_url', 'value')}
            />

            {/* TODO: Refactor */}
            <FilterUrlModeInput
              onChange={(e: any) => {
                // TODO: Finish
                this.setState((state) => ({
                  options: {
                    ...state.options,
                    filter_url_mode: e.currentTarget.value,
                  },
                }));
              }}
            />
          </div>

          <div className="filterRanges">
            <div>Width:</div>
            <Checkbox
              className="text-right"
              position="after"
              checked={options.filter_min_width_enabled}
              onChange={this.setOption('filter_min_width_enabled', 'checked')}
            >
              <small>{options.filter_min_width}px</small>
            </Checkbox>
            {/* TODO: Display slider */}
            <div id="image_width_filter_slider" />
            <Checkbox
              checked={options.filter_max_width_enabled}
              onChange={this.setOption('filter_max_width_enabled', 'checked')}
            >
              <small>{options.filter_max_width}px</small>
            </Checkbox>

            <div>Height:</div>
            <Checkbox
              className="text-right"
              position="after"
              checked={options.filter_min_height_enabled}
              onChange={this.setOption('filter_min_height_enabled', 'checked')}
            >
              <small>{options.filter_min_height}px</small>
            </Checkbox>
            {/* TODO: Display slider */}
            <div id="image_height_filter_slider" />
            <Checkbox
              checked={options.filter_max_height_enabled}
              onChange={this.setOption('filter_max_height_enabled', 'checked')}
            >
              <small>{options.filter_max_height}px</small>
            </Checkbox>
          </div>

          <Checkbox
            className="onlyImagesFromLinks"
            title="Only show images from direct links on the page; this can be useful on sites like Reddit"
            checked={options.only_images_from_links}
            onChange={this.setOption('only_images_from_links', 'checked')}
          >
            Only images from links
          </Checkbox>
        </div>

        <div className="imagesCache" />

        <Checkbox id="toggle_all_checkbox">
          <b>Select all ({state.visibleImages.length})</b>
        </Checkbox>

        <div className="images" style={{ gridTemplateColumns: '1fr '.repeat(options.columns) }}>
          {state.visibleImages.map((imageUrl) => (
            <Image
              key={imageUrl}
              imageUrl={imageUrl}
              options={options}
              onToggleSelected={this.toggleImageSelected}
              selected={state.selectedImages.indexOf(imageUrl) !== -1}
            />
          ))}
        </div>
      </>
    );
  }

  private setOption = (option: keyof Options, key: 'checked' | 'value') => (e: InputEvent) => {
    this.setState(State.setOption(option, e.currentTarget[key]));
  };

  private toggleImageSelected = (imageUrl: string): void => {
    this.setState(State.toggleImageSelection(imageUrl));
  };

  private downloadSelectedImages = async (): Promise<void> => {
    const confirmed = await this.downloadConfirmation();
    if (confirmed) {
      this.state.selectedImages.forEach((imageUrl) => Services.downloadImage(imageUrl));
      // TODO: Flash notification
    }
  };

  private downloadConfirmation = async (): Promise<boolean> => {
    if (this.state.options.show_download_confirmation) {
      // TODO: Show warning in UI
      return window.confirm(`Take a quick look at your Chrome settings and search for the download location.

If the Ask where to save each file before downloading option is checked, continuing might open a lot of popup windows. Are you sure you want to do this?`);
    }
    return true;
  };
}

class FilterUrlModeInput extends Component<Props<HTMLSelectElement>> {
  // TODO: Show title as a styled tooltip
  private readonly options = [
    { value: 'normal', title: 'A plain text search', text: 'Normal' },
    {
      value: 'wildcard',
      text: 'Wildcard',
      title: `You can also use these special symbols:
  * → match zero or more characters
  ? → match zero or one character
  + → match one or more characters
      `,
    },
    {
      value: 'regex',
      text: 'Regex',
      title: `Regular expressions (advanced):
  [abc] → A single character of: a, b or c
  [^abc] → Any single character except: a, b, or c
  [a-z] → Any single character in the range a-z
  [a-zA-Z] → Any single character in the range a-z or A-Z
  ^ → Start of line
  $ → End of line
  \\A → Start of string
  \\z → End of string
  . → Any single character
  \\s → Any whitespace character
  \\S → Any non-whitespace character
  \\d → Any digit
  \\D → Any non-digit
  \\w → Any word character (letter, number, underscore)
  \\W → Any non-word character
  \\b → Any word boundary character
  (...) → Capture everything enclosed
  (a|b) → a or b
  a? → Zero or one of a
  a* → Zero or more of a
  a+ → One or more of a
  a{3} → Exactly 3 of a
  a{3,} → 3 or more of a
  a{3,6} → Between 3 and 6 of a
      `,
    },
  ];

  render() {
    const { props } = this;
    return (
      <select className="filterModeDropdown" {...props}>
        {this.options.map((option) => (
          <option key={option.value} value={option.value} title={option.title}>
            {option.text}
          </option>
        ))}
      </select>
    );
  }
}

class Image extends Component<{
  imageUrl: string;
  onToggleSelected: (imageUrl: string) => any;
  options: Options;
  selected: boolean;
}> {
  render() {
    const {
      props: { imageUrl, options, onToggleSelected, selected },
    } = this;

    return (
      <div className="image">
        <Text
          className="image_url_textbox"
          value={imageUrl}
          onClick={(e) => e.currentTarget.select()}
          readOnly
        />

        <div
          className="openImageButton"
          title="Open in new tab"
          onClick={() => Services.openImage(imageUrl)}
        >
          &nbsp;
        </div>

        <div
          className="downloadImageButton"
          title="Download"
          onClick={() => Services.downloadImage(imageUrl)}
        >
          &nbsp;
        </div>

        <img
          src={imageUrl}
          style={{
            minWidth: `${options.image_min_width}px`,
            maxWidth: `${options.image_max_width}px`,
            borderWidth: `${options.image_border_width}px`,
            ...(selected ? { borderColor: options.image_border_color } : {}),
          }}
          onClick={() => onToggleSelected(imageUrl)}
        />
      </div>
    );
  }
}
