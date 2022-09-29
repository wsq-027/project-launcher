const express = require('express')
const path = require('path')
const services = require('./services')

const router = express.Router()

router.use(express.json())

router.use((req, res, next) => {
  console.log('[request] %s %s', req.method, req.url, req.body)

  res.returns = (data) => {
    console.log('[response] %s %s', req.path, JSON.stringify(data))

    res.json({
      success: true,
      data
    })
  }

  next()
})

router.put('/project', async (req, res, next) => {
  try {
    res.returns(await services.addProject(req.body))
  } catch (e) {
    next(e)
  }
})

router.delete('/project', async (req, res, next) => {
  try {
    await services.removeProject({
      name: req.query.name,
    })

    res.returns(null)
  } catch (e) {
    next(e)
  }
})

router.get('/project/start', async (req, res, next) => {
  try {
    await services.startProject({
      name: req.query.name,
    })

    res.returns(null)
  } catch (e) {
    next(e)
  }
})

router.get('/project/stop', async (req, res, next) => {
  try {
    await services.stopProject({
      name: req.query.name,
    })

    res.returns(null)
  } catch (e) {
    next(e)
  }
})

router.get('/project/all', async (req, res, next) => {
  try {
    res.returns(await services.listProject())
  } catch (e) {
    next(e)
  }
})

router.use('/', express.static(path.join(__dirname, './views')))

router.use(function(err, req, res, next) {
  if (Array.isArray(err)) {
    err = err[0]
  }

  console.error(err)

  res.status(500).json({
    message: err.message,
    success: false,
  })
})

module.exports = router