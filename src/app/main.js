const Core = require('../core')
const Client = require('./index')

function main() {
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
}

main()
