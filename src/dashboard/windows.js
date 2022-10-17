const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const services = require('./services')

function createSchedule({ idPrefix = '', delay, callback, onClose = () => {} }) {
  let timeoutFlag = null
  let hasStart = false
  const id = idPrefix + Date.now().toString()

  function stop() {
    clearTimeout(timeoutFlag)
    hasStart = false
    onClose()
  }

  const refresh = async () => {
    if (!hasStart) {
      return
    }

    await callback()
    timeoutFlag = setTimeout(refresh, delay)
  }

  const start = () => {
    if (hasStart) {
      return
    }

    hasStart = true
    refresh()
  }

  const schedule = {
    start,
    stop,
    id,
  }

  createSchedule.scheduleList.push(schedule)

  return schedule
}

createSchedule.scheduleList = []

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, './preload.js')
    },
  })

  win.loadFile(path.join(__dirname, './views/index.html'))

  createSchedule.scheduleList.forEach((schedule) => schedule.stop())
  createSchedule.scheduleList = []
}

app.whenReady().then(() => {
  initIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})

function initIPC() {
  ipcMain.handle('PUT:/dashboard/project', async (event, data) => {
    return await services.addProject(data)
  })

  ipcMain.handle('DELETE:/dashboard/project', async (event, query) => {
    await services.removeProject({
      name: query.name,
    })
  })

  ipcMain.handle('GET:/dashboard/project/start', async (event, query) => {
    await services.startProject({
      name: query.name,
    })
  })

  ipcMain.handle('GET:/dashboard/project/stop', async (event, query) => {
    await services.stopProject({
      name: query.name,
    })
  })

  ipcMain.handle('GET:/dashboard/project/all', async (event) => {
    const list = await services.listProject()
    return list
  })

  ipcMain.handle('GET:/dashboard/project/select-directory', async () => {
    const parent = BrowserWindow.getFocusedWindow()

    return await dialog.showOpenDialog(parent, {
      title: '选择目录',
      properties: [
        'openDirectory',
        'dontAddToRecent',
      ],
    })
  })

  // stream
  ipcMain.handle('GET:/dashboard/project/detail', (event, query) => {
    const replyUrl = '/dashboard/project/detail'
    const schedule = createSchedule({
      idPrefix: replyUrl + '?id=',
      callback: async () => {
        const data = await services.detailProject({ name: query.name })
        event.sender.send('REPLY:' + replyUrl, data)
      },
      delay: 2000
    })

    ipcMain.handleOnce('CLOSE:' + schedule.id, schedule.stop)
    schedule.start()

    return schedule.id
  })

  ipcMain.handle('GET:/dashboard/project/proxy-log', (event, query) => {
    const id = String(new Date)
    const replyUrl = '/dashbaord/project/proxy-log?id=' + id

    const listener = (logData) => {
      event.sender.send('REPLY:' + replyUrl, logData)
    }

    services.subscribeProxyLog(listener)

    ipcMain.handleOnce('CLOSE:' + replyUrl, () => {
      services.unsubscribeProxyLog(listener)
    })

    return replyUrl
  })

  ipcMain.handle('GET:/dashboard/project/log', async () => {
    // const sse = createSSEServer(req, res)

    // sse.write(new Date())

    // const interval = setInterval(() => {
    //   sse.write(new Date())
    // }, 3000)

    // sse.once('close', () => {
    //   clearInterval(interval)
    // })
    throw new Error('功能开发中')
  })
}
