const { app, dialog, Menu } = require('electron')
const BaseClient = require('../base')
const { initIPC } = require('./ipc')
const { createWindow, activeWindow } = require('./window')
const { initTray } = require('./tray')

module.exports = class DesktopClient extends BaseClient {
  start() {
    const instanceLock = app.requestSingleInstanceLock()

    if (!instanceLock) {
      app.quit()
    } else {
      app.on('second-instance', () => {
        activeWindow()
      })
    }

    app.whenReady().then(() => {
      if (app.isPackaged) {
        Menu.setApplicationMenu(null)
      }

      initIPC(this.core)
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

      await this.core.exit()

      hasClear = true

      app.quit()
    })
  }

  throws(e) {
    console.error(e)

    dialog.showErrorBox('Error', e.message)

    app.quit()
  }

  afterStart() {}
}
