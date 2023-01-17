<template>
  <el-container>
    <el-header>
      <div>
        启动地址：<a :href="serverLink">{{serverLink}}</a>
      </div>
      <div>
        <el-button @click="updatePort">修改端口</el-button>
        <el-button @click="onAddProject">新增</el-button>
        <el-button @click="showMonit">进程监控器</el-button>
        <el-button @click="showProxyLog">查看代理日志</el-button>
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

  <new-project ref="addDialog" @submit="getProjectList" />
  <process-detail ref="detailDialog" />
  <proxy-log ref="proxyLogDialog" />
  <monit ref="monitDialog" />
</template>

<script>
import {gradient} from '../js/utils.js'
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

function useDialog() {
  const addDialog = ref(null)
  const detailDialog = ref(null)
  const monitDialog = ref(null)
  const proxyLogDialog = ref(null)

  function onAddProject() {
    addDialog.value.onAddProject()
  }

  function showProcessDetail(row) {
    detailDialog.value.showProcessDetail(row)
  }

  function showMonit() {
    monitDialog.value.showMonit()
  }

  function showProxyLog() {
    proxyLogDialog.value.proxyLogVisible = true
  }

  return {
    addDialog,
    detailDialog,
    monitDialog,
    proxyLogDialog,
    onAddProject,
    showProcessDetail,
    showMonit,
    showProxyLog,
  }
}

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

export default {
  components: {
    Monit,
    NewProject,
    ProcessDetail,
    ProxyLog,
  },
  setup() {
    const portModule = usePort()
    const listModule = useProjectList()
    const dialogModule = useDialog()

    return {
      ...portModule,
      ...listModule,
      ...dialogModule,
      gradient,
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