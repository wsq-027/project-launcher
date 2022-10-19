const isDesktop = !!process.versions.electron

let userPath = process.env.HOME || process.env.USERPROFILE + '/.project-launcher'
if (isDesktop) {
  const { app } = require('electron')
  userPath = app.getPath('userData')
}

function getUserPath() {
  return userPath
}

function tryRun(fn) {
  try {
    return fn()
  } catch (e) {
    return null
  }
}

module.exports = {
  isDesktop,
  getUserPath,
  tryRun,
}
