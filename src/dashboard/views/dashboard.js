const { createApp, ref, reactive, onMounted, readonly } = Vue
const { ElMessage: message, ElMessageBox: box } = ElementPlus

async function api(url, { data, method, params = {} } = {}) {
  const _url = new URL(url, location.href)

  for (let key in params) {
    _url.searchParams.append(key, params[key])
  }

  try {
    const res = await fetch(_url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const _data = await res.json()

    if (!_data.success) {
      throw _data
    }

    return _data.data
  } catch (e) {
    message.error(e.message)
    throw e
  }
}

const DEFAULT_PROJECT = [
  {
    name: 'hospital(medical)',
    script: './bin/www',
    urlPrefix: '/medical',
    proxyHost: 'http://127.0.0.1:3331',
    dir: '~/Documents/work/zoe-health-hospital',
    isLocal: true,
  },
  {
    name: 'app-pay(pay)',
    script: './bin/www',
    urlPrefix: '/pay',
    proxyHost: 'http://127.0.0.1:3334',
    dir: '~/Documents/work/zoe-health-app-pay',
    isLocal: true,
  },
  {
    name: 'app',
    script: './bin/www',
    urlPrefix: '/',
    proxyHost: 'http://127.0.0.1:3330',
    dir: '~/Documents/work/zoe-health-app',
    isLocal: true,
  },
]

const app = createApp({
  setup() {
    const projectList = ref([])

    async function getProjectList() {
      projectList.value = await api('/dashboard/project/all', {
        method: 'GET',
      })
    }

    onMounted(getProjectList)

    /***/

    const showAddDialog = ref(false)
    const newProject = reactive({
      name: '',
      script: '',
      dir: '',
      urlPrefix: '',
      proxyHost: '',
      isLocal: false,
    })

    const newProjectForm = ref()

    function onAddProject() {
      showAddDialog.value = true
    }

    function cancelAddProject(){
      showAddDialog.value = false
    }

    async function submitAddProject(){
      if (!await newProjectForm.value.validate()) {
        return
      }

      await api('/dashboard/project', {
        method: 'PUT',
        data: newProject
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

      newProject.name = project.name
      newProject.script = project.script
      newProject.dir = project.dir
      newProject.urlPrefix = project.urlPrefix
      newProject.proxyHost = project.proxyHost
      newProject.isLocal = project.isLocal
    }

    async function startProject(project) {
      await api('/dashboard/project/start', {
        params: { name: project.name }
      })

      message.success('启动成功')

      await getProjectList()
    }

    async function stopProject(project) {
      await api('/dashboard/project/stop', {
        params: { name: project.name }
      })

      message.success('关闭成功')

      await getProjectList()
    }

    async function removeProject(project) {
      await box.confirm('确定要删除该项目？')

      await api('/dashboard/project', {
        method: 'DELETE',
        params: { name: project.name }
      })

      message.success('删除成功')

      await getProjectList()
    }

    return {
      projectList,
      showAddDialog,
      newProject,
      newProjectForm,
      onAddProject,
      cancelAddProject,
      submitAddProject,
      defaultProject: readonly(DEFAULT_PROJECT),
      setDefaultProject,
      startProject,
      stopProject,
      removeProject,
    }
  }
})

app.use(ElementPlus)
app.mount('#app')