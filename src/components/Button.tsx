import * as React from 'react';
import { Component, Props } from '../dom';

export class Button extends Component<Props<HTMLButtonElement>> {
  render() {
    const { children, ...props } = this.props;
    return (
      <button type="button" {...props}>
        {children}
      </button>
    );
  }
}
