import html from './html.js';

export const ImageUrlTextbox = (props) => html`
  <input
    type="text"
    readonly
    onClick=${(e) => {
      e.currentTarget.select();
    }}
    ...${props}
  />
`;

const imageButtonStyle = {
  cursor: 'pointer',
  borderRadius: 'var(--border-radius-md)',
  border: '2px solid var(--neutral)',
  backgroundColor: 'var(--neutral-lightest)',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '24px',
  padding: '15px',
};

const ImageButton = ({ children, style, ...props }) => html`
  <button type="button" style=${{ ...imageButtonStyle, ...style }} ...${props}>
    ${children}
  </button>
`;

export const OpenImageButton = ({ imageUrl, onClick, ...props }) => {
  return html`
    <${ImageButton}
      title="Open in new tab"
      style=${{ backgroundImage: `url("/images/open.png")` }}
      onClick=${(e) => {
        chrome.tabs.create({ url: imageUrl, active: false });
        onClick?.(e);
      }}
      ...${props}
    >
      &nbsp;
    <//>
  `;
};

export const DownloadImageButton = ({ imageUrl, onClick, ...props }) => {
  return html`
    <${ImageButton}
      title="Download"
      style=${{ backgroundImage: `url("/images/download.png")` }}
      onClick=${(e) => {
        chrome.downloads.download({ url: imageUrl });
        onClick?.(e);
      }}
      ...${props}
    >
      &nbsp;
    <//>
  `;
};
