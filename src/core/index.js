const Emitter = require('events')
const fs = require('fs')
const ProcessManager = require('./process-manager')
const ProxyServer = require('./proxy-server')
const ProjectStore = require('./project-store')
const Monit = require('./monit')
const { getUserPath } = require('./common')
const Storage = require('node-storage')

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
    this.monit = new Monit()
    this.configStorage = new Storage(getUserPath() + '/config.json')

    /**
     * @typedef {import('http').Server} Server
     * @type {Server?}
     */
    this.server = null
  }

  init() {
    // 避免重复初始化
    if (this.server) {
      return
    }

    const server = this.server = this.ps.start(this.getPort())

    server.addListener('error', (err) => this.emit('error', err))

    this.initTask.addAsyncTask(async () => {
      const list = await this.pm.listProcess()

      for (const { name, pm2_env: { pm_id } } of list) {
        if (this.store.has(name)) {
          const project = this.store.get(name)
          project.isStart = true
          project.isLocal = true
          project.id = pm_id

          this.store.update(name, project)
        }
      }
    })
  }

  async addProject({ name, dir, urlPrefix, proxyHost, isLocal, script }) {
    await this.initTask.ready()

    const data = {
      name,
      dir,
      urlPrefix,
      proxyHost,
      isLocal,
      script,
      isStart: false,
      id: undefined,
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
      const proc = await this.pm.addProcess(project.name, project.dir, project.script)
      project.id = proc[0].pm2_env.pm_id
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
    project.id = null
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

  getPort() {
    return this.configStorage.get('port') || 3335
  }

  updatePort(port) {
    console.log('update port to', port)
    this.configStorage.put('port', port)
    this.server.close()
    this.init()
  }

  openMonit(options) {
    this.monit.open(options)

    return this.monit
  }
}

module.exports = Core
