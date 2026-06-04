import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Import Bootstrap and Icons
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

// Import Custom Base Styles
import './assets/base.css'

createApp(App).use(router).mount('#app')
