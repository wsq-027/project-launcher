<template>
  <el-dialog v-model="monitVisible" title="进程监控器" fullscreen align-center>
    <div id="monit"></div>
  </el-dialog>
</template>

<script>
import * as xterm from 'xterm'
import 'xterm/css/xterm.css'
import {autoClose} from '../js/utils.js'
import {apiStream} from '../js/api.js'

import {
  ref,
  nextTick,
} from 'vue'

export default {
  setup() {
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
}
</script>

<style>

</style>