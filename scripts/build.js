const { join } = require('path')
const fs = require('fs-extra')
const { outputDirectory } = require('./config')

fs.emptyDirSync(outputDirectory)

const filesToCopy = ['manifest.json']
filesToCopy.forEach((file) => {
  fs.copyFileSync(file, join(outputDirectory, file))
})

const directoriesToCopy = ['images', 'lib', 'src', 'stylesheets', 'views']
directoriesToCopy.forEach((directory) => {
  fs.copySync(directory, join(outputDirectory, directory), { recursive: true })
})
