<template>
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
</template>

<script>
import {apiStream} from '../js/api.js'
import { ref, onMounted, nextTick } from 'vue'

export default {
  setup() {
    const proxyLogs = ref([])
    const proxyLogVisible = ref(false)

    const filterDate = (timestamp) => {
      const date = new Date(timestamp)

      return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`
    }

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
      filterDate,
    }
  }
}
</script>

<style>

</style>