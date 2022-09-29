const express = require('express')
const proxy = require('express-http-proxy')

const app = express()

function createProxy(basePath, host) {
  return proxy(host, {
    proxyReqPathResolver(req) {
      const url = basePath + req.url

      console.log('[proxy]', req.method, url)
      console.log('[proxy From]', req.protocol + '://' + req.headers.host + req.originalUrl)
      console.log('[proxy To]', host + url)

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
}

function addProxy(path, proxyHost) {
  const proxyPath = path === '/' ? '' : path
  app.use(path, createProxy(proxyPath, proxyHost))
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
  app.listen(port)
}

module.exports = {
  app,
  addProxy,
  removeProxy,
  start,
}
