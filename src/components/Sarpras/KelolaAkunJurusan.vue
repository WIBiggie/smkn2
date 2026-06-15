<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { UserPlus, ShieldCheck, Mail, Lock, Trash2, Users } from 'lucide-vue-next';

const namaUser = ref('');
const username = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const successMsg = ref('');
const errorFields = ref({});

// State untuk menyimpan daftar akun jurusan dari database
const daftarJurusan = ref([]);

// 1. Fungsi untuk mengambil data semua akun berkategori role 'jurusan'
const muatAkunJurusan = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    // Menembak ke API index UserController Anda
    const response = await axios.get('http://127.0.0.1:8000/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Filter data agar yang muncul di tabel ini hanya yang memiliki role 'jurusan' saja
    if (response.data && response.data.data) {
      daftarJurusan.value = response.data.data.filter(user => user.role === 'jurusan');
    }
  } catch (error) {
    console.error('Gagal memuat data akun:', error);
  }
};

// 2. Fungsi untuk membuat akun baru
const buatAkunJurusan = async () => {
  loading.value = true;
  successMsg.value = '';
  errorFields.value = {};

  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.post('http://127.0.0.1:8000/api/register', {
      nama_user: namaUser.value,
      username: username.value,
      email: email.value,
      password: password.value,
      role: 'jurusan',
      status: 'aktif'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    successMsg.value = `Akun Operator ${response.data.data.nama_user} berhasil dibuat!`;
    
    // Reset fields form
    namaUser.value = '';
    username.value = '';
    email.value = '';
    password.value = '';
    
    // Refresh isi tabel daftar akun secara realtime
    muatAkunJurusan();
  } catch (error) {
    if (error.response && error.response.status === 422) {
      errorFields.value = error.response.data.errors || error.response.data;
    } else {
      alert('Gagal mendaftarkan akun. Cek koneksi backend.');
    }
  } finally {
    loading.value = false;
  }
};

// 3. Fungsi untuk melakukan Hapus Akun Jurusan
const hapusAkun = async (id, nama) => {
  if (confirm(`Apakah Anda yakin ingin menghapus akun "${nama}" secara permanen?`)) {
    try {
      const token = localStorage.getItem('auth_token');
      // Menembak ke endpoint delete backend (Contoh: DELETE /api/users/{id})
      await axios.delete(`http://127.0.0.1:8000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Akun berhasil dihapus dari sistem.');
      // Refresh tabel setelah data terhapus di database
      muatAkunJurusan();
    } catch (error) {
      alert('Gagal menghapus akun. Pastikan rute destroy di backend sudah aktif.');
    }
  }
};

// Panggil fungsi pemuatan data saat komponen pertama kali dibuka di browser
onMounted(() => {
  muatAkunJurusan();
});
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    
    <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div class="mb-6 flex items-center gap-3">
        <div class="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
          <UserPlus class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-xl font-bold text-slate-800">Registrasi Akun Ketua Jurusan</h3>
          <p class="text-sm text-slate-500">Buatkan hak akses login kontrol khusus untuk Kepala Program / Operator Jurusan.</p>
        </div>
      </div>

      <div v-if="successMsg" class="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold flex items-center gap-2">
        <ShieldCheck class="w-5 h-5" /> {{ successMsg }}
      </div>

      <form @submit.prevent="buatAkunJurusan" class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap Jabatan</label>
          <input v-model="namaUser" type="text" placeholder="Contoh: Ketua Jurusan Rekayasa Perangkat Lunak" required class="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Username Login</label>
            <input v-model="username" type="text" placeholder="Contoh: kaprog_rpl" required class="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            <p v-if="errorFields.username" class="text-xs text-red-500 mt-1">{{ errorFields.username[0] }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Email Instansi</label>
            <input v-model="email" type="email" placeholder="Contoh: rpl@smk.sch.id" required class="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            <p v-if="errorFields.email" class="text-xs text-red-500 mt-1">{{ errorFields.email[0] }}</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">Kata Sandi Default</label>
          <input v-model="password" type="password" placeholder="Minimal 6 karakter" required class="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          <p v-if="errorFields.password" class="text-xs text-red-500 mt-1">{{ errorFields.password[0] }}</p>
        </div>

        <button type="submit" :disabled="loading" class="w-full bg-indigo-600 text-white p-3.5 rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50">
          {{ loading ? 'Mendaftarkan Akun...' : 'Buat & Aktifkan Akun' }}
        </button>
      </form>
    </div>

    <div class="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
      <div class="mb-4 flex items-center gap-2">
        <Users class="w-5 h-5 text-indigo-600" />
        <h4 class="text-base font-bold text-slate-800">Daftar Akun Operator Jurusan Saat Ini</h4>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-slate-100">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <th class="p-4">Nama User</th>
              <th class="p-4">Username</th>
              <th class="p-4">Email</th>
              <th class="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="daftarJurusan.length === 0">
              <td colspan="4" class="p-6 text-center text-slate-400 italic">Belum ada akun data jurusan terdaftar.</td>
            </tr>
            <tr v-for="user in daftarJurusan" :key="user.id" class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
              <td class="p-4 font-medium text-slate-800">{{ user.nama_user }}</td>
              <td class="p-4 text-slate-600 font-mono text-xs">{{ user.username }}</td>
              <td class="p-4 text-slate-500">{{ user.email }}</td>
              <td class="p-4 text-center">
                <button 
                  @click="hapusAkun(user.id, user.nama_user)" 
                  class="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all inline-flex items-center gap-1 font-medium text-xs"
                >
                  <Trash2 class="w-4 h-4" /> Hapus Akun
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>