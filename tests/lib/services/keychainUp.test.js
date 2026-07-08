const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.beforeEach(() => {
  sinon.restore()
})

t.test('KeychainUp sanitizes failed security add errors', ct => {
  const privateKey = 'private-key-that-must-not-leak'
  const execFileSync = sinon.stub()
  execFileSync.onFirstCall().throws(new Error('not found'))
  execFileSync.onSecondCall().throws(new Error(`Command failed: security add-generic-password -w ${privateKey}`))

  const readEnvKey = sinon.stub()
  readEnvKey.onFirstCall().returns('public-key')
  readEnvKey.onSecondCall().returns(privateKey)
  const removeEnvKey = sinon.stub()

  const KeychainUp = proxyquire('../../../src/lib/services/keychainUp', {
    child_process: { execFileSync },
    '../helpers/readEnvKey': readEnvKey,
    '../helpers/removeEnvKey': removeEnvKey
  })

  const error = ct.throws(() => new KeychainUp('.env', '.env.keys').run(), /failed to save private key to macOS Keychain/)

  ct.notMatch(error.message, privateKey)
  ct.same(execFileSync.secondCall.args[1], ['add-generic-password', '-U', '-s', 'dotenvx', '-a', 'public-key', '-l', 'dotenvx (PUB LIC)', '-w', privateKey])
  ct.equal(removeEnvKey.callCount, 0)
  ct.end()
})
