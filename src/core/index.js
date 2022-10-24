const Emitter = require('events')
const fs = require('fs')
const ProcessManager = require('./process-manager')
const ProxyServer = require('./proxy-server')
const ProjectStore = require('./project-store')
const { getUserPath } = require('./common')

function tryGet(fn, defaultValue) {
  try {
    return fn()
  } catch (e) {
    return defaultValue
  }
}

class ReadyHandler extends Emitter {
  constructor() {
    super()
    this._readyPromise = new Promise((resolve) => {
      this.once('ready', resolve)
    })
  }

  addReady(fn) {
    this.emit('ready', fn)
  }

  async ready() {
    await this._readyPromise
  }
}

class Core extends ReadyHandler {
  constructor() {
    super()
    this.pm = new ProcessManager
    this.ps = new ProxyServer
    this.store = new ProjectStore
  }

  init() {
    const port = tryGet(() => fs.readFileSync(getUserPath() + '/port', { encoding: 'utf-8', flag: 'r'}).toString(), 3335)
    const server = this.ps.start(port)

    server.addListener('error', (err) => this.emit('error', err))

    this.addReady(async () => {
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
    await this.ready()

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
    await this.ready()

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
    await this.ready()

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
    await this.ready()

    const project = this.store.get(name)

    if (project.isStart) {
      throw new Error('请先停止项目')
    }

    this.store.remove(name)
  }

  async listProject() {
    await this.ready()

    return [...this.store]
  }

  async detailProject({ name }) {
    await this.ready()

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
}

module.exports = Core
