// @ts-check
import { Component } from 'preact';
import html from '../html.js';

export class ErrorBoundary extends Component {
	/** @type {{ hasError: boolean, error: Error | null }} */
	state = { hasError: false, error: null };

	static getDerivedStateFromError(/** @type {Error} */ error) {
		return { hasError: true, error };
	}

	componentDidCatch(/** @type {Error} */ error, /** @type {{ componentStack?: string | null }} */ info) {
		console.error('ErrorBoundary caught an error:', error);
		console.error('Component stack:', info.componentStack);
	}

	render() {
		if (this.state.hasError) {
			const error = this.state.error;
			const errorMessage = error?.message || 'Unknown error';
			const errorStack = error?.stack || '';

			return html`
				<div
					style=${{
						padding: '12px',
						fontFamily: 'system-ui, -apple-system, sans-serif',
						maxWidth: '500px',
						margin: '0 auto',
					}}
				>
					<div
						style=${{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px' }}
					>
						<hgroup>
							<h2 style=${{ color: '#dc2626', margin: '0 0 8px 0', fontSize: '18px' }}>
								Image Downloader encountered an error
							</h2>

							<p style=${{ color: '#7f1d1d', margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.5' }}>
								Something went wrong while rendering the extension. Your browser is safe, but the extension may not work
								properly.
							</p>
						</hgroup>

						<div
							style=${{
								backgroundColor: '#fff',
								border: '1px solid #fecaca',
								borderRadius: '4px',
								padding: '10px',
								marginBottom: '12px',
								fontFamily: 'monospace',
								fontSize: '12px',
								color: '#374151',
								maxHeight: '120px',
								overflow: 'auto',
								wordBreak: 'break-word',
							}}
						>
							${errorMessage}
						</div>

						<details style=${{ marginBottom: '12px', fontSize: '12px' }}>
							<summary style=${{ cursor: 'pointer', color: '#7f1d1d', fontWeight: '500' }}>
								View technical details (for reporting)
							</summary>

							<pre
								style=${{
									backgroundColor: '#fff',
									border: '1px solid #fecaca',
									borderRadius: '4px',
									padding: '10px',
									marginTop: '8px',
									fontSize: '11px',
									color: '#374151',
									maxHeight: '200px',
									overflow: 'auto',
									whiteSpace: 'pre-wrap',
									wordBreak: 'break-all',
								}}
							>
								${errorStack}
							</pre
							>
						</details>

						<div style=${{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
							<button
								onClick=${() => {
									this.setState({ hasError: false, error: null });
									window.location.reload();
								}}
								style=${{
									backgroundColor: '#dc2626',
									color: '#fff',
									border: 'none',
									borderRadius: '6px',
									padding: '8px 16px',
									fontSize: '14px',
									fontWeight: '500',
									cursor: 'pointer',
									flex: '1',
									minWidth: '120px',
								}}
							>
								Reload extension
							</button>

							<button
								onClick=${() => {
									const text = `Error: ${errorMessage}\n\nStack:\n${errorStack}`;
									navigator.clipboard.writeText(text).catch(() => {});
								}}
								style=${{
									backgroundColor: '#fff',
									color: '#dc2626',
									border: '1px solid #fecaca',
									borderRadius: '6px',
									padding: '8px 16px',
									fontSize: '14px',
									fontWeight: '500',
									cursor: 'pointer',
									flex: '1',
									minWidth: '120px',
								}}
							>
								Copy error details
							</button>
						</div>

						<p style=${{ color: '#9ca3af', fontSize: '11px', margin: '12px 0 0 0', textAlign: 'center' }}>
							If this keeps happening, please try reloading the page or restarting the extension.
						</p>
					</div>
				</div>
			`;
		}

		return this.props.children;
	}
}
