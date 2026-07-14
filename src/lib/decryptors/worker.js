const { runAsWorker } = require('@dotenvx/tooling')

runAsWorker(async (decryptorPath, src, options) => {
  const decryptor = require(decryptorPath)
  return decryptor(src, options)
})
