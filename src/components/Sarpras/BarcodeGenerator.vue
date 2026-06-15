<script setup>
import { ref, computed } from 'vue';
import { QrCode, Printer, Tag } from 'lucide-vue-next';

const kategori = ref('SLD'); // Default Solder
const namaAlat = ref('');
const nomorSeri = ref('001');

// Automatisasi Kode Unik Registrasi Barang
const kodeAlatGenerated = computed(() => {
  if (!namaAlat.value) return 'PILIH-KATEGORI-000';
  const cleanName = namaAlat.value.substring(0, 3).toUpperCase();
  return `${kategori.value}-${cleanName}-${nomorSeri.value}`;
});

// URL API QR Code otomatis terintegrasi ke endpoint deteksi backend barang/cari/{kode}
const qrCodeUrl = computed(() => {
  return `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=http://127.0.0.1:8000/api/barang/cari/${kodeAlatGenerated.value}&choe=UTF-8`;
});

const cetakBarcode = () => {
  window.print();
};
</script>

<template>
  <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm max-w-4xl mx-auto">
    <div class="mb-6">
      <h3 class="text-xl font-bold text-slate-800">Registrasi Kategori & Labeling QR Code</h3>
      <p class="text-sm text-slate-500">Buat penomoran aset otomatis beserta label pelacak untuk ditempel di fisik alat.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Kelompok Kategori Alat</label>
          <select v-model="kategori" class="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none">
            <option value="SLD">Peralatan Elektronik & Solder (SLD)</option>
            <option value="NET">Infrastruktur Jaringan & Router (NET)</option>
            <option value="KOM">Komputer & Perangkat Keras (KOM)</option>
            <option value="OTM">Mesin Otomotif & Perkakas (OTM)</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Nama Alat Spesifik</label>
          <input v-model="namaAlat" type="text" placeholder="Contoh: Solder Atten" class="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none" />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Nomor Urut Urutan Registrasi</label>
          <input v-model="nomorSeri" type="text" placeholder="Contoh: 001" class="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none" />
        </div>
      </div>

      <div id="print-area" class="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center min-h-[300px]">
        <p class="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1">
          <Tag class="w-3.5 h-3.5" /> Pratinjau Label Aset SMK
        </p>
        
        <div class="p-3 bg-white border border-slate-100 rounded-xl shadow-inner mb-3">
          <img :src="qrCodeUrl" alt="Aset QR Code" class="w-40 h-40 object-contain mx-auto" />
        </div>

        <h4 class="text-lg font-mono font-bold text-slate-800 tracking-wide bg-slate-100 px-4 py-1.5 rounded-lg border border-slate-200">
          {{ kodeAlatGenerated }}
        </h4>
        <p class="text-xs text-slate-500 mt-1 italic font-medium">{{ namaAlat || 'Nama barang belum diisi' }}</p>

        <button @click="cetakBarcode" class="mt-5 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white p-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all">
          <Printer class="w-4 h-4" /> Cetak Barcode Label
        </button>
      </div>
    </div>
  </div>
</template>