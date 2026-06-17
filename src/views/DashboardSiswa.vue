<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue';
import { Html5Qrcode } from 'html5-qrcode';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { 
  LayoutDashboard, 
  History, 
  PlusCircle, 
  CheckCircle2, 
  LogOut, 
  Menu, 
  X, 
  RefreshCw,
  QrCode,
  ArrowRightLeft,
  GraduationCap
} from 'lucide-vue-next';

const router = useRouter();

// --- State Navigasi & Tampilan ---
const activeTab = ref('overview'); // overview, pinjam, riwayat
const isMobileMenuOpen = ref(false);
const namaUser = ref(localStorage.getItem('user_nama') || 'Siswa');

// --- State Data ---
const barangList = ref([]);
const riwayatList = ref([]);
const stats = ref({
  totalDipinjam: 0,
  totalDikembalian: 0
});
const loading = ref(false);

// --- Form State Peminjaman ---
const formPinjam = ref({
  barang_id: '',
  jumlah_pinjam: 1,
  kode_barang_qr: '' // Untuk simulasi scan QR
});
const isQrMode = ref(false);
const loadingSubmit = ref(false);

// --- State Modal Pengembalian ---
const showReturnModal = ref(false);
const selectedPeminjaman = ref(null);
const formKembali = ref({
  kondisi_kembali: 'baik',
  keterangan_kondisi: ''
});

// --- Fetch Data ---
const fetchData = async () => {
  loading.value = true;
  try {
    // 1. Ambil daftar barang yang tersedia untuk dipinjam
    const resBarang = await axios.get('/barang');
    if (resBarang.data.success) {
      barangList.value = resBarang.data.data;
    }

    // 2. Ambil riwayat peminjaman siswa
    const resRiwayat = await axios.get('/peminjaman/riwayat');
    if (resRiwayat.data.success) {
      riwayatList.value = resRiwayat.data.data;
      
      // Hitung statistik
      stats.value.totalDipinjam = riwayatList.value.filter(r => r.status === 'dipinjam').length;
      stats.value.totalDikembalian = riwayatList.value.filter(r => r.status === 'dikembalikan').length;
    }
  } catch (error) {
    console.error('Gagal memuat data siswa:', error);
  } finally {
    loading.value = false;
  }
};

// --- Submit Peminjaman ---
const handlePeminjaman = async () => {
  loadingSubmit.value = true;
  try {
    let response;
    if (isQrMode.value) {
      // Simulasikan scan QR via kode unik
      response = await axios.post('/peminjaman/scan', {
        kode_barang: formPinjam.value.kode_barang_qr,
        jumlah_pinjam: formPinjam.value.jumlah_pinjam
      });
    } else {
      // Manual select option
      response = await axios.post('/peminjaman', {
        barang_id: formPinjam.value.barang_id,
        jumlah_pinjam: formPinjam.value.jumlah_pinjam
      });
    }

    if (response.data.success) {
      alert(response.data.message || 'Peminjaman berhasil diajukan!');
      // Reset form
      formPinjam.value = { barang_id: '', jumlah_pinjam: 1, kode_barang_qr: '' };
      activeTab.value = 'overview';
      fetchData();
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Gagal memproses peminjaman. Stok mungkin habis.';
    alert(errorMsg);
  } finally {
    loadingSubmit.value = false;
  }
};

// --- Buka Modal Pengembalian ---
const openReturnModal = (peminjaman) => {
  selectedPeminjaman.value = peminjaman;
  formKembali.value = { kondisi_kembali: 'baik', keterangan_kondisi: '' };
  showReturnModal.value = true;
};

// --- Submit Pengembalian ---
const handlePengembalian = async () => {
  if (!selectedPeminjaman.value) return;
  loadingSubmit.value = true;
  try {
    const response = await axios.post('/pengembalian', {
      peminjaman_id: selectedPeminjaman.value.id,
      kondisi_kembali: formKembali.value.kondisi_kembali,
      keterangan_kondisi: formKembali.value.keterangan_kondisi
    });

    if (response.data.success) {
      alert('Pengembalian terkonfirmasi! Terima kasih.');
      showReturnModal.value = false;
      selectedPeminjaman.value = null;
      fetchData();
    }
  } catch (error) {
    alert(error.response?.data?.message || 'Gagal memproses pengembalian.');
  } finally {
    loadingSubmit.value = false;
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

// --- State & Logika Kamera Scanner QR ---
const cameraLoading = ref(false);
const cameraError = ref(false);
let html5QrCode = null;

const startScanner = async () => {
  cameraLoading.value = true;
  cameraError.value = false;
  
  // Berikan jeda 100ms agar rendering elemen DOM selesai sepenuhnya
  setTimeout(async () => {
    try {
      if (html5QrCode && html5QrCode.isScanning) {
        await html5QrCode.stop();
      }
      
      html5QrCode = new Html5Qrcode("qr-reader");
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          }
        },
        (decodedText) => {
          formPinjam.value.kode_barang_qr = decodedText;
        },
        (errorMessage) => {
          // Abaikan kesalahan pembacaan frame biasa
        }
      );
      cameraLoading.value = false;
    } catch (err) {
      console.error("Scanner error:", err);
      cameraError.value = true;
      cameraLoading.value = false;
    }
  }, 100);
};

