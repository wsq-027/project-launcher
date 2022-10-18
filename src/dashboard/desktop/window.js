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

  win.loadFile(path.join(__dirname, '../views/index.html'))

  clearSchedule()
}

module.exports = {
  createWindow,
}