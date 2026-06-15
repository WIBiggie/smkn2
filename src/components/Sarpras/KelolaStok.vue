<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { ArrowUpRight, ArrowDownLeft, Calendar, Package, Users } from 'lucide-vue-next';

// Simulasi data barang dari API GET /api/barang
const daftarBarang = ref([
  { id: 1, nama_barang: 'Solder Station Atten AT937', stok: 15, kode_barang: 'SLD-001' },
  { id: 2, nama_barang: 'Multimeter Digital Fluke 101', stok: 8, kode_barang: 'MLT-002' }
]);

const tipeTransaksi = ref('masuk'); // masuk atau keluar
const selectedBarangId = ref('');
const jumlah = ref(1);
const keterangan = ref('');
const loading = ref(false);
const message = ref('');

const submitStok = async () => {
  if (!selectedBarangId.value) return alert('Pilih barang terlebih dahulu!');
  loading.value = true;
  message.value = '';

  try {
    const endpoint = tipeTransaksi.value === 'masuk' 
      ? `http://127.0.0.1:8000/api/barang/${selectedBarangId.value}/stok-masuk`
      : `http://127.0.0.1:8000/api/barang/${selectedBarangId.value}/stok-keluar`;

    const token = localStorage.getItem('auth_token');
    const response = await axios.post(endpoint, {
      jumlah: jumlah.value,
      keterangan: keterangan.value, // Misal: "Disalurkan ke Jurusan RPL" jika stok keluar
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    message.value = response.data.message || 'Transaksi stok berhasil dicatat!';
    // Reset form
    jumlah.value = 1;
    keterangan.value = '';
  } catch (error) {
    message.value = error.response?.data?.message || 'Gagal memproses stok.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm max-w-4xl mx-auto">
    <div class="mb-6">
      <h3 class="text-xl font-bold text-slate-800">Manajemen Mutasi & Distribusi Stok</h3>
      <p class="text-sm text-slate-500">Kelola barang masuk ke gudang atau distribusi keluar ke program keahlian/jurusan.</p>
    </div>

    <div v-if="message" class="mb-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium">
      {{ message }}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <button 
        @click="tipeTransaksi = 'masuk'"
        :class="tipeTransaksi === 'masuk' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'"
        class="flex items-center justify-center gap-3 p-4 rounded-2xl border-2 font-semibold transition-all"
      >
        <ArrowDownLeft class="w-5 h-5" /> Stok Masuk (Gudang)
      </button>
      <button 
        @click="tipeTransaksi = 'keluar'"
        :class="tipeTransaksi === 'keluar' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'"
        class="flex items-center justify-center gap-3 p-4 rounded-2xl border-2 font-semibold transition-all"
      >
        <ArrowUpRight class="w-5 h-5" /> Stok Keluar (Ke Jurusan)
      </button>
    </div>

    <form @submit.prevent="submitStok" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">Pilih Inventaris Barang</label>
        <select v-model="selectedBarangId" class="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="" disabled>-- Pilih Alat / Bahan --</option>
          <option v-for="b in daftarBarang" :key="b.id" :value="b.id">
            {{ b.kode_barang }} - {{ b.nama_barang }} (Sisa Stok: {{ b.stok }})
          </option>
        </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Jumlah Kuantitas</label>
          <input v-model.number="jumlah" type="number" min="1" required class="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">
            {{ tipeTransaksi === 'keluar' ? 'Jurusan / Ruang Penerima' : 'Asal Supplier / Sumber' }}
          </label>
          <input v-model="keterangan" type="text" :placeholder="tipeTransaksi === 'keluar' ? 'Contoh: Lab Komputer Jurusan RPL' : 'Contoh: PT. Edutech Pratama'" required class="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
      </div>

      <button type="submit" :disabled="loading" class="w-full bg-slate-800 text-white p-3.5 rounded-xl font-semibold shadow-lg hover:bg-slate-900 transition-all disabled:opacity-50">
        {{ loading ? 'Memproses Transaksi...' : 'Simpan Mutasi Stok' }}
      </button>
    </form>
  </div>
</template>