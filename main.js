require('./src/dashboard/windows')

const server = require('./src/proxy-server')
// const dashboard = require('./src/dashboard/router')
// server.app.use('/dashboard', dashboard)

const port = 3335
server.start(port)
console.log(`Server start on http://127.0.0.1:${port}/dashboard`)

// server.addProxy('/medical', 'http://127.0.0.1:3331'))
// server.addProxy('/pay', 'http://127.0.0.1:3334')
// server.addProxy('/', 'http://127.0.0.1:3330')
// server.addProxy('/', 'https://health.dev.zoenet.cn')