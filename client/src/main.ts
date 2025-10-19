import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './services/graphql/client'

const app = createApp(App)

app.use(router)

app.mount('#app')
