<template>
  <div class="home-page">
    <!-- HERO SECTION -->
    <section class="hero-section">
      <div class="hero-bg-overlay"></div>
      <div class="container hero-container">
        <div class="hero-badge fade-in">
          <span>🌿 Direktori Resmi Berbasis Komunitas Kaldera Toba</span>
        </div>
        <h1 class="hero-title fade-in">
          Temukan Keajaiban Alam & <br>
          <span class="hero-highlight">Pengalaman Budaya Batak</span> Autentik
        </h1>
        <p class="hero-subtitle fade-in">
          Jelajahi 130+ tempat wisata alam, pesan homestay warga lokal, ikuti workshop tenun ulos, dan terhubung langsung dengan pemandu komunitas Danau Toba.
        </p>

        <!-- Search Bar Widget -->
        <div class="hero-search-box glass-panel fade-in">
          <form @submit.prevent="executeSearch" class="search-form">
            <div class="search-field">
              <label class="search-label">Cari Tempat atau Layanan</label>
              <div class="input-with-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Misal: Pantai Bulbul, Workshop Ulos, Paralayang..."
                  class="search-input"
                />
              </div>
            </div>

            <div class="search-field">
              <label class="search-label">Wilayah Kabupaten</label>
              <select v-model="selectedRegency" class="search-select">
                <option value="">Semua Kabupaten (8 Wilayah)</option>
                <option v-for="r in regencies" :key="r.id" :value="r.id">
                  {{ r.name }}
                </option>
              </select>
            </div>

            <div class="search-field">
              <label class="search-label">Kategori</label>
              <select v-model="selectedCategory" class="search-select">
                <option value="">Semua Kategori</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>

            <button type="submit" class="btn btn-primary search-submit-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Jelajahi
            </button>
          </form>
        </div>

        <!-- Quick Stats Pill -->
        <div class="stats-pills-wrapper">
          <div class="stat-pill">
            <strong>{{ stats.totalDestinations || 139 }}</strong> Destinasi Terverifikasi
          </div>
          <div class="stat-pill">
            <strong>{{ stats.totalServices || 54 }}</strong> Jasa & Homestay Warga
          </div>
          <div class="stat-pill">
            <strong>{{ stats.totalTransport || 16 }}</strong> Rute Ferry & Angkutan
          </div>
          <div class="stat-pill">
            <strong>{{ stats.totalReviews || 720 }}+</strong> Ulasan Otentik
          </div>
        </div>
      </div>
    </section>

    <!-- COMMUNITY VALUE PROPOSITION (USP) -->
    <section class="usp-section">
      <div class="container">
        <div class="usp-card">
          <div class="usp-text">
            <span class="badge badge-community">Nilai Tambah JelajahToba</span>
            <h2 class="usp-title">Bukan Sekadar Direktori Wisata Umum: <br>Fokus pada Jasa Budaya & Komunitas Lokal</h2>
            <p class="usp-desc">
              Kawasan Danau Toba kaya akan kearifan lokal yang sering luput dari aplikasi komersial besar. JelajahToba hadir untuk menghubungkan wisatawan langsung dengan pelaku ekonomi lokal:
            </p>
            <div class="usp-features">
              <div class="usp-feat-item">
                <div class="feat-icon">🧶</div>
                <div>
                  <h4>Workshop Tenun Ulos Tradisional</h4>
                  <p>Belajar langsung dari inang penenun Kampung Ulos Hutaraja dan lestarikan warisan leluhur.</p>
                </div>
              </div>
              <div class="usp-feat-item">
                <div class="feat-icon">🏡</div>
                <div>
                  <h4>Homestay Autentik Ramah Warga</h4>
                  <p>Tinggal bersama masyarakat lokal, menikmati sarapan tradisional dan cerita sejarah desa.</p>
                </div>
              </div>
              <div class="usp-feat-item">
                <div class="feat-icon">🧭</div>
                <div>
                  <h4>Pemandu Budaya & Trekking Geosite</h4>
                  <p>Didampingi pemuda desa berpengalaman menelusuri sejarah Raja Sisingamangaraja dan kaldera purba.</p>
                </div>
              </div>
            </div>
            <div style="margin-top: 1.5rem;">
              <router-link to="/jasa-lokal" class="btn btn-accent">
                Lihat Semua Jasa Budaya Lokal
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURED DESTINATIONS -->
    <section class="section-padded">
      <div class="container">
        <div class="section-header-row">
          <div class="section-header">
            <span class="section-subtitle">Pilihan Wisata Populer</span>
            <h2 class="section-title">Destinasi Favorit di Sekitar Danau Toba</h2>
            <p class="section-desc">Dari perbukitan panorama hingga air terjun dan situs cagar budaya dengan penilaian tertinggi pengunjung.</p>
          </div>
          <router-link to="/destinasi" class="btn btn-secondary">
            Lihat Semua ({{ stats.totalDestinations || 139 }})
          </router-link>
        </div>

        <div v-if="loadingDestinations" class="loading-state">
          <div class="spinner"></div>
          <p>Memuat destinasi terbaik...</p>
        </div>

        <div v-else class="grid-cards">
          <DestinationCard
            v-for="dest in featuredDestinations"
            :key="dest.id"
            :item="dest"
          />
        </div>
      </div>
    </section>

    <!-- CULTURAL EXPERIENCES & LOCAL SERVICES SPOTLIGHT -->
    <section class="section-padded bg-surface-section">
      <div class="container">
        <div class="section-header-row">
          <div class="section-header">
            <span class="section-subtitle" style="color: #059669;">Pemberdayaan Masyarakat</span>
            <h2 class="section-title">Pengalaman Budaya & Layanan Komunitas</h2>
            <p class="section-desc">Dukung ekonomi masyarakat lokal dengan memesan paket kegiatan budaya dan homestay langsung dari pengelola.</p>
          </div>
          <router-link to="/jasa-lokal" class="btn btn-primary">
            Jelajahi Jasa Lokal
          </router-link>
        </div>

        <div class="grid-cards">
          <ServiceCard
            v-for="service in communityServices"
            :key="service.id"
            :service="service"
          />
        </div>
      </div>
    </section>

    <!-- FERRY & TRANSPORTATION PREVIEW -->
    <section class="section-padded">
      <div class="container">
        <div class="ferry-promo-card">
          <div class="ferry-promo-content">
            <span class="badge" style="background:#e0f2fe; color:#0369a1;">Informasi Penyeberangan Danau</span>
            <h2>Jadwal Kapal Ferry ASDP & Angkutan Darat</h2>
            <p>
              Jangan sampai tertinggal kapal penyeberangan! Periksa jadwal operasional KMP Ihan Batak, KMP Tao Toba, dan KMP Kaldera Toba antar-pelabuhan Balige, Ajibata, Tomok, Sipinggan, dan Tigaras.
            </p>
            <router-link to="/transportasi" class="btn btn-primary">
              Cek Jadwal & Estimasi Tarif Ferry
            </router-link>
          </div>
          <div class="ferry-quick-list">
            <div class="ferry-item">
              <span class="ferry-route">Ajibata (Parapat) ⇄ Ambarita (Samosir)</span>
              <span class="ferry-vessel">KMP Ihan Batak & Pora-Pora (07.30 - 20.00 WIB)</span>
            </div>
            <div class="ferry-item">
              <span class="ferry-route">Ajibata ⇄ Tomok (Samosir)</span>
              <span class="ferry-vessel">KMP Tao Toba I & II (05.00 - 19.40 WIB)</span>
            </div>
            <div class="ferry-item">
              <span class="ferry-route">Balige ⇄ Onan Runggu (Samosir)</span>
              <span class="ferry-vessel">KMP Kaldera Toba (06.30 & 08.00 WIB)</span>
            </div>
            <div class="ferry-item">
              <span class="ferry-route">Tigaras (Simalungun) ⇄ Simanindo (Samosir)</span>
              <span class="ferry-vessel">KMP Sumut I & II (07.00 - 20.00 WIB)</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- RECENT REVIEWS TICKER -->
    <section class="section-padded bg-surface-section">
      <div class="container">
        <div class="section-header" style="text-align: center; align-items: center;">
          <span class="section-subtitle">Suara Pengunjung</span>
          <h2 class="section-title">Ulasan Otentik dari Wisatawan</h2>
          <p class="section-desc">Pengalaman nyata dari wisatawan yang telah berkunjung dan menikmati layanan lokal di Danau Toba.</p>
        </div>

        <div class="reviews-grid">
          <div v-for="rev in recentReviews" :key="rev.id" class="review-box card">
            <div class="review-header">
              <div class="reviewer-avatar">{{ (rev.reviewer_name || 'U')[0].toUpperCase() }}</div>
              <div>
                <h4 class="reviewer-name">{{ rev.reviewer_name }}</h4>
                <span class="review-target">{{ rev.target_name }}</span>
              </div>
              <div class="review-stars">
                ★ {{ Number(rev.rating || 5).toFixed(1) }}
              </div>
            </div>
            <p class="review-body">"{{ rev.review_text }}"</p>
            <span class="review-date">{{ rev.created_at }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../api';
import DestinationCard from '../components/DestinationCard.vue';
import ServiceCard from '../components/ServiceCard.vue';

const router = useRouter();

const searchQuery = ref('');
const selectedRegency = ref('');
const selectedCategory = ref('');

const regencies = ref([]);
const categories = ref([]);
const stats = ref({});
const featuredDestinations = ref([]);
const communityServices = ref([]);
const recentReviews = ref([]);
const loadingDestinations = ref(true);

function executeSearch() {
  const query = {};
  if (searchQuery.value.trim()) query.search = searchQuery.value.trim();
  if (selectedRegency.value) query.regency = selectedRegency.value;
  if (selectedCategory.value) query.category = selectedCategory.value;
  router.push({ path: '/destinasi', query });
}

onMounted(async () => {
  try {
    const [regRes, catRes, statRes, featRes, servRes] = await Promise.all([
      api.getRegencies(),
      api.getCategories(),
      api.getStats(),
      api.getFeaturedDestinations(),
      api.getServices({ limit: 4, community_only: 1 })
    ]);

    if (regRes.success) regencies.value = regRes.data;
    if (catRes.success) categories.value = catRes.data;
    if (statRes.success) {
      stats.value = statRes.data;
      recentReviews.value = statRes.data.recentReviews || [];
    }
    if (featRes.success) featuredDestinations.value = featRes.data;
    if (servRes.success) communityServices.value = servRes.data;
  } catch (err) {
    console.error('Error loading home data:', err);
  } finally {
    loadingDestinations.value = false;
  }
});
</script>

<style scoped>
.hero-section {
  position: relative;
  background: linear-gradient(135deg, #082f49 0%, #0369a1 60%, #0f766e 100%);
  color: white;
  padding: 5.5rem 0 4.5rem;
  overflow: hidden;
}

.hero-bg-overlay {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 20% 30%, rgba(56, 189, 248, 0.2) 0%, transparent 40%),
                    radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.15) 0%, transparent 40%);
  pointer-events: none;
}

