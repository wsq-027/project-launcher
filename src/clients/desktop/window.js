const path = require('path')
const { BrowserWindow } = require('electron')
const { clearSchedule } = require('./schedule')

/**
 * @type {BrowserWindow}
 */
let win

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, './preload.js')
    },
  })

  win.loadFile(path.join(__dirname, '../../views/dashboard/index.html'))

  clearSchedule()
}

function activeWindow() {
  if (!win || win.isDestroyed()) {
    createWindow()
  } else if (win.isMinimized()) {
    win.restore()
  } else {
    win.show()
  }
}

module.exports = {
  createWindow,
  activeWindow,
}