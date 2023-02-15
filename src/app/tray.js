const path = require('path')
const { Tray, Menu, app } = require('electron')

let tray = null

function initTray({ onActive }) {
  tray = new Tray(path.join(__dirname, '../assets/trayTemplate.png'))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      type: 'normal',
      click: onActive
    },
    {
      label: '退出',
      type: 'normal',
      click(menuItem, win) {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  tray.on('double-click', onActive)
}

module.exports = {
  initTray,
}
