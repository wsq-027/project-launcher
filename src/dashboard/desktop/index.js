const { app } = require('electron')
const { initIPC } = require('./ipc')
const { createWindow, activeWindow } = require('./window')
const { initTray } = require('./tray')

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
