const express = require('express')
const proxy = require('express-http-proxy')
const port = 3335

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

addProxy('/medical', 'http://127.0.0.1:3331')
addProxy('/pay', 'http://127.0.0.1:3334')
addProxy('/', 'http://127.0.0.1:3330')
// addProxy('/', 'https://health.dev.zoenet.cn')

app.listen(port)

console.log(`Server start on http://127.0.0.1:${port}`)
