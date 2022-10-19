const express = require('express')
const Emitter = require('events')
const path = require('path')
const core = require('../core/index')

const router = express.Router()

router.use(express.json())

function registRouter(method, path, asyncAction) {
  method.call(router, path, async (req, res) => {
    try {
      console.log('[request] %s %s', req.method, req.url, req.body)

      const data = await asyncAction(req, res) || null

      console.log('[response] %s %s', req.path, JSON.stringify(data).substring(0, 200))

      res.json({
        success: true,
        data,
      })
    } catch (err) {
      console.error(err)

      res.status(500).json({
        message: err.message,
        success: false,
      })
    }
  })
}

function createSSEServer(req, res) {
  console.log('[sse]' + req.url + ' start')

  const emitter = new Emitter()

  res.header({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  req.connection.addListener('close', () => {
    emitter.emit('close')
    console.log('[sse]' + req.url + ' stop')
  }, false)

  return {
    once: emitter.once.bind(emitter),
    write: (data) => res.write('data: ' + data + '\n\n')
  }
}

registRouter(router.put, '/project', async (req, res) => {
  return await core.addProject(req.body)
})

registRouter(router.delete, '/project', async (req, res) => {
  await core.removeProject({
    name: req.query.name,
  })
})

registRouter(router.get, '/project', async (req, res) => {
  return await core.detailProject({
    name: req.query.name
  })
})

registRouter(router.get, '/project/start', async (req, res) => {
  await core.startProject({
    name: req.query.name,
  })
})

registRouter(router.get, '/project/stop', async (req, res) => {
  await core.stopProject({
    name: req.query.name,
  })
})

registRouter(router.get, '/project/all', async (req, res) => {
  return await core.listProject()
})

router.get('/project/detail', (req, res) => {
  const sse = createSSEServer(req, res)

  let timeoutFlag
  const refresh = async () => {
    const data = await core.detailProject({ name: req.query.name })
    sse.write(JSON.stringify(data))
    timeoutFlag = setTimeout(refresh, 2000)
  }

  refresh()

  sse.once('close', () => {
    clearTimeout(timeoutFlag)
  })
})

router.get('/project/log', async (req, res) => {
  const sse = createSSEServer(req, res)

  sse.write(new Date())

  const interval = setInterval(() => {
    sse.write(new Date())
  }, 3000)

  sse.once('close', () => {
    clearInterval(interval)
  })
})


process.on('beforeExit', async (code) => {
  await core.onExit()
  process.exit(code)
})

router.use('/', express.static(path.join(__dirname, './views')))

module.exports = router