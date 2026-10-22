<template>
  <header class="navbar-wrapper">
    <div class="container navbar-inner">
      <!-- Logo -->
      <router-link to="/" class="brand-logo">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>
            <circle cx="12" cy="9" r="2.5"></circle>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-title">Jelajah<span class="brand-highlight">Toba</span></span>
          <span class="brand-tagline">Direktori Wisata & Jasa Lokal</span>
        </div>
      </router-link>

      <!-- Desktop Nav -->
      <nav class="nav-links">
        <router-link to="/" class="nav-link" active-class="active">Beranda</router-link>
        <router-link to="/destinasi" class="nav-link" active-class="active">Destinasi</router-link>
        <router-link to="/jasa-lokal" class="nav-link nav-link-special" active-class="active">
          <span class="pulse-dot"></span>
          Jasa Budaya & Homestay
        </router-link>
        <router-link to="/transportasi" class="nav-link" active-class="active">Jadwal Ferry</router-link>
        <router-link to="/kuliner" class="nav-link" active-class="active">Kuliner Khas</router-link>
        <router-link to="/cerita" class="nav-link" active-class="active">Cerita Toba</router-link>
      </nav>

      <!-- Right Actions -->
      <div class="nav-actions">
        <router-link to="/dashboard" class="btn btn-secondary btn-sm dashboard-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Dashboard
        </router-link>

        <div v-if="user" class="user-profile">
          <span class="user-badge">{{ user.role === 'admin' ? 'Admin' : (user.role === 'partner' ? 'Mitra' : 'User') }}</span>
          <span class="user-name">{{ user.name.split(' ')[0] }}</span>
          <button @click="logout" class="btn-logout" title="Keluar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
        <router-link v-else to="/login" class="btn btn-primary btn-sm">
          Masuk
        </router-link>

        <!-- Mobile Menu Toggle -->
        <button class="mobile-toggle" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Toggle Menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line v-if="!mobileMenuOpen" x1="3" y1="12" x2="21" y2="12"></line>
            <line v-if="!mobileMenuOpen" x1="3" y1="6" x2="21" y2="6"></line>
            <line v-if="!mobileMenuOpen" x1="3" y1="18" x2="21" y2="18"></line>
            <line v-if="mobileMenuOpen" x1="18" y1="6" x2="6" y2="18"></line>
            <line v-if="mobileMenuOpen" x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <div v-if="mobileMenuOpen" class="mobile-drawer">
      <router-link to="/" class="mobile-link" @click="mobileMenuOpen = false">Beranda</router-link>
      <router-link to="/destinasi" class="mobile-link" @click="mobileMenuOpen = false">Destinasi Wisata</router-link>
      <router-link to="/jasa-lokal" class="mobile-link" @click="mobileMenuOpen = false">Jasa Budaya & Homestay</router-link>
      <router-link to="/transportasi" class="mobile-link" @click="mobileMenuOpen = false">Jadwal Ferry & Transportasi</router-link>
      <router-link to="/kuliner" class="mobile-link" @click="mobileMenuOpen = false">Kuliner Khas</router-link>
      <router-link to="/cerita" class="mobile-link" @click="mobileMenuOpen = false">Cerita Danau Toba</router-link>
      <router-link to="/dashboard" class="mobile-link" @click="mobileMenuOpen = false">Dashboard Pengelolaan</router-link>
      <div v-if="!user" class="mobile-link" style="margin-top: 10px;">
        <router-link to="/login" class="btn btn-primary" style="width: 100%;" @click="mobileMenuOpen = false">Masuk ke Akun</router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const mobileMenuOpen = ref(false);
const user = ref(null);

function checkUser() {
  const stored = localStorage.getItem('jt_user');
  if (stored) {
    try {
      user.value = JSON.parse(stored);
    } catch(e) {
      user.value = null;
    }
  } else {
    user.value = null;
  }
}

function logout() {
  localStorage.removeItem('jt_token');
  localStorage.removeItem('jt_user');
  user.value = null;
  router.push('/login');
}

onMounted(() => {
  checkUser();
  window.addEventListener('storage', checkUser);
});
</script>

<style scoped>
.navbar-wrapper {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.85);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 74px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.35);
}

.icon-svg {
  width: 22px;
  height: 22px;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--primary-900);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.brand-highlight {
  color: var(--primary-600);
}

.brand-tagline {
  font-size: 0.725rem;
  color: var(--text-muted);
  font-weight: 500;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  font-size: 0.925rem;
  font-weight: 600;
  color: #475569;
  transition: all var(--transition-fast);
  position: relative;
  padding: 0.4rem 0.2rem;
}

.nav-link:hover, .nav-link.active {
  color: var(--primary-600);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary-600);
  border-radius: var(--radius-full);
}

.nav-link-special {
  color: #065f46;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--emerald-50);
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-full);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f1f5f9;
  padding: 0.35rem 0.7rem;
  border-radius: var(--radius-full);
}

.user-badge {
  font-size: 0.7rem;
  font-weight: 700;
  background: var(--primary-600);
  color: white;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-full);
  text-transform: uppercase;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-main);
}

.btn-logout {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color var(--transition-fast);
}

.btn-logout:hover {
  color: #ef4444;
}

.mobile-toggle {
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #334155;
  padding: 0.4rem;
}

.mobile-drawer {
  display: flex;
  flex-direction: column;
  background: white;
  border-bottom: 1px solid var(--border-subtle);
  padding: 1rem 1.5rem 1.5rem;
  gap: 0.75rem;
}

.mobile-link {
  font-size: 0.95rem;
  font-weight: 600;
  color: #334155;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
}

@media (max-width: 992px) {
  .nav-links, .dashboard-btn {
    display: none;
  }
  .mobile-toggle {
    display: block;
  }
}
</style>
