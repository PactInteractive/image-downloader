import html from './html.js';

export const Checkbox = ({ children, title = '', ...props }) => html`
  <label ...${{ title }}>
    <input type="checkbox" ...${props} />
    ${children}
  </label>
`;
