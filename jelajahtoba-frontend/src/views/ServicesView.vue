<template>
  <div class="services-page container">
    <!-- PAGE HEADER -->
    <div class="page-header">
      <div class="badge badge-community" style="margin-bottom: 0.75rem;">Fokus Unggulan JelajahToba</div>
      <h1 class="page-title">Jasa Budaya, Homestay & Pengalaman Lokal</h1>
      <p class="page-desc">
        Temukan pengalaman autentik yang dikelola langsung oleh masyarakat lokal Danau Toba: homestay ramah warga, workshop menenun ulos, tari tor-tor, pemandu sejarah, dan olahraga air tradisional.
      </p>
    </div>

    <!-- SERVICE TYPE TABS -->
    <div class="type-tabs">
      <button
        class="tab-btn"
        :class="{ active: currentType === '' }"
        @click="setType('')"
      >
        ✨ Semua Layanan ({{ total }})
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentType === 'cultural_experience' }"
        @click="setType('cultural_experience')"
      >
        🧶 Workshop & Budaya
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentType === 'homestay' }"
        @click="setType('homestay')"
      >
        🏡 Homestay Warga
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentType === 'tour_guide' }"
        @click="setType('tour_guide')"
      >
        🧭 Pemandu Lokal
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentType === 'adventure' }"
        @click="setType('adventure')"
      >
        🛶 Petualangan & Tubing
      </button>
    </div>

    <!-- FILTER TOOLBAR -->
    <div class="services-filter card">
      <div class="search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Cari nama layanan, penyedia, atau aktivitas..."
          @input="debounceSearch"
        />
      </div>

      <select v-model="selectedRegency" @change="fetchServices" class="form-select" style="max-width: 240px;">
        <option value="">Semua Kabupaten</option>
        <option v-for="r in regencies" :key="r.id" :value="r.id">{{ r.name }}</option>
      </select>

      <label class="community-checkbox">
        <input type="checkbox" v-model="communityOnly" @change="fetchServices" />
        <span>Hanya Dikelola Warga</span>
      </label>
    </div>

    <!-- LOADING / EMPTY / GRID -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Memuat jasa dan pengalaman lokal...</p>
    </div>

    <div v-else-if="services.length === 0" class="empty-state card">
      <div class="empty-icon">🤝</div>
      <h3>Belum Ada Layanan yang Sesuai</h3>
      <p>Silakan coba kata kunci lain atau pilih kategori layanan berbeda.</p>
      <button @click="resetFilter" class="btn btn-primary" style="margin-top: 1rem;">Tampilkan Semua</button>
    </div>

    <div v-else class="grid-cards fade-in">
      <ServiceCard
        v-for="srv in services"
        :key="srv.id"
        :service="srv"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api';
import ServiceCard from '../components/ServiceCard.vue';

const route = useRoute();
const router = useRouter();

const services = ref([]);
const regencies = ref([]);
const total = ref(0);
const loading = ref(true);

const currentType = ref(route.query.service_type || '');
const selectedRegency = ref(route.query.regency || '');
const search = ref(route.query.search || '');
const communityOnly = ref(false);

let timeout = null;
function debounceSearch() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    fetchServices();
  }, 400);
}

function setType(type) {
  currentType.value = type;
  fetchServices();
}

function resetFilter() {
  currentType.value = '';
  selectedRegency.value = '';
  search.value = '';
  communityOnly.value = false;
  fetchServices();
}

async function fetchServices() {
  loading.value = true;
  try {
    const params = { limit: 50 };
    if (currentType.value) params.service_type = currentType.value;
    if (selectedRegency.value) params.regency = selectedRegency.value;
    if (search.value.trim()) params.search = search.value.trim();
    if (communityOnly.value) params.community_only = '1';

    const res = await api.getServices(params);
    if (res.success) {
      services.value = res.data;
      total.value = res.total;
    }
  } catch (err) {
    console.error('Error fetching services:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    const rRes = await api.getRegencies();
    if (rRes.success) regencies.value = rRes.data;
  } catch (e) {}
  fetchServices();
});
</script>

<style scoped>
.services-page {
  padding-top: 2.5rem;
  padding-bottom: 5rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2.4rem;
  margin-bottom: 0.5rem;
}

.page-desc {
  color: var(--text-muted);
  font-size: 1.05rem;
  max-width: 780px;
}

.type-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.tab-btn {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.65rem 1.25rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
  background: white;
  color: #475569;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.tab-btn.active {
  background: var(--primary-600);
  color: white;
  border-color: var(--primary-600);
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);
}

.services-filter {
  padding: 1.25rem;
  margin-bottom: 2.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  background: white;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 260px;
  display: flex;
  align-items: center;
}

.search-box svg {
  position: absolute;
  left: 0.85rem;
  color: #94a3b8;
}

.search-box input {
  width: 100%;
  padding: 0.7rem 0.85rem 0.7rem 2.4rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  font-size: 0.95rem;
  outline: none;
}

.community-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #047857;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  align-items: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
</style>
