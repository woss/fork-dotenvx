function commentFor (value) {
  let quote
  let escaped = false

  for (let i = 0; i < value.length; i++) {
    const char = value[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\' && quote === '"') {
      escaped = true
      continue
    }

    if (char === '"' || char === "'") {
      if (quote === char) {
        quote = undefined
      } else if (!quote) {
        quote = char
      }
      continue
    }

    if (char === '#' && !quote) {
      return value.slice(i + 1)
    }
  }
}

function optionalKeys (src) {
  const keys = new Set()

  for (const line of src.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([\w.-]+)\s*=(.*)$/)
    if (!match) continue

    const comment = commentFor(match[2])
    if (comment && /\boptional\b/i.test(comment)) {
      keys.add(match[1])
    }
  }

  return keys
}

function validate (example = {}, env = {}, options = {}) {
  const errors = []
  const missingRequired = []
  const optional = optionalKeys(options.exampleSrc || '')

  for (const key of Object.keys(example)) {
    if (!optional.has(key) && !Object.prototype.hasOwnProperty.call(env, key)) {
      missingRequired.push(key)
    }
  }

  if (missingRequired.length > 0) {
    errors.push({
      code: 'MISSING_REQUIRED',
      keys: missingRequired,
      message: `missing required (${missingRequired.join(', ')})`
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

module.exports = validate
