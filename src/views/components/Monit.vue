<template>
  <el-dialog
    v-model="monitVisible"
    title="进程监控器"
    class="monit-dialog"
    fullscreen
    align-center
  >
    <div id="monit"></div>
  </el-dialog>
</template>

<script setup>
import * as xterm from 'xterm'
import 'xterm/css/xterm.css'
import {autoClose} from '../js/utils.js'
import {api, apiStream} from '../js/api.js'

import {
  ref,
  nextTick,
} from 'vue'
import { ElMessage } from 'element-plus'

/**
 * @param {Function[]} fns
 */
function flow(fns) {
  return (arg) => fns.reduce((pre, fn) => fn.call(this, pre), arg)
}

const monitVisible = ref(false)

async function showMonit(project, canInput) {
  if (project.id == null) {
    ElMessage.warning('找不到日志')
    return
  }

  monitVisible.value = true

  await nextTick()

  const el = document.getElementById('monit')
  const rect = el.getBoundingClientRect()
  const rows = Math.floor(rect.height / 18)
  const cols = Math.floor(rect.width / 9)
  const term = new xterm.Terminal({
    windowsMode: ['Windows', 'Win16', 'Win32', 'WinCE'].includes(navigator.platform),
    cols,
    rows,
  })
  term.open(el)

  if (canInput) {
    term.onData((data) => {
      api('monit.data', data)
    })

    setTimeout(() => {
      term.focus()
    }, 1000)
  }

  term.attachCustomKeyEventHandler((e) => !e.catched)

  autoClose(monitVisible, flow([
    apiStream('monit', { rows, cols, args: ['logs', project.id, '--raw'] }, (data) => {
      term.write(data)
    }),
    () => {
      term.dispose()
    }
  ]))
}

defineExpose({
  showMonit,
})
</script>

<style>
.monit-dialog {
  display: flex;
  flex-direction: column;
}

.monit-dialog .el-dialog__body {
  flex: 1;
  min-height: 0;
}
#monit {
  height: 100%;
}
</style>