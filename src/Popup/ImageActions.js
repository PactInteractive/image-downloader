import html from '../html.js';

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

export const OpenImageButton = ({ imageUrl, onClick, ...props }) => {
  return html`
    <button
      type="button"
      title="Open in new tab"
      style=${{ backgroundImage: `url("/images/open.svg")` }}
      onClick=${(e) => {
        chrome.tabs.create({ url: imageUrl, active: false });
        onClick?.(e);
      }}
      ...${props}
    />
  `;
};

export const DownloadImageButton = ({ imageUrl, folderName, onClick, ...props }) => {
  return html`
    <button
      type="button"
      title="Download"
      style=${{ backgroundImage: `url("/images/download.svg")` }}
      onClick=${(e) => {
        chrome.downloads.download({ url: imageUrl, filename: folderName });
        onClick?.(e);
      }}
      ...${props}
    />
  `;
};
