import html from './html.js';

export const ImageUrlTextbox = (props) => html`
  <input
    type="text"
    readonly
    onClick=${(e) => {
      e.target.select();
    }}
    ...${props}
  />
`;

const imageButtonStyle = {
  cursor: 'pointer',
  width: '24px',
  height: '24px',
  border: 0,
  backgroundSize: '24px',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
};

const ImageButton = ({ children, style, ...props }) => html`
  <button type="button" style=${{ ...imageButtonStyle, ...style }} ...${props}>
    ${children}
  </button>
`;

export const OpenImageButton = ({ imageUrl, ...props }) => {
  return html`
    <${ImageButton}
      title="Open in new tab"
      style=${{ backgroundImage: `url("/images/open.png")` }}
      onClick=${() => {
        chrome.tabs.create({ url: imageUrl, active: false });
      }}
      ...${props}
    >
      &nbsp;
    <//>
  `;
};

export const DownloadImageButton = ({ imageUrl, ...props }) => {
  return html`
    <${ImageButton}
      title="Download"
      style=${{ backgroundImage: `url("/images/download.png")` }}
      onClick=${() => {
        chrome.downloads.download({ url: imageUrl });
      }}
      ...${props}
    >
      &nbsp;
    <//>
  `;
};
