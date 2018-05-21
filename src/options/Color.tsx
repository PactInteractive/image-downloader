import * as React from 'react';
import { Component } from '../dom';

export class Color extends Component<Props<HTMLInputElement>> {
  render() {
    const { props } = this;
    return <input type="color" {...props} />;
  }
}
