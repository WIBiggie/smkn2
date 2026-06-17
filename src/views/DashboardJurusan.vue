<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  CheckCircle2, 
  Trash2, 
  LogOut, 
  Menu, 
  X, 
  RefreshCw,
  Search,
  BookOpen,
  ClipboardList
} from 'lucide-vue-next';

const router = useRouter();

// --- State Navigasi & Tampilan ---
const activeTab = ref('overview'); // overview, siswa, peminjaman, riwayat
const isMobileMenuOpen = ref(false); 
const namaUser = ref(localStorage.getItem('user_nama') || 'Ketua Jurusan');

// --- State Data ---
const siswaList = ref([]);
const peminjamanList = ref([]);
const pengembalianList = ref([]);

const stats = ref({
  totalSiswa: 0,
  totalDipinjam: 0,
  totalDikembalikan: 0
});

const loading = ref(false);
const searchSiswa = ref('');

// --- State Form Register Siswa ---
const formSiswa = ref({
  nama_user: '',
  username: '',
  email: '',
  password: ''
});
const errors = ref({});
const showAddModal = ref(false);

// --- Fetch Data ---
const fetchData = async () => {
  loading.value = true;
  try {
    // 1. Ambil daftar siswa
    const resSiswa = await axios.get('/jurusan/siswa-semua');
    if (resSiswa.data.success) {
      siswaList.value = resSiswa.data.data;
      stats.value.totalSiswa = siswaList.value.length;
    }

    // 2. Ambil peminjaman aktif
    const resPinjam = await axios.get('/jurusan/siswa-meminjam');
    if (resPinjam.data.success) {
      peminjamanList.value = resPinjam.data.data;
      stats.value.totalDipinjam = peminjamanList.value.length;
    }

    // 3. Ambil riwayat pengembalian
    const resKembali = await axios.get('/jurusan/siswa-kembali');
    if (resKembali.data.success) {
      pengembalianList.value = resKembali.data.data;
      stats.value.totalDikembalikan = pengembalianList.value.length;
    }
  } catch (error) {
    console.error('Gagal memuat data Jurusan:', error);
  } finally {
    loading.value = false;
  }
};

// --- Registrasi Siswa Baru ---
const handleAddSiswa = async () => {
  errors.value = {};
  try {
    const response = await axios.post('/jurusan/siswa', formSiswa.value);
    if (response.data.success) {
      alert('Siswa berhasil didaftarkan!');
      showAddModal.value = false;
      formSiswa.value = { nama_user: '', username: '', email: '', password: '' };
      fetchData();
    }
  } catch (error) {
    if (error.response && error.response.status === 422) {
      errors.value = error.response.data.errors || {};
    } else {
      alert('Gagal menambahkan siswa.');
    }
  }
};

// --- Hapus Akun Siswa ---
const handleDeleteSiswa = async (id, nama) => {
  if (confirm(`Apakah Anda yakin ingin menghapus akun siswa "${nama}" secara permanen?`)) {
    try {
      const response = await axios.delete(`/jurusan/siswa/${id}`);
      if (response.data.success) {
        alert(response.data.message || 'Siswa berhasil dihapus.');
        fetchData();
      }
    } catch (error) {
      alert('Gagal menghapus siswa.');
    }
  }
};

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

