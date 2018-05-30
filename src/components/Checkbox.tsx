import * as React from 'react';
import { Component, Props } from '../dom';

// TODO: Implement custom style
export class Checkbox extends Component<
  Props<HTMLInputElement> & { position?: 'before' | 'after' }
> {
  static defaultProps = {
    position: 'before',
  };

  render() {
    const { children, className, position, title, ...props } = this.props;
    return (
      <label className={className} title={title}>
        {position === 'before' && <input type="checkbox" {...props} />}
        {children}
        {position === 'after' && <input type="checkbox" {...props} />}
      </label>
    );
  }
}
