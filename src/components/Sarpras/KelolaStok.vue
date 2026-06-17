<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { Boxes, ArrowDownLeft, ArrowUpRight, Plus, Calendar, User, FileText } from 'lucide-vue-next';

// --- State Navigasi Sub-Tab ---
const activeTab = ref('masuk'); // 'masuk' atau 'distribusi'

// --- State Data ---
const barangList = ref([]); // Mengambil master barang dari API
const riwayatMasuk = ref([]);
const riwayatDistribusi = ref([]);
const jurusanAccounts = ref([]);
const loadingSubmit = ref(false);

// --- Form State Stok Masuk ---
const formMasuk = ref({
  barang_id: '',
  jumlah: '',
  sumber_dana: 'BOS', // Contoh opsional
  tanggal_masuk: new Date().toISOString().split('T')[0]
});

// --- Form State Distribusi (Penyaluran ke Jurusan) ---
const formDistribusi = ref({
  barang_id: '',
  nama_jurusan: '', // Misal: TKJ, RPL, DKV, dll
  jumlah: '',
  penerima: '',
  tanggal_distribusi: new Date().toISOString().split('T')[0]
});

// --- Fungsi Ambil Data Master & Riwayat ---
const fetchData = async () => {
  try {
    const resBarang = await axios.get('/barang');
    if (resBarang.data.success) barangList.value = resBarang.data.data;

    const resMasuk = await axios.get('/stok-masuk');
    if (resMasuk.data.success) riwayatMasuk.value = resMasuk.data.data;

    const resDist = await axios.get('/stok-keluar');
    if (resDist.data.success) riwayatDistribusi.value = resDist.data.data;

    const resUsers = await axios.get('/user');
    if (resUsers.data.success) {
      jurusanAccounts.value = resUsers.data.data.filter(u => u.role === 'jurusan' && u.jurusan && u.status === 'aktif');
    }
  } catch (error) {
    console.error('Gagal mengambil data logistik:', error);
  }
};

// --- Submit Stok Masuk ---
const handleStokMasuk = async () => {
  if (!formMasuk.value.barang_id) return;
  loadingSubmit.value = true;
  try {
    const response = await axios.post(`/barang/${formMasuk.value.barang_id}/stok-masuk`, {
      jumlah_masuk: formMasuk.value.jumlah,
      keterangan: formMasuk.value.sumber_dana
    });
    if (response.data.success) {
      alert('Stok barang berhasil ditambahkan!');
      // Reset Form
      formMasuk.value.jumlah = '';
      fetchData(); // Refresh data/statistik
    }
  } catch (error) {
    alert(error.response?.data?.message || 'Gagal memproses stok masuk, periksa kembali inputan.');
  } finally {
    loadingSubmit.value = false;
  }
};

// --- Submit Distribusi Jurusan ---
const handleDistribusi = async () => {
  if (!formDistribusi.value.barang_id) return;
  loadingSubmit.value = true;
  try {
    const response = await axios.post(`/barang/${formDistribusi.value.barang_id}/stok-keluar`, {
      jumlah_keluar: formDistribusi.value.jumlah,
      jurusan: formDistribusi.value.nama_jurusan,
      penerima: formDistribusi.value.penerima,
      keterangan: `Penyaluran logistik lab`
    });
    if (response.data.success) {
      alert('Logistik berhasil disalurkan ke jurusan!');
      // Reset Form
      formDistribusi.value.jumlah = '';
      formDistribusi.value.penerima = '';
      fetchData();
    }
  } catch (error) {
    alert(error.response?.data?.message || 'Gagal mendistribusikan barang. Pastikan stok gudang mencukupi.');
  } finally {
    loadingSubmit.value = false;
  }
};

// --- Bersihkan Riwayat Pengadaan ---
const clearRiwayatMasuk = async () => {
  if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat pengadaan masuk?')) {
    try {
      const response = await axios.delete('/stok-masuk/bersihkan');
      if (response.data.success) {
        alert(response.data.message);
        fetchData();
      }
    } catch (error) {
      alert('Gagal membersihkan riwayat pengadaan.');
    }
  }
};

