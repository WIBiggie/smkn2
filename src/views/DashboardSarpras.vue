<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios'; 
import { 
  LayoutDashboard, 
  Boxes, 
  QrCode, 
  UserPlus, 
  LogOut, 
  Menu, 
  X, 
  User 
} from 'lucide-vue-next';

import KelolaStok from '../components/Sarpras/KelolaStok.vue';
import BarcodeGenerator from '../components/Sarpras/BarcodeGenerator.vue';
import KelolaAkunJurusan from '../components/Sarpras/KelolaAkunJurusan.vue';

const router = useRouter();

// --- State Navigasi & Tampilan ---
const activeView = ref('dashboard'); 
const isMobileMenuOpen = ref(false); 
const namaAdmin = ref(localStorage.getItem('user_nama') || 'Petugas Sarpras');

const statistik = ref({
  totalBarang: 0,
  stokMasukBulanIni: 0,
  distribusiJurusan: 0
});

// Fungsi mengambil data dari API 
const fetchStatistikData = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get('/dashboard/statistik', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data && response.data.status === 'success') {
      statistik.value = response.data.data;
    }
  } catch (error) {
    console.error('Gagal mengambil data statistik:', error);
  }
};

const navigateToView = (view) => {
  activeView.value = view;
  isMobileMenuOpen.value = false; 
};

// Fungsi Logout Sesi
const handleLogout = () => {
  if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_nama');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_role');
    sessionStorage.removeItem('session_only');
    
    router.push('/');
  }
};

// --- State & Logika Edit Profil ---
const showProfileModal = ref(false);
const formProfile = ref({
  nama_user: '',
  username: '',
  email: '',
  password: ''
});
const profileErrors = ref({});
const loadingProfile = ref(false);

const openProfileModal = async () => {
  profileErrors.value = {};
  formProfile.value.password = '';
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get('/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data.success) {
      formProfile.value.nama_user = response.data.data.nama_user;
      formProfile.value.username = response.data.data.username;
      formProfile.value.email = response.data.data.email;
      showProfileModal.value = true;
    }
  } catch (error) {
    alert('Gagal mengambil data profil.');
  }
};

const handleUpdateProfile = async () => {
  loadingProfile.value = true;
  profileErrors.value = {};
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.put('/profile', formProfile.value, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data.success) {
      alert('Profil berhasil diperbarui!');
      namaAdmin.value = response.data.data.nama_user;
      localStorage.setItem('user_nama', response.data.data.nama_user);
      showProfileModal.value = false;
    }
  } catch (error) {
    if (error.response && error.response.status === 422) {
      profileErrors.value = error.response.data.errors || {};
    } else {
      alert('Gagal memperbarui profil.');
    }
  } finally {
    loadingProfile.value = false;
  }
};

// Cek token saat komponen dimuat
onMounted(() => {
  const token = localStorage.getItem('auth_token');
  const role = localStorage.getItem('user_role');

  if (!token || role !== 'sarpras') {
    alert('Akses ditolak! Anda harus login sebagai Sarpras.');
    router.push('/'); 
    return;
  }

  fetchStatistikData();
});
</script>

