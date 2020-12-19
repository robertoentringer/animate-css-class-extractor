#! /usr/bin/env node

const fs = require('fs')
const util = require('util')
const path = require('path')

const sourceDir = path.dirname(
  require.resolve('animate.css', { paths: [process.cwd(), __dirname] })
)

const sourceFile = path.join(sourceDir, 'source', 'animate.css')

const color = (string, color = 'info') => {
  const opts = { info: 36, warning: 33, sucess: 32, danger: 31 }
  return `\x1b[${opts[color]}m${string}\x1b[0m`
}

const outputFilename = (ext) => {
  const version = require(path.join(sourceDir, 'package')).version
  const localDate = Date.now() - new Date().getTimezoneOffset() * 60000
  const dateTime = new Date(localDate)
    .toISOString()
    .slice(0, 16)
    .replace('T', '_')
    .replace(/:/g, '-')
  const filename = `${dateTime}__${path.basename(sourceFile)}__v${version}.${ext}`
  return filename
}

const loadFile = () => {
  try {
    return fs.readFileSync(sourceFile, 'utf-8').match(/\/(.*)\w/g)
  } catch (err) {
    console.error(err.message)
  }
}

const writeFile = (dest, data) => {
  try {
    fs.writeFileSync(dest, data)
  } catch (err) {
    console.error(err.message)
  }
}

const parseFile = () => {
  const source = loadFile()
  let group
  let animations = {}
  let groupStartsWith = '/* '
  for (const line of source) {
    if (line.startsWith(groupStartsWith)) {
      group = line.replace(groupStartsWith, '')
      animations[group] = []
    } else if (group in animations) {
      const cssClass = line.match(/\/(.*)\./)
      if (cssClass) animations[group].push(cssClass[1])
    }
  }
  return animations
}

const main = () => {
  console.info(color('Parse file:'), sourceFile)
  const animations = parseFile()

  const destFolder = process.cwd()

  const formatJSON = JSON.stringify(animations, null, 2)
  const fileJSON = path.join(destFolder, outputFilename('json'))
  console.info(color('Save JSON file:'), fileJSON, '...', color('OK'))
  writeFile(fileJSON, formatJSON)

  const formatModule = `export default ${util.inspect(animations)}`
  const fileJS = path.join(destFolder, outputFilename('js'))
  console.info(color('Save JS file:'), fileJS, '...', color('OK'))
  writeFile(fileJS, formatModule)
}

if (require.main === module) main()

exports.extractCssClasses = parseFile
