const util = require('util')
const path = require('path')
const pm2 = require('pm2')

const manager = {
  connect: util.promisify(pm2.connect).bind(pm2),
  start: util.promisify(pm2.start).bind(pm2),
  stop: util.promisify(pm2.stop).bind(pm2),
  delete: util.promisify(pm2.delete).bind(pm2),
  list: util.promisify(pm2.list).bind(pm2),
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

async function addProgress(projectName, projectDir, projectScript) {
  await connect()

  const proc = await manager.start({
    name: projectName,
    script: projectScript,
    cwd: resolvePathFromAbsoluteToRelateive(projectDir),
    error_file: path.resolve(`./logs/${projectName}_error.log`),
    out_file: path.resolve(`./logs/${projectName}_out.log`),
    pid_file: path.resolve(`./logs/${projectName}.pid`),
    exec_mode: 'cluster',
  })

  return proc
}

async function removeProgress(projectName) {
  await connect()

  await manager.stop(projectName)

  await manager.delete(projectName)
}

async function listProgress() {
  await connect()

  const progress = await manager.list()

  if (!progress) {
    return []
  }

  progress.sort(function(a, b) {
    if (a.pm2_env.name < b.pm2_env.name)
      return -1;
    if (a.pm2_env.name > b.pm2_env.name)
      return 1;
    return 0;
  })

  return progress.map((proc) => {
    const metaData = {
      name: proc.pm2_env.name,
      namespace: proc.pm2_env.namespace,
      version: proc.pm2_env.version,
      restarts: proc.pm2_env.restart_time,
      uptime: (proc.pm2_env.pm_uptime && proc.pm2_env.status == 'online') ? proc.pm2_env.pm_uptime : 0,
      scriptPath: proc.pm2_env.pm_exec_path,
      scritpArgs: proc.pm2_env.args ? (typeof proc.pm2_env.args == 'string' ? JSON.parse(proc.pm2_env.args.replace(/'/g, '"')):proc.pm2_env.args).join(' ') : 'N/A',
      interpreter: proc.pm2_env.exec_interpreter,
      interpreterArgs: proc.pm2_env.node_args.length != 0 ? proc.pm2_env.node_args : 'N/A',
      execMode: proc.pm2_env.exec_mode,
      nodeVersion: proc.pm2_env.node_version,
      watch: proc.pm2_env.watch,
      unstableRestart: proc.pm2_env.unstable_restarts,
      comment: (proc.pm2_env.versioning) ? proc.pm2_env.versioning.comment : 'N/A',
      revision: (proc.pm2_env.versioning) ? proc.pm2_env.versioning.revision : 'N/A',
      branch: (proc.pm2_env.versioning) ? proc.pm2_env.versioning.branch : 'N/A',
      remoteUrl: (proc.pm2_env.versioning) ? proc.pm2_env.versioning.url : 'N/A',
      lastUpdate: (proc.pm2_env.versioning) ? proc.pm2_env.versioning.update_time : 'N/A',
    }

    const metrics = {}
    for (let key in  proc.pm2_env.axm_monitor) {
      const metric = []
      metric.push(proc.pm2_env.axm_monitor[key].value || proc.pm2_env.axm_monitor[key])

      if (proc.pm2_env.axm_monitor[key].unit) {
        metric.push(proc.pm2_env.axm_monitor[key].unit)
      }

      metrics[key] = metric.join(' ')
    }

    return {
      pmId: proc.pm2_env.pm_id,
      name: proc.pm2_env.name,
      memory: proc.monit.memory,
      cpu: proc.monit.cpu,
      status: proc.pm2_env.status,
      metaData,
      metrics,
    }
  })
}

function exit() {
  pm2.disconnect()
  hasConnect = false
  console.log('exit')
}

process.on('exit', exit)

module.exports = {
  addProgress,
  removeProgress,
  listProgress,
}