const { execFileSync } = require('child_process')

const windowsCredentialManager = require('../../helpers/windowsCredentialManager')
const linuxSecretService = require('../../helpers/linuxSecretService')

const SECURITY_BIN = '/usr/bin/security'
const SERVICE = 'dotenvx'

function findMacosPrivateKey (publicKeyHex) {
  return execFileSync(SECURITY_BIN, ['find-generic-password', '-s', SERVICE, '-a', publicKeyHex, '-w'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
}

function set (key, value, label) {
  if (process.platform === 'win32') {
    windowsCredentialManager.addGenericPassword(key, value)
    return
  }

  if (process.platform === 'linux') {
    linuxSecretService.addGenericPassword(key, label, value)
    return
  }

  try {
    execFileSync(SECURITY_BIN, ['add-generic-password', '-U', '-s', SERVICE, '-a', key, '-l', label, '-w', value], { stdio: 'ignore' })
  } catch {
    throw new Error('failed to save private key to macOS Keychain')
  }
}

function index (publicKeyHex) {
  if (!['darwin', 'linux', 'win32'].includes(process.platform)) return {}

  try {
    let privateKeyHex
    if (process.platform === 'win32') {
      privateKeyHex = windowsCredentialManager.findGenericPassword(publicKeyHex)
    } else if (process.platform === 'linux') {
      privateKeyHex = linuxSecretService.findGenericPassword(publicKeyHex)
    } else {
      privateKeyHex = findMacosPrivateKey(publicKeyHex)
    }

    if (!privateKeyHex) return {}

    return { [publicKeyHex]: privateKeyHex }
  } catch {
    return {}
  }
}

index.set = set

module.exports = index
