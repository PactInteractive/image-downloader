import { sync } from 'glob';
import { join } from 'node:path';

import * as config from './config';

const injectScripts = `
	<script src="/src/Web/lib/eruda.min.js"></script>
	<script>eruda.init()</script>
	<script src="/src/Web/chrome.shim.js"></script>
`;

const mimeTypes: Record<string, string> = {
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

const port = parseInt(process.env.PORT || '') || 3000;
Bun.serve({
	port,
	async fetch(request) {
		const url = new URL(request.url);
		const filepath = url.pathname === '/' ? '/src/Web/index.html' : url.pathname;
		const shouldServeFromBuild = config.copy.include.some((pattern) =>
			sync(pattern, {
				ignore: config.copy.exclude.filter((pattern) => pattern !== config.style),
			}).includes(`.${filepath}`)
		);

		const file = Bun.file(join(__dirname, '..', (shouldServeFromBuild ? config.build : '') + filepath));

		if (await file.exists()) {
			console.log(`${request.method} ${url.href} 200`);
			const extension = filepath.slice(filepath.lastIndexOf('.'));
			const contentType = mimeTypes[extension] || 'application/octet-stream';

			if (extension === '.html') {
				const html = (await file.text()).replace('<script', `${injectScripts}<script`);
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
