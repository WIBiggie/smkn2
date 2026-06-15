import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue' // Sesuaikan dengan letak file Login.vue kamu
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
    path: '/jurusan/dashboardjurusan',
    name: 'DashboardJurusan',
    component: DashboardJurusan,
    meta: { requiresAuth: true, role: 'jurusan' }
  },
  {
    path: '/sarpras/dashboardsarpras',
    name: 'DashboardSarpras',
    component: DashboardSarpras,
    meta: { requiresAuth: true, role: 'sarpras' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// --- Middleware (Navigation Guard) agar dashboard aman tidak bisa ditembus sembarangan ---
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token')
  const userRole = localStorage.getItem('user_role')

  if (to.meta.requiresAuth) {
    if (!token) {
      // Belum login? tendang ke halaman login
      return next({ name: 'login' })
    }
    
    // Jika rolenya tidak sesuai, kembalikan ke dashboard aslinya
    if (to.meta.role && to.meta.role !== userRole) {
      if (userRole === 'siswa') return next('/siswa/dashboard')
      if (userRole === 'jurusan') return next('/jurusan/dashboardjurusan')
      if (userRole === 'sarpras' || userRole === 'sapras') return next('/sarpras/dashboardsarpras')
      return next('/')
    }
  }
  next()
})

export default router