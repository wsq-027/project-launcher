const { createApp, ref, reactive, onMounted, readonly, watch } = Vue
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

function gradient(p, rgb_beginning, rgb_end) {

  var w = (p / 100) * 2 - 1;

  var w1 = (w + 1) / 2.0;
  var w2 = 1 - w1;

  var rgb = [parseInt(rgb_beginning[0] * w1 + rgb_end[0] * w2),
      parseInt(rgb_beginning[1] * w1 + rgb_end[1] * w2),
          parseInt(rgb_beginning[2] * w1 + rgb_end[2] * w2)];

  return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
}

const app = createApp({
  setup() {
    /** 初始化 */
    const projectList = ref([])

    async function getProjectList() {
      projectList.value = await api('/dashboard/project/all', {
        method: 'GET',
      })
    }

    onMounted(getProjectList)

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
    }

    function cancelAddProject(){
      newProjectVisible.value = false
    }

    async function submitAddProject(){
      if (!await newProjectForm.value.validate()) {
        return
      }

      await api('/dashboard/project', {
        method: 'PUT',
        data: newProject.value
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

    /** 列表操作 */

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

    /** 详情弹窗 */

    const processDetail = ref({})
    const processDetailVisible = ref(false)

    function showProcessDetail(project) {
      processDetailVisible.value = true
      let timeoutFlag
      const interval = async () => {
        processDetail.value = await api('/dashboard/project', {
          method: 'GET',
          params: { name: project.name }
        })

        if (processDetailVisible.value) {
          timeoutFlag = setTimeout(interval, 3000)
        }
      }

      const unwatch = watch(processDetailVisible, () => {
        if (!processDetailVisible.value) {
          clearTimeout(timeoutFlag)
          unwatch()
        }
      })

      interval()
    }

    return {
      projectList,
      newProjectVisible,
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
      processDetail,
      processDetailVisible,
      showProcessDetail,
      gradient,
    }
  }
})

app.use(ElementPlus)
app.mount('#app')