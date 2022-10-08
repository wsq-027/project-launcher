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
    return res
  },
  listen: ({ url, data, callback }) => {
    const action = 'GET:' + url
    info('[listen]', url)

    if (!url.startsWith('/dashboard/project')) {
      throw new Error('invalid action ' + action)
    }

    const reply = ipcRenderer.invoke(action, data)

    reply.then((replyUrl) => {
      ipcRenderer.on('REPLY:' + replyUrl, (event, arg) => {
        info('[listen reply]', url, arg)
        callback(arg)
      })
    })

    return function close() {
      reply.then((replyUrl) => {
        info('[listen close]', url)
        ipcRenderer.invoke('CLOSE:' + replyUrl)
      })
    }
  }
})
