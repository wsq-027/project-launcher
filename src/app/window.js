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
    resizable: false,
    fullscreenable: false,
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(`${process.env.VITE_DEV_SERVER_URL}`)
  } else {
    const viewPath = path.join(__dirname, `../views/index.html`)
    win.loadFile(viewPath)
  }

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