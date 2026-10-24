<template>
  <div class="dashboard-page container">
    <div class="dash-hero card fade-in">
      <div class="dash-welcome">
        <span class="user-role-badge" :class="user?.role === 'admin' ? 'badge-admin-glow' : 'badge-user'">
          {{ user?.role === 'admin' ? '👑 ADMINISTRATOR' : (user?.role === 'partner' ? '🧶 MITRA LOKAL' : '🌿 WISATAWAN') }}
        </span>
        <h1 class="dash-title">Dashboard JelajahToba</h1>
        <p class="dash-subtitle">
          Selamat datang kembali, <strong>{{ user?.name || 'Pengguna JelajahToba' }}</strong>! Pantau ringkasan direktori wisata, jasa lokal, dan aktivitas akun Anda di kawasan Danau Toba.
        </p>
      </div>

      <div class="dash-actions">
        <router-link to="/profil" class="btn btn-secondary">
          👤 Buka Profil
        </router-link>
        <router-link to="/settings" class="btn btn-secondary">
          ⚙️ Pengaturan
        </router-link>
        <router-link v-if="user?.role === 'admin'" to="/admin" class="btn btn-primary">
          👑 Panel Admin
        </router-link>
      </div>
    </div>

    <!-- STATS OVERVIEW -->
    <section class="stats-grid fade-in" aria-label="Ringkasan Statistik Direktori">
      <div class="stat-card card">
        <div class="stat-icon" aria-hidden="true">📍</div>
        <div class="stat-info">
          <span class="stat-value">130+</span>
          <span class="stat-name">Destinasi Kaldera</span>
        </div>
      </div>

      <div class="stat-card card">
        <div class="stat-icon" aria-hidden="true">🧶</div>
        <div class="stat-info">
          <span class="stat-value">40+</span>
          <span class="stat-name">Jasa Budaya & Homestay</span>
        </div>
      </div>

      <div class="stat-card card">
        <div class="stat-icon" aria-hidden="true">🚢</div>
        <div class="stat-info">
          <span class="stat-value">12</span>
          <span class="stat-name">Rute Penyeberangan Ferry</span>
        </div>
      </div>

      <div class="stat-card card">
        <div class="stat-icon" aria-hidden="true">🍲</div>
        <div class="stat-info">
          <span class="stat-value">50+</span>
          <span class="stat-name">Kuliner Tradisi Batak</span>
        </div>
      </div>
    </section>

    <!-- QUICK ACCESS SECTIONS -->
    <div class="dash-sections-grid">
      <div class="section-card card fade-in">
        <h2 class="section-title">Eksplorasi Cepat</h2>
        <p class="section-desc">Akses langsung direktori objek wisata dan jasa masyarakat di 8 kabupaten Danau Toba.</p>
        <div class="shortcuts-list">
          <router-link to="/destinasi" class="shortcut-item">
            <span class="shortcut-icon" aria-hidden="true">🏞️</span>
            <div>
              <strong>Katalog Destinasi</strong>
              <small>Temukan pantai pasir putih, air terjun, dan bukit kaldera</small>
            </div>
          </router-link>
          <router-link to="/jasa-lokal" class="shortcut-item">
            <span class="shortcut-icon" aria-hidden="true">🤝</span>
            <div>
              <strong>Pemandu & Homestay</strong>
              <small>Dukung ekonomi warga lokal kampung ulos dan desa wisata</small>
            </div>
          </router-link>
          <router-link to="/transportasi" class="shortcut-item">
            <span class="shortcut-icon" aria-hidden="true">⏱️</span>
            <div>
              <strong>Jadwal Kapal</strong>
              <small>Cek jadwal keberangkatan ferry Ajibata - Ambarita & Muara</small>
            </div>
          </router-link>
        </div>
      </div>

      <div class="section-card card fade-in">
        <h2 class="section-title">Aktivitas & Keamanan Akun</h2>
        <p class="section-desc">Kelola preferensi akun, foto profil, dan ulasan yang telah Anda tulis.</p>
        <div class="shortcuts-list">
          <router-link to="/settings" class="shortcut-item">
            <span class="shortcut-icon" aria-hidden="true">🔐</span>
            <div>
              <strong>Pengaturan & Kata Sandi</strong>
              <small>Perbarui data akun dan informasi kontak Anda</small>
            </div>
          </router-link>
          <router-link to="/profil" class="shortcut-item">
            <span class="shortcut-icon" aria-hidden="true">💬</span>
            <div>
              <strong>Ulasan Saya</strong>
              <small>Lihat riwayat ulasan destinasi dan jasa budaya</small>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '../auth';

const { currentUser: user } = useAuth();
</script>

<style scoped>
.dashboard-page {
  padding: 3rem 1rem 5rem;
}

.dash-hero {
  padding: 2.25rem;
  background: white;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  border-left: 5px solid #0284c7;
}

.user-role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 800;
  border-radius: 9999px;
  margin-bottom: 0.65rem;
  text-transform: uppercase;
  background: #e0f2fe;
  color: #0369a1;
}

.badge-admin-glow {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.dash-title {
  font-size: 1.85rem;
  margin-bottom: 0.5rem;
  color: #0f172a;
}

.dash-subtitle {
  color: #334155;
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 600px;
}

.dash-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.stat-card {
  padding: 1.5rem;
  background: white;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
  width: 52px;
  height: 52px;
  background: #f1f5f9;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0369a1;
  line-height: 1.2;
}

.stat-name {
  font-size: 0.85rem;
  color: #334155;
  font-weight: 600;
}

.dash-sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.section-card {
  padding: 1.75rem;
  background: white;
}

.section-title {
  font-size: 1.25rem;
  margin-bottom: 0.35rem;
  color: #0f172a;
}

.section-desc {
  font-size: 0.875rem;
  color: #334155;
  margin-bottom: 1.25rem;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-decoration: none;
  color: #0f172a;
  transition: all 0.2s ease;
}

.shortcut-item:hover {
  background: #f0f9ff;
  border-color: #0284c7;
  transform: translateX(4px);
}

.shortcut-icon {
  font-size: 1.5rem;
}

.shortcut-item strong {
  display: block;
  font-size: 0.95rem;
  color: #0369a1;
}

.shortcut-item small {
  display: block;
  font-size: 0.8rem;
  color: #334155;
}
</style>
