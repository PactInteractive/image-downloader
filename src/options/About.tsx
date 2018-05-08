import { Component, h } from '../dom';
import { Fieldset } from './Fieldset';

class State {
  source = 'https://github.com/vdsabev/image-downloader';
}

export class About extends Component<{}, State> {
  state = new State();

  render(props: {}, state: State) {
    return (
      <Fieldset legend="About">
        This extension is and always will be free, open-source, and without ads or tracking algorithms of any kind.
        The source code can be found on GitHub: <a href={state.source} target="_blank">{state.source}</a>
      </Fieldset>
    );
  }
}
