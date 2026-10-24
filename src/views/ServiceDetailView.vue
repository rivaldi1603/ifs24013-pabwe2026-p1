<template>
  <div class="service-detail-page container">
    <div v-if="loading" class="loading-state" style="padding: 6rem 0;">
      <div class="spinner"></div>
      <p>Memuat detail layanan...</p>
    </div>

    <div v-else-if="!srv" class="empty-state card">
      <h3>Layanan Tidak Ditemukan</h3>
      <p>{{ errorMessage || 'Informasi jasa atau homestay tidak tersedia.' }}</p>
      <div style="margin-top: 1rem; display: flex; gap: 0.75rem; justify-content: center;">
        <button @click="loadDetail" class="btn btn-secondary">Coba Muat Ulang</button>
        <router-link to="/jasa-lokal" class="btn btn-primary">Kembali ke Daftar</router-link>
      </div>
    </div>

    <div v-else class="fade-in">
      <nav class="breadcrumb">
        <router-link to="/">Beranda</router-link>
        <span>/</span>
        <router-link to="/jasa-lokal">Jasa Budaya & Homestay</router-link>
        <span>/</span>
        <span class="active">{{ srv.name }}</span>
      </nav>

      <div class="service-detail-card card">
        <div class="service-detail-header">
          <div>
            <div class="badges-row">
              <span class="badge badge-regency">{{ srv.regency_name }}</span>
              <span class="badge" style="background:#ede9fe; color:#6d28d9;">{{ formatServiceType(srv.service_type) }}</span>
              <span v-if="srv.is_community_managed" class="badge badge-community">🌿 Berbasis Komunitas</span>
            </div>
            <h1 class="service-headline">{{ srv.name }}</h1>
            <p class="service-provider-line">
              Dikelola oleh: <strong>{{ srv.provider_name }}</strong>
            </p>
          </div>

          <div class="price-banner">
            <span class="price-title">Estimasi Tarif</span>
            <span class="price-amount">{{ srv.price_display }}</span>
            <span class="price-sub">{{ srv.price_unit ? `(${srv.price_unit})` : '' }}</span>
          </div>
        </div>

        <div class="service-contact-bar">
          <div class="address-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>{{ srv.address || 'Kawasan Danau Toba' }}</span>
          </div>

          <div class="contact-buttons">
            <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              Chat WhatsApp
            </a>
            <button @click="showReviewModal = true" class="btn btn-secondary">
              Beri Ulasan
            </button>
          </div>
        </div>

        <div class="service-body-grid">
          <div class="service-main-text">
            <h3>Tentang Layanan & Nilai Budaya</h3>
            <div class="desc-content">
              <p>{{ srv.description }}</p>
            </div>

            <div v-if="srv.facilities" class="facilities-box">
              <h4>Fasilitas & Perlengkapan yang Disediakan</h4>
              <p>{{ srv.facilities }}</p>
            </div>

            <!-- REVIEWS -->
            <div class="service-reviews-section">
              <div class="reviews-title-row">
                <h3>Ulasan Pelanggan ({{ srv.reviews?.length || 0 }})</h3>
                <span class="rating-display">★ {{ Number(srv.rating_avg || 4.8).toFixed(1) }}</span>
              </div>

              <div v-if="!srv.reviews || srv.reviews.length === 0" class="no-reviews">
                <p>Belum ada ulasan untuk layanan ini. Jadilah yang pertama memberikan review!</p>
              </div>

              <div v-else class="reviews-list">
                <div v-for="rev in srv.reviews" :key="rev.id" class="review-box card">
                  <div class="rev-header">
                    <strong>{{ rev.reviewer_name }}</strong>
                    <span>★ {{ Number(rev.rating).toFixed(1) }}</span>
                  </div>
                  <p class="rev-text">"{{ rev.review_text }}"</p>
                  <span class="rev-date">{{ rev.created_at }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="service-sidebar">
            <div class="card booking-help-card">
              <h4>Petunjuk Pemesanan</h4>
              <p>
                1. Klik tombol WhatsApp untuk menghubungi pengelola secara langsung.<br>
                2. Informasikan tanggal kunjungan dan jumlah peserta.<br>
                3. Transaksi dilakukan langsung dengan pengelola warga tanpa potongan komisi.
              </p>
              <div class="safety-badge">
                🛡️ Terverifikasi Tim JelajahToba
              </div>
            </div>

            <!-- Jasa Terkait / Serupa di Sekitar -->
            <div v-if="srv.related && srv.related.length > 0" class="card related-services-card" style="margin-top: 1.5rem; padding: 1.25rem;">
              <h4 style="font-size: 1rem; margin-bottom: 0.85rem; color: var(--primary-900);">Layanan Terkait di Sekitar</h4>
              <div class="related-list" style="display: flex; flex-direction: column; gap: 0.85rem;">
                <router-link
                  v-for="rel in srv.related"
                  :key="rel.id"
                  :to="`/jasa-lokal/${rel.slug || rel.id}`"
                  class="related-item card"
                  style="padding: 0.75rem; border: 1px solid var(--border-subtle); text-decoration: none; display: block; border-radius: 8px; transition: all 0.2s ease;"
                >
                  <span class="badge" style="background:#ede9fe; color:#6d28d9; font-size: 0.7rem; margin-bottom: 0.25rem; display: inline-block;">
                    {{ formatServiceType(rel.service_type) }}
                  </span>
                  <div style="font-size: 0.92rem; font-weight: 600; color: var(--text-dark); margin-bottom: 0.25rem;">{{ rel.name }}</div>
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
                    <span style="color: #0284c7; font-weight: 700;">{{ rel.price_display }}</span>
                    <span style="color: #f59e0b; font-weight: 600;">★ {{ Number(rel.rating_avg || 4.8).toFixed(1) }}</span>
                  </div>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Review Modal -->
    <ReviewModal
      :is-open="showReviewModal"
      target-type="service"
      :target-id="srv ? srv.id : 0"
      :target-title="srv ? srv.name : ''"
      @close="showReviewModal = false"
      @review-submitted="loadDetail"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api';
import ReviewModal from '../components/ReviewModal.vue';

const route = useRoute();
const srv = ref(null);
const loading = ref(true);
const errorMessage = ref('');
const showReviewModal = ref(false);

function formatServiceType(type) {
  const map = {
    'homestay': 'Homestay Warga',
    'cultural_experience': 'Workshop & Budaya',
    'tour_guide': 'Pemandu Lokal',
    'adventure': 'Petualangan Air/Alam',
    'boat_rental': 'Sewa Solu / Perahu'
  };
  return map[type] || 'Layanan Lokal';
}

const whatsappUrl = computed(() => {
  if (!srv.value) return '';
  const wa = srv.value.contact_wa || '6281260008888';
  const text = encodeURIComponent(`Halo ${srv.value.provider_name}, saya melihat layanan "${srv.value.name}" di JelajahToba dan ingin menanyakan ketersediaan serta reservasi.`);
  return `https://wa.me/${wa}?text=${text}`;
});

async function loadDetail() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const slug = route.params.slug;
    const res = await api.getServiceDetail(slug);
    if (res.success) {
      srv.value = res.data;
    } else {
      srv.value = null;
      errorMessage.value = res.message || 'Layanan tidak ditemukan.';
    }
  } catch (err) {
    console.error('Error loading service:', err);
    srv.value = null;
    errorMessage.value = 'Gagal terhubung ke server backend.';
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.slug, (newSlug) => {
  if (newSlug) {
    loadDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

onMounted(() => {
  loadDetail();
});
</script>

<style scoped>
.service-detail-page {
  padding-top: 2rem;
  padding-bottom: 5rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.breadcrumb a:hover {
  color: var(--primary-600);
}

.service-detail-card {
  padding: 2.25rem;
}

.service-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
  flex-wrap: wrap;
  gap: 1.5rem;
}

.badges-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.service-headline {
  font-size: 2.2rem;
  line-height: 1.2;
  margin-bottom: 0.4rem;
}

.service-provider-line {
  color: #475569;
  font-size: 0.95rem;
}

.price-banner {
  background: #f8fafc;
  border: 1px solid var(--border-subtle);
  padding: 1rem 1.5rem;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.price-title {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 600;
}

.price-amount {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--primary-900);
}

.price-sub {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.service-contact-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--border-subtle);
  flex-wrap: wrap;
  gap: 1rem;
}

.address-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: #475569;
  font-size: 0.95rem;
}

.contact-buttons {
  display: flex;
  gap: 0.75rem;
}

.service-body-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2.5rem;
  padding-top: 2rem;
}

