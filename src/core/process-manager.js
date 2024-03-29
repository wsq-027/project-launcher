const path = require('path')
const Session = require('./session')
const EventEmitter = require('events')

const CATCH_MAX_SIZE = 1024 * 1024 * 4

function resolvePathFromAbsoluteToRelateive(dir) {
  return path.relative(process.cwd(), dir.replace('~', process.env.HOME || process.env.USERPROFILE))
}

class LogsCache extends EventEmitter {
  constructor() {
    super()
    this.data = ''
  }

  get fullData() {
    return this.data
  }

  addData(data) {
    this.data += data
    if (this.data.length > CATCH_MAX_SIZE) {
      this.data = this.data.substring(this.data.length - CATCH_MAX_SIZE, this.data.length)
    }
    this.emit('data', data)
  }

  onData(cb) {
    this.on('data', cb)
  }

  offData(cb) {
    this.off('data', cb)
  }
}

module.exports = class ProcessManager {
  constructor() {
    /**
     * @type {Map<string, {session: Session, logsCache: LogsCache, name: string}>}
     */
    this.processMap = new Map()
  }

  /**
   *
   * @param {string} projectName
   * @param {string} projectDir
   * @param {string} projectScript
   * @returns
   */
  async addProcess(projectName, projectDir, projectScript) {
    const session = new Session()
    const [command, ...args] = projectScript.split(' ')
    await session.open(command, args, {
      // TODO 窗口尺寸
      rows: 400 / 18,
      cols: 1000 / 9,
      cwd: resolvePathFromAbsoluteToRelateive(projectDir),
    })

    const logsCache = new LogsCache()

    session.on('data', (data) => {
      logsCache.addData(data)
    })

    const process = {
      name: projectName,
      session,
      logsCache,
    }

    this.processMap.set(projectName, process)

    return process
  }

  /**
   *
   * @param {string} projectName
   */
  async removeProcess(projectName) {
    const process = this.processMap.get(projectName)

    if (!process) {
      return
    }

    await new Promise((resolve, reject) => {
      if (process.session.ended) {
        return resolve()
      }

      process.session.once('exit', resolve)
      process.session.exit()
    })

    this.processMap.delete(projectName)
  }

  /**
   *
   * @param {string} name
   */
  getProcess(name) {
    const process = this.processMap.get(name)

    if (!process) {
      throw new Error('项目未启动')
    }

    return process
  }
}
