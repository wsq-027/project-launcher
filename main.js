const Core = require('./src/core')
const Client = require('./src/clients/desktop/index')

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
