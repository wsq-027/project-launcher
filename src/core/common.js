const { app } = require('electron')
let userPath = app.getPath('userData')

function getUserPath() {
  return userPath
}

module.exports = {
  getUserPath,
}
