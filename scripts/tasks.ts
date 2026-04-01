import { $ } from 'bun';
import fs from 'fs-extra';
import { join, normalize } from 'path';
import sharp from 'sharp';

import * as config from './config';

export async function clean() {
	await fs.emptyDir(config.build);
}

export async function updateManifest() {
	const [packageJson, manifestJson] = await Promise.all([
		fs.readJson(config.packageJson),
		fs.readJson(config.manifestJson),
	]);

	const icons = await generateIcons(config.icons);

	await fs.writeJson(config.manifestJson, { ...manifestJson, version: packageJson.version, icons }, { spaces: '\t' });

	return normalize(config.manifestJson);
}

export async function buildCss() {
	await $`bunx @tailwindcss/cli -i ./src/style.css -o ./${config.build}/src/style.css`;
}

export async function copyFile(path: string) {
	await fs.copy(path, join(config.build, path));
}

export async function removeFile(path: string) {
	await fs.remove(join(config.build, path));
}

// See https://wxt.dev/api/config.html
async function generateIcons({ svg, output, prefix, sizes }: typeof config.icons) {
	try {
		const icons: Record<string, string> = {};

		// Ensure output directory exists
		await fs.mkdir(join(config.build, output), { recursive: true });

		// Check if input SVG exists
		try {
			await fs.access(svg);
		} catch {
			throw new Error(`Input SVG file (${svg}) not found.`);
		}

		// Generate PNGs for each size
		for (const size of sizes) {
			const outputPath = join(config.build, output, `${prefix}${size}.png`);
			await sharp(svg)
				.resize(size, size, {
					fit: 'contain',
					background: { r: 0, g: 0, b: 0, alpha: 0 },
				})
				.png()
				.toFile(outputPath);
			console.log(`Generated ${outputPath}`);

			icons[`${size}`] = `/${output}/${prefix}${size}.png`;
		}

		return icons;
	} catch (error) {
		console.error('Error generating icons:', error);
		process.exit(1);
	}
}

export type Task = (...args: string[]) => Promise<void | string>;

export const tasks = {
	clean,
	updateManifest,
	buildCss,
	copyFile,
	removeFile,
} satisfies Record<string, Task>;
