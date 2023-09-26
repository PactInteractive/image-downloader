import html from '../html.js';
import { ExternalLink } from '../components/ExternalLink.js';

const numberOfActiveUsers = '1,000,000+';
const years = new Date().getFullYear() - 2012;

export const About = () => html`
  <p style=${{ margin: '1em 0' }}>
    If you're one of the ${numberOfActiveUsers} people using this extension,
    over the past ${years} years marketing companies have approached me with
    offers to pay in exchange for <b>your private data</b> like:
  </p>

  <ul>
    <li>what websites you visit</li>
    <li>when you visit them</li>
    <li>where you visit them from</li>
  </ul>

  <p>
    And what do they think your privacy and trust are worth?
    <br />
    <b>0.15 to 0.45 cents</b>
    <br />
    Less than a penny!
  </p>

  <p>
    My response to such offers?
    <br />
    Mark as spam and delete!
  </p>

  <p>
    The extension will remain <b>free</b>, <b>open-source</b>, and
    <b> without targeted ads or tracking algorithms</b>.
    <br />
    The source code can be found on GitHub:${' '}
    <${ExternalLink}
      href="https://github.com/PactInteractive/image-downloader"
    />
  </p>
`;
