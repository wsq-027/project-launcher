const { app, dialog } = require('electron')
const { initIPC } = require('./ipc')
const { createWindow, activeWindow } = require('./window')
const { initTray } = require('./tray')
const core = require('../../core/index')

function onStart() {
  const instanceLock = app.requestSingleInstanceLock()

  if (!instanceLock) {
    app.quit()
  } else {
    app.on('second-instance', () => {
      activeWindow()
    })
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

  let hasClear = false
  app.once('before-quit', async (event) => {
    if (!hasClear) {
      event.preventDefault()
    }

    await core.onExit()

    hasClear = true

    app.quit()
  })
}

module.exports = {
  onStart,
  onError(e) {
    console.error(e)

    dialog.showErrorBox('Error', e.message)

      app.quit()
  },
  afterStart({port}) {},
}