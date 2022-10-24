const BaseClient = require('../base')
const createDashboard = require('./router')

module.exports = class WebClient extends BaseClient {
  start() {
    const dashboard = createDashboard(this.core)
    this.core.ps.app.use('/dashboard', dashboard)

    process.on('beforeExit', async (code) => {
      await this.core.exit()
      process.exit(code)
    })
  }

  throws() {}

  afterStart() {
    const { port } = this.core.ps
    console.log(`Server start on http://127.0.0.1:${port}/dashboard`)
  }
}
