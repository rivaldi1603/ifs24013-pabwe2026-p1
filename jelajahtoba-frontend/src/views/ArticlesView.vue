<template>
  <div class="articles-page container">
    <div class="page-header">
      <span class="section-subtitle">Edukasi & Geowisata UNESCO</span>
      <h1 class="page-title">Cerita & Sejarah Kaldera Danau Toba</h1>
      <p class="page-desc">
        Pelajari sejarah letusan gunung api purba supervolcano 74.000 tahun silam yang mengubah iklim dunia, legenda lokal Danau Toba, serta situs bersejarah di sekeliling kaldera.
      </p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Memuat artikel edukasi...</p>
    </div>

    <div v-else class="articles-grid fade-in">
      <div v-for="art in articles" :key="art.id" class="article-card card">
        <div class="art-header">
          <span class="badge badge-regency">{{ art.regency_name || 'Danau Toba' }}</span>
          <span class="art-date">{{ art.published_at || 'Artikel Geopark' }}</span>
        </div>

        <h2 class="art-title">{{ art.title }}</h2>

        <p class="art-summary">{{ art.summary }}</p>

        <div class="art-footer">
          <a
            :href="art.source_url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-secondary btn-sm"
          >
            Baca Selengkapnya di Sumber Resmi
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api';

const articles = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await api.getArticles();
    if (res.success) {
      articles.value = res.data;
    }
  } catch (err) {
    console.error('Error fetching articles:', err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.articles-page {
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
  max-width: 780px;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 2rem;
}

.article-card {
  padding: 2rem;
  background: white;
}

.art-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.art-date {
  font-size: 0.775rem;
  color: var(--text-subtle);
}

.art-title {
  font-size: 1.35rem;
  line-height: 1.35;
  margin-bottom: 1rem;
  color: var(--primary-900);
}

.art-summary {
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.7;
  white-space: pre-line;
  margin-bottom: 1.75rem;
}

.art-footer {
  margin-top: auto;
  border-top: 1px solid #f1f5f9;
  padding-top: 1rem;
}
</style>
