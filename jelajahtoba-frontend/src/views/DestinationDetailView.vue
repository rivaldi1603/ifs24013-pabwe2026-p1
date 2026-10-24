<template>
  <div class="destination-detail-page container">
    <div v-if="loading" class="loading-state" style="padding: 6rem 0;">
      <div class="spinner"></div>
      <p>Memuat informasi destinasi...</p>
    </div>

    <div v-else-if="!dest" class="empty-state card">
      <h3>Destinasi Tidak Ditemukan</h3>
      <p>Destinasi wisata yang Anda cari tidak tersedia atau tautan tidak valid.</p>
      <router-link to="/destinasi" class="btn btn-primary" style="margin-top: 1rem;">Kembali ke Direktori</router-link>
    </div>

    <div v-else class="detail-content fade-in">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <router-link to="/">Beranda</router-link>
        <span>/</span>
        <router-link to="/destinasi">Destinasi</router-link>
        <span>/</span>
        <span class="active">{{ dest.name }}</span>
      </nav>

      <!-- HERO BANNER -->
      <div class="detail-hero card">
        <div class="hero-image-box">
          <img :src="dest.image_url || defaultImage" :alt="dest.name" class="detail-main-img" @error="onImgError" />
          <div class="hero-tags">
            <span class="badge badge-regency">{{ dest.regency_name }}</span>
            <span class="badge badge-category">{{ dest.category_name }}</span>
            <span v-if="dest.is_community_managed" class="badge badge-community">🌿 Dikelola Komunitas</span>
          </div>
        </div>

        <div class="hero-info-box">
          <div class="rating-header">
            <div class="stars-display">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span class="rating-score">{{ Number(dest.rating_avg || 4.5).toFixed(1) }}</span>
              <span class="rating-total">({{ dest.review_count || dest.reviews?.length || 0 }} Ulasan)</span>
            </div>
            <span class="status-badge" :class="dest.status === 'beroperasi' ? 'status-open' : 'status-closed'">
              ● {{ dest.status || 'Beroperasi' }}
            </span>
          </div>

          <h1 class="dest-title">{{ dest.name }}</h1>

          <p class="dest-address">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {{ dest.address || 'Kawasan Danau Toba, Sumatera Utara' }}
          </p>

          <!-- Quick Spec Grid -->
          <div class="specs-grid">
            <div class="spec-item">
              <span class="spec-label">Harga Tiket Masuk</span>
              <span class="spec-value">{{ dest.price_display || 'Gratis' }}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Jam Operasional</span>
              <span class="spec-value">{{ dest.operational_hours || '08.00 - 18.00 WIB' }}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Koordinat Lokasi</span>
              <span class="spec-value">{{ dest.latitude && dest.longitude ? `${dest.latitude}, ${dest.longitude}` : 'Tersedia di Peta' }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="hero-actions">
            <a
              v-if="dest.latitude && dest.longitude"
              :href="`https://www.google.com/maps/search/?api=1&query=${dest.latitude},${dest.longitude}`"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
              </svg>
              Buka Google Maps
            </a>

            <a
              :href="whatsappUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-whatsapp"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              WhatsApp Pengelola
            </a>

            <button @click="showReviewModal = true" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              Tulis Ulasan
            </button>
          </div>
        </div>
      </div>

      <!-- MAIN DESCRIPTION & DETAILS -->
      <div class="details-grid">
        <div class="details-main">
          <div class="card detail-section-card">
            <h2 class="section-card-title">Deskripsi Objek Wisata</h2>
            <div class="dest-description-text">
              <p>{{ dest.description || 'Destinasi wisata unggulan di Danau Toba dengan keindahan panorama alam dan keramahan masyarakat setempat.' }}</p>
            </div>
          </div>

          <!-- REVIEWS SECTION -->
          <div class="card detail-section-card" id="reviews-section">
            <div class="reviews-header-row">
              <div>
                <h2 class="section-card-title">Ulasan Pengunjung ({{ dest.reviews?.length || 0 }})</h2>
                <p class="section-card-desc">Pengalaman dan tanggapan nyata dari wisatawan yang pernah berkunjung.</p>
              </div>
              <button @click="showReviewModal = true" class="btn btn-secondary btn-sm">
                + Tambah Ulasan
              </button>
            </div>

            <div v-if="!dest.reviews || dest.reviews.length === 0" class="no-reviews">
              <p>Belum ada ulasan untuk tempat ini. Jadilah yang pertama memberikan ulasan!</p>
            </div>

            <div v-else class="reviews-list">
              <div v-for="rev in dest.reviews" :key="rev.id" class="review-item">
                <div class="review-top">
                  <div class="reviewer-meta">
                    <div class="avatar">{{ rev.reviewer_name[0].toUpperCase() }}</div>
                    <div>
                      <span class="name">{{ rev.reviewer_name }}</span>
                      <span class="date">{{ rev.created_at }}</span>
                    </div>
                  </div>
                  <div class="stars">
                    ★ {{ Number(rev.rating).toFixed(1) }}
                  </div>
                </div>
                <p class="comment">"{{ rev.review_text }}"</p>
              </div>
            </div>
          </div>
        </div>

        <!-- SIDEBAR RELATED DESTINATIONS -->
        <div class="details-sidebar">
          <div class="card detail-section-card">
            <h3 class="sidebar-title">Wisata Terkait di Sekitar</h3>
            <p class="sidebar-desc">Rekomendasi destinasi lain di {{ dest.regency_name }}:</p>

            <div class="related-list">
              <router-link
                v-for="rel in dest.related"
                :key="rel.id"
                :to="`/destinasi/${rel.slug || rel.id}`"
                class="related-item"
              >
                <img :src="rel.image_url || defaultImage" :alt="rel.name" class="related-thumb" @error="onImgError" />
                <div class="related-info">
                  <h4 class="related-name">{{ rel.name }}</h4>
                  <span class="related-price">{{ rel.price_display }}</span>
                  <div class="related-rating">★ {{ Number(rel.rating_avg || 4.5).toFixed(1) }}</div>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Review Modal -->
    <ReviewModal
      :is-open="showReviewModal"
      target-type="destination"
      :target-id="dest ? dest.id : 0"
      :target-title="dest ? dest.name : ''"
      @close="showReviewModal = false"
      @review-submitted="onReviewSubmitted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api';
import ReviewModal from '../components/ReviewModal.vue';

const route = useRoute();
const dest = ref(null);
const loading = ref(true);
const showReviewModal = ref(false);

const defaultImage = 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=800&q=80';

function onImgError(e) {
  e.target.src = defaultImage;
}

const whatsappUrl = computed(() => {
  if (!dest.value) return '';
  const wa = dest.value.contact_wa || '6281260008888';
  const text = encodeURIComponent(`Halo pengelola ${dest.value.name}, saya mendapatkan kontak dari JelajahToba dan ingin menanyakan informasi tiket & kunjungan.`);
  return `https://wa.me/${wa}?text=${text}`;
});

async function loadDetail() {
  loading.value = true;
  try {
    const slug = route.params.slug;
    const res = await api.getDestinationDetail(slug);
    if (res.success) {
      dest.value = res.data;
    } else {
      dest.value = null;
    }
  } catch (err) {
    console.error('Error loading destination:', err);
    dest.value = null;
  } finally {
    loading.value = false;
  }
}

function onReviewSubmitted(data) {
  if (dest.value) {
    dest.value.rating_avg = data.rating_avg;
    dest.value.review_count = data.review_count;
    loadDetail();
  }
}

watch(() => route.params.slug, () => {
  loadDetail();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

onMounted(() => {
  loadDetail();
});
</script>

<style scoped>
.destination-detail-page {
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

.breadcrumb .active {
  color: var(--primary-900);
  font-weight: 600;
}

.detail-hero {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  overflow: hidden;
  margin-bottom: 2.5rem;
}

.hero-image-box {
  position: relative;
  min-height: 380px;
  background: #cbd5e1;
}

.detail-main-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-tags {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  align-items: flex-start;
}

.hero-info-box {
  padding: 2.25rem;
  display: flex;
  flex-direction: column;
}

.rating-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.stars-display {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.rating-score {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--primary-900);
}

.rating-total {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-full);
}

.status-open {
  background: #dcfce7;
  color: #15803d;
}

.dest-title {
  font-size: 2.2rem;
  line-height: 1.2;
  margin-bottom: 0.75rem;
}

.dest-address {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-bottom: 1.75rem;
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  background: #f8fafc;
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  margin-bottom: 2rem;
}

.spec-item {
  display: flex;
  flex-direction: column;
}

.spec-label {
  font-size: 0.725rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 600;
}

.spec-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--primary-900);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: auto;
}

.details-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.detail-section-card {
  padding: 1.75rem;
  margin-bottom: 1.75rem;
}

.section-card-title {
  font-size: 1.35rem;
  margin-bottom: 1rem;
}

.dest-description-text {
  font-size: 1.05rem;
  color: #334155;
  line-height: 1.8;
  white-space: pre-line;
}

.reviews-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.section-card-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.review-item {
  padding: 1rem;
  background: #f8fafc;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.review-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.reviewer-meta {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.reviewer-meta .avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-600);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}

.reviewer-meta .name {
  font-weight: 700;
  font-size: 0.9rem;
  display: block;
}

.reviewer-meta .date {
  font-size: 0.75rem;
  color: var(--text-subtle);
}

.review-top .stars {
  font-size: 0.85rem;
  font-weight: 700;
  color: #f59e0b;
}

.review-item .comment {
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.5;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.related-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.related-item:hover {
  background: #f1f5f9;
}

.related-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.related-name {
  font-size: 0.9rem;
  line-height: 1.3;
  margin-bottom: 0.2rem;
}

.related-price {
  font-size: 0.775rem;
  color: var(--text-muted);
  display: block;
}

.related-rating {
  font-size: 0.775rem;
  font-weight: 700;
  color: #f59e0b;
}

@media (max-width: 992px) {
  .detail-hero {
    grid-template-columns: 1fr;
  }
  .details-grid {
    grid-template-columns: 1fr;
  }
  .specs-grid {
    grid-template-columns: 1fr;
  }
}
</style>
