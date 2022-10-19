const pm = require('../process-manager')
const ps = require('../proxy-server')
const store = require('../project-store')
const { isDesktop } = require('../common')

async function addProject({ name, dir, urlPrefix, proxyHost, isLocal, script }) {
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

  store.add(data)

  return data
}

async function startProject({name}) {
  const project = store.get(name)

  if (project.isStart) {
    throw new Error('不可重复启动')
  }

  if (project.isLocal) {
    await pm.addProcess(project.name, project.dir, project.script)
  }

  ps.addProxy(project.urlPrefix, project.proxyHost)

  project.isStart = true
  store.update(name, project)
}

async function stopProject({name}) {
  const project = store.get(name)

  if (!project.isStart) {
    throw new Error('项目未启动')
  }

  if (project.isLocal) {
    await pm.removeProcess(project.name)
  }

  ps.removeProxy(project.urlPrefix)

  project.isStart = false
  store.update(name, project)
}

async function removeProject({name}) {
  const project = store.get(name)

  if (project.isStart) {
    throw new Error('请先停止项目')
  }

  store.remove(name)
}

async function listProject() {
  return [...store]
}

async function detailProject({ name }) {
  const project = store.get(name)

  if (!project.isStart) {
    throw new Error('项目未启动')
  }

  return {
    ...project,
    ...(await pm.detailProcess(name)),
  }
}

function subscribeProxyLog(listener) {
  ps.logs.subscribe(listener)
}

function unsubscribeProxyLog(listener) {
  ps.logs.unsubscribe(listener)
}

async function onExit() {
  console.log('on exit')

  for (const project of store) {
    if (project.isLocal && project.isStart) {
      await pm.removeProcess(project.name)
    }
  }

  console.log('remove all project')

  pm.disconnect()
}

module.exports = {
  addProject,
  startProject,
  stopProject,
  removeProject,
  listProject,
  detailProject,
  subscribeProxyLog,
  unsubscribeProxyLog,
  onExit,
}
