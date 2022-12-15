const path = require('path')
const { BrowserWindow } = require('electron')
const { clearSchedule } = require('./schedule')

/**
 * @type {Record<string, BrowserWindow}
 */
const winMap = {}

function createWindow(winId) {
  const win = winMap[winId] = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, './preload.js')
    },
  })

  win.loadFile(path.join(__dirname, `../../views/${winId}/index.html`))

  clearSchedule()
}

function activeWindow(winId) {
  const win = winMap[winId]
  if (!win || win.isDestroyed()) {
    createWindow(winId)
  } else if (win.isMinimized()) {
    win.restore()
  } else {
    win.show()
  }
}

function activeAllWindow() {
  for (let winId in winMap) {
    activeWindow(winId)
  }
}

module.exports = {
  createWindow,
  activeWindow,
  activeAllWindow,
}