.service-main-text h3 {
  font-size: 1.35rem;
  margin-bottom: 0.85rem;
}

.desc-content {
  font-size: 1.05rem;
  color: #334155;
  line-height: 1.8;
  white-space: pre-line;
  margin-bottom: 2rem;
}

.facilities-box {
  background: #f8fafc;
  padding: 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  margin-bottom: 2.5rem;
}

.facilities-box h4 {
  font-size: 1rem;
  margin-bottom: 0.45rem;
}

.facilities-box p {
  color: #475569;
  font-size: 0.95rem;
}

.service-reviews-section {
  border-top: 1px solid var(--border-subtle);
  padding-top: 2rem;
}

.reviews-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.rating-display {
  font-size: 1.15rem;
  font-weight: 800;
  color: #f59e0b;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-box {
  padding: 1rem;
}

.rev-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 0.35rem;
  color: var(--primary-900);
}

.rev-text {
  font-size: 0.875rem;
  color: #475569;
  margin-bottom: 0.45rem;
}

.rev-date {
  font-size: 0.725rem;
  color: var(--text-subtle);
}

.booking-help-card {
  padding: 1.5rem;
  background: var(--bg-surface);
}

.booking-help-card h4 {
  margin-bottom: 0.75rem;
}

.booking-help-card p {
  font-size: 0.875rem;
  line-height: 1.6;
  color: #475569;
  margin-bottom: 1rem;
}

.safety-badge {
  background: #dcfce7;
  color: #15803d;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-md);
  text-align: center;
}

@media (max-width: 992px) {
  .service-body-grid {
    grid-template-columns: 1fr;
  }
  .service-detail-header {
    flex-direction: column;
  }
  .price-banner {
    align-items: flex-start;
    width: 100%;
  }
}
</style>
