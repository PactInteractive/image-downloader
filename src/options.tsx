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

class State {
  options = new Options();
}

class Options {
  general = new GeneralOptions();
  filters = new FiltersOptions();
  images = new ImagesOptions();

  constructor() {
  }
}

class App extends Component<{}, State> {
  state = new State();

  render(props: {}, state: State) {
    return (
      <div>
        <h2>Image Downloader</h2>

        <About />
        <General options={state.options.general} />
        <Filters options={state.options.filters} />
        <Images options={state.options.images} />

        <Actions />

        <Notifications />
      </div>
    );
  }
}

render(<App />, document.body);
