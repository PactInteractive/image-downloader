import * as React from 'react';
import { Component } from '../dom';

export class Number extends Component<Props<HTMLInputElement>> {
  render() {
    const { props } = this;
    return <input type="number" {...props} />;
  }
}
