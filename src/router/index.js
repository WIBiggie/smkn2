import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue' 
import DashboardSiswa from '../views/DashboardSiswa.vue'
import DashboardJurusan from '../views/DashboardJurusan.vue'
import DashboardSarpras from '../views/DashboardSarpras.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: Login
  },
  {
    path: '/siswa/dashboard',
    name: 'DashboardSiswa',
    component: DashboardSiswa,
    meta: { requiresAuth: true, role: 'siswa' }
  },
  {
    path: '/jurusan/dashboard',
    name: 'DashboardJurusan',
    component: DashboardJurusan,
    meta: { requiresAuth: true, role: 'jurusan' }
  },
  {
    path: '/sarpras/dashboard',
    name: 'DashboardSarpras',
    component: DashboardSarpras,
    meta: { requiresAuth: true, role: 'sarpras' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// --- Middleware (Navigation Guard) ---
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
  const userRole = localStorage.getItem('user_role') || sessionStorage.getItem('user_role')

  // PROTEKSI 1: Jika user SUDAH LOGIN tapi mengakses login ('/')
  if (to.name === 'login' && token) {
    if (userRole === 'siswa') return next('/siswa/dashboard')
    if (userRole === 'jurusan') return next('/jurusan/dashboard')
    if (userRole === 'sarpras' || userRole === 'sapras') return next('/sarpras/dashboard')
  }

  // PROTEKSI 2: Mengamankan halaman yang mewajibkan login
  if (to.meta.requiresAuth) {
    if (!token) {
      return next({ name: 'login' })
    }
    
    // PROTEKSI 3: Memastikan user tidak salah memasuki area dashboard milik role lain
    if (to.meta.role && to.meta.role !== userRole) {
      if (userRole === 'siswa') return next('/siswa/dashboard')
      if (userRole === 'jurusan') return next('/jurusan/dashboard')
      if (userRole === 'sarpras' || userRole === 'sapras') return next('/sarpras/dashboard')
      return next('/')
    }
  }
  next()
})

export default router