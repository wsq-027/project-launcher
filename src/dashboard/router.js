const express = require('express')
const path = require('path')
const services = require('./services')

const router = express.Router()

router.use(express.json())

function registRouter(method, path, asyncAction) {
  method.call(router, path, async (req, res, next) => {
    try {
      console.log('[request] %s %s', req.method, req.url, req.body)

      const data = await asyncAction(req, res) || null

      console.log('[response] %s %s', req.path, JSON.stringify(data))

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

registRouter(router.put, '/project', async (req, res) => {
  return await services.addProject(req.body)
})

registRouter(router.delete, '/project', async (req, res) => {
  await services.removeProject({
    name: req.query.name,
  })
})

registRouter(router.get, '/project', async (req, res) => {
  return await services.detailProject({
    name: req.query.name
  })
})

registRouter(router.get, '/project/start', async (req, res) => {
  await services.startProject({
    name: req.query.name,
  })
})

registRouter(router.get, '/project/stop', async (req, res) => {
  await services.stopProject({
    name: req.query.name,
  })
})

registRouter(router.get, '/project/all', async (req, res) => {
  return await services.listProject()
})

router.use('/', express.static(path.join(__dirname, './views')))

module.exports = router