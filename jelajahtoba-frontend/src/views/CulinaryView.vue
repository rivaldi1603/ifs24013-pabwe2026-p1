<template>
  <div class="culinary-page container">
    <div class="page-header">
      <span class="section-subtitle">Kekayaan Gastronomi Toba</span>
      <h1 class="page-title">Kuliner Tradisi & Rekomendasi Restoran</h1>
      <p class="page-desc">
        Cicipi cita rasa otentik bumbu andaliman, Dali ni Horbo (keju kerbau tradisional), Naniura (sashimi khas Batak), serta temukan rumah makan terpercaya ramah muslim dan khas Batak di sekeliling Danau Toba.
      </p>
    </div>

    <!-- 12 ICONIC TRADITIONAL DISHES -->
    <div class="dishes-section">
      <h2 class="section-title" style="font-size: 1.8rem; margin-bottom: 0.5rem;">
        12 Masakan Khas Tradisi Batak
      </h2>
      <p class="section-desc" style="margin-bottom: 2rem;">
        Warisan kuliner turun-temurun yang menjadi simbol kehormatan dalam jamuan adat masyarakat Batak.
      </p>

      <div class="dishes-grid">
        <div v-for="dish in culinaryItems" :key="dish.id" class="dish-card card">
          <div class="dish-header">
            <h3 class="dish-name">{{ dish.name }}</h3>
            <span
              class="badge"
              :class="dish.halal_status === 'Halal' ? 'badge-halal' : 'badge-nonhalal'"
            >
              {{ dish.halal_status }}
            </span>
          </div>
          <p class="dish-desc">{{ dish.description }}</p>
          <div class="dish-footer">
            <span class="dish-origin">📍 {{ dish.origin_region }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- RESTAURANTS DIRECTORY -->
    <div class="restaurants-section" style="margin-top: 5rem;">
      <div class="section-header-row">
        <div>
          <span class="section-subtitle">Tempat Makan & Kuliner</span>
          <h2 class="section-title">Direktori Rumah Makan & Restoran ({{ totalRestos }})</h2>
          <p class="section-desc">Pilihan rumah makan halal dan restoran lokal di 8 kabupaten sekitar Danau Toba.</p>
        </div>
      </div>

      <div class="resto-filter card">
        <div class="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Cari restoran atau menu rekomendasi..."
            @input="debounceSearch"
          />
        </div>

        <select v-model="selectedRegency" @change="fetchRestaurants" class="form-select" style="max-width: 220px;">
          <option value="">Semua Kabupaten</option>
          <option v-for="r in regencies" :key="r.id" :value="r.id">{{ r.name }}</option>
        </select>

        <label class="halal-checkbox">
          <input type="checkbox" v-model="halalOnly" @change="fetchRestaurants" />
          <span>🥗 Khusus Rumah Makan Halal / Ramah Muslim</span>
        </label>
      </div>

      <div v-if="loadingResto" class="loading-state">
        <div class="spinner"></div>
        <p>Memuat tempat makan...</p>
      </div>

      <div v-else class="grid-cards fade-in">
        <div v-for="res in restaurants" :key="res.id" class="resto-card card">
          <div class="resto-top">
            <span class="badge badge-regency">{{ res.regency_short || 'Danau Toba' }}</span>
            <span v-if="res.is_halal_certified" class="badge badge-halal">Halal</span>
          </div>

          <h3 class="resto-title">{{ res.name }}</h3>

          <div v-if="res.recommended_menu" class="menu-box">
            <span class="menu-label">Menu Rekomendasi:</span>
            <p class="menu-items">{{ truncate(res.recommended_menu, 90) }}</p>
          </div>

          <p class="resto-address">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {{ truncate(res.address, 55) }}
          </p>

          <div class="resto-footer">
            <div class="resto-price">
              <span class="p-label">Estimasi Harga</span>
              <span class="p-val">{{ res.price_display }}</span>
            </div>
            <div class="resto-rating">
              ★ {{ Number(res.rating_avg || 4.3).toFixed(1) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api';

const culinaryItems = ref([]);
const restaurants = ref([]);
const regencies = ref([]);
const totalRestos = ref(0);
const loadingResto = ref(true);

const search = ref('');
const selectedRegency = ref('');
const halalOnly = ref(false);

let timeout = null;
function debounceSearch() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    fetchRestaurants();
  }, 400);
}

function truncate(str, max = 80) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '...' : str;
}

async function fetchRestaurants() {
  loadingResto.value = true;
  try {
    const params = { limit: 30 };
    if (search.value.trim()) params.search = search.value.trim();
    if (selectedRegency.value) params.regency = selectedRegency.value;
    if (halalOnly.value) params.halal = '1';

    const res = await api.getRestaurants(params);
    if (res.success) {
      restaurants.value = res.data;
      totalRestos.value = res.total;
    }
  } catch (err) {
    console.error('Error fetching restaurants:', err);
  } finally {
    loadingResto.value = false;
  }
}

onMounted(async () => {
  try {
    const [culRes, regRes] = await Promise.all([
      api.getCulinary(),
      api.getRegencies()
    ]);
    if (culRes.success) culinaryItems.value = culRes.data;
    if (regRes.success) regencies.value = regRes.data;
  } catch (err) {
    console.error('Error loading culinary data:', err);
  }
  fetchRestaurants();
});
</script>

<style scoped>
.culinary-page {
  padding-top: 2.5rem;
  padding-bottom: 5rem;
}

.page-header {
  margin-bottom: 2.5rem;
}

.page-title {
  font-size: 2.4rem;
  margin-bottom: 0.5rem;
}

.page-desc {
  color: var(--text-muted);
  font-size: 1.05rem;
  max-width: 800px;
}

.dishes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.dish-card {
  padding: 1.5rem;
  background: white;
  border-left: 4px solid var(--accent-gorga);
}

.dish-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.dish-name {
  font-size: 1.2rem;
  color: var(--primary-900);
}

.badge-halal {
  background: #dcfce7;
  color: #15803d;
  font-weight: 700;
}

.badge-nonhalal {
  background: #fee2e2;
  color: #b91c1c;
  font-weight: 700;
}

.dish-desc {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.dish-footer {
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.dish-origin {
  font-size: 0.775rem;
  color: var(--text-muted);
  font-weight: 600;
}

.resto-filter {
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

.halal-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #15803d;
  cursor: pointer;
}

.resto-card {
  padding: 1.25rem;
  background: white;
}

.resto-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.resto-title {
  font-size: 1.15rem;
  margin-bottom: 0.65rem;
}

.menu-box {
  background: #f8fafc;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  margin-bottom: 0.75rem;
  border: 1px solid var(--border-subtle);
}

.menu-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 700;
  display: block;
}

.menu-items {
  font-size: 0.825rem;
  color: #334155;
  margin-top: 0.15rem;
}

.resto-address {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--text-muted);
  font-size: 0.8rem;
  margin-bottom: 1rem;
}

.resto-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.p-label {
  font-size: 0.675rem;
  color: var(--text-muted);
  display: block;
}

.p-val {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--primary-900);
}

.resto-rating {
  font-size: 0.85rem;
  font-weight: 700;
  color: #f59e0b;
}
</style>
