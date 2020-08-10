import html from './html.js'

export const Checkbox = ({ children, ...props }) => html`
  <label>
    <input type="checkbox" ...${props} />
    ${children}
  </label>
`
