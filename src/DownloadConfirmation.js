import html from './html.js';
import { Checkbox } from './components/Checkbox.js';

export const DownloadConfirmation = ({
  onCheckboxChange,
  onClose,
  onConfirm,
  style,
  ...props
}) => {
  return html`
    <div style=${{ gridColumn: '1 / -1', ...style }} ...${props}>
      <div>
        <hr />
        <p>Take a quick look at your browser settings.</p>
        <p class="danger">
         If the <b>Ask where to save each file before downloading</b> option is
          checked, proceeding might open a lot of popup windows. Continue with
          the download?
        </p>
      </div>

      <div style=${{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <div style=${{ marginRight: 'auto' }}>
          <${Checkbox} onChange=${onCheckboxChange}>
            Got it, don't show again
          <//>
        </div>

        <input
          type="button"
          class="neutral ghost"
          value="Cancel"
          onClick=${onClose}
        />

        <input
          type="button"
          class="success"
          value="Yes, Download"
          onClick=${() => {
            onClose();
            onConfirm();
          }}
        />
      </div>
    </div>
  `;
};
