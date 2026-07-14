const { objectTreeify: treeify } = require('@dotenvx/tooling')

const { logger } = require('./../../shared/logger')

const main = require('./../../lib/main')
const ArrayToTree = require('./../../lib/helpers/arrayToTree')
const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')

async function ls (directory) {
  // debug args
  logger.debug(`directory: ${directory}`)

  const options = this.opts()
  const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
  const spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'traversing' })
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const filepaths = await main.ls(directory, options.envFile, options.excludeEnvFile, (filepath) => {
      if (spinner) spinner.text = `traversing ${filepath}`
    })
    logger.debug(`filepaths: ${JSON.stringify(filepaths)}`)

    const tree = new ArrayToTree(filepaths).run()
    logger.debug(`tree: ${JSON.stringify(tree)}`)

    if (spinner) spinner.stop()
    logger.info(treeify(tree))
  } catch (error) {
    if (spinner) spinner.stop()
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = ls
