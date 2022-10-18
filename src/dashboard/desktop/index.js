const { app } = require('electron')
const { initIPC } = require('./ipc')
const { createWindow } = require('./window')
const { initTray } = require('./tray')

app.whenReady().then(() => {
  initIPC()
  createWindow()
  initTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0)  {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  console.log('win all close')
  // app.quit()
})
