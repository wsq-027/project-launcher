<template>
<div>
  <el-container>
    <el-header>
      <div>
        启动地址：<a :href="serverLink">{{serverLink}}</a>
      </div>
      <div>
        <el-button @click="updatePort">修改端口</el-button>
        <el-button @click="onAddProject">新增</el-button>
        <el-button @click="showMonit">进程监控器</el-button>
        <el-button @click="proxyLogVisible = true">查看代理日志</el-button>
      </div>
    </el-header>

    <el-main>
      <el-table border :data="projectList">
        <el-table-column label="项目标识" prop="name"></el-table-column>
        <el-table-column label="url前缀" prop="urlPrefix"></el-table-column>
        <el-table-column label="代理目标host" prop="proxyHost" :min-width="220">
          <template #default="{row }">
            <el-tag v-if="row.isLocal" effect="dark" type="danger" size="small">local</el-tag>
            <el-tag v-else effect="dark" type="success" size="small">online</el-tag>
            <span style="margin-left: 5px;">{{ row.proxyHost }}</span>
          </template>
        </el-table-column>
        <el-table-column label="node执行文件" prop="script" :width="130"></el-table-column>
        <el-table-column label="项目所在路径" prop="dir" :min-width="180"></el-table-column>
        <el-table-column label="运行" :width="70" align="center">
          <template #default="{ row }">
            <el-switch :value="row.isStart" :before-change="() => switchProject(row)" :loading="row._loading" />
          </template>
        </el-table-column>
        <el-table-column label="操作" :width="120">
          <template #default="{ row }">
            <el-button v-if="!row.isStart" @click="removeProject(row)">删除</el-button>
            <el-button v-if="row.isLocal && row.isStart" @click="showProcessDetail(row)">查看进程</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-main>
  </el-container>

  <el-dialog v-model="newProjectVisible" title="新增" :close-on-click-modal="false" :width="480" align-center>

    <el-form ref="newProjectForm" :model="newProject" label-width="120px">
      <el-form-item label="项目标识" prop="name" required>
        <el-input v-model="newProject.name">
          <template #append>
            <el-dropdown trigger="click" @command="setDefaultProject">
              <el-button class="el-dropdown-link">example</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="project in defaultProject" :key="project.name" :command="project.name">
                      {{ project.name }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="url前缀" prop="urlPrefix" required>
        <el-input v-model="newProject.urlPrefix" />
      </el-form-item>

      <el-form-item label="代理目标host" prop="proxyHost" required>
        <el-input v-model="newProject.proxyHost" />
      </el-form-item>

      <el-form-item label="是否本地项目" prop="isLocal" required>
        <el-checkbox v-model="newProject.isLocal" />
      </el-form-item>

      <template v-if="newProject.isLocal">
        <el-form-item label="项目目录" prop="dir" required>
          <el-input v-model="newProject.dir">
            <template #append>
              <el-button size="small" @click="onDirectory" icon="FolderAdd" title="选择目录"></el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="node执行文件" prop="script" required>
          <el-input v-model="newProject.script">
            <template #append>
              <el-button size="small" @click="onScriptFile" icon="DocumentAdd" title="选择文件"></el-button>
            </template>
          </el-input>
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="cancelAddProject">取消</el-button>
      <el-button type="primary" @click="submitAddProject">新增</el-button>
    </template>
  </el-dialog>

  <el-dialog  v-model="processDetailVisible" title="进程详情" :close-on-click-modal="false" :width="640">
    <template v-if="processDetail.pm2_env">
      <el-descriptions :title="processDetail.pm2_env.name" :column="3">
        <template #extra>
          <el-button @click="showProcessLog">查看日志</el-button>
          <el-button @click="showProcessError">查看异常日志</el-button>
        </template>
        <el-descriptions-item label="Process Id:">
          [{{ processDetail.pm2_env.pm_id }}]
        </el-descriptions-item>
        <el-descriptions-item label="Mem:">
          <b>{{ (processDetail.monit.memory / 1048576).toFixed(2) }}</b> MB
        </el-descriptions-item>
        <el-descriptions-item label="CPU:">
          <b :style="{ color: gradient(processDetail.monit.cpu, [255, 0, 0], [0, 255, 0]) }">{{ processDetail.monit.cpu}}</b> %
        </el-descriptions-item>
      </el-descriptions>

      <el-collapse accordion model-value="metrics">
        <el-collapse-item name="metrics" title="Custom Metrics" v-if="processDetail.pm2_env.axm_monitor">
          <el-descriptions border :column="1">
            <el-descriptions-item v-for="(metrics, key) in processDetail.pm2_env.axm_monitor" :key="key" :label="key">
              {{ metrics.value ?? metrics }} {{ metrics.unit }}
            </el-descriptions-item>
          </el-descriptions>
        </el-collapse-item>

        <el-collapse-item name="meta" title="Metadata">
          <el-descriptions border :column="1">
            <el-descriptions-item label="Name">
              {{ processDetail.pm2_env.name }}
            </el-descriptions-item>
            <el-descriptions-item label="Namespace">
              {{processDetail.pm2_env.namespace}}
            </el-descriptions-item>
            <el-descriptions-item label="Version">
              {{processDetail.pm2_env.version}}
            </el-descriptions-item>
            <el-descriptions-item label="Restarts">
              {{processDetail.pm2_env.restart_time}}
            </el-descriptions-item>
            <el-descriptions-item label="Uptime">
              {{(processDetail.pm2_env.pm_uptime && processDetail.pm2_env.status == 'online') ? processDetail.pm2_env.pm_uptime : 0}}
            </el-descriptions-item>
            <el-descriptions-item label="Script Path">
              {{processDetail.pm2_env.pm_exec_path}}
            </el-descriptions-item>
            <el-descriptions-item label="Scritp Args">
              {{processDetail.pm2_env.args ? (typeof processDetail.pm2_env.args == 'string' ? JSON.parse(processDetail.pm2_env.args.replace(/'/g, '"')):processDetail.pm2_env.args).join(' ') : 'N/A'}}
            </el-descriptions-item>
            <el-descriptions-item label="Interpreter">
              {{processDetail.pm2_env.exec_interpreter}}
            </el-descriptions-item>
            <el-descriptions-item label="Interpreter Args">
              {{processDetail.pm2_env.node_args.length != 0 ? processDetail.pm2_env.node_args : 'N/A'}}
            </el-descriptions-item>
            <el-descriptions-item label="Exec Mode">
              {{processDetail.pm2_env.exec_mode}}
            </el-descriptions-item>
            <el-descriptions-item label="Node Version">
              {{processDetail.pm2_env.node_version}}
            </el-descriptions-item>
            <el-descriptions-item label="Watch">
              {{processDetail.pm2_env.watch}}
            </el-descriptions-item>
            <el-descriptions-item label="Unstable Restart">
              {{processDetail.pm2_env.unstable_restarts}}
            </el-descriptions-item>
            <!-- <el-descriptions-item label="Comment">
              {{(processDetail.pm2_env.versioning) ? processDetail.pm2_env.versioning.comment : 'N/A'}}
            </el-descriptions-item>
            <el-descriptions-item label="Revision">
              {{(processDetail.pm2_env.versioning) ? processDetail.pm2_env.versioning.revision : 'N/A'}}
            </el-descriptions-item>
            <el-descriptions-item label="Branch">
              {{(processDetail.pm2_env.versioning) ? processDetail.pm2_env.versioning.branch : 'N/A'}}
            </el-descriptions-item>
            <el-descriptions-item label="Remote Url">
              {{(processDetail.pm2_env.versioning) ? processDetail.pm2_env.versioning.url : 'N/A'}}
            </el-descriptions-item>
            <el-descriptions-item label="Last Update">
              {{(processDetail.pm2_env.versioning) ? processDetail.pm2_env.versioning.update_time : 'N/A'}}
            </el-descriptions-item> -->
          </el-descriptions>
        </el-collapse-item>
      </el-collapse>
    </template>
  </el-dialog>

  <el-dialog v-model="proxyLogVisible" title="代理日志" fullscreen align-center>
    <ul v-if="proxyLogs.length" class="proxy-log" id="proxy-log">
      <li class="proxy-log-item" v-for="log in proxyLogs" :key="log.timestamp">
        <span class="log-time"><el-tag>{{log.type}}</el-tag>{{filterDate(log.data.timestamp)}}</span>
        <span class="log-name" :title="log.proxy">{{log.data.proxy}}</span>

        <template v-if="log.type === 'log'">
          <span class="log-target" :title="log.target">{{log.data.target}}</span>
        </template>

        <template v-if="log.type === 'response'">
          <pre class="log-response" :title="log.data.toString()">{{log.data.data}}</pre>
        </template>

        <template v-if="log.type === 'error'">
          <pre class="log-error">{{log.data.error}}</pre>
        </template>
      </li>
    </ul>

    <el-empty v-else/>
  </el-dialog>

  <el-dialog v-model="monitVisible" title="进程监控器" fullscreen align-center>
    <div id="monit"></div>
  </el-dialog>
</div>
</template>

<script>
import * as xterm from 'xterm'
import {autoClose, gradient} from '../js/utils.js'
import {DEFAULT_PROJECT} from '../js/constants.js'
import {api, apiStream} from '../js/api.js'

import {
  ref,
  computed,
  readonly,
  onMounted,
  nextTick,
} from 'vue'

import { ElMessage as message, ElMessageBox as box } from 'element-plus'

function usePort() {
  let port = ref(0)
  const serverLink = computed(() => `127.0.0.1:${port.value}`)

  async function initPort() {
    port.value = await api('port.get')
  }

  onMounted(initPort)

  async function updatePort() {
    const prompt = await box.prompt('请输入新的端口号')
    console.log('update', prompt)

    if (prompt.action != 'confirm') {
      return
    }

    if (prompt.value === port.value) {
      return
    }

    const confirm = await box.confirm('修改端口后会重启代理服务器')

    if (confirm != 'confirm') {
      return
    }

    await api('port.update', {port: prompt.value})

    initPort()

    message.success('端口修改成功')
  }

  return {
    serverLink,
    updatePort,
  }
}

function useMonit() {
  window.xterm = xterm
  const term = new xterm.Terminal()
  const monitVisible = ref(false)
  console.log('monit', xterm)

  async function showMonit() {
    monitVisible.value = true

    await nextTick()

    term.open(document.getElementById('monit'))

    autoClose(monitVisible, apiStream('project.monit', {}, (data) => {
      term.write(data)
    }))
  }

  return {
    monitVisible,
    showMonit,
  }
}

function useProjectList() {
  /** 初始化 */
  const projectList = ref([])

  async function getProjectList() {
    projectList.value = await api('project.all')
  }

  onMounted(getProjectList)

  /** 列表操作 */
  async function startProject(project) {
    await api('project.start', { name: project.name })

    message.success('启动成功')

    await getProjectList()
  }

  async function stopProject(project) {
    await api('project.stop', { name: project.name })

    message.success('关闭成功')

    await getProjectList()
  }

  async function switchProject(project) {
    project._loading = true

    try {
      if (project.isStart) {
        stopProject(project)
      } else {
        startProject(project)
      }
    } finally {
      project._loading = false
    }
  }

  async function removeProject(project) {
    await box.confirm('确定要删除该项目？')

    await api('project.delete', { name: project.name })

    message.success('删除成功')

    await getProjectList()
  }

  return {
    projectList,
    getProjectList,
    startProject,
    stopProject,
    switchProject,
    removeProject,
  }
}

function useNewProject({ getProjectList }) {
  /** 新增弹窗 */
  const newProjectVisible = ref(false)
  const newProject = ref({
    name: '',
    script: '',
    dir: '',
    urlPrefix: '',
    proxyHost: '',
    isLocal: false,
  })

  const newProjectForm = ref()

  function onAddProject() {
    newProjectVisible.value = true
    newProject.value = {
      name: '',
      script: '',
      dir: '',
      urlPrefix: '/',
      proxyHost: 'http://',
      isLocal: false,
    }
  }

  function cancelAddProject(){
    newProjectVisible.value = false
  }

  async function submitAddProject(){
    if (!await newProjectForm.value.validate()) {
      return
    }

    const data = newProject.value

    await api('project.add', {
      ...data,
      script: data.isLocal ? data.script : '',
      dir: data.isLocal ? data.dir : '',
    })

    message.success('添加项目成功')

    cancelAddProject()
    await getProjectList()
  }

  function setDefaultProject(name) {
    const project = DEFAULT_PROJECT.find((proj) => proj.name === name)

    if (!project) {
      return
    }

    newProject.value = project
  }

  async function onDirectory() {
    const res = await api('common.select-directory')

    if (res.success) {
      newProject.value.dir = res.directory
    }
  }

  async function onScriptFile() {
    const res = await api('common.select-file', {
      dir: newProject.value.dir
    })

    if (res.success) {
      newProject.value.script = res.relativePath || res.path

      if (!newProject.value.dir) {
        newProject.value.dir = res.path.substring(0, res.path.lastIndexOf('/'))
      }
    }
  }

  return {
    newProjectVisible,
    newProjectForm,
    newProject,
    onAddProject,
    cancelAddProject,
    submitAddProject,
    setDefaultProject,
    onDirectory,
    onScriptFile,
  }
}

function useDetail() {
  /** 详情弹窗 */

  const processDetail = ref({})
  const processDetailVisible = ref(false)

  function showProcessDetail(project) {
    processDetailVisible.value = true

    autoClose(processDetailVisible, apiStream('project.detail',
    {name: project.name},
    (data) => {
      processDetail.value = data
    }))
  }

  function showProcessLog() {
    api('common.view-file', {
      filename: processDetail.value.pm2_env.pm_out_log_path,
    })
  }

  function showProcessError() {
    api('common.view-file', {
      filename: processDetail.value.pm2_env.pm_err_log_path,
    })
  }

  return {
    processDetail,
    processDetailVisible,
    showProcessDetail,
    showProcessLog,
    showProcessError,
  }
}

function useProxyLog() {
  const proxyLogs = ref([])
  const proxyLogVisible = ref(false)

  onMounted(() => {
    apiStream('project.proxy-log', {}, {
      callback(logData) {
        proxyLogs.value.push(logData)

        nextTick(() => {
          const el = document.getElementById('proxy-log')
          el?.scrollTo({
            top: el?.scrollHeight,
          })
        })
      }
    })
  })

  return {
    proxyLogs,
    proxyLogVisible,
  }
}

export default {
  setup() {
    const portModule = usePort()
    const monitModule = useMonit()
    const listModule = useProjectList()
    const newModule = useNewProject(listModule)
    const detailModule = useDetail()
    const proxyLogModule = useProxyLog()

    const filterDate = (timestamp) => {
      const date = new Date(timestamp)

      return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`
    }

    return {
      ...portModule,
      ...monitModule,
      ...listModule,
      ...newModule,
      ...detailModule,
      ...proxyLogModule,
      defaultProject: readonly(DEFAULT_PROJECT),
      gradient,
      filterDate,
    }
  },
}
</script>

<style>
body {
  margin: 0;
}
.el-container {
  height: 100vh;
}

.el-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.el-main {
  overflow: auto;
}

.proxy-log-item {
  font-size: 12px;
  box-shadow: 0 0 6px 0 #d5d5d5;
  padding: 10px 20px;
  margin-top: 10px;
}

.log-time {
  color: gray;
  font-size: 12px;
  margin-right: 10rpx;
}
.log-time::before {
  content: '--';
}
.log-time::after {
  content: '--';
}

.log-name,
.log-target,
.log-response,
.log-error {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 5px;
}

.log-response,
.log-error {
  white-space: normal;
}

.proxy-log {
  height: calc(100vh - 54px - 30px * 2);
  overflow: auto;
  box-sizing: border-box;
  margin: 0;
  padding: 1px;
  list-style: none;
}
</style>