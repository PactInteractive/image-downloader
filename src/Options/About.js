import html from '../html.js';
import { ExternalLink } from '../components/ExternalLink.js';

const numberOfActiveUsers = '1,900,000+';
const years = new Date().getFullYear() - 2012;

export const About = () => html`
  <a class="float-right mb-4 ml-4 text-center" href="https://x.com/vdsabev" target="_blank" rel="noopener noreferrer">
    <img
      class="w-32 h-32 shadow rounded-[3rem] mb-1"
      src="/images/me.jpg"
    />
    <span class="text-slate-700">Made by</span> @vdsabev
    <br />
    <small class="text-slate-500">(🐕 with Ruby's help)</small>
  </a>

  <p>
    If you're one of the ${numberOfActiveUsers} people using this extension,
    over the past <b class="text-nowrap">${years} years</b> marketing companies have approached me with
    offers to pay in exchange for <b>your private data</b> like:
  </p>

  <ul class="list-disc ml-8">
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
