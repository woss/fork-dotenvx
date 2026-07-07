const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.afterEach((ct) => {
  sinon.restore()
})

t.test('keychain provider finds private key by public key', ct => {
  const execFileSync = sinon.stub().returns('private-key\n')
  const provider = proxyquire('../../../src/lib/providers/keychain', {
    child_process: {
      execFileSync
    }
  })

  const keyring = provider('public-key')

  ct.same(keyring, { 'public-key': 'private-key' })
  ct.same(execFileSync.firstCall.args, [
    '/usr/bin/security',
    ['find-generic-password', '-s', 'dotenvx', '-a', 'public-key', '-w'],
    { encoding: 'utf8' }
  ])
  ct.end()
})

t.test('keychain provider returns empty keyring when security errors', ct => {
  const error = new Error('security error')
  const execFileSync = sinon.stub().throws(error)
  const provider = proxyquire('../../../src/lib/providers/keychain', {
    child_process: {
      execFileSync
    }
  })

  const keyring = provider('public-key')

  ct.same(keyring, {})
  ct.end()
})
