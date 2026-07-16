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

t.test('validate accepts keys marked optional by an inline comment', t => {
  const example = {
    REQUIRED: '',
    OPTIONAL_EMPTY: '',
    OPTIONAL_VALUE: 'fallback',
    OPTIONAL_UPPERCASE: ''
  }
  const exampleSrc = [
    'REQUIRED=',
    'OPTIONAL_EMPTY= # optional',
    'OPTIONAL_VALUE=fallback # this is optional here',
    'OPTIONAL_UPPERCASE= # OPTIONAL'
  ].join('\n')

  t.same(validate(example, {}, { exampleSrc }), {
    valid: false,
    errors: [{
      code: 'MISSING_REQUIRED',
      keys: ['REQUIRED'],
      message: 'missing required (REQUIRED)'
    }]
  })
  t.end()
})

t.test('validate does not treat optional inside a quoted value as a comment', t => {
  const example = { REQUIRED: '# optional' }
  const exampleSrc = 'REQUIRED="# optional"'

  t.same(validate(example, {}, { exampleSrc }), {
    valid: false,
    errors: [{
      code: 'MISSING_REQUIRED',
      keys: ['REQUIRED'],
      message: 'missing required (REQUIRED)'
    }]
  })
  t.end()
})
