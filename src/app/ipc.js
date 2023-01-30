const { ipcMain, dialog, shell, BrowserWindow } = require('electron')
const Emitter = require('events')
const p = require('path')
const { createSchedule } = require('./schedule')

/**
 * @typedef {import('electron').IpcMainInvokeEvent} IpcMainInvokeEvent
 *
 * @callback ChannelListener
 * @param {IpcMainInvokeEvent} event
 * @param  {*} data
 * @returns {*}
 */

/**
 *
 * @param {String} channel
 * @param {ChannelListener} listener
 */
function regist(channel, listener) {
  ipcMain.handle(channel, async (event, data) => {
    try {
      console.log(`[channel] ${channel} [data] ${JSON.stringify(data)}`)
      const result = await listener(event, data)

      return {
        success: true,
        data: result
      }
    } catch (e) {
      if (Array.isArray(e)) {
        e = e[0]
      }

      return {
        success: false,
        message: e.message,
        extra: e,
      }
    }
  })
}

/**
 * @typedef {Object} DuplexContext
 * @property {(closeListener: () => void) => void} onClose
 * @property {() => void} doClose
 * @property {(resp: *) => void} reply
 * @property {IpcMainInvokeEvent} event
 *
 * @callback ContextCallback
 * @param {DuplexContext} context
 * @param {Object} data
 * @returns {*}
 */

const duplex = new Emitter()

/**
 * @param {String} channel
 * @param {ContextCallback} fn
 */
function registDuplex(channel, fn) {
  duplex.on('duplex.start', async (event, data) => {
    if (data.channel != channel) return

    const { timestamp } = data
    let _closeListener
    /**
     * @type {DuplexContext}
     */
    const context = {
      doClose: () => {
        if (!event.sender.isDestroyed()) {
          event.sender.send('duplex.close', {
            channel,
            timestamp,
          })
        }
      },
      onClose: (closeListener) => _closeListener = closeListener,
      reply: (resp) => {
        event.sender.send('duplex.reply', {
          channel,
          timestamp,
          data: resp,
        })
      },
      event,
    }

    const closeHandler =  (_event, _data) => {
      if (_data.channel == channel && _data.timestamp == timestamp) {
        _closeListener()
        duplex.off('duplex.close', closeHandler)
      }
    }

    duplex.on('duplex.close', closeHandler)

    return fn(context, data.params)
  })
}

regist('duplex.start', (...arg) => duplex.emit('duplex.start', ...arg))
regist('duplex.close', (...arg) => duplex.emit('duplex.close', ...arg))

/**
 * @typedef {import('../core')} Core
 * @param {Core} core
 */
function initIPC(core) {
  regist('project.add', async (event, data) => {
    return await core.addProject(data)
  })

  regist('project.delete', async (event, query) => {
    await core.removeProject({
      name: query.name,
    })
  })

  regist('project.start', async (event, query) => {
    await core.startProject({
      name: query.name,
    })
  })

  regist('project.stop', async (event, query) => {
    await core.stopProject({
      name: query.name,
    })
  })

  regist('project.all', async (event) => {
    const list = await core.listProject()
    return list
  })

  regist('common.select-directory', async (event, query) => {
    const res = await dialog.showOpenDialog(BrowserWindow.getAllWindows()[0], {
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

  regist('common.select-file', async (event, query) => {
    const res = await dialog.showOpenDialog(BrowserWindow.getAllWindows()[0], {
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
      relativePath: query.dir ? p.relative(query.dir, path) : ''
    }
  })

  regist('common.view-file', (event, query) => {
    if (process.platform === 'darwin') {
      const win = BrowserWindow.getAllWindows()[0]

      if (win) {
        win.previewFile(query.filename)

        return
      }
    }

    shell.openPath(query.filename)
  })

  registDuplex('project.detail', (context, query) => {
    const schedule = createSchedule({
      async callback() {
        const {session, logsCache, ...data} = await core.getProject({ name: query.name })
        context.reply(data)
      },
      delay: 2000
    })

    context.onClose(schedule.stop)
    schedule.start()
  })

  registDuplex('project.proxy-log', (context, data) => {
    const logListener = (logData) => {
      context.reply({ type: 'log', data: logData})
    }
    const responseListener = (resData) => {
      context.reply({ type: 'response', data: resData })
    }
    const errorListener = (error) => {
      context.reply({ type: 'error', data: error})
    }

    core.ps.logs.on('log', logListener)
    core.ps.logs.on('response', responseListener)
    core.ps.logs.on('error', errorListener)

    context.onClose(() => {
      core.ps.logs.off('log', logListener)
      core.ps.logs.off('response', responseListener)
      core.ps.logs.off('error', errorListener)
    })
  })

  registDuplex('project.log', (context, data) => {
    const { logsCache, session } = core.getProject(data)
    const onData = (data) => {
      context.reply(data)
    }

    session.once('exit', () => {
      context.doClose()
    })

    logsCache.onData(onData)

    context.onClose(() => {
      logsCache.offData(onData)
    })

    setTimeout(() => {
      onData(logsCache.fullData) // 初始数据
    })
  })

  regist('port.get', () => {
    return core.getPort()
  })

  regist('port.update', (event, query) => {
    core.updatePort(query.port)
  })
}

module.exports = {
  initIPC
}