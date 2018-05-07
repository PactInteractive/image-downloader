import { h } from '../dom';

export const Fieldset = (props: Props<HTMLFieldSetElement> & { legend: string }) => (
  <fieldset>
    <legend>{props.legend}</legend>
    {props.children}
  </fieldset>
);