.hero-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.hero-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  color: white;
  line-height: 1.15;
  margin-bottom: 1.25rem;
  max-width: 850px;
}

.hero-highlight {
  background: linear-gradient(90deg, #38bdf8 0%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.15rem;
  color: #e0f2fe;
  max-width: 680px;
  margin-bottom: 2.5rem;
  line-height: 1.6;
}

.hero-search-box {
  width: 100%;
  max-width: 980px;
  padding: 1.5rem;
  border-radius: var(--radius-xl);
  margin-bottom: 2.5rem;
}

.search-form {
  display: grid;
  grid-template-columns: 2fr 1.3fr 1.3fr auto;
  gap: 1rem;
  align-items: flex-end;
}

.search-field {
  display: flex;
  flex-direction: column;
  text-align: left;
  gap: 0.35rem;
}

.search-label {
  font-size: 0.775rem;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-icon svg {
  position: absolute;
  left: 0.85rem;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 0.75rem 0.85rem 0.75rem 2.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  font-size: 0.95rem;
  outline: none;
}

.search-select {
  width: 100%;
  padding: 0.75rem 0.85rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  font-size: 0.95rem;
  outline: none;
  background: white;
}

.search-submit-btn {
  height: 46px;
  padding: 0 1.5rem;
  font-size: 1rem;
}

.stats-pills-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}

.stat-pill {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);
  padding: 0.45rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  color: #e0f2fe;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.stat-pill strong {
  color: white;
}

