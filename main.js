const Core = require('./src/core')
const { isDesktop } = require('./src/core/common')
const Client = isDesktop ? require('./src/clients/desktop/index') : require('./src/clients/web/index')

const core = new Core
const client = new Client(core)
core.on('error', client.throws)

try {
  client.start()
  core.init()
  client.afterStart()
} catch (e) {
  client.throws(e)
}
