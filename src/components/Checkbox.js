import html from '../html.js';

export const Checkbox = ({
  children,
  class: className,
  indeterminate,
  style,
  title = '',
  ...props
}) => html`
  <label ...${{ className, title }}>
    <input
      ref=${setIndeterminate(indeterminate)}
      type="checkbox"
      style=${{ marginLeft: 0, ...style }}
      ...${props}
    />
    ${children}
  </label>
`;

// Source: https://davidwalsh.name/react-indeterminate
const setIndeterminate = (indeterminate) => (element) => {
  if (element) {
    element.indeterminate = indeterminate;
  }
};
