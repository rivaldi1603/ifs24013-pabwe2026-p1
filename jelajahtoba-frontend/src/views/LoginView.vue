<template>
  <div class="login-page container">
    <div class="auth-card card fade-in">
      <!-- HEADER -->
      <div class="auth-header">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>
            <circle cx="12" cy="9" r="2.5"></circle>
          </svg>
        </div>
        <h1 class="auth-title">{{ isRegister ? 'Daftar Akun JelajahToba' : 'Masuk ke JelajahToba' }}</h1>
        <p class="auth-subtitle">
          {{ isRegister ? 'Bergabunglah untuk mengelola layanan atau memberikan ulasan wisata' : 'Masuk untuk mengelola direktori atau memberikan ulasan' }}
        </p>
      </div>

      <!-- DEMO QUICK LOGIN PRESETS -->
      <div v-if="!isRegister" class="demo-box">
        <span class="demo-title">Akun Uji Coba Cepat (Evaluasi):</span>
        <div class="demo-buttons">
          <button @click="fillLogin('admin@jelajahtoba.id', 'admin123')" class="demo-btn">
            👑 Admin
          </button>
          <button @click="fillLogin('hutaraja@jelajahtoba.id', 'mitra123')" class="demo-btn">
            🧶 Mitra Hutaraja
          </button>
          <button @click="fillLogin('budi.traveler@gmail.com', 'user123')" class="demo-btn">
            👤 Traveler
          </button>
        </div>
      </div>

      <!-- TABS -->
      <div class="auth-tabs">
        <button
          type="button"
          class="auth-tab"
          :class="{ active: !isRegister }"
          @click="isRegister = false"
        >
          Masuk
        </button>
        <button
          type="button"
          class="auth-tab"
          :class="{ active: isRegister }"
          @click="isRegister = true"
        >
          Daftar Akun
        </button>
      </div>

      <!-- FORM -->
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="isRegister" class="form-group">
          <label class="form-label">Nama Lengkap</label>
          <input v-model="name" type="text" class="form-input" placeholder="Nama Anda atau Komunitas" required />
        </div>

        <div class="form-group">
          <label class="form-label" for="username">Alamat Email / Username</label>
          <input id="username" name="username" v-model="email" type="text" class="form-input" placeholder="admin@jelajahtoba.id atau admin" required autocomplete="username" />
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Kata Sandi</label>
          <input id="password" name="password" v-model="password" type="password" class="form-input" placeholder="••••••••" required autocomplete="current-password" />
        </div>

        <div v-if="isRegister" class="form-group">
          <label class="form-label">Nomor WhatsApp / Telepon</label>
          <input v-model="phone" type="text" class="form-input" placeholder="081234567890" />
        </div>

        <div v-if="isRegister" class="form-group">
          <label class="form-label">Jenis Akun</label>
          <select v-model="role" class="form-select">
            <option value="user">Wisatawan / Traveler</option>
            <option value="partner">Mitra Lokal / Pemilik Homestay / Pemandu</option>
          </select>
        </div>

        <div v-if="isRegister && role === 'partner'" class="form-group">
          <label class="form-label">Nama Organisasi / Usaha Komunitas</label>
          <input v-model="organization" type="text" class="form-input" placeholder="Contoh: Pokdarwis Lumban Suhi-suhi" />
        </div>

        <div v-if="errorMsg" class="alert-error">
          {{ errorMsg }}
        </div>

        <div v-if="successMsg" class="alert-success">
          {{ successMsg }}
        </div>

        <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 1rem;" :disabled="loading">
          {{ loading ? 'Memproses...' : (isRegister ? 'Daftar Sekarang' : 'Masuk ke Akun') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api';
import { useAuth } from '../auth';

const router = useRouter();
const route = useRoute();
const { setUser } = useAuth();

const isRegister = ref(false);
const name = ref('');
const email = ref('');
const password = ref('');
const phone = ref('');
const role = ref('user');
const organization = ref('');

const loading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

function fillLogin(em, pw) {
  email.value = em;
  password.value = pw;
  isRegister.value = false;
}

async function handleSubmit() {
  loading.value = true;
  errorMsg.value = '';
  successMsg.value = '';

  try {
    if (isRegister.value) {
      const res = await api.register({
        name: name.value,
        email: email.value,
        password: password.value,
        phone: phone.value,
        role: role.value,
        organization: organization.value
      });

      if (res.success) {
        setUser(res.user, res.token);
        successMsg.value = 'Registrasi berhasil! Mengalihkan ke profil Anda...';
        setTimeout(() => {
          router.push('/profil');
        }, 500);
      } else {
        errorMsg.value = res.message || 'Registrasi gagal.';
      }
    } else {
      const res = await api.login(email.value, password.value);
      if (res.success) {
        setUser(res.user, res.token);
        successMsg.value = 'Login berhasil! Mengalihkan...';
        const target = res.user.role === 'admin' ? '/admin' : (route.query.redirect || '/profil');
        setTimeout(() => {
          router.push(target);
        }, 400);
      } else {
        errorMsg.value = res.message || 'Email atau password salah.';
      }
    }
  } catch (err) {
    errorMsg.value = 'Terjadi kesalahan server.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  padding: 4rem 1rem 6rem;
  display: flex;
  justify-content: center;
}

.auth-card {
  max-width: 480px;
  width: 100%;
  padding: 2.5rem;
  background: white;
}

.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.brand-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.85rem;
}

.auth-title {
  font-size: 1.6rem;
  margin-bottom: 0.35rem;
}

.auth-subtitle {
  color: var(--text-muted);
  font-size: 0.875rem;
  line-height: 1.4;
}

.demo-box {
  background: #f8fafc;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
}

.demo-title {
  display: block;
  font-size: 0.725rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.45rem;
}

.demo-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.demo-btn {
  background: white;
  border: 1px solid var(--border-subtle);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.demo-btn:hover {
  background: var(--primary-50);
  border-color: var(--primary-500);
}

.auth-tabs {
  display: flex;
  border-bottom: 2px solid #f1f5f9;
  margin-bottom: 1.5rem;
}

.auth-tab {
  flex: 1;
  padding: 0.65rem;
  border: none;
  background: transparent;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.auth-tab.active {
  color: var(--primary-600);
  border-color: var(--primary-600);
}

.alert-error {
  background: #fee2e2;
  color: #b91c1c;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  margin-top: 0.75rem;
}

.alert-success {
  background: #dcfce7;
  color: #15803d;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  margin-top: 0.75rem;
}
</style>
