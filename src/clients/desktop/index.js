const { app, dialog, Menu } = require('electron')
const BaseClient = require('../base')
const { initIPC } = require('./ipc')
const { createWindow, activeAllWindow } = require('./window')
const { initTray } = require('./tray')

module.exports = class DesktopClient extends BaseClient {
  start() {
    const instanceLock = app.requestSingleInstanceLock()

    if (!instanceLock) {
      app.quit()
    } else {
      app.on('second-instance', () => {
        activeAllWindow()
      })
    }

    app.whenReady().then(() => {
      if (app.isPackaged) {
        Menu.setApplicationMenu(null)
      }

      initIPC(this.core)
      createWindow('dashboard')
      initTray({
        onActive: activeAllWindow
      })

      app.on('activate', activeAllWindow)
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

    dialog.showErrorBox('Error', e.stack)

    app.quit()
  }

  afterStart() {}
}
