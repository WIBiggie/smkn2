<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { UserPlus, Trash2, Shield, Mail, User, Key, RefreshCw } from 'lucide-vue-next';

// --- State Data ---
const users = ref([]);
const loadingFetch = ref(false);
const loadingSubmit = ref(false);

// --- State Form Input ---
const form = ref({
  nama_user: '',
  username: '',
  email: '',
  password: '',
  role: 'jurusan', // Default sesuai dengan backend
  status: 'aktif',
  jurusan: '' // Menampung program keahlian
});

const errors = ref({});
const successMessage = ref('');

// --- Fungsi 1: Ambil Semua Daftar User ---
const fetchUsers = async () => {
  loadingFetch.value = true;
  try {
    // Memanfaatkan baseURL dari main.js
    const response = await axios.get('/user');
    if (response.data.success) {
      // Filter hanya menampilkan user ber-role 'jurusan' agar rapi
      users.value = response.data.data.filter(u => u.role === 'jurusan');
    }
  } catch (error) {
    console.error('Gagal mengambil daftar pengguna:', error);
  } finally {
    loadingFetch.value = false;
  }
};

// --- Fungsi 2: Simpan Akun Baru (Store) ---
const handleSubmit = async () => {
  loadingSubmit.value = true;
  errors.value = {};
  successMessage.value = '';

  try {
    const response = await axios.post('/user', form.value);
    
    if (response.data.success) {
      successMessage.value = response.data.message;
      // Reset form input
      form.value = {
        nama_user: '',
        username: '',
        email: '',
        password: '',
        role: 'jurusan',
        status: 'aktif',
        jurusan: ''
      };
      // Refresh data tabel
      await fetchUsers();
    }
  } catch (error) {
    if (error.response && error.response.status === 422) {
      errors.value = error.response.data.errors || {};
    } else {
      alert('Terjadi kesalahan sistem saat menyimpan data.');
    }
  } finally {
    loadingSubmit.value = false;
  }
};

// --- Fungsi 3: Hapus Akun Jurusan (Destroy) ---
const deleteUser = async (id, nama) => {
  if (confirm(`Apakah Anda yakin ingin menghapus akun jurusan "${nama}" secara permanen?`)) {
    try {
      const response = await axios.delete(`/user/${id}`);
      if (response.data.success) {
        alert(response.data.message);
        await fetchUsers(); // Refresh tabel
      }
    } catch (error) {
      alert('Gagal menghapus data pengguna.');
    }
  }
};

// Ambil data pertama kali saat komponen dimuat
onMounted(() => {
  fetchUsers();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
      <div>
        <h3 class="text-lg font-bold text-slate-800">Registrasi & Kelola Akun Jurusan</h3>
        <p class="text-xs text-slate-400">Buat atau hapus hak akses login untuk masing-masing operator program keahlian.</p>
      </div>
      <button @click="fetchUsers" :disabled="loadingFetch" class="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50">
        <RefreshCw :class="{'animate-spin': loadingFetch}" class="w-4 h-4 text-slate-600" />
        Refresh Data
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm h-fit">
        <div class="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
          <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <UserPlus class="w-5 h-5" />
          </div>
          <h4 class="font-bold text-slate-800 text-sm">Form Pembuatan Akun</h4>
        </div>

        <div v-if="successMessage" class="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-xl border border-emerald-200/60 text-center">
          {{ successMessage }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap / Jurusan</label>
            <div class="relative">
              <User class="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input v-model="form.nama_user" type="text" placeholder="Contoh: Kaprog TKJ / RPL" required
                     class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all" />
            </div>
            <p v-if="errors.nama_user" class="text-[11px] text-rose-500 font-medium italic mt-1">{{ errors.nama_user[0] }}</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
            <div class="relative">
              <Shield class="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input v-model="form.username" type="text" placeholder="username_jurusan" required
                     class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all" />
            </div>
            <p v-if="errors.username" class="text-[11px] text-rose-500 font-medium italic mt-1">{{ errors.username[0] }}</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alamat Email</label>
            <div class="relative">
              <Mail class="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input v-model="form.email" type="email" placeholder="jurusan@sekolah.sch.id" required
                     class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all" />
            </div>
            <p v-if="errors.email" class="text-[11px] text-rose-500 font-medium italic mt-1">{{ errors.email[0] }}</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Program Keahlian / Jurusan</label>
            <select v-model="form.jurusan" required
                    class="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all">
              <option value="" disabled>-- Pilih Program Keahlian --</option>
              <option value="RPL">Rekayasa Perangkat Lunak (RPL)</option>
              <option value="AV">Audio Video (AV)</option>
              <option value="TKJ">Teknik Komputer & Jaringan (TKJ)</option>
            </select>
            <p v-if="errors.jurusan" class="text-[11px] text-rose-500 font-medium italic mt-1">{{ errors.jurusan[0] }}</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kata Sandi (Min. 6 Karakter)</label>
            <div class="relative">
              <Key class="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input v-model="form.password" type="password" placeholder="******" required
                     class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all" />
            </div>
            <p v-if="errors.password" class="text-[11px] text-rose-500 font-medium italic mt-1">{{ errors.password[0] }}</p>
          </div>

          <button type="submit" :disabled="loadingSubmit"
                  class="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl text-sm shadow-md hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 mt-2">
            {{ loadingSubmit ? 'Menyimpan...' : 'Daftarkan Akun' }}
          </button>
        </form>
      </div>

      <div class="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
            <div class="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <User class="w-5 h-5" />
            </div>
            <h4 class="font-bold text-slate-800 text-sm">Daftar Akun Operator Terdaftar</h4>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead>
                <tr class="bg-slate-50 text-slate-400 font-bold text-xs uppercase border-b border-slate-100">
                  <th class="px-4 py-3 rounded-l-xl">Nama Pengguna</th>
                  <th class="px-4 py-3">Username & Email</th>
                  <th class="px-4 py-3 text-center">Status</th>
                  <th class="px-4 py-3 text-center rounded-r-xl w-20">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="users.length === 0" class="text-center">
                  <td colspan="4" class="py-8 text-slate-400 text-xs italic">Belum ada akun operator jurusan yang terdaftar.</td>
                </tr>
                <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50/60 transition-colors">
                  <td class="px-4 py-3.5 font-semibold text-slate-800">{{ user.nama_user }}</td>
                  <td class="px-4 py-3.5 leading-normal">
                    <span class="block font-medium text-slate-700 text-xs bg-slate-100 w-fit px-2 py-0.5 rounded-md mb-1">@{{ user.username }}</span>
                    <span class="text-xs text-slate-400 block">{{ user.email }}</span>
                    <span v-if="user.jurusan" class="inline-block text-[10px] bg-indigo-50 text-indigo-600 font-bold uppercase px-1.5 py-0.5 rounded border border-indigo-150 mt-1">Jurusan: {{ user.jurusan }}</span>
                  </td>
                  <td class="px-4 py-3.5 text-center">
                    <span :class="user.status === 'aktif' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'" 
                          class="px-2.5 py-1 text-xs border font-semibold rounded-full capitalize">
                      {{ user.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3.5 text-center">
                    <button @click="deleteUser(user.id, user.nama_user)" class="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Hapus Permanen">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
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