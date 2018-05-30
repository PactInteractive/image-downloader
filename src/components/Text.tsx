import * as React from 'react';
import { Component, Props } from '../dom';

export class Text extends Component<Props<HTMLInputElement>> {
  render() {
    const { props } = this;
    return <input type="text" {...props} />;
  }
}
