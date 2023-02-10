const Emitter = require('events')
const ProcessManager = require('./process-manager')
const ProxyServer = require('./proxy-server')
const ProjectStore = require('./project-store')
const { getUserPath } = require('./common')
const Storage = require('node-storage')

class Core extends Emitter {
  constructor() {
    super()
    this.pm = new ProcessManager
    this.ps = new ProxyServer
    this.store = new ProjectStore
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
  }

  async addProject({ name, dir, urlPrefix, proxyHost, isLocal, script }) {
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
    const project = this.store.get(name)

    if (project.isStart) {
      throw new Error('不可重复启动')
    }

    if (this.ps.hasRoute(project.urlPrefix)) {
      throw new Error(`路径 ${project.urlPrefix} 被占用`)
    }

    if (project.isLocal) {
      await this.pm.addProcess(project.name, project.dir, project.script)
    }

    this.ps.addProxy(project.urlPrefix, project.proxyHost)

    project.isStart = true
    this.store.update(name, project)
  }

  async stopProject({name}) {
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
    const project = this.store.get(name)

    if (project.isStart) {
      throw new Error('请先停止项目')
    }

    this.store.remove(name)
  }

  async listProject() {
    return [...this.store]
  }

  getProject({ name }) {
    const project = this.store.get(name)

    if (!project.isStart) {
      throw new Error('项目未启动')
    }

    return {
      ...project,
      ...this.pm.getProcess(name),
    }
  }

  async exit() {
    console.log('on exit')

    for (const project of this.store) {
      if (project.isLocal && project.isStart) {
        try {
          await this.pm.removeProcess(project.name)
        } catch (e) {
          console.error(e)
        }
      }
    }

    console.log('remove all project')
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
}

module.exports = Core
