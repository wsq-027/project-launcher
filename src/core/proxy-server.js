const express = require('express')
const proxy = require('express-http-proxy')
const Emitter = require('events')

const logs = {
  _emitter: new Emitter,
  log(req, host, url) {
    this._emitter.emit('log', {
      proxy: req.method + ' ' + url,
      from: req.protocol + '://' + req.headers.host + req.originalUrl,
      to: host + url,
      timestamp: Date.now(),
    })
  },
  subscribe(listener) {
    this._emitter.on('log', listener)
  },
  unsubscribe(listener) {
    this._emitter.off('log', listener)
  },
}

const app = express()

function createProxy(basePath, host) {
  const _proxy = proxy(host, {
    proxyReqPathResolver(req) {
      const url = (basePath === '/' ? '' : basePath) + req.url

      logs.log(req, host, url)

      return url
    },
    proxyErrorHandler(err, res, next) {
      console.error(err)

      switch (err && err.code) {
        case 'ECONNRESET':    { return res.status(405).send('504 became 405'); }
        case 'ECONNREFUSED':  { return res.status(200).send('gotcher back'); }
        default:              { next(err); }
      }
    },
  })

  _proxy.path = basePath
  _proxy.level = basePath.split('/').filter(Boolean).length

  return _proxy
}

function sortRoute(layer1, layer2) {
  if (layer1.name === layer2.name && layer1.name === 'handleProxy') {
    return layer2.handle.level - layer1.handle.level
  }

  if (layer1.name === 'handleProxy') {
    return 1
  }

  if (layer2.name === 'handleProxy') {
    return -1
  }

  return 0
}

function addProxy(path, proxyHost) {
  app.use(path, createProxy(path, proxyHost))
  // 代理路径插入随机，但是路由请求需要按优先级排序
  app._router.stack.sort(sortRoute)
}

function removeProxy(path) {
  const index = app._router.stack
  .findIndex((layer) => layer.name ==='handleProxy' && RegExp(layer.regexp).test(path))

  if (index === -1) {
    throw new Error('no such path: ' + path + ' !')
  }

  app._router.stack.splice(index, 1)
}

function start(port) {
  return app.listen(port)
}

module.exports = {
  app,
  addProxy,
  removeProxy,
  start,
  logs,
}
