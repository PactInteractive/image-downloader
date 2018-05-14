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
import { css } from './style';

class State {
  options = new Options();
}

export class Options implements GeneralOptions, FiltersOptions, ImagesOptions {
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
  state = new State();

  render(props: {}, state: State) {
    return (
      <div>
        <h2>Image Downloader</h2>

        <About />
        <General options={state.options} />
        <Filters options={state.options} />
        <Images options={state.options} />

        <Actions />

        <Notifications />
      </div>
    );
  }
}

render(<App />, document.body);
