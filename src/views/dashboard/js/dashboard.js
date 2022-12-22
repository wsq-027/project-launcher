import {autoClose, gradient} from './utils.js'
import {DEFAULT_PROJECT} from './constants.js'

import {api, apiStream} from './api.js'

const {
  createApp,
  ref,
  computed,
  readonly,
  onMounted,
  nextTick,
} = Vue
const { ElMessage: message, ElMessageBox: box } = ElementPlus
const { FolderAdd, DocumentAdd } = ElementPlusIconsVue

function useCommon() {
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

const app = createApp({
  setup() {
    const commonModule = useCommon()
    const listModule = useProjectList()
    const newModule = useNewProject(listModule)
    const detailModule = useDetail()
    const proxyLogModule = useProxyLog()

    const filterDate = (timestamp) => {
      const date = new Date(timestamp)

      return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`
    }

    return {
      ...commonModule,
      ...listModule,
      ...newModule,
      ...detailModule,
      ...proxyLogModule,
      defaultProject: readonly(DEFAULT_PROJECT),
      gradient,
      filterDate,
    }
  }
})

app.use(ElementPlus)
app.component('FolderAdd', FolderAdd)
app.component('DocumentAdd', DocumentAdd)
app.mount('#app')