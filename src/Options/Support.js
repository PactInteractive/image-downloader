import html from '../html.js';
import { ExternalLink } from '../components/ExternalLink.js';

export const Support = () => html`
  <p style=${{ margin: '1em 0' }}>
    Try some of our other projects or support Image Downloader directly by
    donating on Gumroad:
  </p>

  <div
    style=${{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr)',
      gap: '1em',
    }}
  >
    <${ExternalLink}
      href="https://slidezones.com"
      target="_blank"
      style=${{
        border: '2px dashed var(--border-color)',
        padding: '0 1em 1em 1em',
      }}
    >
      <h2 style=${{ display: 'inline-flex', gap: '0.5ch', marginBottom: '0' }}>
        <img
          src="https://slidezones.com/images/logo.svg"
          style=${{ height: '1em' }}
        />
        SlideZones
      </h2>
      <br />
      <small>Time zone converter for seamless global meetings</small>

      <img src="https://slidezones.com/images/screenshot.png" />
    <//>

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

    <a
      href="https://vdsabev.gumroad.com/l/image-downloader"
      target="_blank"
      style=${{
        display: 'flex',
        flexDirection: 'column',
        border: '2px dashed var(--border-color)',
        padding: '0 1em 1em 1em',
      }}
    >
      <div>
        <h2
          style=${{ display: 'inline-flex', gap: '0.5ch', marginBottom: '0' }}
        >
          <img src="/images/gumroad.png" style=${{ height: '1em' }} />
          Gumroad page
        </h2>
        <br />
        <small>Support Image Downloader on Gumroad</small>
      </div>

      <img src="/images/gumroad.svg" style=${{ flex: '1' }} />
    </a>
  </div>
`;
