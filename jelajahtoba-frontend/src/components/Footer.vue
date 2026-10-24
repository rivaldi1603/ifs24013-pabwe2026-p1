<template>
  <footer class="footer-wrapper">
    <div class="container footer-content">
      <div class="footer-brand">
        <div class="footer-logo">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>
              <circle cx="12" cy="9" r="2.5"></circle>
            </svg>
          </div>
          <span class="footer-brand-title">Jelajah<span style="color:#38bdf8;">Toba</span></span>
        </div>
        <p class="footer-bio">
          Platform direktori wisata, homestay warga, pemandu lokal, dan pelestarian budaya berbasis masyarakat di Kawasan Kaldera Danau Toba (UNESCO Global Geopark).
        </p>
        <div class="footer-badge">
          <span>🌿 Dikelola & Diberdayakan Bersama Masyarakat Lokal</span>
        </div>
      </div>

      <div class="footer-links-group">
        <h2>Wilayah Kaldera</h2>
        <ul>
          <li><router-link to="/destinasi?regency=1">Kabupaten Toba</router-link></li>
          <li><router-link to="/destinasi?regency=2">Kabupaten Samosir</router-link></li>
          <li><router-link to="/destinasi?regency=3">Kabupaten Simalungun</router-link></li>
          <li><router-link to="/destinasi?regency=4">Kabupaten Tapanuli Utara</router-link></li>
          <li><router-link to="/destinasi?regency=5">Kabupaten Humbang Hasundutan</router-link></li>
          <li><router-link to="/destinasi?regency=6">Kabupaten Dairi & Karo</router-link></li>
        </ul>
      </div>

      <div class="footer-links-group">
        <h2>Fitur Layanan</h2>
        <ul>
          <li><router-link to="/destinasi">Direktori Objek Wisata</router-link></li>
          <li><router-link to="/jasa-lokal">Homestay & Pemandu Lokal</router-link></li>
          <li><router-link to="/jasa-lokal?service_type=cultural_experience">Workshop Tenun & Seni Budaya</router-link></li>
          <li><router-link to="/transportasi">Jadwal Kapal Ferry ASDP</router-link></li>
          <li><router-link to="/kuliner">Kuliner Tradisi Batak</router-link></li>
          <li><router-link to="/dashboard">Dashboard Pengelolaan</router-link></li>
        </ul>
      </div>

      <div class="footer-links-group">
        <h2>Konteks Proyek</h2>
        <p class="footer-note">
          Pengembangan Aplikasi Berbasis Web (PABWE)<br>
          Institut Teknologi Del (IT DEL)<br>
          Teknologi: Vue 3 + Express.js + SQLite.
        </p>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="container footer-bottom-inner">
        <p>© 2026 JelajahToba. Hak Cipta Dilindungi Undang-Undang. Pariwisata Berkelanjutan Danau Toba.</p>
        <p class="developer-tag">Dibangun untuk Proyek 1 PABWE</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-wrapper {
  background: #0f172a;
  color: #94a3b8;
  margin-top: auto;
  padding-top: 4rem;
  border-top: 1px solid #1e293b;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.2fr;
  gap: 3rem;
  padding-bottom: 3.5rem;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.brand-icon {
  width: 36px;
  height: 36px;
  background: #0284c7;
  color: white;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-brand-title {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 800;
  color: white;
}

.footer-bio {
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 1.25rem;
}

.footer-badge {
  display: inline-block;
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
  font-size: 0.775rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-full);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.footer-links-group h2,
.footer-links-group h4 {
  color: white;
  font-size: 1.05rem;
  margin-bottom: 1.25rem;
}

.footer-links-group ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.footer-links-group a {
  color: #94a3b8;
  font-size: 0.875rem;
  transition: color var(--transition-fast);
}

.footer-links-group a:hover {
  color: #38bdf8;
}

.footer-note {
  font-size: 0.85rem;
  line-height: 1.6;
}

.footer-bottom {
  border-top: 1px solid #1e293b;
  padding: 1.5rem 0;
  font-size: 0.825rem;
  background: #090d16;
}

.footer-bottom-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.developer-tag {
  color: #38bdf8;
  font-weight: 600;
}

@media (max-width: 992px) {
  .footer-content {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
}

@media (max-width: 600px) {
  .footer-content {
    grid-template-columns: 1fr;
  }
}
</style>
