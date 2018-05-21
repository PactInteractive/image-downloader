import * as React from 'react';
import { Component } from '../dom';

export class Fieldset extends Component<Props & { legend: string }> {
  render() {
    const { props } = this;
    return (
      <fieldset>
        <legend>{props.legend}</legend>
        {props.children}
      </fieldset>
    );
  }
}
