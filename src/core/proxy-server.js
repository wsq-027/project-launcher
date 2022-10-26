const express = require('express')
const proxy = require('express-http-proxy')
const Emitter = require('events')

class ProxyLogs extends Emitter {
  log({ id, target }) {
    this.emit('log', {
      proxy: id,
      target,
      timestamp: Date.now(),
    })
  }

  response({ id, data }) {
    this.emit('response', {
      proxy: id,
      data,
      timestamp: Date.now(),
    })
  }

  error({ id, error }) {
    console.error(error)
    this.emit('err', {
      proxy: id,
      error,
      timestamp: Date.now(),
    })
  }
}

module.exports = class ProxyServer {
  constructor() {
    this.app = express()
    this.logs = new ProxyLogs
    this.port = null
  }

  _createProxy(basePath, host) {
    const { logs } = this

    const getUrl = (req) => {
      const _basePath = basePath === '/' ? '' : basePath
      const url = _basePath + req.url

      return {
        url,
        id: req.method + ' ' + url
      }
    }

    const _proxy = proxy(host, {
      proxyReqPathResolver(req) {
        const {url, id} = getUrl(req)

        logs.log({
          id,
          target: host + url
        })

        return url
      },
      proxyErrorHandler(err, res, next) {
        logs.error({
          id: getUrl(res.req).id,
          error: err
        })

        next(err)

        // switch (err && err.code) {
        //   case 'ECONNRESET':    { return res.status(405).send('504 became 405'); }
        //   case 'ECONNREFUSED':  { return res.status(200).send('gotcher back'); }
        //   default:              { next(err); }
        // }
      },
      userResDecorator(proxyRes, proxyResData, userReq) {
        if (proxyRes.headers['content-type'].includes('json')) {
          logs.response({
            id: getUrl(userReq).id,
            data: proxyResData.toString('utf8'),
          })
        }

        return proxyResData
      }
    })

    _proxy.path = basePath
    _proxy.level = basePath.split('/').filter(Boolean).length

    return _proxy
  }

  _sortRoute(layer1, layer2) {
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

  addProxy(path, proxyHost) {
    this.app.use(path, this._createProxy(path, proxyHost))
    // 代理路径插入随机，但是路由请求需要按优先级排序
    this.app._router.stack.sort(this._sortRoute)
  }

  removeProxy(path) {
    const index = this.app._router.stack
    .findIndex((layer) => layer.name ==='handleProxy' && RegExp(layer.regexp).test(path))

    if (index === -1) {
      throw new Error('no such path: ' + path + ' !')
    }

    this.app._router.stack.splice(index, 1)
  }

  start(port) {
    this.port = port
    return this.app.listen(port)
  }
}
