<template>
  <el-container>
    <el-header>
      <div>
        启动地址：<a :href="serverLink">{{serverLink}}</a>
      </div>
      <div>
        <el-button @click="updatePort">修改端口</el-button>
        <el-button @click="addProject">新增</el-button>
        <el-button @click="showMonit">进程监控器</el-button>
        <el-button @click="showProxyLog">查看代理日志</el-button>
      </div>
    </el-header>

    <el-main>
      <el-table border :data="projectList">
        <el-table-column label="项目标识" prop="name" width="90"></el-table-column>
        <el-table-column label="url前缀" prop="urlPrefix" width="90"></el-table-column>
        <el-table-column label="代理目标host" prop="proxyHost" :min-width="220">
          <template #default="{row }">
            <el-tag v-if="row.isLocal" effect="dark" type="danger" size="small">local</el-tag>
            <el-tag v-else effect="dark" type="success" size="small">online</el-tag>
            <span style="margin-left: 5px;">{{ row.proxyHost }}</span>
          </template>
        </el-table-column>
        <el-table-column label="node执行文件" prop="script" :width="130">
          <template #default="{row}">
            <span v-if="!row.isLocal" class="info-msg">remote</span>
          </template>
        </el-table-column>
        <el-table-column label="项目所在路径" prop="dir" :min-width="180">
          <template #default="{row}">
            <span v-if="!row.isLocal" class="info-msg">remote</span>
          </template>
        </el-table-column>
        <el-table-column label="运行" :width="70" align="center">
          <template #default="{ row }">
            <el-switch :value="row.isStart" :before-change="() => switchProject(row)" :loading="row._loading" />
          </template>
        </el-table-column>
        <el-table-column label="操作" :width="160">
          <template #default="{ row }">
            <el-button v-if="!row.isStart" @click="editProject(row)">编辑</el-button>
            <el-button v-if="!row.isStart" @click="removeProject(row)">删除</el-button>
            <el-button v-if="row.isLocal && row.isStart" @click="showProcessDetail(row)">查看进程</el-button>
            <span class="info-msg" v-if="!row.isLocal && row.isStart">项目运行中不可修改</span>
          </template>
        </el-table-column>
      </el-table>
    </el-main>
  </el-container>

  <new-project ref="addDialog" @submit="getProjectList" />
  <process-detail ref="detailDialog" />
  <proxy-log ref="proxyLogDialog" />
  <monit ref="monitDialog" />
</template>

<script setup>
import {api} from '../js/api.js'
import {
  ref,
  computed,
  onMounted,
} from 'vue'
import { ElMessage as message, ElMessageBox as box } from 'element-plus'
import Monit from './Monit.vue'
import NewProject from './NewProject.vue'
import ProcessDetail from './ProcessDetail.vue'
import ProxyLog from './ProxyLog.vue'

/** 添加 */
const addDialog = ref(null)
function addProject() {
  addDialog.value.addProject()
}

/** 查看 */
const detailDialog = ref(null)
function showProcessDetail(row) {
  detailDialog.value.showProcessDetail(row)
}

/** 进程监控 */
const monitDialog = ref(null)
function showMonit() {
  monitDialog.value.showMonit()
}

/** 代理日志 */
const proxyLogDialog = ref(null)
function showProxyLog() {
  proxyLogDialog.value.showProxy()
}

/** 修改端口 */
let port = ref(0)
const serverLink = computed(() => `127.0.0.1:${port.value}`)

async function initPort() {
  port.value = await api('port.get')
}

onMounted(initPort)

async function updatePort() {
  const prompt = await box.prompt('请输入新的端口号', {
    inputPlaceholder: port.value,
    inputType: 'number',
    inputValidator: (value) => {
      if (value > 65535 || value < 0) {
        return '非法端口'
      }

      return true
    }
  })

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

/** 列表 */
const projectList = ref([])
async function getProjectList() {
  projectList.value = await api('project.all')
}

onMounted(getProjectList)

/** 启动 */
async function startProject(project) {
  await api('project.start', { name: project.name })

  message.success('启动成功')

  await getProjectList()
}

/** 停止 */
async function stopProject(project) {
  await api('project.stop', { name: project.name })

  message.success('关闭成功')

  await getProjectList()
}

/** 切换按钮 */
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

/** 删除 */
async function removeProject(project) {
  await box.confirm('确定要删除该项目？')

  await api('project.delete', { name: project.name })

  message.success('删除成功')

  await getProjectList()
}

/** 修改 */
async function editProject(project) {
  addDialog.value.editProject(project)
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

.info-msg {
  color: var(--el-color-info-light-5);
  font-size: 12px;
}
</style>