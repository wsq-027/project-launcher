const { app, BrowserWindow } = require('electron')
const { initIPC } = require('./ipc')
const { createWindow } = require('./window')
const { initTray } = require('./tray')

function activeWindow() {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
}

app.whenReady().then(() => {
  initIPC()
  createWindow()
  initTray({
    onActive: activeWindow
  })

  app.on('activate', activeWindow)
})

app.on('window-all-closed', () => {
  console.log('win all close')
  // app.quit()
})
