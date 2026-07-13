const { execFileSync } = require('child_process')

const keynames = require('../conventions/keynames')
const readEnvKey = require('../helpers/readEnvKey')
const armoredKeyDisplay = require('../helpers/armoredKeyDisplay')
const nativeProvider = require('../providers/native')
const windowsCredentialManager = require('../helpers/windowsCredentialManager')
const linuxSecretService = require('../helpers/linuxSecretService')

const SECURITY_BIN = '/usr/bin/security'
const SERVICE = 'dotenvx'

function findGenericPassword (publicKey) {
  if (process.platform === 'win32') {
    return windowsCredentialManager.findGenericPassword(publicKey)
  }

  if (process.platform === 'linux') {
    return linuxSecretService.findGenericPassword(publicKey)
  }

  return execFileSync(SECURITY_BIN, ['find-generic-password', '-s', SERVICE, '-a', publicKey, '-w'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
}

class KeychainPush {
  constructor (envFile = '.env', envKeysFile = '.env.keys') {
    this.envFile = envFile
    this.envKeysFile = envKeysFile
  }

  run () {
    const envFile = this.envFile
    const envKeysFile = this.envKeysFile

    const {
      publicKeyName,
      privateKeyName
    } = keynames(envFile)

    const publicKey = readEnvKey(publicKeyName, envFile, { strict: true, ignore: ['MISSING_PRIVATE_KEY'] })
    const privateKey = readEnvKey(privateKeyName, envKeysFile, { strict: true })
    const label = `dotenvx (${armoredKeyDisplay(publicKey)})`

    try {
      const existingPrivateKey = findGenericPassword(publicKey)

      if (existingPrivateKey === privateKey) {
        return {
          changed: false,
          label,
          privateKeyName,
          privateKeyValue: privateKey,
          publicKeyValue: publicKey
        }
      }
    } catch {}

    nativeProvider.set(publicKey, privateKey, label)

    return {
      changed: true,
      label,
      privateKeyName,
      privateKeyValue: privateKey,
      publicKeyValue: publicKey
    }
  }
}

module.exports = KeychainPush
