import { h } from '../dom';

export const Checkbox = (props: Props<HTMLInputElement>) => (
  <label title={props.title}>
    <input type="checkbox" />
    <span>{props.children}</span>
  </label>
);
