const fs = require('fs')
const server = require('./src/core/proxy-server')
const { isDesktop, getUserPath } = require('./src/core/common')
const client = isDesktop ? require('./src/clients/desktop/index') : require('./src/clients/web/index')

function tryGet(fn, defaultValue) {
  try {
    return fn()
  } catch (e) {
    return defaultValue
  }
}

try {
  client.onStart()

  const port = tryGet(() => fs.readFileSync(getUserPath() + '/port', { encoding: 'utf-8', flag: 'r'}).toString(), 3335)
  const instance = server.start(port)

  instance.addListener('error', client.onError)

  client.afterStart({port})
} catch (e) {
  client.onError(e)
}

