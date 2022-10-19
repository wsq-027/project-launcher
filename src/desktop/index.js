const { app } = require('electron')
const { initIPC } = require('./ipc')
const { createWindow, activeWindow } = require('./window')
const { initTray } = require('./tray')
const core = require('../core/index')

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

let hasClear = false
app.once('before-quit', async (event) => {
  if (!hasClear) {
    event.preventDefault()
  }

  await core.onExit()

  hasClear = true

  app.quit()
})
