const path = require('path')
const { BrowserWindow } = require('electron')
const { clearSchedule } = require('./schedule')

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
  } else if (!win.isVisible()) {
    win.show()
  } else if (win.isMinimized()) {
    win.restore()
  } else {
    win.focus()
  }
}

module.exports = {
  createWindow,
  activeWindow,
}