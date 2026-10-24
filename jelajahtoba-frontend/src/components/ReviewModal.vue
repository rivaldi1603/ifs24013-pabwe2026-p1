<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-card fade-in">
      <div class="modal-header">
        <h3 class="modal-title">Tulis Ulasan & Penilaian</h3>
        <button class="modal-close-btn" @click="close">&times;</button>
      </div>

      <p class="modal-target-info">
        Memberikan ulasan untuk: <strong>{{ targetTitle }}</strong>
      </p>

      <!-- Login gate: only registered users may post reviews -->
      <div v-if="!currentUser" class="login-gate">
        <p class="login-gate-text">
          Anda perlu masuk terlebih dahulu untuk menulis ulasan dan memberi bintang.
        </p>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="close">Nanti Saja</button>
          <router-link id="review-login" :to="{ path: '/auth/login', query: { redirect: route.fullPath } }" class="btn btn-primary" @click="close">
            Masuk
          </router-link>
          <router-link id="review-register" :to="{ path: '/auth/register', query: { redirect: route.fullPath } }" class="btn btn-secondary" @click="close">
            Daftar
          </router-link>
        </div>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="modal-form">
        <!-- Rating Stars Selection -->
        <div class="form-group">
          <label class="form-label">Penilaian Bintang (1 - 5):</label>
          <div class="stars-selector">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              class="star-btn"
              :class="{ 'star-active': star <= rating }"
              @click="rating = star"
              :title="`${star} Bintang`"
            >
              ★
            </button>
            <span class="rating-text-hint">{{ rating }} dari 5 Bintang</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Nama Anda:</label>
          <input
            v-model="reviewerName"
            type="text"
            class="form-input"
            placeholder="Contoh: Budi Santoso / Turis Jakarta"
            required
            readonly
          />
        </div>

        <div class="form-group">
          <label class="form-label">Ulasan Pengalaman Anda:</label>
          <textarea
            v-model="reviewText"
            rows="4"
            class="form-textarea"
            placeholder="Ceritakan pengalaman Anda, suasana tempat, keramahan pengelola lokal, atau saran untuk wisatawan lain..."
            required
          ></textarea>
        </div>

        <div v-if="errorMsg" class="alert-error">
          {{ errorMsg }}
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="close">Batal</button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? 'Mengirimkan...' : 'Kirim Ulasan' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api';
import { useAuth } from '../auth';

const props = defineProps({
  isOpen: Boolean,
  targetType: {
    type: String,
    required: true
  },
  targetId: {
    type: Number,
    required: true
  },
  targetTitle: {
    type: String,
    default: 'Destinasi'
  }
});

const emit = defineEmits(['close', 'review-submitted']);
const { currentUser } = useAuth();
const route = useRoute();

const rating = ref(5);
const reviewerName = ref('');
const reviewText = ref('');
const submitting = ref(false);
const errorMsg = ref('');

// Pre-fill user name if logged in
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (currentUser.value?.name) {
      reviewerName.value = currentUser.value.name;
    }
  }
});

function close() {
  errorMsg.value = '';
  emit('close');
}

async function handleSubmit() {
  if (!reviewerName.value.trim() || !reviewText.value.trim()) {
    errorMsg.value = 'Silakan lengkapi nama dan isi ulasan.';
    return;
  }

  submitting.value = true;
  errorMsg.value = '';

  try {
    const res = await api.submitReview({
      target_type: props.targetType,
      target_id: props.targetId,
      rating: rating.value,
      reviewer_name: reviewerName.value.trim(),
      review_text: reviewText.value.trim()
    });

    if (res.success) {
      emit('review-submitted', res.data);
      reviewText.value = '';
      close();
    } else {
      errorMsg.value = res.message || 'Gagal mengirimkan ulasan.';
    }
  } catch (err) {
    errorMsg.value = 'Terjadi kesalahan jaringan.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.login-gate-text {
  margin: 0.5rem 0 1.25rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.login-gate .btn {
  text-decoration: none;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-card {
  background: white;
  border-radius: var(--radius-xl);
  max-width: 500px;
  width: 100%;
  padding: 1.75rem;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.modal-title {
  font-size: 1.35rem;
  color: var(--primary-900);
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
}

.modal-target-info {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 1.25rem;
}

.stars-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.star-btn {
  background: transparent;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #cbd5e1;
  transition: transform 0.15s;
  line-height: 1;
}

.star-btn:hover {
  transform: scale(1.15);
}

.star-active {
  color: #f59e0b;
}

.rating-text-hint {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  margin-left: 0.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.alert-error {
  background: #fee2e2;
  color: #b91c1c;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  margin-top: 0.75rem;
}
</style>
