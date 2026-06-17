<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { QrCode, Printer, Layers, Eye, RefreshCw, Search } from 'lucide-vue-next';

// --- State Data ---
const barangList = ref([]);
const loadingFetch = ref(false);
const searchQuery = ref('');

// --- State Operasional Generator ---
const selectedBarang = ref(null);
const formatLabel = ref('QR_CODE'); // Pilihan format label
const qrUrl = ref('');
const isGenerated = ref(false);

// --- Fungsi 1: Ambil Data Master Barang ---
const fetchBarang = async () => {
  loadingFetch.value = true;
  try {
    const response = await axios.get('/barang');
    if (response.data.success) {
      barangList.value = response.data.data;
    }
  } catch (error) {
    console.error('Gagal memuat barang untuk barcode:', error);
    // Data dummy otomatis jika API backend /barang belum kamu buat
    barangList.value = [
      { id: 1, kode_barang: 'BRG-TKJ-2026-001', nama_barang: 'Laptop ASUS ExpertBook B1400', kategori: 'Elektronik', stok: 12 },
      { id: 2, kode_barang: 'BRG-RPL-2026-042', nama_barang: 'PC Desktop i7 RAM 16GB', kategori: 'Elektronik', stok: 25 },
      { id: 3, kode_barang: 'BRG-SAR-2026-105', nama_barang: 'Proyektor Epson X41', kategori: 'Media Pembelajaran', stok: 5 },
    ];
  } finally {
    loadingFetch.value = false;
  }
};

// --- Fungsi 2: Filter Pencarian Barang ---
const filteredBarang = () => {
  return barangList.value.filter(b => 
    b.nama_barang.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    b.kode_barang.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
};

// --- Fungsi 3: Pilih Barang untuk di-Generate ---
const selectBarang = (barang) => {
  selectedBarang.value = barang;
  isGenerated.value = false;
  qrUrl.value = '';
};

// --- Fungsi 4: Generate Kode QR / Barcode ---
const generateCode = () => {
  if (!selectedBarang.value) return;
  
  // Menggunakan API QR Server open-source dan gratis (Sangat andal tanpa install library tambahan)
  // Data yang dimasukkan ke dalam QR adalah kode unik barang agar nanti saat di-scan bisa langsung terlacak
  const dataToEncode = selectedBarang.value.kode_barang;
  qrUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(dataToEncode)}&ecc=M&margin=10`;
  
  isGenerated.value = true;
};

// --- Fungsi 5: Cetak / Print Stiker Label ---
const printLabel = () => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Cetak Label Aset - ${selectedBarang.value.kode_barang}</title>
        <style>
          body { font-family: 'Arial', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .label-box { border: 2px dashed #000; padding: 20px; width: 320px; text-align: center; border-radius: 8px; }
          .title { font-size: 14px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
          .subtitle { font-size: 10px; color: #555; margin-bottom: 15px; letter-spacing: 1px; }
          .qr-img { width: 160px; height: 160px; margin-bottom: 10px; }
          .item-name { font-size: 12px; font-weight: bold; margin-top: 5px; }
          .item-code { font-size: 11px; font-family: 'Courier New', monospace; background: #eee; padding: 2px 6px; display: inline-block; margin-top: 4px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="label-box">
          <div class="title">PROPERTI INVENTARIS SEKOLAH</div>
          <div class="subtitle">MANAJEMEN LOGISTIK SARPRAS</div>
          <img src="${qrUrl.value}" class="qr-img" />
          <div class="item-name">${selectedBarang.value.nama_barang}</div>
          <div class="item-code">${selectedBarang.value.kode_barang}</div>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

onMounted(() => {
  fetchBarang();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
      <div>
        <h3 class="text-lg font-bold text-slate-800">Sistem Cetak Label & QR Code Aset</h3>
        <p class="text-xs text-slate-400">Pilih aset logistik, buat QR Code pelacaknya, lalu cetak stiker inventaris secara instan.</p>
      </div>
      <button @click="fetchBarang" :disabled="loadingFetch" class="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
        <RefreshCw :class="{'animate-spin': loadingFetch}" class="w-4 h-4 text-slate-600" />
        Segarkan Barang
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
          <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span class="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Layers class="w-4 h-4" /></span>
            Pilih Aset Sekolah
          </h4>
          <div class="relative w-full sm:w-64">
            <Search class="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input v-model="searchQuery" type="text" placeholder="Cari nama / kode aset..." 
                   class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all" />
          </div>
        </div>

        <div class="overflow-x-auto text-xs">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th class="p-3 rounded-l-xl">Kode Aset</th>
                <th class="p-3">Nama Barang</th>
                <th class="p-3">Kategori</th>
                <th class="p-3 text-center rounded-r-xl w-24">Tindakan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="barang in filteredBarang()" :key="barang.id" 
                  :class="selectedBarang?.id === barang.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50/60'"
                  class="transition-colors">
                <td class="p-3 font-mono font-semibold text-indigo-600">{{ barang.kode_barang }}</td>
                <td class="p-3 font-semibold text-slate-700">{{ barang.nama_barang }}</td>
                <td class="p-3 text-slate-400">{{ barang.kategori }}</td>
                <td class="p-3 text-center">
                  <button @click="selectBarang(barang)" 
                          :class="selectedBarang?.id === barang.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                          class="px-3 py-1.5 font-bold rounded-lg transition-all">
                    Pilih
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm h-fit">
        <h4 class="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
          <span class="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><QrCode class="w-4 h-4" /></span>
          Pratinjau Label Cetak
        </h4>

        <div v-if="!selectedBarang" class="py-12 text-center text-slate-400 text-xs italic flex flex-col items-center justify-center gap-2">
          <QrCode class="w-12 h-12 text-slate-200 stroke-1" />
          Silakan pilih item barang di tabel sebelah kiri terlebih dahulu.
        </div>

        <div v-else class="space-y-5">
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1.5">
            <p class="text-slate-400">Aset Terpilih:</p>
            <p class="font-bold text-slate-800 text-sm leading-snug">{{ selectedBarang.nama_barang }}</p>
            <p class="font-mono text-indigo-600 bg-indigo-50 w-fit px-2 py-0.5 rounded-md font-semibold">{{ selectedBarang.kode_barang }}</p>
          </div>

          <button v-if="!isGenerated" @click="generateCode"
                  class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2">
            <QrCode class="w-4 h-4" />
            Generate QR Code
          </button>

          <div v-else class="flex flex-col items-center justify-center pt-2 space-y-5">
            <div class="border-2 border-dashed border-slate-300 rounded-xl p-4 w-full bg-white text-center shadow-inner flex flex-col items-center">
              <span class="text-[9px] font-extrabold text-slate-400 tracking-widest uppercase block mb-3">ID Inventaris Sarpras</span>
              <img :src="qrUrl" alt="QR Code Aset" class="w-40 h-40 object-contain border p-1 bg-white rounded-lg shadow-sm" />
              <p class="text-xs font-bold text-slate-700 mt-3 truncate w-full">{{ selectedBarang.nama_barang }}</p>
              <p class="text-[10px] font-mono text-slate-400 mt-1">{{ selectedBarang.kode_barang }}</p>
            </div>

            <button @click="printLabel"
                    class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2">
              <Printer class="w-4 h-4" />
              Cetak Stiker Label (Print)
            </button>
          </div>
        </div>
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