const util = require('util')
const path = require('path')
const pm2 = require('pm2')
const {getUserPath} = require('./common')

const manager = {
  connect: util.promisify(pm2.connect).bind(pm2),
  start: util.promisify(pm2.start).bind(pm2),
  stop: util.promisify(pm2.stop).bind(pm2),
  delete: util.promisify(pm2.delete).bind(pm2),
  list: util.promisify(pm2.list).bind(pm2),
  describe: util.promisify(pm2.describe).bind(pm2),
  disconnect: util.promisify(pm2.disconnect).bind(pm2),
}

let hasConnect = false
async function connect() {
  if (!hasConnect) {
    await manager.connect()

    hasConnect = true
  }
}

function resolvePathFromAbsoluteToRelateive(dir) {
  return path.relative(process.cwd(), dir.replace('~', process.env.HOME || process.env.USERPROFILE))
}

async function addProcess(projectName, projectDir, projectScript) {
  await connect()

  const proc = await manager.start({
    name: projectName,
    script: projectScript,
    cwd: resolvePathFromAbsoluteToRelateive(projectDir),
    error_file: path.join(getUserPath(), `./logs/${projectName}_error.log`),
    out_file: path.join(getUserPath(), `./logs/${projectName}_out.log`),
    pid_file: path.join(getUserPath(), `./logs/${projectName}.pid`),
    exec_mode: 'cluster',
  })

  return proc
}

async function removeProcess(projectName) {
  await connect()

  await manager.stop(projectName)

  await manager.delete(projectName)
}

async function detailProcess(name) {
  const procs = await manager.describe(name)

  return procs[0]
}

function disconnect() {
  hasConnect = false
  pm2.disconnect()
}

module.exports = {
  addProcess,
  removeProcess,
  detailProcess,
  disconnect,
}