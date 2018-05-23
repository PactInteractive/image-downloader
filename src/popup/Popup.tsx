import * as React from 'react';
import { Component } from '../dom';

interface State {}

export class App extends Component<{}, State> {
  readonly state: State = {};

  render() {
    // const { state } = this;
    return (
      <div>
        <div id="filters_container">
          <table id="filter_inputs_container" className="grid">
            <colgroup>
              <col />
              <col style={{ width: '100px' }} />
            </colgroup>
            <tbody>
              <tr>
                <td>
                  <input
                    type="text"
                    id="folder_name_textbox"
                    placeholder="SAVE TO SUBFOLDER"
                    title="Set the name of the subfolder you want to download the images to."
                  />
                </td>
                <td>
                  <input type="button" id="download_button" className="primary" value="DOWNLOAD" disabled />
                </td>
              </tr>

              <tr>
                <td colSpan={2}>
                  <input
                    type="text"
                    id="file_renaming_textbox"
                    placeholder="RENAME FILES"
                    title="Set a new file name for the images you want to download."
                  />
                </td>
              </tr>

              <tr id="image_url_filter">
                <td>
                  <input
                    type="text"
                    id="filter_textbox"
                    placeholder="FILTER BY URL"
                    title="Filter by parts of the URL or regular expressions."
                  />
                </td>
                <td>
                  <FilterUrlModeInput />
                </td>
              </tr>
            </tbody>
          </table>

          <table className="grid">
            <colgroup>
              <col style={{ width: '45px' }} />
              <col style={{ width: '40px' }} />
              <col style={{ width: '10px' }} />
              <col />
              <col style={{ width: '10px' }} />
              <col style={{ width: '40px' }} />
            </colgroup>
            <tbody>
              <tr id="image_width_filter">
                <td>Width:</td>
                <td style={{ textAlign: 'right' }}>
                  <label htmlFor="image_width_filter_min_checkbox">
                    <small id="image_width_filter_min" />
                  </label>
                </td>
                <td>
                  <input type="checkbox" id="image_width_filter_min_checkbox" />
                </td>
                <td>
                  <div id="image_width_filter_slider" />
                </td>
                <td>
                  <input type="checkbox" id="image_width_filter_max_checkbox" />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <label htmlFor="image_width_filter_max_checkbox">
                    <small id="image_width_filter_max" />
                  </label>
                </td>
              </tr>

              <tr id="image_height_filter">
                <td>Height:</td>
                <td style={{ textAlign: 'right' }}>
                  <label htmlFor="image_height_filter_min_checkbox">
                    <small id="image_height_filter_min" />
                  </label>
                </td>
                <td>
                  <input type="checkbox" id="image_height_filter_min_checkbox" />
                </td>
                <td>
                  <div id="image_height_filter_slider" />
                </td>
                <td>
                  <input type="checkbox" id="image_height_filter_max_checkbox" />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <label htmlFor="image_height_filter_max_checkbox">
                    <small id="image_height_filter_max" />
                  </label>
                </td>
              </tr>
            </tbody>
          </table>

          <label
            id="only_images_from_links_container"
            title="Only show images from direct links on the page; this can be useful on sites like Reddit"
          >
            <input type="checkbox" id="only_images_from_links_checkbox" />Only images from links
          </label>
        </div>

        <div id="images_cache" />
        <table id="images_table" className="grid" />
      </div>
    );
  }
}

class FilterUrlModeInput extends Component<{}, {}> {
  // TODO: Show title as a styled tooltip
  private readonly options = [
    { value: 'normal', title: 'A plain text search', text: 'Normal' },
    {
      value: 'wildcard',
      text: 'Wildcard',
      title: `You can also use these special symbols:
  * → zero or more characters
  ? → zero or one character
  + → one or more characters
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
  \A → Start of string
  \z → End of string
  . → Any single character
  \s → Any whitespace character
  \S → Any non-whitespace character
  \d → Any digit
  \D → Any non-digit
  \w → Any word character (letter, number, underscore)
  \W → Any non-word character
  \b → Any word boundary character
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
    return (
      <select id="filter_url_mode_input">
        {this.options.map((option) => (
          <option value={option.value} title={option.title}>
            {option.text}
          </option>
        ))}
      </select>
    );
  }
}
