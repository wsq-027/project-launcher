const fs = require('fs')
const server = require('./src/core/proxy-server')
const { isDesktop, getUserPath, tryRun } = require('./src/core/common')

if (!isDesktop) {
  const dashboard = require('./src/server/router')
  server.app.use('/dashboard', dashboard)
}

try {
  const port = tryRun(() => fs.readFileSync(getUserPath() + '/port', { encoding: 'utf-8', flag: 'r'}))?.toString?.() ?? 3335
  server.start(port)
} catch (e) {
  if (isDesktop) {
    const { app } = require('electron')
    app.quit()
  }

  throw e
}

if (isDesktop) {
  require('./src/desktop/index')
} else {
  console.log(`Server start on http://127.0.0.1:${port}/dashboard`)
}
