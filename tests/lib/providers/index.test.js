const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.afterEach((ct) => {
  sinon.restore()
})

function keychainStub () {
  const keychain = sinon.stub().resolves({})
  return keychain
}

function providersWithSession (session, stubs = {}) {
  return proxyquire('../../../src/lib/providers', Object.assign({
    './../../db/session': function Session () {
      return session
    },
    './keychain/index': keychainStub()
  }, stubs))
}

t.test('providers returns explicit provider', async ct => {
  const explicitProvider = sinon.stub()
  const session = {
    noArmor: sinon.stub().rejects(new Error('should not check session')),
    noArmorSync: sinon.stub().throws(new Error('should not check session'))
  }
  const providers = providersWithSession(session)

  ct.equal(await providers({ provider: explicitProvider }), explicitProvider)
  ct.equal(providers.sync({ provider: explicitProvider }), explicitProvider)
  ct.end()
})

t.test('providers returns null when disabled', async ct => {
  const session = {
    noArmor: sinon.stub().rejects(new Error('should not check session')),
    noArmorSync: sinon.stub().throws(new Error('should not check session'))
  }
  const providers = providersWithSession(session)

  ct.equal(await providers({ noArmor: true }), null)
  ct.equal(await providers({ provider: null }), null)
  ct.equal(providers.sync({ noArmor: true }), null)
  ct.equal(providers.sync({ provider: null }), null)
  ct.end()
})

t.test('providers returns keychain provider when armor session is off', async ct => {
  const keychain = keychainStub()
  const session = {
    noArmor: sinon.stub().resolves(true),
    noArmorSync: sinon.stub().returns(true)
  }
  const providers = providersWithSession(session, {
    './keychain/index': keychain
  })

  ct.equal(await providers(), keychain)
  ct.equal(providers.sync(), keychain)
  ct.end()
})

t.test('providers returns armor provider when armor session is on', async ct => {
  const armor = sinon.stub().resolves({ 'public-key': 'private-key' })
  const keychain = keychainStub()
  const session = {
    noArmor: sinon.stub().resolves(false),
    noArmorSync: sinon.stub().returns(false)
  }
  const providers = proxyquire('../../../src/lib/providers', {
    './../../db/session': function Session () {
      return session
    },
    './armor/index': armor,
    './keychain/index': keychain
  })

  const provider = await providers({ onStatus: 'status' })
  const value = await provider('public-key')

  ct.same(value, { 'public-key': 'private-key' })
  ct.same(keychain.firstCall.args, ['public-key'])
  ct.same(armor.firstCall.args, ['public-key', { onStatus: 'status', token: undefined, command: undefined }])
  ct.equal(typeof providers.sync(), 'function')
  ct.end()
})

t.test('providers returns keychain result before armor provider', async ct => {
  const armor = sinon.stub().resolves({ 'public-key': 'armor-private-key' })
  const keychain = keychainStub()
  keychain.resolves({ 'public-key': 'keychain-private-key' })
  const session = {
    noArmor: sinon.stub().resolves(false),
    noArmorSync: sinon.stub().returns(false)
  }
  const providers = providersWithSession(session, {
    './armor/index': armor,
    './keychain/index': keychain
  })

  const provider = await providers()
  const value = await provider('public-key')

  ct.same(value, { 'public-key': 'keychain-private-key' })
  ct.equal(armor.callCount, 0)
  ct.end()
})

t.test('providers returns armor provider results even when keyring is empty', async ct => {
  const armor = sinon.stub().resolves({})
  const keychain = keychainStub()
  const session = {
    noArmor: sinon.stub().resolves(false),
    noArmorSync: sinon.stub().returns(false)
  }
  const providers = proxyquire('../../../src/lib/providers', {
    './../../db/session': function Session () {
      return session
    },
    './armor/index': armor,
    './keychain/index': keychain
  })

  const provider = await providers()
  const value = await provider('public-key')

  ct.same(value, {})
  ct.equal(typeof provider, 'function')
  ct.equal(typeof providers.sync(), 'function')
  ct.end()
})