<template>
  <div class="min-h-screen bg-slate-100 font-sans flex text-slate-800">
    
    <aside 
      :class="[
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        'fixed md:sticky top-0 left-0 z-50 w-72 h-screen bg-slate-900 text-slate-300 flex flex-col justify-between p-6 transition-transform duration-300 ease-in-out border-r border-slate-800'
      ]"
    >
      <div>
        <div class="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-indigo-600 rounded-xl text-white">
              <Boxes class="w-6 h-6" />
            </div>
            <div>
              <h1 class="text-lg font-bold text-white tracking-wide leading-none">SARPRAS</h1>
              <span class="text-xs text-indigo-400 font-medium">Inventory Tracking</span>
            </div>
          </div>
          <button @click="isMobileMenuOpen = false" class="md:hidden text-slate-400 hover:text-white transition-colors">
            <X class="w-6 h-6" />
          </button>
        </div>

        <nav class="space-y-1.5">
          <button 
            @click="navigateToView('dashboard')"
            :class="[activeView === 'dashboard' ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-800 hover:text-white']"
            class="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all"
          >
            <LayoutDashboard class="w-5 h-5" /> Dashboard Utama
          </button>

          <button 
            @click="navigateToView('stok')"
            :class="[activeView === 'stok' ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-800 hover:text-white']"
            class="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all"
          >
            <Boxes class="w-5 h-5" /> Kelola Stok Masuk/Keluar
          </button>

          <button 
            @click="navigateToView('barcode')"
            :class="[activeView === 'barcode' ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-800 hover:text-white']"
            class="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all"
          >
            <QrCode class="w-5 h-5" /> Kategori & Kode Alat
          </button>

          <button 
            @click="navigateToView('akun_jurusan')"
            :class="[activeView === 'akun_jurusan' ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-800 hover:text-white']"
            class="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all"
          >
            <UserPlus class="w-5 h-5" /> Buat Akun Jurusan
          </button>
        </nav>
      </div>

      <div class="pt-4 border-t border-slate-800">
        <button 
          @click="handleLogout"
          class="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 font-medium transition-all"
        >
          <LogOut class="w-5 h-5" /> Keluar Sistem
        </button>
      </div>
    </aside>

    <div 
      v-if="isMobileMenuOpen" 
      @click="isMobileMenuOpen = false" 
      class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
    ></div>

    <div class="flex-1 flex flex-col min-w-0">
      
      <header class="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-4">
          <button 
            @click="isMobileMenuOpen = !isMobileMenuOpen" 
            class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 md:hidden transition-colors"
          >
            <Menu class="w-6 h-6" />
          </button>
          
          <div>
            <h2 class="text-lg font-bold text-slate-800 capitalize">Halaman Kontrol Sarpras</h2>
            <p class="text-xs text-slate-400 hidden sm:block">Sistem Informasi Manajemen Aset dan Distribusi Inventaris Sekolah</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div @click="openProfileModal" class="flex items-center gap-2.5 pl-3 border-l border-slate-200 cursor-pointer hover:opacity-85 transition-all">
            <div class="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold text-sm">
              <User class="w-4 h-4" />
            </div>
            <div class="hidden md:block leading-none">
              <p class="text-sm font-semibold text-slate-800">{{ namaAdmin }}</p>
              <span class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Logistik Pusat</span>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 p-6 max-w-7xl w-full mx-auto">
        <div class="transition-all duration-300">
          
          <div v-if="activeView === 'dashboard'" class="space-y-6">
            <div class="p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden">
              <div class="relative z-10 max-w-lg">
                <h3 class="text-2xl font-bold mb-1">Halo, {{ namaAdmin }}! 👋</h3>
                <p class="text-slate-300 text-sm leading-relaxed">Selamat datang kembali di panel kendali inventaris. Monitor sirkulasi logistik masuk dan kelola pembuatan hak akses jurusan dengan aman dari satu tempat.</p>
              </div>
              <Boxes class="absolute -right-6 -bottom-6 w-44 h-44 text-white/5 pointer-events-none transform -rotate-12" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                <div>
                  <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Item Aset</span>
                  <h4 class="text-2xl font-bold text-slate-800 mt-1">{{ statistik.totalBarang }} <span class="text-xs text-slate-400 font-normal">Unit</span></h4>
                </div>
                <div class="p-3 bg-blue-50 text-blue-600 rounded-xl"><Boxes class="w-6 h-6" /></div>
              </div>

              <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                <div>
                  <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stok Masuk (Bulan Ini)</span>
                  <h4 class="text-2xl font-bold text-slate-800 mt-1">+{{ statistik.stokMasukBulanIni }} <span class="text-xs text-slate-400 font-normal">Item</span></h4>
                </div>
                <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Boxes class="w-6 h-6" /></div>
              </div>

              <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                <div>
                  <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Disalurkan Ke Jurusan</span>
                  <h4 class="text-2xl font-bold text-slate-800 mt-1">{{ statistik.distribusiJurusan }} <span class="text-xs text-slate-400 font-normal">Kali</span></h4>
                </div>
                <div class="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Boxes class="w-6 h-6" /></div>
              </div>
            </div>
            
            <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <h4 class="text-base font-bold text-slate-800 mb-4">Akses Navigasi Pengelolaan Cepat</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button @click="navigateToView('stok')" class="p-4 border border-slate-200 rounded-xl text-left hover:border-indigo-500 hover:bg-indigo-50/40 group transition-all">
                  <h5 class="font-bold text-slate-700 text-sm group-hover:text-indigo-600">Alur Mutasi Stok &rarr;</h5>
                  <p class="text-xs text-slate-400 mt-1">Catat penambahan barang atau pengeluaran logistik ke lab jurusan.</p>
                </button>
                <button @click="navigateToView('barcode')" class="p-4 border border-slate-200 rounded-xl text-left hover:border-indigo-500 hover:bg-indigo-50/40 group transition-all">
                  <h5 class="font-bold text-slate-700 text-sm group-hover:text-indigo-600">Registrasi Label & QR &rarr;</h5>
                  <p class="text-xs text-slate-400 mt-1">Buka generator cetak kode penomoran untuk pengenal tracking fisik barang.</p>
                </button>
                <button @click="navigateToView('akun_jurusan')" class="p-4 border border-slate-200 rounded-xl text-left hover:border-indigo-500 hover:bg-indigo-50/40 group transition-all">
                  <h5 class="font-bold text-slate-700 text-sm group-hover:text-indigo-600">Registrasi User Baru &rarr;</h5>
                  <p class="text-xs text-slate-400 mt-1">Buatkan akun operator khusus untuk ketua program keahlian/jurusan.</p>
                </button>
              </div>
            </div>
          </div>
          
          <KelolaStok v-else-if="activeView === 'stok'" />
          <BarcodeGenerator v-else-if="activeView === 'barcode'" />
          <KelolaAkunJurusan v-else-if="activeView === 'akun_jurusan'" />
          
        </div>
      </main>
    </div>

    <!-- Modal Edit Profil -->
    <div v-if="showProfileModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <div class="flex items-center justify-between p-5 border-b border-slate-100">
          <h4 class="font-bold text-slate-800 text-sm">Edit Profil Saya</h4>
          <button @click="showProfileModal = false" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X class="w-5 h-5" /></button>
        </div>

        <form @submit.prevent="handleUpdateProfile" class="p-5 space-y-4 text-xs text-slate-700">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
            <input v-model="formProfile.nama_user" type="text" required
                   class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
            <p v-if="profileErrors.nama_user" class="text-[10px] text-rose-500 italic mt-1">{{ profileErrors.nama_user[0] }}</p>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Username</label>
            <input v-model="formProfile.username" type="text" required
                   class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
            <p v-if="profileErrors.username" class="text-[10px] text-rose-500 italic mt-1">{{ profileErrors.username[0] }}</p>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email</label>
            <input v-model="formProfile.email" type="email" required
                   class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
            <p v-if="profileErrors.email" class="text-[10px] text-rose-500 italic mt-1">{{ profileErrors.email[0] }}</p>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Password Baru (Kosongkan jika tidak ingin diubah)</label>
            <input v-model="formProfile.password" type="password" placeholder="******"
                   class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all" />
            <p v-if="profileErrors.password" class="text-[10px] text-rose-500 italic mt-1">{{ profileErrors.password[0] }}</p>
          </div>

          <button type="submit" :disabled="loadingProfile" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all">
            {{ loadingProfile ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </form>
      </div>
    </div>

  </div>
</template>

<style scoped>
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>