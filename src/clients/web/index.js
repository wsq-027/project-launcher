const dashboard = require('./router')
const server = require('../../core/proxy-server')

module.exports = {
  onStart() {
    server.app.use('/dashboard', dashboard)
  },
  onError() {},
  afterStart() {
    console.log(`Server start on http://127.0.0.1:${port}/dashboard`)
  },
}