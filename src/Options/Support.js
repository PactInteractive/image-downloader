import html from '../html.js';
import { ExternalLink } from '../components/ExternalLink.js';

const addresses = {
  btc: '19UsTZPYtNp1h2y4QT2a7gbNYNZrEdjXvE',
};

export const Support = () => html`
  <p style=${{ margin: '1em 0' }}>
    Try some of our other projects or support Image Downloader directly by
    donating Bitcoin:
  </p>

  <div
    style=${{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr)',
      gap: '1em',
    }}
  >
    <a
      href="https://slidezones.netlify.app"
      target="_blank"
      style=${{
        border: '2px dashed var(--border-color)',
        padding: '0 1em 1em 1em',
      }}
    >
      <h2 style=${{ display: 'inline-flex', gap: '0.5ch', marginBottom: '0' }}>
        <img
          src="https://slidezones.netlify.app/images/logo.svg"
          style=${{ height: '1em' }}
        />
        SlideZones
      </h2>
      <br />
      <small>Time zone converter for seamless global meetings</small>

      <img src="https://slidezones.netlify.app/images/screenshot.png" />
    </a>

    <a
      href="https://codebedder.com"
      target="_blank"
      style=${{
        border: '2px dashed var(--border-color)',
        padding: '0 1em 1em 1em',
      }}
    >
      <h2 style=${{ display: 'inline-flex', gap: '0.5ch', marginBottom: '0' }}>
        <img src="https://codebedder.com/logo.svg" style=${{ height: '1em' }} />
        CodeBedder.com
      </h2>
      <br />
      <small>Simplest code editor on the web</small>

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
      <h2 style=${{ display: 'inline-flex', gap: '0.5ch', marginBottom: '0' }}>
        <img
          src="https://raw.githubusercontent.com/vdsabev/code-blue/master/images/icon_128.png"
          style=${{ height: '1em' }}
        />
        Code Blue
      </h2>
      <br />
      <small>Render blocks of inline code on X/Twitter</small>

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
      <h2 style=${{ display: 'inline-flex', gap: '0.5ch', marginBottom: '0' }}>
        <img src="/images/btc.png" style=${{ height: '1em' }} />
        Bitcoin <small>donation address</small>
      </h2>
      <pre style=${{ margin: '0' }}>${addresses.btc}</pre>

      <${ExternalLink} href="bitcoin:${addresses.btc}">
        <img src="/images/btc-qr.png" style=${{ marginBottom: '1rem' }} />
      <//>
    </div>
  </div>
`;
