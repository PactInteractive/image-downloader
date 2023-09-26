import html from '../html.js';
import { ExternalLink } from '../components/ExternalLink.js';

const addresses = {
  btc: '19UsTZPYtNp1h2y4QT2a7gbNYNZrEdjXvE',
};

export const Support = () => html`
  <p style=${{ margin: '1em 0' }}>
    If you want to, you can try some of our other projects or support Image
    Downloader by donating Bitcoin.
  </p>

  <div style=${{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
    <a
      href="https://codebedder.com"
      target="_blank"
      style=${{
        border: '2px dashed var(--border-color)',
        padding: '0 1em 1em 1em',
      }}
    >
      <h2 style=${{ display: 'inline-flex', gap: '0.5ch' }}>
        <img src="https://codebedder.com/logo.svg" style=${{ height: '1em' }} />
        CodeBedder.com <small> - simplest code editor on the web</small>
      </h2>

      <img src="https://codebedder.com/screenshot.png" />
    </a>

    <a
      href="https://chrome.google.com/webstore/detail/code-blue/mbjgnjfkngoogkgohnmbimnpdacdbghb"
      target="_blank"
      style=${{
        border: '2px dashed var(--border-color)',
        padding: '0 1em 1em 1em',
      }}
    >
      <h2 style=${{ display: 'inline-flex', gap: '0.5ch' }}>
        <img
          src="https://raw.githubusercontent.com/vdsabev/code-blue/master/images/icon_128.png"
          style=${{ height: '1em' }}
        />
        Code Blue
        <small> - extension to render blocks of inline code on X/Twitter</small>
      </h2>

      <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <img
          src="https://raw.githubusercontent.com/vdsabev/code-blue/master/images/before.png"
        />
        <img
          src="https://raw.githubusercontent.com/vdsabev/code-blue/master/images/demo.gif"
        />
      </div>
    </a>

    <div
      style=${{ border: '2px dashed var(--border-color)', padding: '0 1em' }}
    >
      <h2 style=${{ display: 'inline-flex', gap: '0.5ch' }}>
        <img src="/images/btc.png" style=${{ height: '1em' }} />
        Bitcoin <small>donation address</small>
      </h2>

      <${ExternalLink} href="bitcoin:${addresses.btc}">
        <img src="/images/btc-qr.png" style=${{ width: '240px' }} />
      <//>

      <pre>${addresses.btc}</pre>
    </div>
  </div>
`;
