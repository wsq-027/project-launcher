const path = require('path')
const { Tray, Menu, app } = require('electron')

let tray = null

function initTray() {
  tray = new Tray(path.join(__dirname, '../../asserts/tray.png'))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出',
      type: 'normal',
      click(menuItem, win) {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
}

module.exports = {
  initTray,
}
