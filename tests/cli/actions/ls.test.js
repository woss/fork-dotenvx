const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.beforeEach(() => {
  sinon.restore()
})

t.test('ls traverses with a spinner and stops it before output', async ct => {
  const spinner = { text: 'traversing', stop: sinon.stub() }
  const createSpinner = sinon.stub().resolves(spinner)
  const main = { ls: sinon.stub().returns(['.env']) }
  const logger = {
    debug: sinon.stub(),
    info: sinon.stub()
  }
  const ls = proxyquire('../../../src/cli/actions/ls', {
    './../../lib/main': main,
    './../../shared/logger': { logger },
    '../../lib/helpers/createSpinner': createSpinner
  })

  await ls.call({
    opts: () => ({ envFile: '.env*' }),
    optsWithGlobals: () => ({ quiet: false })
  }, '.')

  ct.same(createSpinner.firstCall.args, [{ quiet: false, envFile: '.env*', text: 'traversing' }])
  ct.equal(main.ls.firstCall.args[0], '.')
  ct.equal(main.ls.firstCall.args[1], '.env*')
  ct.equal(main.ls.firstCall.args[2], undefined)
  main.ls.firstCall.args[3]('packages/example')
  ct.equal(spinner.text, 'traversing packages/example')
  ct.equal(spinner.stop.callCount, 1)
  ct.ok(spinner.stop.calledBefore(logger.info), 'stops spinner before tree output')
  ct.end()
})

t.test('ls stops the spinner and reports traversal errors', async ct => {
  const error = new Error('cannot traverse')
  const spinner = { stop: sinon.stub() }
  const createSpinner = sinon.stub().resolves(spinner)
  const catchAndLog = sinon.stub()
  const exitStub = sinon.stub(process, 'exit')
  const ls = proxyquire('../../../src/cli/actions/ls', {
    './../../lib/main': { ls: sinon.stub().throws(error) },
    '../../lib/helpers/createSpinner': createSpinner,
    '../../lib/helpers/catchAndLog': catchAndLog
  })

  await ls.call({ opts: () => ({}) }, '.')

  ct.equal(spinner.stop.callCount, 1)
  ct.same(catchAndLog.firstCall.args, [error])
  ct.ok(exitStub.calledWith(1))
  ct.end()
})
