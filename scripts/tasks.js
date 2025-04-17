import fs from 'fs-extra';
import { join, normalize } from 'path';
import sharp from 'sharp';

import * as config from './config';

export async function clean() {
  await fs.emptyDir(config.outputDirectory);
}

export async function updateManifest() {
  const [packageJson, manifestJson] = await Promise.all([
    fs.readJson(config.paths.package),
    fs.readJson(config.paths.manifest),
  ]);

  const icons = await generateIcons(config.icons);

  await fs.writeJson(
    config.paths.manifest,
    { ...manifestJson, version: packageJson.version, icons },
    { spaces: 2 },
  );

  return normalize(config.paths.manifest);
}

export async function copyFile(path) {
  await fs.copy(path, join(config.outputDirectory, path), { recursive: true });
}

export async function removeFile(path) {
  await fs.remove(join(config.outputDirectory, path));
}

// See https://wxt.dev/api/config.html
async function generateIcons({ inputSvg, outputDirectory, prefix, sizes }) {
  try {
    const icons = {};

    // Ensure output directory exists
    await fs.mkdir(join(config.outputDirectory, outputDirectory), {
      recursive: true,
    });

    // Check if input SVG exists
    try {
      await fs.access(inputSvg);
    } catch {
      throw new Error(`Input SVG file (${inputSvg}) not found.`);
    }

    // Generate PNGs for each size
    for (const size of sizes) {
      const outputPath = join(
        config.outputDirectory,
        outputDirectory,
        `${prefix}${size}.png`,
      );
      await sharp(inputSvg)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(outputPath);
      console.log(`Generated ${outputPath}`);

      icons[`${size}`] = `/${outputDirectory}/${prefix}${size}.png`;
    }

    return icons;
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}
