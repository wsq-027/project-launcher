const { contextBridge, ipcRenderer } = require('electron')

const debug = true
const info = (...arg) => debug && console.info(...arg)

contextBridge.exposeInMainWorld('projectApi', {
  invoke: async ({ method, url, data }) => {
    const action = method + ':' + url
    info('[invoke]', action, data)

    if (!url.startsWith('/dashboard/project')) {
      throw new Error('invalid action ' + action)
    }

    const res = await ipcRenderer.invoke(action, data)
    info('[invoke return]', res)
    if (res.success) {
      return res.data
    }

    throw res
  },
  listen: ({ url, data, callback, error }) => {
    const action = 'GET:' + url
    info('[listen]', url)

    if (!url.startsWith('/dashboard/project')) {
      throw new Error('invalid action ' + action)
    }

    const reply = ipcRenderer.invoke(action, data)

    reply.then((res) => {
      if (res.success) {
        ipcRenderer.on('REPLY:' + res.data, (event, arg) => {
          info('[listen reply]', url, arg)
          callback(arg)
        })
      } else {
        error(res)
      }
    })

    return function close() {
      reply.then((res) => {
        if (res.success) {
          info('[listen close]', url)
          ipcRenderer.invoke('CLOSE:' + res.data)
        } else {
          error(res)
        }
      })
    }
  }
})
