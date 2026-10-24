<template>
  <div class="destinations-page container">
    <!-- PAGE HEADER -->
    <div class="page-header">
      <span class="section-subtitle">Katalog Lengkap Kaldera Toba</span>
      <h1 class="page-title">Direktori Objek Wisata</h1>
      <p class="page-desc">Temukan keindahan alam Danau Toba, geosite warisan dunia, desa wisata, dan situs sejarah Batak yang telah terverifikasi.</p>
    </div>

    <!-- FILTER & SEARCH TOOLBAR -->
    <div class="filter-toolbar card">
      <div class="toolbar-top">
        <div class="search-input-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Cari nama tempat atau lokasi..."
            @input="debounceSearch"
          />
          <button v-if="search" @click="clearSearch" class="clear-btn">&times;</button>
        </div>

        <div class="select-filters">
          <select v-model="selectedRegency" @change="applyFilters" class="form-select filter-select">
            <option value="">Semua Kabupaten</option>
            <option v-for="r in regencies" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>

          <select v-model="selectedCategory" @change="applyFilters" class="form-select filter-select">
            <option value="">Semua Kategori</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>

          <select v-model="sortBy" @change="applyFilters" class="form-select filter-select">
            <option value="">Urutkan: Standar</option>
            <option value="rating">Rating Tertinggi</option>
            <option value="reviews">Ulasan Terbanyak</option>
            <option value="price_low">Harga Terendah</option>
            <option value="price_high">Harga Tertinggi</option>
          </select>
        </div>
      </div>

      <div class="toolbar-bottom">
        <label class="community-toggle">
          <input type="checkbox" v-model="communityOnly" @change="applyFilters" />
          <span class="toggle-text">🌿 Hanya yang Dikelola Masyarakat / Pokdarwis</span>
        </label>

        <div class="filter-status">
          <span>Menampilkan <strong>{{ total }}</strong> tempat wisata</span>
          <button v-if="hasActiveFilters" @click="resetFilters" class="btn-reset">Reset Filter</button>
        </div>
      </div>
    </div>

    <!-- CONTENT GRID -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Memuat tempat wisata...</p>
    </div>

    <div v-else-if="destinations.length === 0" class="empty-state card">
      <div class="empty-icon">🔍</div>
      <h3>Tidak Ada Tempat yang Sesuai</h3>
      <p>Coba gunakan kata kunci lain atau ubah filter kabupaten dan kategori Anda.</p>
      <button @click="resetFilters" class="btn btn-primary" style="margin-top: 1rem;">Lihat Semua Tempat</button>
    </div>

    <div v-else class="grid-cards fade-in">
      <DestinationCard
        v-for="item in destinations"
        :key="item.id"
        :item="item"
      />
    </div>

    <!-- PAGINATION -->
    <div v-if="totalPages > 1" class="pagination-wrapper">
      <button
        class="btn btn-secondary btn-sm"
        :disabled="page <= 1"
        @click="goToPage(page - 1)"
      >
        « Sebelumnya
      </button>

      <span class="page-indicator">
        Halaman <strong>{{ page }}</strong> dari <strong>{{ totalPages }}</strong>
      </span>

      <button
        class="btn btn-secondary btn-sm"
        :disabled="page >= totalPages"
        @click="goToPage(page + 1)"
      >
        Selanjutnya »
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api';
import DestinationCard from '../components/DestinationCard.vue';

const route = useRoute();
const router = useRouter();

const destinations = ref([]);
const regencies = ref([]);
const categories = ref([]);
const total = ref(0);
const page = ref(1);
const limit = ref(18);
const totalPages = ref(1);
const loading = ref(true);

const search = ref(route.query.search || '');
const selectedRegency = ref(route.query.regency || '');
const selectedCategory = ref(route.query.category || '');
const sortBy = ref(route.query.sort || '');
const communityOnly = ref(route.query.community_only === '1');

let searchTimeout = null;
function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 400);
}

function clearSearch() {
  search.value = '';
  applyFilters();
}

const hasActiveFilters = computed(() => {
  return !!(search.value || selectedRegency.value || selectedCategory.value || sortBy.value || communityOnly.value);
});

function resetFilters() {
  search.value = '';
  selectedRegency.value = '';
  selectedCategory.value = '';
  sortBy.value = '';
  communityOnly.value = false;
  page.value = 1;
  applyFilters();
}

function applyFilters() {
  const query = {};
  if (search.value.trim()) query.search = search.value.trim();
  if (selectedRegency.value) query.regency = selectedRegency.value;
  if (selectedCategory.value) query.category = selectedCategory.value;
  if (sortBy.value) query.sort = sortBy.value;
  if (communityOnly.value) query.community_only = '1';
  if (page.value > 1) query.page = page.value;

  router.replace({ query });
  fetchData();
}

function goToPage(p) {
  page.value = p;
  applyFilters();
  window.scrollTo({ top: 180, behavior: 'smooth' });
}

async function fetchData() {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      limit: limit.value
    };
    if (search.value.trim()) params.search = search.value.trim();
    if (selectedRegency.value) params.regency = selectedRegency.value;
    if (selectedCategory.value) params.category = selectedCategory.value;
    if (sortBy.value) params.sort = sortBy.value;
    if (communityOnly.value) params.community_only = '1';

    const res = await api.getDestinations(params);
    if (res.success) {
      destinations.value = res.data;
      total.value = res.total;
      totalPages.value = res.totalPages;
    }
  } catch (err) {
    console.error('Error fetching destinations:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    const [regRes, catRes] = await Promise.all([
      api.getRegencies(),
      api.getCategories()
    ]);
    if (regRes.success) regencies.value = regRes.data;
    if (catRes.success) categories.value = catRes.data.filter(c => c.type === 'place');
  } catch (e) {}
  fetchData();
});
</script>

<style scoped>
.destinations-page {
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
  max-width: 720px;
}

.filter-toolbar {
  padding: 1.25rem;
  margin-bottom: 2.25rem;
  background: white;
}

.toolbar-top {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.search-input-box {
  position: relative;
  flex: 1;
  min-width: 260px;
  display: flex;
  align-items: center;
}

.search-input-box svg {
  position: absolute;
  left: 0.85rem;
  color: #94a3b8;
}

.search-input-box input {
  width: 100%;
  padding: 0.7rem 2rem 0.7rem 2.4rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  font-size: 0.95rem;
  outline: none;
}

.clear-btn {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: #94a3b8;
  cursor: pointer;
}

.select-filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-select {
  width: auto;
  min-width: 170px;
}

.toolbar-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.community-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.toggle-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #047857;
}

.filter-status {
  font-size: 0.85rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-reset {
  background: transparent;
  border: none;
  color: var(--primary-600);
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
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

.pagination-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-top: 3.5rem;
}

.page-indicator {
  font-size: 0.9rem;
  color: #475569;
}
</style>
