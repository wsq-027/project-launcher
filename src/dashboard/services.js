const pm = require('../progress-manager')
const ps = require('../proxy-server')
const store = require('../project-store')

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
    await pm.addProgress(project.name, project.dir, project.script)
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
    await pm.removeProgress(project.name)
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
    ...(await pm.detailProgress(name)),
  }
}

async function exit() {
  console.log('remove all project')
  for (const project of store) {
    if (project.isLocal && project.isStart) {
      await pm.removeProgress(project.name)
    }
  }
  process.exit()
}

process.on('SIGTERM', exit)
process.on('SIGINT', exit)

module.exports = {
  addProject,
  startProject,
  stopProject,
  removeProject,
  listProject,
  detailProject,
}
