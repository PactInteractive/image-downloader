// Style
import '../stylesheets/main.css';
import './options.css';

// Application
import { Component, h, render } from './dom';
import { About } from './options/About';
import { Actions } from './options/Actions';
import { Filters } from './options/Filters';
import { General } from './options/General';
import { Images } from './options/Images';
import { Notifications } from './options/Notifications';

class State {
}

class Options extends Component<Props, State> {
  state = new State();

  render(props: Props, state: State) {
    return (
      <div>
        <h2>Image Downloader</h2>

        <About />
        <General />
        <Filters />
        <Images />

        <Actions />

        <Notifications />
      </div>
    );
  }
}

render(<Options />, document.body);
