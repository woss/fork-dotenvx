const { WriteStream } = require('tty')
const t = require('tap')
const sinon = require('sinon')

const depth = require('../../../src/lib/helpers/colorDepth')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('returns WriteStream.prototype.getColorDepth()', (ct) => {
  const stub = sinon.stub(WriteStream.prototype, 'getColorDepth').returns(8)
  ct.equal(depth.getColorDepth(), 8)

  stub.restore()
  ct.end()
})

t.test('returns no color for a redirected stream', (ct) => {
  const stream = { isTTY: false }

  ct.equal(depth.getColorDepth(stream), 1)
  ct.end()
})

t.test('returns the color depth of a TTY stream', (ct) => {
  const stream = { isTTY: true, getColorDepth: sinon.stub().returns(8) }

  ct.equal(depth.getColorDepth(stream), 8)
  ct.ok(stream.getColorDepth.calledOnce)
  ct.end()
})

t.test('falls back to process.env.TERM when getColorDepth throws an error (deno scenario)', (ct) => {
  const stub = sinon.stub(WriteStream.prototype, 'getColorDepth').throws(new TypeError('Not a function'))

  process.env.TERM = 'xterm-256color'

  ct.equal(depth.getColorDepth(), 8, 'should return 8 since TERM is 256')

  stub.restore()
  ct.end()
})

t.test('falls back to 4 when no process.env.TERM when getColorDepth throws an error (deno scenario)', (ct) => {
  const stub = sinon.stub(WriteStream.prototype, 'getColorDepth').throws(new TypeError('Not a function'))

  ct.equal(depth.getColorDepth(), 4, 'should return 4 since TERM is missing')

  stub.restore()
  ct.end()
})

t.test('falls back to 4 when process.env.TERM neither xterm or 256color when getColorDepth throws an error (deno scenario)', (ct) => {
  process.env.TERM = 'something else'

  const stub = sinon.stub(WriteStream.prototype, 'getColorDepth').throws(new TypeError('Not a function'))

  ct.equal(depth.getColorDepth(), 4, 'should return 4 since TERM is missing')

  stub.restore()
  ct.end()
})
