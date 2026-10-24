<template>
  <div class="login-page container">
    <div class="auth-card card fade-in">
      <!-- HEADER -->
      <div class="auth-header">
        <div class="brand-icon">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;">
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
          <button type="button" @click="fillLogin('admin@jelajahtoba.id', 'admin123')" class="demo-btn" aria-label="Isi otomatis akun admin">
            👑 Admin
          </button>
          <button type="button" @click="fillLogin('hutaraja@jelajahtoba.id', 'mitra123')" class="demo-btn" aria-label="Isi otomatis akun mitra Hutaraja">
            🧶 Mitra Hutaraja
          </button>
          <button type="button" @click="fillLogin('budi.traveler@gmail.com', 'user123')" class="demo-btn" aria-label="Isi otomatis akun traveler">
            👤 Traveler
          </button>
        </div>
      </div>

      <!-- TABS (real links to /auth/login and /auth/register) -->
      <nav class="auth-tabs" aria-label="Pilih Masuk atau Daftar">
        <router-link
          id="tab-login"
          class="auth-tab"
          :class="{ active: !isRegister }"
          :to="{ path: '/auth/login', query: route.query }"
        >
          Masuk
        </router-link>
        <router-link
          id="tab-register"
          class="auth-tab"
          :class="{ active: isRegister }"
          :to="{ path: '/auth/register', query: route.query }"
        >
          Daftar Akun
        </router-link>
      </nav>

      <p v-if="route.query.redirect && !isRegister" class="auth-notice">
        Silakan masuk terlebih dahulu untuk melanjutkan.
      </p>

      <!-- FORM -->
      <form @submit.prevent="handleSubmit" class="auth-form" novalidate>
        <div v-if="isRegister" class="form-group">
          <label class="form-label" for="reg-name">Nama Lengkap</label>
          <input id="reg-name" name="name" v-model="name" type="text" class="form-input" placeholder="Nama Anda atau Komunitas" required autocomplete="name" />
        </div>

        <div class="form-group">
          <label class="form-label" for="username">{{ isRegister ? 'Alamat Email' : 'Alamat Email / Username' }}</label>
          <input
            id="username"
            name="username"
            v-model="email"
            :type="isRegister ? 'email' : 'text'"
            class="form-input"
            :placeholder="isRegister ? 'nama@email.com' : 'admin@jelajahtoba.id atau admin'"
            required
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Kata Sandi</label>
          <input
            id="password"
            name="password"
            v-model="password"
            type="password"
            class="form-input"
            placeholder="••••••••"
            required
            :minlength="isRegister ? 6 : undefined"
            :autocomplete="isRegister ? 'new-password' : 'current-password'"
          />
          <small v-if="isRegister" class="field-hint">Minimal 6 karakter.</small>
        </div>

        <div v-if="isRegister" class="form-group">
          <label class="form-label" for="reg-phone">Nomor WhatsApp / Telepon (opsional)</label>
          <input id="reg-phone" name="phone" v-model="phone" type="tel" class="form-input" placeholder="081234567890" autocomplete="tel" />
        </div>

        <div v-if="isRegister" class="form-group">
          <label class="form-label" for="reg-org">Organisasi / Usaha Komunitas (opsional)</label>
          <input id="reg-org" name="organization" v-model="organization" type="text" class="form-input" placeholder="Contoh: Pokdarwis Lumban Suhi-suhi" autocomplete="organization" />
        </div>

        <div v-if="errorMsg" class="alert-error" role="alert">
          {{ errorMsg }}
        </div>

        <div v-if="successMsg" class="alert-success" role="status">
          {{ successMsg }}
        </div>

        <button id="btn-submit" name="btn-submit" type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 1rem;" :disabled="loading">
          {{ loading ? 'Memproses...' : (isRegister ? 'Daftar Sekarang' : 'Masuk ke Akun') }}
        </button>

        <p class="auth-switch">
          <template v-if="isRegister">
            Sudah punya akun?
            <router-link :to="{ path: '/auth/login', query: route.query }">Masuk di sini</router-link>
          </template>
          <template v-else>
            Belum punya akun?
            <router-link :to="{ path: '/auth/register', query: route.query }">Daftar gratis</router-link>
          </template>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api';
import { useAuth } from '../auth';

const router = useRouter();
const route = useRoute();
const { setUser } = useAuth();

// Mode is derived from the URL: /auth/register or /auth/regiter -> register, otherwise login
const isRegister = computed(() => route.path === '/auth/register' || route.path === '/auth/regiter' || route.path === '/register' || route.path === '/regiter');

const name = ref('');
const email = ref('');
const password = ref('');
const phone = ref('');
const organization = ref('');

const loading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

watch(isRegister, () => {
  errorMsg.value = '';
  successMsg.value = '';
});

// Only allow same-origin absolute paths (blocks open redirects like //evil.com or https://evil.com)
function safeRedirect(target) {
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/auth/')
    ? target
    : null;
}

// Linear-time email check (no regex): one '@', non-empty local part, dot inside the domain
function isValidEmail(value) {
  if (value.length > 254 || value.includes(' ')) return false;
  const at = value.indexOf('@');
  if (at < 1 || at !== value.lastIndexOf('@')) return false;
  const domain = value.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  return dot > 0 && dot < domain.length - 1;
}

function fillLogin(em, pw) {
  email.value = em;
  password.value = pw;
}

async function handleSubmit() {
  errorMsg.value = '';
  successMsg.value = '';

  if (isRegister.value) {
    if (!name.value.trim()) {
      errorMsg.value = 'Nama lengkap wajib diisi.';
      return;
    }
    if (!isValidEmail(email.value.trim())) {
      errorMsg.value = 'Format email tidak valid.';
      return;
    }
    if (password.value.length < 6) {
      errorMsg.value = 'Kata sandi minimal 6 karakter.';
      return;
    }
  }

  loading.value = true;
  const redirectTo = safeRedirect(route.query.redirect);

  try {
    if (isRegister.value) {
      const res = await api.register({
        name: name.value,
        email: email.value,
        password: password.value,
        phone: phone.value,
        organization: organization.value
      });

      if (res.success) {
        setUser(res.user, res.token);
        successMsg.value = 'Registrasi berhasil! Mengalihkan...';
        setTimeout(() => {
          router.push(redirectTo || '/profil');
        }, 500);
      } else {
        errorMsg.value = res.message || 'Registrasi gagal.';
      }
    } else {
      const res = await api.login(email.value, password.value);
      if (res.success) {
        setUser(res.user, res.token);
        successMsg.value = 'Login berhasil! Mengalihkan...';
        const target = redirectTo || (res.user.role === 'admin' ? '/admin' : '/profil');
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
  color: #334155;
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
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #1e293b;
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
  color: #0f172a;
  padding: 0.35rem 0.65rem;
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
  display: block;
  text-align: center;
  text-decoration: none;
  padding: 0.65rem;
  border: none;
  background: transparent;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.95rem;
  color: #334155;
  cursor: pointer;
  transition: all var(--transition-fast);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.auth-tab.active {
  color: #0369a1;
  border-bottom-color: #0284c7;
}

.auth-notice {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
  padding: 0.6rem 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  margin-bottom: 1rem;
  font-weight: 500;
}

.auth-switch {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #334155;
}

.auth-switch a {
  color: #0369a1;
  font-weight: 700;
  text-decoration: underline;
}

.field-hint {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.75rem;
  color: #334155;
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
