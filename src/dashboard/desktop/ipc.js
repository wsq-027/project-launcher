const { ipcMain, dialog, shell } = require('electron')
const path = require('path')
const services = require('../services')
const { getWindow } = require('./window')
const { createSchedule } = require('./schedule')

function regist(method, url, action) {
  ipcMain.handle(method.toUpperCase() + ':' + url, async (event, data) => {
    try {
      const result = await action(event, data)

      return {
        success: true,
        data: result
      }
    } catch (e) {
      return {
        success: false,
        message: e.message
      }
    }
  })
}

function initIPC() {
  regist('PUT', '/dashboard/project', async (event, data) => {
    return await services.addProject(data)
  })

  regist('DELETE', '/dashboard/project', async (event, query) => {
    await services.removeProject({
      name: query.name,
    })
  })

  regist('GET', '/dashboard/project/start', async (event, query) => {
    await services.startProject({
      name: query.name,
    })
  })

  regist('GET', '/dashboard/project/stop', async (event, query) => {
    await services.stopProject({
      name: query.name,
    })
  })

  regist('GET', '/dashboard/project/all', async (event) => {
    const list = await services.listProject()
    return list
  })

  regist('GET', '/dashboard/project/select-directory', async (event, query) => {
    const res = await dialog.showOpenDialog(getWindow(), {
      title: query.title || '选择目录',
      properties: [
        'openDirectory',
        'dontAddToRecent',
      ],
    })

    return {
      success: !res.canceled,
      directory: res.filePaths?.[0],
    }
  })

  regist('GET', '/dashboard/project/select-file', async (event, query) => {
    const res = await dialog.showOpenDialog(getWindow(), {
      title: query.title || '选择文件',
      defaultPath: query.dir,
      properties: [
        'openFile',
        'dontAddToRecent',
      ],
    })

    if (res.canceled) {
      return { success: false }
    }

    const path = res.filePaths[0]

    return {
      success: true,
      path,
      relativePath: query.dir ? path.relative(query.dir, path) : ''
    }
  })

  // stream
  regist('GET', '/dashboard/project/detail', (event, query) => {
    const replyUrl = '/dashboard/project/detail'
    const schedule = createSchedule({
      idPrefix: replyUrl + '?id=',
      async callback() {
        const data = await services.detailProject({ name: query.name })
        event.sender.send('REPLY:' + schedule.id, data)
      },
      delay: 2000
    })

    ipcMain.handleOnce('CLOSE:' + schedule.id, schedule.stop)
    schedule.start()

    return schedule.id
  })

  regist('GET', '/dashboard/project/proxy-log', (event, query) => {
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

  regist('GET', '/dashboard/project/view-file', (event, query) => {
    if (process.platform === 'darwin') {
      getWindow().previewFile(query.filename)
    } else {
      shell.openPath(query.filename)
    }
  })
}

module.exports = {
  initIPC
}