import html from './html.js'

export const SelectAllCheckbox = ({ children, ...props }) => html`
  <label>
    <input type="checkbox" ...${props} />
    ${children}
  </label>
`
