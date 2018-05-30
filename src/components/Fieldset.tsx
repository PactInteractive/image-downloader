import * as React from 'react';
import { Component, Props } from '../dom';

export class Fieldset extends Component<Props<HTMLFieldSetElement> & { legend: string }> {
  render() {
    const { children, legend, ...props } = this.props;
    return (
      <fieldset {...props}>
        <legend>{legend}</legend>
        {children}
      </fieldset>
    );
  }
}
