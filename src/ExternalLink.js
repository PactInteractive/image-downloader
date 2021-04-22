import html from './html.js';

export const ExternalLink = ({ children, ...props }) => html`
  <a rel="nofollow noopener" target="_blank" ...${props}>
    ${children?.length > 0 ? children : props.href}
  </a>
`;
