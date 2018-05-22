import * as React from 'react';
import { Component, Props } from '../dom';

// TODO: Implement custom style
export class Checkbox extends Component<Props<HTMLInputElement>> {
  render() {
    const { title, children, ...props } = this.props;
    return (
      <label title={title}>
        <input type="checkbox" {...props} />
        <span>{children}</span>
      </label>
    );
  }
}
