const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.beforeEach(() => {
  sinon.restore()
})

t.test('KeychainPush sanitizes failed security add errors', ct => {
  const privateKey = 'private-key-that-must-not-leak'
  const execFileSync = sinon.stub()
  execFileSync.onFirstCall().throws(new Error('not found'))
  execFileSync.onSecondCall().throws(new Error(`Command failed: security add-generic-password -w ${privateKey}`))

  const readEnvKey = sinon.stub()
  readEnvKey.onFirstCall().returns('public-key')
  readEnvKey.onSecondCall().returns(privateKey)

  const KeychainPush = proxyquire('../../../src/lib/services/keychainPush', {
    child_process: { execFileSync },
    '../helpers/readEnvKey': readEnvKey
  })

  const error = ct.throws(() => new KeychainPush('.env', '.env.keys').run(), /failed to save private key to macOS Keychain/)

  ct.notMatch(error.message, privateKey)
  ct.same(execFileSync.secondCall.args[1], ['add-generic-password', '-U', '-s', 'dotenvx', '-a', 'public-key', '-l', 'dotenvx (PUB LIC)', '-w', privateKey])
  ct.end()
})
