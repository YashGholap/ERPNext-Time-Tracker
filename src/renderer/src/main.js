import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'

import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'

let app = createApp(App)
app.use(router)
app.mount('#app')
