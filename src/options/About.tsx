import * as React from 'react';
import { Fieldset } from '../components';
import { Component } from '../dom';

export class About extends Component {
  private readonly source = 'https://github.com/vdsabev/image-downloader';

  render() {
    return (
      <Fieldset legend="About">
        This extension is and always will be free, open-source, and without ads or tracking algorithms of any kind.
        The source code can be found on GitHub: <a href={this.source} target="_blank">{this.source}</a>
      </Fieldset>
    );
  }
}