// --- Bersihkan Riwayat Peminjaman/Pengembalian ---
const clearRiwayat = async () => {
  if (confirm('Apakah Anda yakin ingin menghapus semua riwayat transaksi logistik siswa untuk program keahlian Anda?')) {
    try {
      const response = await axios.delete('/jurusan/bersihkan-riwayat');
      if (response.data.success) {
        alert(response.data.message);
        fetchData();
      }
    } catch (error) {
      alert('Gagal membersihkan riwayat transaksi jurusan.');
    }
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
    const response = await axios.get('/profile');
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
    const response = await axios.put('/profile', formProfile.value);
    if (response.data.success) {
      alert('Profil berhasil diperbarui!');
      namaUser.value = response.data.data.nama_user;
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

onMounted(() => {
  const token = localStorage.getItem('auth_token');
  const role = localStorage.getItem('user_role');

  if (!token || role !== 'jurusan') {
    alert('Akses ditolak! Anda harus login sebagai Jurusan.');
    router.push('/');
    return;
  }

  fetchData();
});
</script>

<template>
  <div class="min-h-screen bg-slate-950 font-sans flex text-slate-100">
    
    <!-- Sidebar -->
    <aside 
      :class="[
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        'fixed md:sticky top-0 left-0 z-50 w-72 h-screen bg-slate-900 text-slate-300 flex flex-col justify-between p-6 transition-transform duration-300 ease-in-out border-r border-slate-800'
      ]"
    >
      <div>
        <div class="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-purple-600 rounded-xl text-white">
              <BookOpen class="w-6 h-6" />
            </div>
            <div>
              <h1 class="text-lg font-bold text-white tracking-wide leading-none">JURUSAN</h1>
              <span class="text-xs text-purple-400 font-medium">Department Portal</span>
            </div>
          </div>
          <button @click="isMobileMenuOpen = false" class="md:hidden text-slate-400 hover:text-white transition-colors">
            <X class="w-6 h-6" />
          </button>
        </div>

        <nav class="space-y-1.5">
          <button 
            @click="activeTab = 'overview'"
            :class="[activeTab === 'overview' ? 'bg-purple-600 text-white font-semibold' : 'hover:bg-slate-800 hover:text-white']"
            class="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all"
          >
            <LayoutDashboard class="w-5 h-5" /> Ringkasan
          </button>

          <button 
            @click="activeTab = 'siswa'"
            :class="[activeTab === 'siswa' ? 'bg-purple-600 text-white font-semibold' : 'hover:bg-slate-800 hover:text-white']"
            class="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all"
          >
            <Users class="w-5 h-5" /> Daftar Siswa
          </button>

          <button 
            @click="activeTab = 'peminjaman'"
            :class="[activeTab === 'peminjaman' ? 'bg-purple-600 text-white font-semibold' : 'hover:bg-slate-800 hover:text-white']"
            class="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all"
          >
            <ClipboardList class="w-5 h-5" /> Peminjaman Aktif
          </button>

          <button 
            @click="activeTab = 'riwayat'"
            :class="[activeTab === 'riwayat' ? 'bg-purple-600 text-white font-semibold' : 'hover:bg-slate-800 hover:text-white']"
            class="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all"
          >
            <CheckCircle2 class="w-5 h-5" /> Riwayat Kembali
          </button>


        </nav>
      </div>

      <div class="pt-4 border-t border-slate-800">
        <button 
          @click="handleLogout"
          class="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-medium transition-all"
        >
          <LogOut class="w-5 h-5" /> Keluar Sesi
        </button>
      </div>
    </aside>

    <div 
      v-if="isMobileMenuOpen" 
      @click="isMobileMenuOpen = false" 
      class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
    ></div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 font-sans">
      
      <!-- Header -->
      <header class="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-4">
          <button 
            @click="isMobileMenuOpen = !isMobileMenuOpen" 
            class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 md:hidden transition-colors"
          >
            <Menu class="w-6 h-6" />
          </button>
          
          <div>
            <h2 class="text-lg font-bold text-white font-sans">Dashboard Program Keahlian</h2>
            <p class="text-xs text-slate-400 hidden sm:block">Kelola data siswa dan riwayat logistik lab jurusan secara modular.</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <button @click="fetchData" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all">
            <RefreshCw :class="{'animate-spin': loading}" class="w-5 h-5" />
          </button>
          <div @click="openProfileModal" class="flex items-center gap-2.5 pl-3 border-l border-slate-800 font-sans cursor-pointer hover:opacity-85 transition-all">
            <div class="w-9 h-9 rounded-xl bg-purple-900/40 border border-purple-800 text-purple-400 flex items-center justify-center font-bold text-sm">
              {{ namaUser.charAt(0) }}
            </div>
            <div class="hidden md:block leading-none">
              <p class="text-sm font-semibold text-white">{{ namaUser }}</p>
              <span class="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Operator Program</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Section -->
      <main class="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        
        <!-- Tab Overview -->
        <div v-if="activeTab === 'overview'" class="space-y-6">
          <div class="p-6 rounded-3xl bg-gradient-to-r from-purple-900/60 to-indigo-950/60 border border-purple-500/20 text-white shadow-xl relative overflow-hidden">
            <div class="relative z-10 max-w-lg">
              <h3 class="text-2xl font-bold mb-1">Halo, {{ namaUser }}! 👋</h3>
              <p class="text-slate-300 text-sm leading-relaxed leading-6">Selamat datang di panel kendali program keahlian Anda. Di sini Anda dapat memantau status peminjaman alat, mengajukan pengadaan logistik baru, serta mengelola akun siswa dengan mudah.</p>
            </div>
            <BookOpen class="absolute -right-6 -bottom-6 w-44 h-44 text-white/5 pointer-events-none transform -rotate-12" />
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between hover:border-purple-500/30 transition-all">
              <div>
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Siswa Terdaftar</span>
                <h4 class="text-2xl font-bold text-white mt-1">{{ stats.totalSiswa }} <span class="text-xs text-slate-500 font-normal">Siswa</span></h4>
              </div>
              <div class="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20"><Users class="w-6 h-6" /></div>
            </div>

            <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between hover:border-amber-500/30 transition-all">
              <div>
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alat Sedang Dipinjam</span>
                <h4 class="text-2xl font-bold text-white mt-1">{{ stats.totalDipinjam }} <span class="text-xs text-slate-500 font-normal">Alat</span></h4>
              </div>
              <div class="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20"><ClipboardList class="w-6 h-6" /></div>
            </div>

            <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between hover:border-emerald-500/30 transition-all">
              <div>
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kembali Sukses</span>
                <h4 class="text-2xl font-bold text-white mt-1">{{ stats.totalDikembalikan }} <span class="text-xs text-slate-500 font-normal">Kali</span></h4>
              </div>
              <div class="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20"><CheckCircle2 class="w-6 h-6" /></div>
            </div>
          </div>

          <!-- Shortcuts -->
          <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
            <h4 class="text-sm font-bold text-white mb-4">Navigasi Pengelolaan</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button @click="activeTab = 'siswa'" class="p-4 border border-slate-850 rounded-xl text-left bg-slate-950/45 hover:border-purple-500 hover:bg-purple-500/5 group transition-all">
                <h5 class="font-bold text-slate-200 text-sm group-hover:text-purple-400">Registrasi Akun Siswa &rarr;</h5>
                <p class="text-[11px] text-slate-400 mt-1 leading-5">Buat, monitoring, atau nonaktifkan akun akses siswa lab jurusan Anda.</p>
              </button>
              <button @click="activeTab = 'peminjaman'" class="p-4 border border-slate-850 rounded-xl text-left bg-slate-950/45 hover:border-purple-500 hover:bg-purple-500/5 group transition-all">
                <h5 class="font-bold text-slate-200 text-sm group-hover:text-purple-400">Monitoring Peminjaman &rarr;</h5>
                <p class="text-[11px] text-slate-400 mt-1 leading-5">Lihat detail barang yang sedang dibawa oleh siswa saat ini.</p>
              </button>
            </div>
          </div>
        </div>

        <!-- Tab Daftar Siswa -->
        <div v-else-if="activeTab === 'siswa'" class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div>
              <h3 class="text-lg font-bold text-white">Daftar Akun Siswa</h3>
              <p class="text-xs text-slate-400">Kelola kredensial akun siswa yang dapat meminjam alat/barang.</p>
            </div>
            <button @click="showAddModal = true" class="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all shadow-md">
              <UserPlus class="w-4 h-4" />
              Daftarkan Siswa Baru
            </button>
          </div>

          <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
            <div class="flex items-center gap-3 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 mb-4 max-w-md">
              <Search class="w-4 h-4 text-slate-500" />
              <input v-model="searchSiswa" type="text" placeholder="Cari nama atau username siswa..." class="bg-transparent outline-none text-xs w-full text-slate-200" />
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr class="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-850">
                    <th class="px-4 py-3 rounded-l-xl">Nama Lengkap</th>
                    <th class="px-4 py-3">Username & Email</th>
                    <th class="px-4 py-3 text-center">Status</th>
                    <th class="px-4 py-3 text-center rounded-r-xl w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-850">
                  <tr v-if="siswaList.length === 0" class="text-center">
                    <td colspan="4" class="py-8 text-slate-500 italic">Belum ada siswa terdaftar.</td>
                  </tr>
                  <tr v-for="siswa in siswaList" :key="siswa.id" class="hover:bg-slate-850/30 transition-colors">
                    <td class="px-4 py-3.5 font-semibold text-white">{{ siswa.nama_user }}</td>
                    <td class="px-4 py-3.5 leading-normal">
                      <span class="block font-medium text-slate-300 text-[10px] bg-slate-800 w-fit px-2 py-0.5 rounded-md mb-1">@{{ siswa.username }}</span>
                      <span class="text-[10px] text-slate-400">{{ siswa.email }}</span>
                    </td>
                    <td class="px-4 py-3.5 text-center">
                      <span :class="siswa.status === 'aktif' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'" 
                            class="px-2.5 py-1 text-[10px] border font-semibold rounded-full capitalize">
                        {{ siswa.status }}
                      </span>
                    </td>
                    <td class="px-4 py-3.5 text-center">
                      <button @click="handleDeleteSiswa(siswa.id, siswa.nama_user)" class="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all" title="Hapus Akun">
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab Peminjaman Aktif -->
        <div v-else-if="activeTab === 'peminjaman'" class="space-y-6">
          <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
            <h3 class="text-base font-bold text-white mb-1">Daftar Peminjaman Alat Aktif</h3>
            <p class="text-xs text-slate-400 mb-4">Berikut data alat lab yang sedang berada di tangan siswa saat ini.</p>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr class="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-850">
                    <th class="px-4 py-3 rounded-l-xl">Nama Siswa</th>
                    <th class="px-4 py-3">Nama & Kode Alat</th>
                    <th class="px-4 py-3">Tanggal Pinjam</th>
                    <th class="px-4 py-3 text-center rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-850">
                  <tr v-if="peminjamanList.length === 0" class="text-center">
                    <td colspan="4" class="py-8 text-slate-500 italic">Tidak ada transaksi peminjaman aktif.</td>
                  </tr>
                  <tr v-for="p in peminjamanList" :key="p.id" class="hover:bg-slate-850/30 transition-colors">
                    <td class="px-4 py-3.5 font-semibold text-white">{{ p.nama_siswa }}</td>
                    <td class="px-4 py-3.5">
                      <span class="block font-medium text-slate-200">{{ p.nama_alat }}</span>
                      <span class="text-[10px] font-semibold text-purple-400 uppercase">Code: {{ p.kode_alat }}</span>
                    </td>
                    <td class="px-4 py-3.5 text-slate-400">{{ p.created_at.split('T')[0] }}</td>
                    <td class="px-4 py-3.5 text-center">
                      <span class="px-2.5 py-1 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold rounded-full capitalize">
                        {{ p.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab Riwayat Kembali -->
        <div v-else-if="activeTab === 'riwayat'" class="space-y-6">
          <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-base font-bold text-white mb-1">Riwayat Pengembalian</h3>
                <p class="text-xs text-slate-400">Log pengembalian logistik yang telah berhasil diaudit & dikembalikan.</p>
              </div>
              <button v-if="pengembalianList.length > 0 || peminjamanList.length > 0" @click="clearRiwayat" class="text-xs text-rose-450 hover:text-rose-500 font-semibold transition-all">
                Bersihkan Riwayat
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr class="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-850">
                    <th class="px-4 py-3 rounded-l-xl">Nama Siswa</th>
                    <th class="px-4 py-3">Alat & Kode</th>
                    <th class="px-4 py-3">Catatan Kondisi</th>
                    <th class="px-4 py-3 text-center rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-850">
                  <tr v-if="pengembalianList.length === 0" class="text-center">
                    <td colspan="4" class="py-8 text-slate-500 italic">Belum ada riwayat pengembalian.</td>
                  </tr>
                  <tr v-for="r in pengembalianList" :key="r.id" class="hover:bg-slate-850/30 transition-colors">
                    <td class="px-4 py-3.5 font-semibold text-white">{{ r.nama_siswa }}</td>
                    <td class="px-4 py-3.5">
                      <span class="block font-medium text-slate-200">{{ r.nama_alat }}</span>
                      <span class="text-[10px] font-semibold text-slate-400 uppercase">Code: {{ r.kode_alat }}</span>
                    </td>
                    <td class="px-4 py-3.5">
                      <span class="block text-slate-300">{{ r.keterangan_kondisi || 'Tidak ada catatan' }}</span>
                      <span class="text-[10px] text-slate-500">Updated: {{ r.updated_at.split('T')[0] }}</span>
                    </td>
                    <td class="px-4 py-3.5 text-center">
                      <span class="px-2.5 py-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold rounded-full capitalize">
                        Selesai
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Halaman Katalog dan Pengajuan Dihapus -->

      </main>
    </div>

    <!-- Modal Form Tambah Siswa -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <div class="flex items-center justify-between p-5 border-b border-slate-800">
          <h4 class="font-bold text-white text-sm">Daftarkan Akun Siswa Baru</h4>
          <button @click="showAddModal = false" class="p-1 text-slate-400 hover:text-white rounded-lg"><X class="w-5 h-5" /></button>
        </div>

        <form @submit.prevent="handleAddSiswa" class="p-5 space-y-4">
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Lengkap</label>
            <input v-model="formSiswa.nama_user" type="text" placeholder="Contoh: Budi Santoso" required
                   class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-purple-500 focus:bg-slate-900 transition-all" />
            <p v-if="errors.nama_user" class="text-[10px] text-rose-400 italic mt-1">{{ errors.nama_user[0] }}</p>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Username</label>
            <input v-model="formSiswa.username" type="text" placeholder="Contoh: budi_santoso" required
                   class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-purple-500 focus:bg-slate-900 transition-all" />
            <p v-if="errors.username" class="text-[10px] text-rose-400 italic mt-1">{{ errors.username[0] }}</p>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
            <input v-model="formSiswa.email" type="email" placeholder="Contoh: budi@sekolah.sch.id" required
                   class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-purple-500 focus:bg-slate-900 transition-all" />
            <p v-if="errors.email" class="text-[10px] text-rose-400 italic mt-1">{{ errors.email[0] }}</p>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sandi Akses (Min. 6 Karakter)</label>
            <input v-model="formSiswa.password" type="password" placeholder="******" required
                   class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-purple-500 focus:bg-slate-900 transition-all" />
            <p v-if="errors.password" class="text-[10px] text-rose-400 italic mt-1">{{ errors.password[0] }}</p>
          </div>

          <button type="submit" class="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all mt-2">
            Simpan Registrasi Siswa
          </button>
        </form>
      </div>
    </div>

    <!-- Modal Edit Profil -->
    <div v-if="showProfileModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <div class="flex items-center justify-between p-5 border-b border-slate-800">
          <h4 class="font-bold text-white text-sm">Edit Profil Saya</h4>
          <button @click="showProfileModal = false" class="p-1 text-slate-400 hover:text-white rounded-lg"><X class="w-5 h-5" /></button>
        </div>

        <form @submit.prevent="handleUpdateProfile" class="p-5 space-y-4 text-xs">
          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Lengkap</label>
            <input v-model="formProfile.nama_user" type="text" required
                   class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500 focus:bg-slate-900 transition-all" />
            <p v-if="profileErrors.nama_user" class="text-[10px] text-rose-450 italic mt-1">{{ profileErrors.nama_user[0] }}</p>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Username</label>
            <input v-model="formProfile.username" type="text" required
                   class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500 focus:bg-slate-900 transition-all" />
            <p v-if="profileErrors.username" class="text-[10px] text-rose-450 italic mt-1">{{ profileErrors.username[0] }}</p>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
            <input v-model="formProfile.email" type="email" required
                   class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500 focus:bg-slate-900 transition-all" />
            <p v-if="profileErrors.email" class="text-[10px] text-rose-450 italic mt-1">{{ profileErrors.email[0] }}</p>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password Baru (Kosongkan jika tidak ingin diubah)</label>
            <input v-model="formProfile.password" type="password" placeholder="******"
                   class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500 focus:bg-slate-900 transition-all" />
            <p v-if="profileErrors.password" class="text-[10px] text-rose-450 italic mt-1">{{ profileErrors.password[0] }}</p>
          </div>

          <button type="submit" :disabled="loadingProfile" class="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md transition-all">
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
  transition-duration: 200ms;
}
</style>