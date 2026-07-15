const t = require('tap')

const redactedValues = require('../../../src/lib/helpers/redactedValues')

t.test('redactedValues returns injected values except _PLAIN values', ct => {
  const values = redactedValues([
    {
      injected: {
        SECRET: 'super-secret',
        PUBLIC: 'public-value',
        VISIBLE_PLAIN: 'visible-value',
        EMPTY: ''
      }
    },
    {
      injected: { INLINE: 'inline-value' },
      existed: {
        EXISTING: 'external-value',
        EXISTING_PLAIN: 'external-visible-value'
      }
    }
  ])

  ct.same(values, ['super-secret', 'public-value', 'inline-value', 'external-value'])
  ct.end()
})
