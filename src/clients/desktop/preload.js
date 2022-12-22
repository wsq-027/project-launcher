const { contextBridge, ipcRenderer } = require('electron')

const debug = true
const info = (...arg) => debug && console.info(...arg)

contextBridge.exposeInMainWorld('projectApi', {
  invoke: async (channel, params) => {
    info('[invoke]', channel, params)

    const res = await ipcRenderer.invoke(channel, params)
    info('[invoke return]', res)
    if (res.success) {
      return res.data
    }

    throw res
  },
  duplex: (channel, params, { callback, error } = {}) => {
    const timestamp = Date.now()
    info('[duplex]', channel, params)

    const reply = ipcRenderer.invoke(`duplex.start`, {
      channel,
      timestamp,
      params,
    })

    function createListener(cb) {
      return (event, data) => {
        if (data.channel === channel && data.timestamp === timestamp) {
          info('[duplex reply]', channel, data)
          cb(data.data)
        }
      }
    }

    const callbackListener = createListener(callback)
    const closeListener = createListener(() => {
      ipcRenderer.off('duplex.reply', callbackListener)
      ipcRenderer.off('duplex.close', closeListener)
    })

    reply.then((res) => {
      if (res.success) {
        ipcRenderer.on(`duplex.reply`, callbackListener)
        ipcRenderer.on('duplex.close', closeListener)
      } else {
        error(res)
      }
    })

    function close() {
      reply.then((res) => {
        if (res.success) {
          info('[listen close]', channel)
          ipcRenderer.invoke(`duplex.close`, {
            channel,
            timestamp,
          })
        } else {
          error(res)
        }
      })
    }

    window.addEventListener('beforeunload', () => {
      close()
      ipcRenderer.off('duplex.start')
      ipcRenderer.off('duplex.reply')
      ipcRenderer.off('duplex.close')
    })

    return close
  }
})
