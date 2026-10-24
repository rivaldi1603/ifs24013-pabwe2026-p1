<template>
  <div class="card destination-card">
    <div class="card-img-wrapper">
      <img
        :src="item.image_url || defaultImage"
        :alt="item.name"
        class="card-img"
        loading="lazy"
        @error="onImageError"
      />
      <!-- Badges on image -->
      <div class="card-badges-top">
        <span class="badge badge-regency">{{ item.regency_short || 'Danau Toba' }}</span>
        <span v-if="item.is_community_managed" class="badge badge-community">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          Komunitas
        </span>
      </div>

      <div class="card-price-tag">
        {{ item.price_display || 'Gratis' }}
      </div>
    </div>

    <div class="card-body">
      <div class="card-category-rating">
        <span class="card-category">{{ item.category_name || 'Wisata Alam' }}</span>
        <div class="rating-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span class="rating-value">{{ Number(item.rating_avg || 4.5).toFixed(1) }}</span>
          <span class="rating-count">({{ item.review_count || 0 }})</span>
        </div>
      </div>

      <h3 class="card-title">
        <router-link :to="`/destinasi/${item.slug || item.id}`">{{ item.name }}</router-link>
      </h3>

      <p class="card-address">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>{{ truncate(item.address || 'Kawasan Danau Toba', 45) }}</span>
      </p>

      <div class="card-footer">
        <span class="op-hours">{{ item.operational_hours || '08.00 - 18.00 WIB' }}</span>
        <router-link :to="`/destinasi/${item.slug || item.id}`" class="btn btn-secondary btn-sm card-btn">
          Detail
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

const defaultImage = 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=800&q=80';

function onImageError(e) {
  e.target.src = defaultImage;
}

function truncate(str, max = 50) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '...' : str;
}
</script>

<style scoped>
.destination-card {
  position: relative;
}

.card-badges-top {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
  pointer-events: none;
}

.card-price-tag {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  color: white;
  font-size: 0.775rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-md);
  z-index: 2;
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
}

.card-category-rating {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.card-category {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--primary-600);
  letter-spacing: 0.05em;
}

.rating-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.825rem;
  font-weight: 700;
}

.rating-count {
  color: var(--text-muted);
  font-weight: 400;
  font-size: 0.75rem;
}

.card-title {
  font-size: 1.15rem;
  margin-bottom: 0.45rem;
  line-height: 1.35;
}

.card-title a:hover {
  color: var(--primary-600);
}

.card-address {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  color: var(--text-muted);
  font-size: 0.825rem;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.card-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.85rem;
  border-top: 1px solid #f1f5f9;
}

.op-hours {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

.card-btn {
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
}
</style>
