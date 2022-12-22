const Emitter = require('events')
const fs = require('fs')
const ProcessManager = require('./process-manager')
const ProxyServer = require('./proxy-server')
const ProjectStore = require('./project-store')
const { getUserPath } = require('./common')

class TaskReady extends Emitter {
  constructor() {
    super()
    this._readyPromise = new Promise(resolve => {
      this.once('ready', resolve)
    })
  }

  addAsyncTask(task) {
    this.emit('ready', task)
  }

  async ready() {
    await this._readyPromise
  }
}

class Core extends Emitter {
  constructor() {
    super()
    this.pm = new ProcessManager
    this.ps = new ProxyServer
    this.store = new ProjectStore
    this.initTask = new TaskReady()
    /**
     * @type {Number?}
     */
    this.port = null
    /**
     * @typedef {import('http').Server} Server
     * @type {Server?}
     */
    this.server = null
  }

  init() {
    let port = 3335
    try {
      port = parseInt(fs.readFileSync(getUserPath() + '/port', { encoding: 'utf-8', flag: 'r'}).toString())
    } catch (e) {}

    const server = this.server = this.ps.start(port)

    server.addListener('error', (err) => this.emit('error', err))

    this.port = port

    this.initTask.addAsyncTask(async () => {
      const list = await this.pm.listProcess()

      for (const { name } of list) {
        if (this.store.has(name)) {
          const project = this.store.get(name)
          project.isStart = true
          project.isLocal = true

          this.store.update(name, project)
        }
      }
    })
  }

  async addProject({ name, dir, urlPrefix, proxyHost, isLocal, script }) {
    await this.initTask.ready()

    if (!script) {
      script = './bin/www'
    }

    const data = {
      name,
      dir,
      urlPrefix,
      proxyHost,
      isLocal,
      script,
      isStart: false,
    }

    this.store.add(data)

    return data
  }

  async startProject({name}) {
    await this.initTask.ready()

    const project = this.store.get(name)

    if (project.isStart) {
      throw new Error('不可重复启动')
    }

    if (project.isLocal) {
      await this.pm.addProcess(project.name, project.dir, project.script)
    }

    this.ps.addProxy(project.urlPrefix, project.proxyHost)

    project.isStart = true
    this.store.update(name, project)
  }

  async stopProject({name}) {
    await this.initTask.ready()

    const project = this.store.get(name)

    if (!project.isStart) {
      throw new Error('项目未启动')
    }

    if (project.isLocal) {
      await this.pm.removeProcess(project.name)
    }

    this.ps.removeProxy(project.urlPrefix)

    project.isStart = false
    this.store.update(name, project)
  }

  async removeProject({name}) {
    await this.initTask.ready()

    const project = this.store.get(name)

    if (project.isStart) {
      throw new Error('请先停止项目')
    }

    this.store.remove(name)
  }

  async listProject() {
    await this.initTask.ready()

    return [...this.store]
  }

  async detailProject({ name }) {
    await this.initTask.ready()

    const project = this.store.get(name)

    if (!project.isStart) {
      throw new Error('项目未启动')
    }

    return {
      ...project,
      ...(await this.pm.detailProcess(name)),
    }
  }

  async exit() {
    console.log('on exit')

    for (const project of this.store) {
      if (project.isLocal && project.isStart) {
        await this.pm.removeProcess(project.name)
      }
    }

    console.log('remove all project')

    this.pm.disconnect()
  }

  updatePort(port) {
    console.log('update port', port)
    fs.writeFileSync(getUserPath() + '/port', port.toString(), { encoding: 'utf-8', flag: 'w' })
    this.server.close()
    this.init()
  }
}

module.exports = Core
