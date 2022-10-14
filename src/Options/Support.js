import html from '../html.js';
import { ExternalLink } from '../components/ExternalLink.js';

const numberOfActiveUsers = '1,000,000+';
const years = new Date().getFullYear() - 2012;
const addresses = {
  btc: '19UsTZPYtNp1h2y4QT2a7gbNYNZrEdjXvE',
};

export const SupportList = () => html`
  <div style=${{ display: 'flex', gap: '24px' }}>
    <div style=${{ flex: 2 }}>
      <p>
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
        If you want to, you may support this project by donating Bitcoin.
        <br />
        In any case, the extension will remain <b>free</b>, <b>open-source</b>,
        and <b> without targeted ads or tracking algorithms</b>.
      </p>

      <p>
        The source code can be found on GitHub:${' '}
        <${ExternalLink}
          href="https://github.com/PactInteractive/image-downloader"
        />
      </p>
    </div>

    <div style=${{ flex: 1, textAlign: 'center' }}>
      <h2 style=${{ display: 'inline-flex', gap: '0.5ch' }}>
        <img src="/images/btc.png" style=${{ height: '1em' }} />
        Bitcoin address
      </h2>

      <${ExternalLink} href="bitcoin:${addresses.btc}">
        <img src="/images/btc-qr.png" style=${{ width: '100%' }} />
      <//>

      <pre>${addresses.btc}</pre>
    </div>
  </div>
`;
