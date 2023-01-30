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

<script setup>
import {apiStream} from '../js/api.js'
import { ref, onMounted, nextTick } from 'vue'

const proxyLogs = ref([])
const proxyLogVisible = ref(false)

const filterDate = (timestamp) => {
  const date = new Date(timestamp)

  return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`
}

onMounted(() => {
  apiStream('project.proxy-log', {}, (logData) => {
    proxyLogs.value.push(logData)

    nextTick(() => {
      const el = document.getElementById('proxy-log')
      el?.scrollTo({
        top: el?.scrollHeight,
      })
    })
  })
})

function showProxy() {
  proxyLogVisible.value = true
}

defineExpose({
  showProxy,
})
</script>

<style>

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