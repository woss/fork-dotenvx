const { logger } = require('./../../shared/logger')

const conventions = require('./../../lib/helpers/conventions')
const escape = require('./../../lib/helpers/escape')
const catchAndLog = require('./../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')
const getResolver = require('./../../lib/resolvers/get')
const normalizeDotenvConfigConvention = require('../../lib/helpers/normalizeDotenvConfigConvention')
const resolveDirectoryFilepath = require('../../lib/helpers/resolveDirectoryFilepath')

function buildEnvs (envs, convention) {
  const resolvedEnvs = []
  let hasDirectory = false

  for (const env of envs) {
    if (env.type !== 'envFile') {
      resolvedEnvs.push(env)
      continue
    }

    const envFilepath = resolveDirectoryFilepath(env.value, '.env')
    if (envFilepath === env.value) {
      resolvedEnvs.push(env)
      continue
    }

    hasDirectory = true
    if (convention) {
      for (const conventionEnv of conventions(convention)) {
        resolvedEnvs.push({
          ...conventionEnv,
          value: resolveDirectoryFilepath(env.value, conventionEnv.value)
        })
      }
    } else {
      resolvedEnvs.push({ ...env, value: envFilepath })
    }
  }

  if (convention && !hasDirectory) {
    return conventions(convention).concat(resolvedEnvs)
  }

  return resolvedEnvs
}

function resolveEnvKeysFile (envKeysFile) {
  if (Array.isArray(envKeysFile)) {
    return envKeysFile.map(filepath => resolveDirectoryFilepath(filepath, '.env.keys'))
  }

  return envKeysFile && resolveDirectoryFilepath(envKeysFile, '.env.keys')
}

async function get (key) {
  const options = normalizeDotenvConfigConvention(this.opts())
  const spinner = await createSpinner({ ...options, text: 'decrypting' })

  logger.debug(`options: ${JSON.stringify(options)}`)
  if (key) {
    logger.debug(`key: ${key}`)
  }

  const prettyPrint = options.prettyPrint || options.pp
  const ignore = options.ignore || []
  let errorCount = 0

  const envs = buildEnvs(this.envs, options.convention)

  try {
    const sesh = new Session()
    const noArmor = options.armor === false || (await sesh.noArmor())
    const noKeychain = options.native === false || options.noNative === true
    const { parsed, errors } = await getResolver({
      key,
      envs,
      overload: options.overload,
      all: options.all,
      envKeysFile: resolveEnvKeysFile(options.envKeysFile),
      noArmor,
      noKeychain,
      onStatus: (text) => {
        if (spinner && text) {
          spinner.text = text
        }
      }
    })

    for (const error of errors || []) {
      if (options.strict) throw error // throw immediately if strict

      if (ignore.includes(error.code)) {
        continue // ignore error
      }

      errorCount += 1
      logger.error(error.messageWithHelp)
    }

    if (spinner) spinner.stop()
    if (key) {
      const single = parsed[key]
      if (single === undefined) {
        console.log('')
      } else {
        console.log(single)
      }
    } else {
      if (options.format === 'eval') {
        let inline = ''
        for (const [key, value] of Object.entries(parsed)) {
          inline += `${key}=${escape(value)}\n`
        }
        inline = inline.trim()

        console.log(inline)
      } else if (options.format === 'shell') {
        let inline = ''
        for (const [key, value] of Object.entries(parsed)) {
          inline += `${key}=${value} `
        }
        inline = inline.trim()

        console.log(inline)
      } else if (options.format === 'colon') {
        let inline = ''
        for (const [key, value] of Object.entries(parsed)) {
          inline += `${key}:${value} `
        }
        inline = inline.trim()

        console.log(inline)
      } else {
        let space = 0
        if (prettyPrint) {
          space = 2
        }

        console.log(JSON.stringify(parsed, null, space))
      }
    }

    if (errorCount > 0) {
      process.exit(1)
    }
  } catch (error) {
    if (spinner) spinner.stop()
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = get
