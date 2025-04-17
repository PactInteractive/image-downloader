import html from '../html.js';
import { ExternalLink } from '../components/ExternalLink.js';

const numberOfActiveUsers = '1,500,000+';
const years = new Date().getFullYear() - 2012;

export const About = () => html`
  <a href="https://x.com/vdsabev" target="_blank" rel="noopener noreferrer" style=${{ float: 'right', margin: '0 0 1rem 1rem', textAlign: 'center' }}>
    <img
      src="/images/me.jpg"
      style=${{
        width: '8rem',
        height: '8rem',
        boxShadow: '0 4px 6px -1px var(--border-color), 0 2px 4px -2px var(--border-color)',
        borderRadius: '2rem',
        margin: '1rem 0 0.25rem 0',
      }}
    />
    <span style=${{ color: 'oklch(44.4% 0.011 73.639)' }}>Made by</span> @vdsabev
    <br />
    <small style=${{ color: 'oklch(55.3% 0.013 58.071)' }}>(🐕 with Ruby's help)</small>
  </a>

  <p style=${{ margin: '1em 0' }}>
    If you're one of the ${numberOfActiveUsers} people using this extension,
    over the past <b style=${{ whiteSpace: 'nowrap' }}>${years} years</b> marketing companies have approached me with
    offers to pay in exchange for <b>your private data</b> like:
  </p>

  <ul>
    <li>what websites you visit</li>
    <li>when you visit them</li>
    <li>where you visit them from</li>
  </ul>

  <p>
    My response to such offers will always be a resounding <b>NO</b>!
  </p>

  <p>
    The extension will remain <b>free</b>, <b>open-source</b>, and
    <b> without targeted ads or tracking algorithms</b>.
    The source code can be found on GitHub:${' '}
    <${ExternalLink}
      href="https://github.com/PactInteractive/image-downloader"
    />
  </p>
`;
