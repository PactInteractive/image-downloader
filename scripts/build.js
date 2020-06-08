const { join } = require('path')
const fs = require('fs-extra')
const { outputDirectory } = require('./config')

// Update manifest version
const packageJson = require('../package.json')
const manifestJson = require('../manifest.json')
fs.writeJsonSync(
  './manifest.json',
  { ...manifestJson, version: packageJson.version },
  { spaces: 2 }
)

// Empty output directory
fs.emptyDirSync(outputDirectory)

// Copy root directory files
const filesToCopy = ['manifest.json']
filesToCopy.forEach((file) => {
  fs.copyFileSync(file, join(outputDirectory, file))
})

// Copy directories recursively
const directoriesToCopy = ['images', 'lib', 'src', 'stylesheets', 'views']
directoriesToCopy.forEach((directory) => {
  fs.copySync(directory, join(outputDirectory, directory), { recursive: true })
})
