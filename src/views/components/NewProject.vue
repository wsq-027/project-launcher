<template>
  <el-dialog v-model="newProjectVisible" :title="title" :close-on-click-modal="false" :width="480" align-center>
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

        <el-form-item label="启动命令" prop="script" required>
          <el-input v-model="newProject.script" />
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="cancelAddProject">取消</el-button>
      <el-button type="primary" @click="submitAddProject">{{title}}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import {DEFAULT_PROJECT} from '../js/constants.js'
import {api} from '../js/api.js'
import { ref, readonly, computed } from 'vue'
import { ElMessage as message } from 'element-plus'

const defaultProject = readonly(DEFAULT_PROJECT)
const emit = defineEmits(['submit'])

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
const isEdit = ref(false)
const title = computed(() => isEdit.value ? '编辑' : '新增')

const newProjectForm = ref()

function addProject() {
  isEdit.value = false
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

function editProject(project) {
  isEdit.value = true
  newProjectVisible.value = true
  newProject.value = {
    ...project,
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

  if (isEdit.value) {
    await api('project.delete', { name: data.name })
  } else {
    if (!data.script) {
      data.script = './bin/www'
    }
  }

  await api('project.add', {
    ...data,
    script: data.isLocal ? data.script : '',
    dir: data.isLocal ? data.dir : '',
  })

  message.success(`${title}项目成功`)

  cancelAddProject()
  emit('submit')
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

defineExpose({
  addProject,
  editProject,
})
</script>

<style>

</style>