<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios'; // Pastikan axios sudah terinstall via npm
import { 
  LayoutDashboard, 
  Boxes, 
  QrCode, 
  UserPlus, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  User 
} from 'lucide-vue-next';

// Impor komponen-komponen fitur pendukung sesuai struktur Anda
import KelolaStok from '../components/Sarpras/KelolaStok.vue';
import BarcodeGenerator from '../components/Sarpras/BarcodeGenerator.vue';
import KelolaAkunJurusan from '../components/Sarpras/KelolaAkunJurusan.vue';

const router = useRouter();

// --- State Navigasi & Tampilan ---
const activeView = ref('dashboard'); // Default halaman utama dashboard
const isMobileMenuOpen = ref(false); // Kontrol buka/tutup sidebar di mobile
const namaAdmin = ref('Petugas Sarpras');

// --- State Data Ringkas (Diambil dinamis dari database, default 0) ---
const statistik = ref({
  totalBarang: 0,
  stokMasukBulanIni: 0,
  distribusiJurusan: 0
});

// Fungsi mengambil data dari API Lumen
const fetchStatistikData = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    
    // Sesuaikan URL host & port dengan server Lumen Anda
    const response = await axios.get('http://localhost:8000/api/dashboard/statistik', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.status === 'success') {
      statistik.value = response.data.data;
    }
  } catch (error) {
    console.error('Gagal memuat data statistik dari database:', error);
  }
};

// Menangani perpindahan halaman menu
const navigateToView = (view) => {
  activeView.value = view;
  isMobileMenuOpen.value = false; // Tutup otomatis sidebar jika di mode mobile
};

// Fungsi Logout
const handleLogout = () => {
  if (confirm('Apakah Anda yakin ingin keluar dari sistem Sarpras?')) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    router.push('/');
  }
};

// Cek token saat komponen dimuat
onMounted(() => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    router.push('/');
  } else {
    fetchStatistikData();
  }
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
          <button class="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all relative">
            <Bell class="w-5 h-5" />
            <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>
          <div class="flex items-center gap-2.5 pl-3 border-l border-slate-200">
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

  </div>
</template>

<style scoped>
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>