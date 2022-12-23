<template>
  <el-dialog  v-model="processDetailVisible" title="进程详情" :close-on-click-modal="false" :width="640">
    <template v-if="processDetail.pm2_env">
      <el-descriptions :title="processDetail.pm2_env.name" :column="3">
        <template #extra>
          <el-button @click="showProcessLog">查看日志</el-button>
          <el-button @click="showProcessError">查看异常日志</el-button>
        </template>
        <el-descriptions-item label="Process Id:">
          [{{ processDetail.pm2_env.pm_id }}]
        </el-descriptions-item>
        <el-descriptions-item label="Mem:">
          <b>{{ (processDetail.monit.memory / 1048576).toFixed(2) }}</b> MB
        </el-descriptions-item>
        <el-descriptions-item label="CPU:">
          <b :style="{ color: gradient(processDetail.monit.cpu, [255, 0, 0], [0, 255, 0]) }">{{ processDetail.monit.cpu}}</b> %
        </el-descriptions-item>
      </el-descriptions>

      <el-collapse accordion model-value="metrics">
        <el-collapse-item name="metrics" title="Custom Metrics" v-if="processDetail.pm2_env.axm_monitor">
          <el-descriptions border :column="1">
            <el-descriptions-item v-for="(metrics, key) in processDetail.pm2_env.axm_monitor" :key="key" :label="key">
              {{ metrics.value ?? metrics }} {{ metrics.unit }}
            </el-descriptions-item>
          </el-descriptions>
        </el-collapse-item>

        <el-collapse-item name="meta" title="Metadata">
          <el-descriptions border :column="1">
            <el-descriptions-item label="Name">
              {{ processDetail.pm2_env.name }}
            </el-descriptions-item>
            <el-descriptions-item label="Namespace">
              {{processDetail.pm2_env.namespace}}
            </el-descriptions-item>
            <el-descriptions-item label="Version">
              {{processDetail.pm2_env.version}}
            </el-descriptions-item>
            <el-descriptions-item label="Restarts">
              {{processDetail.pm2_env.restart_time}}
            </el-descriptions-item>
            <el-descriptions-item label="Uptime">
              {{(processDetail.pm2_env.pm_uptime && processDetail.pm2_env.status == 'online') ? processDetail.pm2_env.pm_uptime : 0}}
            </el-descriptions-item>
            <el-descriptions-item label="Script Path">
              {{processDetail.pm2_env.pm_exec_path}}
            </el-descriptions-item>
            <el-descriptions-item label="Scritp Args">
              {{processDetail.pm2_env.args ? (typeof processDetail.pm2_env.args == 'string' ? JSON.parse(processDetail.pm2_env.args.replace(/'/g, '"')):processDetail.pm2_env.args).join(' ') : 'N/A'}}
            </el-descriptions-item>
            <el-descriptions-item label="Interpreter">
              {{processDetail.pm2_env.exec_interpreter}}
            </el-descriptions-item>
            <el-descriptions-item label="Interpreter Args">
              {{processDetail.pm2_env.node_args.length != 0 ? processDetail.pm2_env.node_args : 'N/A'}}
            </el-descriptions-item>
            <el-descriptions-item label="Exec Mode">
              {{processDetail.pm2_env.exec_mode}}
            </el-descriptions-item>
            <el-descriptions-item label="Node Version">
              {{processDetail.pm2_env.node_version}}
            </el-descriptions-item>
            <el-descriptions-item label="Watch">
              {{processDetail.pm2_env.watch}}
            </el-descriptions-item>
            <el-descriptions-item label="Unstable Restart">
              {{processDetail.pm2_env.unstable_restarts}}
            </el-descriptions-item>
            <!-- <el-descriptions-item label="Comment">
              {{(processDetail.pm2_env.versioning) ? processDetail.pm2_env.versioning.comment : 'N/A'}}
            </el-descriptions-item>
            <el-descriptions-item label="Revision">
              {{(processDetail.pm2_env.versioning) ? processDetail.pm2_env.versioning.revision : 'N/A'}}
            </el-descriptions-item>
            <el-descriptions-item label="Branch">
              {{(processDetail.pm2_env.versioning) ? processDetail.pm2_env.versioning.branch : 'N/A'}}
            </el-descriptions-item>
            <el-descriptions-item label="Remote Url">
              {{(processDetail.pm2_env.versioning) ? processDetail.pm2_env.versioning.url : 'N/A'}}
            </el-descriptions-item>
            <el-descriptions-item label="Last Update">
              {{(processDetail.pm2_env.versioning) ? processDetail.pm2_env.versioning.update_time : 'N/A'}}
            </el-descriptions-item> -->
          </el-descriptions>
        </el-collapse-item>
      </el-collapse>
    </template>
  </el-dialog>
</template>

<script>
import {autoClose} from '../js/utils.js'
import {api, apiStream} from '../js/api.js'
import {gradient} from '../js/utils.js'
import { ref } from 'vue'

export default {
  setup() {
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
      gradient,
    }
  }
}
</script>

<style>

</style>