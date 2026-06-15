<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

// --- State Form Login ---
const loginInput = ref(''); // Menampung email atau username
const password = ref('');
const remember = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const errors = ref({});
const router = useRouter();

// --- State Ganti Background ---
const backgrounds = [
    { name: 'Abstract Blue', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920' },
    { name: 'Modern Architecture', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920' },
    { name: 'Dark Nature', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1920' },
    { name: 'Soft Gradient', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1920' }
];
const currentBg = ref(backgrounds[0].url);

const submit = async () => {
    loading.value = true;
    errorMessage.value = '';
    errors.value = {};

    try {
        // Ambil data dari loginInput.value (Bukan username.value)
        const response = await axios.post('http://127.0.0.1:8000/api/login', {
            login: loginInput.value, 
            password: password.value,
            remember: remember.value
        });

        // Pastikan format response sesuai dengan UserController.php Anda
        const tokenJWT = response.data.token;
        const roleUser = response.data.user.role;

        localStorage.setItem('auth_token', tokenJWT);
        localStorage.setItem('user_role', roleUser);

        alert('Selamat, login berhasil!');

        // PERBAIKAN UTAMA: Menggunakan fungsi router.push(...) yang benar
        if (roleUser === 'jurusan') {
            await router.push('/jurusan/dashboardjurusan');
        } else if (roleUser === 'siswa') {
            await router.push('/siswa/dashboard');
        } else if (roleUser === 'sarpras' || roleUser === 'sapras') {
            await router.push('/sarpras/dashboardsarpras');
        } else {
            await router.push('/');
        }
    } catch (error) {
        if (error.response) {
            if (error.response.status === 422) {
                errors.value = error.response.data.errors || error.response.data;
            } else if (error.response.status === 401 || error.response.status === 403) {
                errorMessage.value = error.response.data.message; // Menangkap pesan 'Email/Username atau Password salah!'
            } else {
                errorMessage.value = error.response.data.message || 'Login gagal, periksa kembali data Anda.';
            }
        } else {
            errorMessage.value = 'Tidak dapat terhubung ke server Backend. Pastikan kp-backend menyala di port 8000!';
        }
        password.value = '';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div
        class="relative flex min-h-screen items-center justify-center overflow-hidden bg-cover bg-center px-4 transition-all duration-700"
        :style="{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${currentBg}')` }"
    >
        
        <div class="relative w-full max-w-[420px] overflow-hidden rounded-[32px] border border-white/20 bg-white/10 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">

            <div class="mb-8 text-center">
                <h2 class="text-3xl font-bold tracking-tight text-white">Selamat Datang</h2>
                <p class="mt-2 text-sm text-gray-200">Silakan masuk ke akun Anda</p>
            </div>

            <div v-if="errorMessage" class="mb-4 rounded-xl bg-red-500/20 p-3 text-center text-sm font-medium text-red-300 border border-red-500/30">
                {{ errorMessage }}
            </div>

            <form @submit.prevent="submit" class="space-y-5">
                <div>
                    <input
                        type="text"
                        v-model="loginInput"
                        required
                        class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3.5 text-white placeholder-white/50 outline-none transition-all focus:border-indigo-400 focus:bg-white/20 focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Email / Username"
                    />
                    <p v-if="errors.login" class="mt-1.5 text-xs text-red-300 italic">
                        {{ errors.login?.[0] || errors.login }}
                    </p>
                </div>

                <div>
                    <input
                        type="password"
                        v-model="password"
                        required
                        class="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3.5 text-white placeholder-white/50 outline-none transition-all focus:border-indigo-400 focus:bg-white/20 focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Password"
                    />
                    <p v-if="errors.password" class="mt-1.5 text-xs text-red-300 italic">
                        {{ errors.password?.[0] || errors.password }}
                    </p>
                </div>

                <div class="flex items-center justify-between">
                    <label class="flex items-center text-gray-200 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            v-model="remember"
                            class="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-0"
                        />
                        <span class="ms-2 text-sm italic">Ingat saya</span>
                    </label>
                </div>

                <div class="pt-2">
                    <button
                        type="submit"
                        :disabled="loading"
                        class="w-full justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-3.5 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-indigo-500/40 active:translate-y-0 disabled:opacity-50"
                    >
                        {{ loading ? 'Mengautentikasi...' : 'Masuk' }}
                    </button>
                </div>
            </form>
        </div>

        <div class="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-10">
            <p class="text-[10px] uppercase tracking-widest text-white/60 font-bold">Ganti Background</p>
            <div class="flex gap-2">
                <button
                    v-for="(bg, index) in backgrounds"
                    :key="index"
                    @click="currentBg = bg.url"
                    class="h-10 w-10 overflow-hidden rounded-lg border-2 transition-all hover:scale-110 active:scale-95 shadow-lg"
                    :class="currentBg === bg.url ? 'border-white scale-110 shadow-indigo-500/50' : 'border-white/20'"
                >
                    <img :src="bg.url" class="h-full w-full object-cover" :title="bg.name">
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.transition-all {
    transition-property: all;
}
</style>