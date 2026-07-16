const t = require('tap')

const validate = require('../../../src/lib/helpers/validate')

t.test('validate accepts an empty example', t => {
  t.same(validate({}, {}), {
    valid: true,
    errors: []
  })
  t.end()
})

t.test('validate accepts required keys that exist', t => {
  t.same(validate({ HELLO: '' }, { HELLO: '' }), {
    valid: true,
    errors: []
  })
  t.end()
})

t.test('validate collects all missing required keys', t => {
  t.same(validate({ HELLO: '', DATABASE_URL: '', API_KEY: '' }, { HELLO: 'World' }), {
    valid: false,
    errors: [
      {
        code: 'MISSING_REQUIRED',
        keys: ['DATABASE_URL', 'API_KEY'],
        message: 'missing required (DATABASE_URL, API_KEY)'
      }
    ]
  })
  t.end()
})
