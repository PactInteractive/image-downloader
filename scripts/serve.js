import { join } from 'node:path';
import { outputDirectory } from './config.js';

const injectScripts = `
	<script src="/lib/eruda.min.js"></script>
	<script>eruda.init()</script>
	<script src="/src/Web/chrome.shim.js"></script>
`;

const mimeTypes = {
	'.html': 'text/html',
	'.js': 'application/javascript',
	'.mjs': 'application/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.ico': 'image/x-icon',
	'.webp': 'image/webp',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
};

const port = parseInt(process.env.PORT) || 3000;
Bun.serve({
	port,
	async fetch(request) {
		const url = new URL(request.url);
		const filePath = url.pathname === '/' ? '/src/Web/index.html' : url.pathname;

		const file = Bun.file(join(__dirname, '..', (filePath.startsWith('/src/Web') ? '' : outputDirectory) + filePath));

		if (await file.exists()) {
			console.log(`${request.method} ${url.href} 200`);
			const extension = filePath.slice(filePath.lastIndexOf('.'));
			const contentType = mimeTypes[extension] || 'application/octet-stream';

			if (extension === '.html') {
				const html = (await file.text()).replace('<head>', `<head>${injectScripts}`);
				return new Response(html, {
					headers: {
						'Content-Type': contentType,
						'Access-Control-Allow-Origin': '*',
					},
				});
			}

			return new Response(file, {
				headers: {
					'Content-Type': contentType,
					'Access-Control-Allow-Origin': '*',
				},
			});
		}

		console.log(`${request.method} ${url.href} 404`);
		return new Response('Not Found', { status: 404 });
	},
});

console.log(`Web server running at http://localhost:${port}`);
