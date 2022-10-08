const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const services = require('./services')

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, './preload.js')
    },
  })

  win.loadFile(path.join(__dirname, './views/index.html'))
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

function createSchedule({ delay, callback, onClose = () => {} }) {
  let timeoutFlag = null
  let hasStart = false
  const id = Date.now().toString()

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

  return {
    start,
    stop,
    id,
  }
}

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

  ipcMain.handle('GET:/dashboard/project/detail', (event, query) => {
    let replyUrl = '/dashboard/project/detail?'
    const schedule = createSchedule({
      callback: async () => {
        const data = await services.detailProject({ name: query.name })
        event.sender.send('REPLY:' + replyUrl, data)
      },
      delay: 2000
    })

    replyUrl += 'id=' + schedule.id

    ipcMain.handleOnce('CLOSE:' + replyUrl, schedule.stop)
    schedule.start()

    return replyUrl
  })

  ipcMain.handle('GET:/dashboard/project/log', async (req, res) => {
    // const sse = createSSEServer(req, res)

    // sse.write(new Date())

    // const interval = setInterval(() => {
    //   sse.write(new Date())
    // }, 3000)

    // sse.once('close', () => {
    //   clearInterval(interval)
    // })
  })
}