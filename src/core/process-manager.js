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

function resolvePathFromAbsoluteToRelateive(dir) {
  return path.relative(process.cwd(), dir.replace('~', process.env.HOME || process.env.USERPROFILE))
}

module.exports = class ProcessManager {
  constructor() {
    this._hasConnect = false
  }

  async connect() {
    if (!this._hasConnect) {
      await manager.connect()

      this._hasConnect = true
    }
  }

  async addProcess(projectName, projectDir, projectScript) {
    await this.connect()

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

  async removeProcess(projectName) {
    await this.connect()

    await manager.stop(projectName)

    await manager.delete(projectName)
  }

  async detailProcess(name) {
    const procs = await manager.describe(name)

    return procs[0]
  }

  async listProcess() {
    return await manager.list()
  }

  disconnect() {
    this.hasConnect = false
    pm2.disconnect()
  }
}
