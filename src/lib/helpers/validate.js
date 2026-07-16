function validate (example = {}, env = {}) {
  const errors = []
  const missingRequired = []

  for (const key of Object.keys(example)) {
    if (!Object.prototype.hasOwnProperty.call(env, key)) {
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
