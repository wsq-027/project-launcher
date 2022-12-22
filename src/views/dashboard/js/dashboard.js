import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import { FolderAdd, DocumentAdd } from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'

import Dashboard from '../components/dashboard.vue'

const app = createApp(Dashboard)

app.use(ElementPlus)
app.component('FolderAdd', FolderAdd)
app.component('DocumentAdd', DocumentAdd)
app.mount('#app')