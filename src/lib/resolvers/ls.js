const { Fdir } = require('@dotenvx/tooling')
const path = require('path')
const { match } = require('@dotenvx/primitives')

function patternsFor (value) {
  if (!Array.isArray(value)) {
    return [`**/${value}`]
  }

  return value.map(part => `**/${part}`)
}

function excludePatternsFor (value) {
  if (!Array.isArray(value)) {
    return [`**/${value}`]
  }

  return value.map(part => `**/${part}`)
}

async function ls (options = {}) {
  const ignore = ['node_modules/**', '**/node_modules/**', '.git/**', '**/.git/**']
  const cwd = path.resolve(options.directory || './')
  const envFile = options.envFile || ['.env*']
  const excludeEnvFile = options.excludeEnvFile || []
  const excludePatterns = excludePatternsFor(excludeEnvFile)
  const excludes = excludePatterns.length > 0 ? ignore.concat(excludePatterns) : ignore
  const exclude = match(excludes, { dot: true })
  const include = match(patternsFor(envFile), {
    dot: true,
    ignore: excludes
  })
  const onDirectory = options.onDirectory || (() => {})

  return new Fdir()
    .withRelativePaths()
    .exclude((dirname, directory) => {
      if (dirname === 'node_modules' || dirname === '.git') return true

      onDirectory(path.relative(cwd, directory) || '.')
      return false
    })
    .filter((filepath) => !exclude(filepath) && include(filepath))
    .crawl(cwd)
    .withPromise()
}

module.exports = ls
