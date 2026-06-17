import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Menuju berkas index.js router kamu
import './style.css'
import axios from 'axios'

// 1. Atur Base URL Backend API agar tidak menulis URL lengkap di setiap file Vue
axios.defaults.baseURL = 'http://127.0.0.1:8000/api'

// 2. Request Interceptor: Otomatis menyisipkan token JWT di setiap request ke backend
axios.interceptors.request.use((config) => {
  // Mengambil token dari localStorage atau sessionStorage (tergantung kondisi "Ingat Saya")
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// 3. Response Interceptor (SUDAH DISATUKAN & DIOPTIMALKAN): 
// Menendang user secara otomatis ke login jika token hangus/expired (Error 401)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Bersihkan seluruh data sesi di browser tanpa tersisa
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_nama')
      sessionStorage.removeItem('auth_token')
      sessionStorage.removeItem('user_role')
      sessionStorage.removeItem('session_only')
      
      // Beri notifikasi yang ramah kepada pengguna
      alert('Sesi Anda telah berakhir atau tidak sah. Silakan masuk kembali.')
      
      // Tendang visual ke halaman login frontend
      router.push('/')
    }
    return Promise.reject(error)
  }
)

const app = createApp(App)
app.use(router) // Memasang router yang sudah diperbaiki
app.mount('#app')