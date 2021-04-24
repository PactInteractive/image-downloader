import html from '../html.js';

export const ExternalLink = ({ children, ...props }) => html`
  <a rel="nofollow noopener" target="_blank" ...${props}>
    ${children || props.href}
  </a>
`;
