import {autoClose, gradient} from './utils.js'
import {DEFAULT_PROJECT} from './constants.js'

import {api, apiStream} from './api.js'

const { createApp, ref, onMounted, readonly } = Vue
const { ElMessage: message, ElMessageBox: box } = ElementPlus

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

      autoClose(processDetailVisible, apiStream('/dashboard/project/detail', {
        params: {name: project.name},
        callback(data) {
          processDetail.value = data
        }
      }))
    }

    /** 日志弹窗 */
    function showProcessLog() {
      // autoClose(processDetailVisible, apiStream('/dashboard/project/log', {
      //   params: {},
      //   callback(data) {
      //     console.log('data: ', data)
      //   }
      // }))
      message.warning('功能开发中')
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
      switchProject,
      removeProject,
      processDetail,
      processDetailVisible,
      showProcessDetail,
      gradient,
      showProcessLog,
    }
  }
})

app.use(ElementPlus)
app.mount('#app')