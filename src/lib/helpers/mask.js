function mask (str, showChar = 6) {
  if (!str || str.length < 1) {
    return ''
  }

  const number = Number(showChar)
  showChar = Number.isFinite(number) ? Math.abs(Math.trunc(number)) : 0

  const visibleChars = str.length === 1
    ? 0
    : str.length <= showChar
      ? Math.ceil(str.length / 2)
      : showChar
  const visiblePart = str.slice(0, visibleChars)
  const maskedPart = '*'.repeat(str.length - visibleChars)

  return visiblePart + maskedPart
}

module.exports = mask
