import html from './html.js';

export const Checkbox = ({ children, style, title = '', ...props }) => html`
  <label ...${{ title }}>
    <input type="checkbox" style=${{ marginLeft: 0, ...style }} ...${props} />
    ${children}
  </label>
`;
