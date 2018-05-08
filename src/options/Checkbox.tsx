import { h } from '../dom';

// TODO: Implement custom style
export const Checkbox = ({ title, children, ...props }: Props<any>) => (
  <label title={title}>
    <input type="checkbox" {...props} />
    <span>{children}</span>
  </label>
);
