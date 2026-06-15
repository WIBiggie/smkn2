import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // <--- 1. Import konfigurasi router kamu
import './style.css'

const app = createApp(App)

app.use(router) // <--- 2. Pasang router ke dalam aplikasi Vue

app.mount('#app')