const stopScanner = async () => {
  if (html5QrCode && html5QrCode.isScanning) {
    try {
      await html5QrCode.stop();
    } catch (err) {
      console.error("Gagal menghentikan kamera:", err);
    }
  }
};

watch(isQrMode, async (newVal) => {
  if (newVal) {
    await nextTick();
    startScanner();
  } else {
    stopScanner();
  }
});

onUnmounted(() => {
  stopScanner();
});

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

  if (!token || role !== 'siswa') {
    alert('Akses ditolak! Anda harus login sebagai Siswa.');
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
            <div class="p-2 bg-indigo-600 rounded-xl text-white">
              <GraduationCap class="w-6 h-6" />
            </div>
            <div>
              <h1 class="text-lg font-bold text-white tracking-wide leading-none">SISWA</h1>
              <span class="text-xs text-indigo-400 font-medium">Student Portal</span>
            </div>
          </div>
          <button @click="isMobileMenuOpen = false" class="md:hidden text-slate-400 hover:text-white transition-colors">
            <X class="w-6 h-6" />
          </button>
        </div>

        <nav class="space-y-1.5">
          <button 
            @click="activeTab = 'overview'"
            :class="[activeTab === 'overview' ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-800 hover:text-white']"
            class="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all"
          >
            <LayoutDashboard class="w-5 h-5" /> Menu Utama
          </button>

          <button 
            @click="activeTab = 'pinjam'"
            :class="[activeTab === 'pinjam' ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-800 hover:text-white']"
            class="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all"
          >
            <PlusCircle class="w-5 h-5" /> Ajukan Pinjam Alat
          </button>

          <button 
            @click="activeTab = 'riwayat'"
            :class="[activeTab === 'riwayat' ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-slate-800 hover:text-white']"
            class="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all"
          >
            <History class="w-5 h-5" /> Riwayat Transaksi
          </button>
        </nav>
      </div>

      <div class="pt-4 border-t border-slate-800">
        <button 
          @click="handleLogout"
          class="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-medium transition-all"
        >
          <LogOut class="w-5 h-5" /> Keluar Akun
        </button>
      </div>
    </aside>

    <div 
      v-if="isMobileMenuOpen" 
      @click="isMobileMenuOpen = false" 
      class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
    ></div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
      
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
            <h2 class="text-lg font-bold text-white">Portal Siswa</h2>
            <p class="text-xs text-slate-400 hidden sm:block">Akses cepat peminjaman dan pengembalian inventaris lab sekolah.</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <button @click="fetchData" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all">
            <RefreshCw :class="{'animate-spin': loading}" class="w-5 h-5" />
          </button>
          <div @click="openProfileModal" class="flex items-center gap-2.5 pl-3 border-l border-slate-800 cursor-pointer hover:opacity-85 transition-all">
            <div class="w-9 h-9 rounded-xl bg-indigo-900/40 border border-indigo-850 text-indigo-400 flex items-center justify-center font-bold text-sm">
              S
            </div>
            <div class="hidden md:block leading-none">
              <p class="text-sm font-semibold text-white">{{ namaUser }}</p>
              <span class="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Siswa Aktif</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Section -->
      <main class="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        
        <!-- Tab Overview -->
        <div v-if="activeTab === 'overview'" class="space-y-6">
          <div class="p-6 rounded-3xl bg-gradient-to-r from-indigo-900/60 to-slate-900/60 border border-indigo-500/20 text-white shadow-xl relative overflow-hidden">
            <div class="relative z-10 max-w-lg">
              <h3 class="text-2xl font-bold mb-1">Halo, {{ namaUser }}! 🎓</h3>
              <p class="text-slate-300 text-sm leading-relaxed">Selamat datang di panel siswa. Di sini kamu bisa meminjam alat lab dengan cepat baik menggunakan formulir digital maupun pemindai QR Code.</p>
            </div>
            <GraduationCap class="absolute -right-6 -bottom-6 w-44 h-44 text-white/5 pointer-events-none transform -rotate-12" />
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between hover:border-indigo-500/30 transition-all">
              <div>
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alat Sedang Dipinjam</span>
                <h4 class="text-2xl font-bold text-white mt-1">{{ stats.totalDipinjam }} <span class="text-xs text-slate-500 font-normal">Unit</span></h4>
              </div>
              <div class="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20"><ArrowRightLeft class="w-6 h-6" /></div>
            </div>

            <div class="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between hover:border-emerald-500/30 transition-all">
              <div>
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Selesai Dikembalikan</span>
                <h4 class="text-2xl font-bold text-white mt-1">{{ stats.totalDikembalian }} <span class="text-xs text-slate-500 font-normal">Kali</span></h4>
              </div>
              <div class="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20"><CheckCircle2 class="w-6 h-6" /></div>
            </div>
          </div>

          <!-- Active Borrowing Section -->
          <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
            <h4 class="text-sm font-bold text-white mb-4">Peminjaman Aktif Saat Ini</h4>
            
            <div class="overflow-x-auto text-xs">
              <table class="w-full text-left text-slate-300">
                <thead>
                  <tr class="bg-slate-950 font-bold border-b border-slate-850 text-slate-400 uppercase">
                    <th class="p-3 rounded-l-xl">Nama Barang</th>
                    <th class="p-3">Jumlah Pinjam</th>
                    <th class="p-3">Tanggal Pinjam</th>
                    <th class="p-3 text-center rounded-r-xl w-32">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="riwayatList.filter(r => r.status === 'dipinjam').length === 0" class="text-center">
                    <td colspan="4" class="py-8 text-slate-500 italic">Kamu tidak memiliki pinjaman aktif.</td>
                  </tr>
                  <tr v-for="r in riwayatList.filter(r => r.status === 'dipinjam')" :key="r.id" class="border-b border-slate-850/60 hover:bg-slate-850/20 transition-colors">
                    <td class="p-3 font-semibold text-white">
                      {{ r.barang?.nama_barang || 'Aset Sekolah' }}
                      <span class="block text-[10px] text-indigo-400 font-normal font-mono">{{ r.barang?.kode_barang }}</span>
                    </td>
                    <td class="p-3 text-slate-300 font-bold">{{ r.jumlah_pinjam }} Unit</td>
                    <td class="p-3 text-slate-400">{{ r.tanggal_pinjam }}</td>
                    <td class="p-3 text-center">
                      <button @click="openReturnModal(r)" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-md">
                        Kembalikan
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab Ajukan Peminjaman -->
        <div v-else-if="activeTab === 'pinjam'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm h-fit">
            <div class="flex items-center justify-between pb-3 border-b border-slate-850 mb-4">
              <h4 class="font-bold text-white text-sm">Form Peminjaman</h4>
              <button @click="isQrMode = !isQrMode" class="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <QrCode class="w-3.5 h-3.5" />
                {{ isQrMode ? 'Ganti Mode Manual' : 'Simulasi Scan QR' }}
              </button>
            </div>

            <form @submit.prevent="handlePeminjaman" class="space-y-4 text-xs">
              <div v-if="isQrMode" class="space-y-4">
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Simulasi Scan Kamera QR</label>
                <div class="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-2">
                  <!-- Div bersih tanpa anak bertipe Vue untuk diatur oleh library html5-qrcode -->
                  <div id="qr-reader" class="w-full overflow-hidden rounded-lg bg-slate-900 aspect-video min-h-[150px]"></div>
                  
                  <!-- Overlay status rendering/kamera error -->
                  <div v-if="cameraLoading || cameraError" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-4 text-center">
                    <div v-if="cameraLoading && !cameraError" class="text-slate-400 text-[10px] flex flex-col items-center gap-2">
                      <RefreshCw class="w-6 h-6 animate-spin text-indigo-500" />
                      Mengaktifkan kamera...
                    </div>
                    <div v-if="cameraError" class="text-rose-450 text-[10px] flex flex-col items-center gap-1.5">
                      <X class="w-6 h-6 text-rose-500" />
                      <span class="font-bold text-slate-200">Kamera gagal diaktifkan.</span>
                      <span class="text-slate-400">Silakan isi kode QR secara manual di bawah ini.</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Atau Isi Kode QR secara Manual</label>
                  <div class="relative">
                    <QrCode class="absolute left-3 top-3 w-4 h-4 text-slate-555" />
                    <input v-model="formPinjam.kode_barang_qr" type="text" placeholder="Masukkan kode barang (Contoh: BRG-001)" required
                           class="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all" />
                  </div>
                </div>
              </div>

              <div v-else>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Pilih Aset Barang</label>
                <select v-model="formPinjam.barang_id" required
                        class="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all">
                  <option value="" disabled>-- Pilih Item Aset --</option>
                  <option v-for="b in barangList" :key="b.id" :value="b.id">
                    {{ b.nama_barang }} (Tersedia: {{ b.jumlah }} {{ b.kategori }})
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Jumlah Pinjam</label>
                <input v-model="formPinjam.jumlah_pinjam" type="number" min="1" placeholder="1" required
                       class="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all" />
              </div>

              <button type="submit" :disabled="loadingSubmit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all">
                {{ loadingSubmit ? 'Memproses...' : 'Konfirmasi Peminjaman' }}
              </button>
            </form>
          </div>

          <div class="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
            <h4 class="font-bold text-white text-sm mb-4">Aset Tersedia di Lab</h4>
            <div class="overflow-x-auto text-xs">
              <table class="w-full text-left text-slate-300">
                <thead>
                  <tr class="bg-slate-950 font-bold border-b border-slate-850 text-slate-400 uppercase">
                    <th class="p-3 rounded-l-xl">Nama Barang</th>
                    <th class="p-3">Kategori</th>
                    <th class="p-3">Kondisi</th>
                    <th class="p-3 text-center rounded-r-xl w-24">Stok</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="b in barangList" :key="b.id" class="border-b border-slate-850/60 hover:bg-slate-850/20 transition-colors">
                    <td class="p-3 font-semibold text-white">
                      {{ b.nama_barang }}
                      <span class="block text-[10px] text-slate-500 font-mono">{{ b.kode_barang }}</span>
                    </td>
                    <td class="p-3 text-slate-400">{{ b.kategori }}</td>
                    <td class="p-3 capitalize">
                      <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold text-[10px]">
                        {{ b.kondisi || 'Baik' }}
                      </span>
                    </td>
                    <td class="p-3 text-center font-bold text-indigo-400">{{ b.jumlah }} Unit</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab Riwayat Transaksi -->
        <div v-else-if="activeTab === 'riwayat'" class="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
          <h4 class="font-bold text-white text-sm mb-4">Log Seluruh Transaksi Peminjaman Kamu</h4>
          <div class="overflow-x-auto text-xs">
            <table class="w-full text-left text-slate-300">
              <thead>
                <tr class="bg-slate-950 font-bold border-b border-slate-850 text-slate-400 uppercase">
                  <th class="p-3 rounded-l-xl">Nama Barang</th>
                  <th class="p-3">Jumlah</th>
                  <th class="p-3">Pinjam / Kembali</th>
                  <th class="p-3 text-center rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="riwayatList.length === 0" class="text-center">
                  <td colspan="4" class="py-8 text-slate-500 italic">Kamu belum pernah meminjam barang.</td>
                </tr>
                <tr v-for="r in riwayatList" :key="r.id" class="border-b border-slate-850/60 hover:bg-slate-850/20 transition-colors">
                  <td class="p-3 font-semibold text-white">
                    {{ r.barang?.nama_barang || 'Aset Lab' }}
                    <span class="block text-[10px] text-slate-500 font-mono">{{ r.barang?.kode_barang }}</span>
                  </td>
                  <td class="p-3 text-slate-300 font-bold">{{ r.jumlah_pinjam }} Unit</td>
                  <td class="p-3 leading-normal">
                    <span class="block text-slate-300">Pinjam: {{ r.tanggal_pinjam }}</span>
                    <span class="block text-slate-400 text-[10px]">Kembali: {{ r.tanggal_kembali || '-' }}</span>
                  </td>
                  <td class="p-3 text-center">
                    <span :class="r.status === 'dipinjam' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'"
                          class="px-2.5 py-1 text-[10px] font-semibold border rounded-full capitalize">
                      {{ r.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>

    <!-- Modal Form Konfirmasi Pengembalian -->
    <div v-if="showReturnModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <div class="flex items-center justify-between p-5 border-b border-slate-800">
          <h4 class="font-bold text-white text-sm">Form Pengembalian Aset</h4>
          <button @click="showReturnModal = false" class="p-1 text-slate-400 hover:text-white rounded-lg"><X class="w-5 h-5" /></button>
        </div>

        <form @submit.prevent="handlePengembalian" class="p-5 space-y-4 text-xs">
          <div>
            <p class="text-slate-300 mb-2">Mengembalikan barang: <span class="font-bold text-white">{{ selectedPeminjaman?.barang?.nama_barang }}</span></p>
            <p class="text-slate-400 text-[10px]">Jumlah Pinjam: {{ selectedPeminjaman?.jumlah_pinjam }} Unit</p>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Kondisi Fisik Barang</label>
            <select v-model="formKembali.kondisi_kembali" required
                    class="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all">
              <option value="baik">Sangat Baik / Utuh</option>
              <option value="rusak">Rusak Sebagian</option>
              <option value="hilang">Hilang / Tidak Ditemukan</option>
            </select>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Catatan/Keterangan Tambahan</label>
            <textarea v-model="formKembali.keterangan_kondisi" rows="3" placeholder="Masukkan alasan jika barang rusak/hilang..." required
                      class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all"></textarea>
          </div>

          <button type="submit" :disabled="loadingSubmit" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all">
            {{ loadingSubmit ? 'Mengirim Data...' : 'Konfirmasi Pengembalian' }}
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
                   class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all" />
            <p v-if="profileErrors.nama_user" class="text-[10px] text-rose-400 italic mt-1">{{ profileErrors.nama_user[0] }}</p>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Username</label>
            <input v-model="formProfile.username" type="text" required
                   class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all" />
            <p v-if="profileErrors.username" class="text-[10px] text-rose-400 italic mt-1">{{ profileErrors.username[0] }}</p>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
            <input v-model="formProfile.email" type="email" required
                   class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all" />
            <p v-if="profileErrors.email" class="text-[10px] text-rose-400 italic mt-1">{{ profileErrors.email[0] }}</p>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password Baru (Kosongkan jika tidak ingin diubah)</label>
            <input v-model="formProfile.password" type="password" placeholder="******"
                   class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 focus:bg-slate-900 transition-all" />
            <p v-if="profileErrors.password" class="text-[10px] text-rose-400 italic mt-1">{{ profileErrors.password[0] }}</p>
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
  transition-duration: 200ms;
}
</style>