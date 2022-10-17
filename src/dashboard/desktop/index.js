const { app } = require('electron')
const { initIPC } = require('./ipc')
const { createWindow } = require('./window')

app.whenReady().then(() => {
  initIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0)  {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  app.quit()
})

