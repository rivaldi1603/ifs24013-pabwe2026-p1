<template>
  <header class="navbar-wrapper">
    <div class="container navbar-inner">
      <!-- Logo -->
      <router-link to="/" class="brand-logo">
        <div class="brand-icon">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="icon-svg">
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
      <nav class="nav-links" aria-label="Navigasi Utama">
        <router-link to="/" class="nav-link" active-class="active">Beranda</router-link>
        <router-link to="/destinasi" class="nav-link" active-class="active">Destinasi</router-link>
        <router-link to="/jasa-lokal" class="nav-link nav-link-special" active-class="active">
          <span class="pulse-dot" aria-hidden="true"></span>
          Jasa Budaya & Homestay
        </router-link>
        <router-link to="/transportasi" class="nav-link" active-class="active">Jadwal Ferry</router-link>
        <router-link to="/kuliner" class="nav-link" active-class="active">Kuliner Khas</router-link>
        <router-link to="/cerita" class="nav-link" active-class="active">Cerita Toba</router-link>
      </nav>

      <!-- Right Actions -->
      <div class="nav-actions">
        <!-- Logged in state buttons based on role -->
        <template v-if="user">
          <router-link
            v-if="user.role === 'admin'"
            to="/admin"
            class="btn btn-admin btn-sm dashboard-btn"
          >
            <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"></path>
            </svg>
            Panel Admin
          </router-link>

          <router-link
            v-else
            to="/profil"
            class="btn btn-secondary btn-sm dashboard-btn"
          >
            <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            {{ user.role === 'partner' ? 'Profil Mitra' : 'Ulasan & Profil' }}
          </router-link>

          <!-- User profile chip -->
          <div class="user-profile">
            <img v-if="user.avatar_url" :src="user.avatar_url" class="nav-avatar-img" :alt="user.name" />
            <span
              v-else
              class="user-badge"
              :class="{
                'badge-admin': user.role === 'admin',
                'badge-partner': user.role === 'partner',
                'badge-user': user.role === 'user'
              }"
            >
              {{ user.role === 'admin' ? 'ADMIN' : (user.role === 'partner' ? 'MITRA' : 'WISATAWAN') }}
            </span>
            <span class="user-name">{{ user.name.split(' ')[0] }}</span>
            <button type="button" @click="handleLogout" class="btn-logout" title="Keluar" aria-label="Keluar dari akun">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </template>

        <!-- Guest state -->
        <template v-else>
          <router-link id="nav-login" to="/auth/login" class="btn btn-secondary btn-sm">
            Masuk
          </router-link>
          <router-link id="nav-register" to="/auth/register" class="btn btn-primary btn-sm">
            Daftar
          </router-link>
        </template>

        <!-- Mobile Menu Toggle -->
        <button type="button" class="mobile-toggle" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Buka menu navigasi" :aria-expanded="mobileMenuOpen">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
      
      <div v-if="user" style="margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        <router-link :to="user.role === 'admin' ? '/admin' : '/profil'" class="mobile-link" style="color: var(--primary-600); font-weight: 700;" @click="mobileMenuOpen = false">
          {{ user.role === 'admin' ? '⚙️ Buka Panel Admin' : '👤 Buka Ulasan & Profil' }}
        </router-link>
        <button @click="handleLogout" class="btn btn-secondary btn-sm" style="width: 100%; margin-top: 10px;">
          Keluar ({{ user.name }})
        </button>
      </div>
      <div v-else style="margin-top: 10px; display: flex; gap: 8px;">
        <router-link to="/auth/login" class="btn btn-secondary" style="flex: 1;" @click="mobileMenuOpen = false">Masuk</router-link>
        <router-link to="/auth/register" class="btn btn-primary" style="flex: 1;" @click="mobileMenuOpen = false">Daftar</router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../auth';

const router = useRouter();
const mobileMenuOpen = ref(false);
const { currentUser: user, logoutUser } = useAuth();

function handleLogout() {
  logoutUser();
  mobileMenuOpen.value = false;
  router.push('/auth/login');
}
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
  color: #334155;
  font-weight: 600;
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

.btn-admin {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: white;
  border: none;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);
}

.btn-admin:hover {
  background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
  color: white;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f1f5f9;
  padding: 0.3rem 0.7rem;
  border-radius: var(--radius-full);
  border: 1px solid #e2e8f0;
}

.nav-avatar-img {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid #10b981;
}

.user-badge {
  font-size: 0.675rem;
  font-weight: 800;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-full);
  letter-spacing: 0.03em;
}

.badge-admin {
  background: #075985;
  color: #ffffff;
}

.badge-partner {
  background: #5b21b6;
  color: #ffffff;
}

.badge-user {
  background: #065f46;
  color: #ffffff;
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
  padding: 2px;
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
