<template>
  <div class="transport-page container">
    <div class="page-header">
      <span class="section-subtitle">Aksesibilitas Danau Toba</span>
      <h1 class="page-title">Jadwal Ferry ASDP & Transportasi Lokal</h1>
      <p class="page-desc">
        Panduan lengkap penyeberangan kapal ferry Ro-Ro antarpelabuhan di Danau Toba serta angkutan umum darat (KBT, KPT) untuk memudahkan mobilitas Anda.
      </p>
    </div>

    <!-- TABS -->
    <div class="transport-tabs">
      <button
        class="tab-btn"
        :class="{ active: currentTab === 'all' }"
        @click="currentTab = 'all'"
      >
        Semua Transportasi ({{ routes.length }})
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentTab === 'ferry' }"
        @click="currentTab = 'ferry'"
      >
        🚢 Kapal Ferry ASDP Penyeberangan
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentTab === 'land_shuttle' }"
        @click="currentTab = 'land_shuttle'"
      >
        🚐 Angkutan Antarkota & Travel Darat (KBT/KPT)
      </button>
    </div>

    <!-- LIST OF ROUTES -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Memuat jadwal rute transportasi...</p>
    </div>

    <div v-else class="routes-grid fade-in">
      <div
        v-for="route in filteredRoutes"
        :key="route.id"
        class="route-card card"
      >
        <div class="route-header">
          <div class="route-icon-box" :class="route.transport_type === 'ferry' ? 'icon-ferry' : 'icon-shuttle'">
            <span v-if="route.transport_type === 'ferry'">🚢</span>
            <span v-else>🚐</span>
          </div>
          <div>
            <span class="route-type-tag">
              {{ route.transport_type === 'ferry' ? 'Kapal Ferry Penyeberangan' : 'Angkutan Darat / Shuttle' }}
            </span>
            <h3 class="route-name">{{ route.name }}</h3>
          </div>
        </div>

        <div class="route-body">
          <div class="route-path-box">
            <span class="path-label">Rute Layanan</span>
            <p class="path-text">{{ route.route_direction }}</p>
          </div>

          <div class="route-details-grid">
            <div class="route-detail-col">
              <span class="det-label">Jadwal / Jam Keberangkatan</span>
              <span class="det-val">{{ route.departure_hours }}</span>
            </div>
            <div class="route-detail-col">
              <span class="det-label">Estimasi Tarif</span>
              <span class="det-val text-primary">{{ route.price_display }}</span>
            </div>
            <div class="route-detail-col">
              <span class="det-label">Jenis Kendaraan / Armada</span>
              <span class="det-val">{{ route.vehicle_type || 'Armada Standar' }}</span>
            </div>
            <div class="route-detail-col">
              <span class="det-label">Operator / Kontak</span>
              <span class="det-val">{{ route.operator || 'Pengelola Terkait' }}</span>
            </div>
          </div>

          <p v-if="route.description" class="route-notes">
            {{ route.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../api';

const routes = ref([]);
const currentTab = ref('all');
const loading = ref(true);

const filteredRoutes = computed(() => {
  if (currentTab.value === 'all') return routes.value;
  return routes.value.filter(r => r.transport_type === currentTab.value);
});

onMounted(async () => {
  try {
    const res = await api.getTransport();
    if (res.success) {
      routes.value = res.data;
    }
  } catch (err) {
    console.error('Error fetching transport:', err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.transport-page {
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

.transport-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 2.5rem;
}

.tab-btn {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.75rem 1.35rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
  background: white;
  color: #475569;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-btn:hover {
  background: #f1f5f9;
}

.tab-btn.active {
  background: var(--primary-600);
  color: white;
  border-color: var(--primary-600);
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);
}

.routes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  gap: 1.5rem;
}

.route-card {
  padding: 1.75rem;
  background: white;
}

.route-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.route-icon-box {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
}

.icon-ferry {
  background: #e0f2fe;
}

.icon-shuttle {
  background: #fef3c7;
}

.route-type-tag {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
}

.route-name {
  font-size: 1.25rem;
  color: var(--primary-900);
}

.route-path-box {
  background: #f8fafc;
  border: 1px solid var(--border-subtle);
  padding: 0.85rem 1rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.25rem;
}

.path-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--primary-600);
}

.path-text {
  font-weight: 700;
  color: var(--primary-900);
  font-size: 0.95rem;
  margin-top: 0.2rem;
}

.route-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.route-detail-col {
  display: flex;
  flex-direction: column;
}

.det-label {
  font-size: 0.725rem;
  color: var(--text-muted);
}

.det-val {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-main);
}

.text-primary {
  color: var(--primary-700);
  font-weight: 800;
}

.route-notes {
  font-size: 0.825rem;
  color: var(--text-muted);
  line-height: 1.5;
  border-top: 1px solid #f1f5f9;
  padding-top: 0.75rem;
}

@media (max-width: 600px) {
  .routes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
