<template>
  <div class="card service-card">
    <div class="service-card-header">
      <div class="service-type-badge" :class="`badge-type-${service.service_type}`">
        {{ formatServiceType(service.service_type) }}
      </div>
      <span class="badge badge-regency">{{ service.regency_short || 'Danau Toba' }}</span>
    </div>

    <div class="card-body">
      <h3 class="service-title">
        <router-link :to="`/jasa-lokal/${service.slug || service.id}`">{{ service.name }}</router-link>
      </h3>

      <div class="provider-info">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span class="provider-name">{{ service.provider_name || 'Komunitas Lokal' }}</span>
        <span v-if="service.is_community_managed" class="badge-mini-community">Warga Lokal</span>
      </div>

      <p class="service-desc">
        {{ truncate(service.description, 110) }}
      </p>

      <div class="service-meta">
        <div class="price-box">
          <span class="price-label">Tarif Indikatif</span>
          <span class="price-val">{{ service.price_display || 'Rp 50.000' }}</span>
          <span class="price-unit">{{ service.price_unit ? `/${service.price_unit}` : '' }}</span>
        </div>

        <div class="service-rating">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span class="rating-num">{{ Number(service.rating_avg || 4.8).toFixed(1) }}</span>
        </div>
      </div>

      <div class="service-actions">
        <router-link :to="`/jasa-lokal/${service.slug || service.id}`" class="btn btn-secondary btn-sm" style="flex: 1;">
          Detail Jasa
        </router-link>
        <a
          :href="whatsappUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-whatsapp btn-sm"
          style="flex: 1;"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          Hubungi
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  service: {
    type: Object,
    required: true
  }
});

function formatServiceType(type) {
  const map = {
    'homestay': 'Homestay Warga',
    'cultural_experience': 'Jasa / Budaya',
    'tour_guide': 'Pemandu Lokal',
    'adventure': 'Petualangan Air/Alam',
    'boat_rental': 'Sewa Solu / Perahu'
  };
  return map[type] || 'Layanan Lokal';
}

function truncate(text, max = 100) {
  if (!text) return '';
  return text.length > max ? text.substring(0, max) + '...' : text;
}

const whatsappUrl = computed(() => {
  const wa = props.service.contact_wa || '6281260008888';
  const text = encodeURIComponent(`Halo ${props.service.provider_name}, saya melihat layanan "${props.service.name}" di JelajahToba dan ingin menanyakan ketersediaan / pemesanan.`);
  return `https://wa.me/${wa}?text=${text}`;
});
</script>

<style scoped>
.service-card {
  border-top: 4px solid var(--primary-600);
}

.service-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem 0.25rem;
}

.service-type-badge {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-full);
}

.badge-type-homestay {
  background: #ede9fe;
  color: #6d28d9;
}
.badge-type-cultural_experience {
  background: #fef3c7;
  color: #b45309;
}
.badge-type-tour_guide {
  background: #e0f2fe;
  color: #0369a1;
}
.badge-type-adventure {
  background: #dcfce7;
  color: #15803d;
}
.badge-type-boat_rental {
  background: #ffedd5;
  color: #c2410c;
}

.service-title {
  font-size: 1.15rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  line-height: 1.35;
}

.service-title a:hover {
  color: var(--primary-600);
}

.provider-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #475569;
  font-size: 0.825rem;
  margin-bottom: 0.75rem;
}

.provider-name {
  font-weight: 600;
}

.badge-mini-community {
  font-size: 0.675rem;
  background: #d1fae5;
  color: #047857;
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-full);
  font-weight: 700;
}

.service-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 1rem;
}

.service-meta {
  background: #f8fafc;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.65rem 0.85rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.price-box {
  display: flex;
  flex-direction: column;
}

.price-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 600;
}

.price-val {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--primary-900);
}

.price-unit {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.service-rating {
  display: flex;
  align-items: center;
  gap: 3px;
  font-weight: 700;
  font-size: 0.9rem;
}

.service-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}
</style>