// --- Bersihkan Riwayat Penyaluran ---
const clearRiwayatKeluar = async () => {
  if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat penyaluran keluar?')) {
    try {
      const response = await axios.delete('/stok-keluar/bersihkan');
      if (response.data.success) {
        alert(response.data.message);
        fetchData();
      }
    } catch (error) {
      alert('Gagal membersihkan riwayat penyaluran.');
    }
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 class="text-lg font-bold text-slate-800">Manajemen Mutasi Skenario Logistik</h3>
        <p class="text-xs text-slate-400">Catat penambahan aset gudang pusat atau distribusikan logistik langsung ke unit lab keahlian.</p>
      </div>
      
      <div class="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button @click="activeTab = 'masuk'"
                :class="activeTab === 'masuk' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'"
                class="flex items-center gap-2 px-4 py-2 text-xs rounded-lg transition-all">
          <ArrowDownLeft class="w-4 h-4 text-emerald-500" />
          Barang Masuk
        </button>
        <button @click="activeTab = 'distribusi'"
                :class="activeTab === 'distribusi' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800'"
                class="flex items-center gap-2 px-4 py-2 text-xs rounded-lg transition-all">
          <ArrowUpRight class="w-4 h-4 text-indigo-500" />
          Salurkan ke Jurusan
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'masuk'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm h-fit">
        <h4 class="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
          <span class="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Plus class="w-4 h-4" /></span>
          Input Pengadaan Barang
        </h4>
        <form @submit.prevent="handleStokMasuk" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5">Pilih Item Barang</label>
            <select v-model="formMasuk.barang_id" required class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all">
              <option value="" disabled>-- Pilih Aset --</option>
              <option v-for="b in barangList" :key="b.id" :value="b.id">{{ b.nama_barang }} (Stok: {{ b.jumlah }})</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5">Jumlah Masuk</label>
            <input v-model="formMasuk.jumlah" type="number" min="1" placeholder="0" required class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5">Sumber Dana</label>
            <input v-model="formMasuk.sumber_dana" type="text" placeholder="BOS / Komite / DLL" required class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5">Tanggal Masuk</label>
            <input v-model="formMasuk.tanggal_masuk" type="date" required class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all" />
          </div>
          <button type="submit" :disabled="loadingSubmit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md transition-all">
            {{ loadingSubmit ? 'Memproses...' : 'Konfirmasi Masuk' }}
          </button>
        </form>
      </div>

      <div class="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h4 class="font-bold text-slate-800 text-sm">Log Pengadaan Terakhir</h4>
          <button v-if="riwayatMasuk.length > 0" @click="clearRiwayatMasuk" class="text-xs text-red-500 hover:text-red-700 font-semibold transition-all">
            Bersihkan Riwayat
          </button>
        </div>
        <div class="overflow-x-auto text-xs text-slate-600">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50 font-bold border-b border-slate-100 text-slate-400">
                <th class="p-3">Nama Aset</th>
                <th class="p-3">Jumlah</th>
                <th class="p-3">Tanggal</th>
                <th class="p-3">Sumber Dana</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="riwayatMasuk.length === 0" class="text-center">
                <td colspan="4" class="py-8 text-slate-400 italic">Belum ada riwayat pengadaan.</td>
              </tr>
              <tr v-for="log in riwayatMasuk" :key="log.id" class="border-b border-slate-100/60 hover:bg-slate-50/40">
                <td class="p-3 font-semibold text-slate-800">{{ log.barang?.nama_barang || 'Aset' }}</td>
                <td class="p-3 text-emerald-600 font-bold">+{{ log.jumlah_masuk }} Unit</td>
                <td class="p-3 text-slate-400">{{ log.tanggal_masuk }}</td>
                <td class="p-3"><span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-semibold text-[10px]">{{ log.keterangan || 'N/A' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'distribusi'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm h-fit">
        <h4 class="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
          <span class="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><ArrowUpRight class="w-4 h-4" /></span>
          Form Pengeluaran Barang
        </h4>
        <form @submit.prevent="handleDistribusi" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5">Pilih Barang Gudang</label>
            <select v-model="formDistribusi.barang_id" required class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all">
              <option value="" disabled>-- Pilih Item --</option>
              <option v-for="b in barangList" :key="b.id" :value="b.id">{{ b.nama_barang }} (Tersedia: {{ b.jumlah }})</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5">Jurusan Tujuan</label>
            <select v-model="formDistribusi.nama_jurusan" required class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all">
              <option value="" disabled>-- Pilih Program Keahlian --</option>
              <option v-for="j in jurusanAccounts" :key="j.id" :value="j.jurusan">
                {{ j.nama_user }} ({{ j.jurusan }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5">Jumlah Diserahkan</label>
            <input v-model="formDistribusi.jumlah" type="number" min="1" placeholder="0" required class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-1.5">Nama Guru Penerima</label>
            <input v-model="formDistribusi.penerima" type="text" placeholder="Nama Kaprog / Toolman" required class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all" />
          </div>
          <button type="submit" :disabled="loadingSubmit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md transition-all">
            {{ loadingSubmit ? 'Mengirim...' : 'Salurkan Sekarang' }}
          </button>
        </form>
      </div>

      <div class="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h4 class="font-bold text-slate-800 text-sm">Log Mutasi Keluar ke Lab</h4>
          <button v-if="riwayatDistribusi.length > 0" @click="clearRiwayatKeluar" class="text-xs text-red-500 hover:text-red-700 font-semibold transition-all">
            Bersihkan Riwayat
          </button>
        </div>
        <div class="overflow-x-auto text-xs text-slate-600">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50 font-bold border-b border-slate-100 text-slate-400">
                <th class="p-3">Nama Barang</th>
                <th class="p-3">Jumlah</th>
                <th class="p-3">Tanggal</th>
                <th class="p-3">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="riwayatDistribusi.length === 0" class="text-center">
                <td colspan="4" class="py-8 text-slate-400 italic">Belum ada riwayat distribusi.</td>
              </tr>
              <tr v-for="log in riwayatDistribusi" :key="log.id" class="border-b border-slate-100/60 hover:bg-slate-50/40">
                <td class="p-3 font-semibold text-slate-800">{{ log.barang?.nama_barang || 'Aset' }}</td>
                <td class="p-3 text-rose-600 font-bold">-{{ log.jumlah_keluar }} Unit</td>
                <td class="p-3 text-slate-400">{{ log.tanggal_keluar }}</td>
                <td class="p-3 text-slate-500">{{ log.keterangan || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>