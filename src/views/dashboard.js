import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { FolderAdd, DocumentAdd } from '@element-plus/icons-vue'
import Dashboard from './components/dashboard.vue'

const app = createApp(Dashboard)
app.use(ElementPlus)
app.component(FolderAdd.name, FolderAdd)
app.component(DocumentAdd.name, DocumentAdd)
app.mount('#app')