/* USP Section */
.usp-section {
  margin-top: -1.5rem;
  position: relative;
  z-index: 20;
}

.usp-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: 2.5rem;
  box-shadow: var(--shadow-xl);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.usp-title {
  font-size: 1.85rem;
  margin: 0.75rem 0 0.85rem;
  color: var(--primary-900);
}

.usp-desc {
  color: var(--text-muted);
  font-size: 1.05rem;
  max-width: 800px;
  margin-bottom: 1.75rem;
}

.usp-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.usp-feat-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  background: #f8fafc;
  padding: 1.25rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}

.feat-icon {
  font-size: 1.75rem;
  line-height: 1;
}

.usp-feat-item h4 {
  font-size: 1rem;
  margin-bottom: 0.35rem;
}

.usp-feat-item p {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.45;
}

/* Sections */
.section-padded {
  padding: 4.5rem 0;
}

.bg-surface-section {
  background-color: var(--bg-surface);
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2.25rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-muted);
  gap: 1rem;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--primary-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Ferry Promo Card */
.ferry-promo-card {
  background: linear-gradient(135deg, #075985 0%, #0369a1 100%);
  color: white;
  border-radius: var(--radius-xl);
  padding: 2.75rem;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 2.5rem;
  align-items: center;
  box-shadow: var(--shadow-xl);
}

.ferry-promo-content h2 {
  color: white;
  font-size: 1.85rem;
  margin: 0.75rem 0 0.85rem;
}

.ferry-promo-content p {
  color: #e0f2fe;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.ferry-quick-list {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  padding: 1.25rem;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.ferry-item {
  display: flex;
  flex-direction: column;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.ferry-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.ferry-route {
  font-weight: 700;
  font-size: 0.9rem;
}

.ferry-vessel {
  font-size: 0.775rem;
  color: #bae6fd;
}

/* Reviews Grid */
.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.review-box {
  padding: 1.5rem;
  background: white;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.reviewer-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--primary-100);
  color: var(--primary-700);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
}

.reviewer-name {
  font-size: 0.95rem;
  color: var(--text-main);
  line-height: 1.2;
}

.review-target {
  font-size: 0.75rem;
  color: var(--primary-600);
}

.review-stars {
  margin-left: auto;
  font-size: 0.85rem;
  font-weight: 700;
  color: #f59e0b;
}

.review-body {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.5;
  font-style: italic;
  margin-bottom: 0.85rem;
}

.review-date {
  font-size: 0.725rem;
  color: var(--text-subtle);
}

@media (max-width: 992px) {
  .hero-title {
    font-size: 2.25rem;
  }
  .search-form {
    grid-template-columns: 1fr;
  }
  .ferry-promo-card {
    grid-template-columns: 1fr;
  }
}
</style>
