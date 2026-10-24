<template>
  <div class="profile-page container">
    <!-- HEADER WISATAWAN DENGAN FOTO, BIO & EDIT PROFIL -->
    <div class="profile-header card fade-in">
      <div class="user-intro">
        <!-- AVATAR CONTAINER -->
        <div class="avatar-wrapper" @click="openEditModal" title="Klik untuk mengganti foto profil">
          <img v-if="user?.avatar_url" :src="user.avatar_url" :alt="user.name" class="user-avatar-img" />
          <div v-else class="user-avatar-large">
            {{ user?.name ? user.name.charAt(0).toUpperCase() : 'U' }}
          </div>
          <span class="avatar-edit-badge" title="Ganti foto">📷</span>
        </div>

        <div class="user-intro-text">
          <div class="badge-role-row">
            <span class="user-role-badge" :class="user?.role === 'partner' ? 'badge-partner' : 'badge-user'">
              {{ user?.role === 'partner' ? '🧶 MITRA KOMUNITAS' : '🌿 WISATAWAN TERDAFTAR' }}
            </span>
            <span class="account-status-chip">Akun Aktif</span>
          </div>

          <h1 class="user-display-name">{{ user?.name }}</h1>
          
          <div class="user-contact-chips">
            <span class="contact-chip">✉️ {{ user?.email }}</span>
            <span v-if="user?.phone" class="contact-chip">📱 {{ user.phone }}</span>
          </div>

          <!-- USER BIO -->
          <p class="user-bio-text">
            {{ user?.bio || 'Belum ada bio. Ceritakan pengalaman dan ketertarikan Anda saat menjelajah keindahan Danau Toba!' }}
          </p>
        </div>
      </div>

      <div class="profile-header-actions">
        <button @click="openEditModal" class="btn btn-secondary btn-edit-profile">
          ✏️ Edit Profil & Foto
        </button>
        <router-link to="/destinasi" class="btn btn-primary">
          🔍 Jelajahi Wisata
        </router-link>
      </div>
    </div>

    <!-- NOTIFICATION ALERT -->
    <div v-if="saveSuccessMsg" class="alert-success fade-in">
      ✅ {{ saveSuccessMsg }}
    </div>

    <!-- STATS / OVERVIEW CARDS -->
    <div class="user-stats-grid fade-in">
      <div class="stat-card card">
        <span class="stat-icon">💬</span>
        <div>
          <span class="stat-num">{{ myReviews.length }}</span>
          <span class="stat-label">Ulasan Ditulis</span>
        </div>
      </div>
      <div class="stat-card card">
        <span class="stat-icon">⭐</span>
        <div>
          <span class="stat-num">{{ averageGivenRating }}</span>
          <span class="stat-label">Rata-rata Rating Diberikan</span>
        </div>
      </div>
      <div class="stat-card card">
        <span class="stat-icon">🗺️</span>
        <div>
          <span class="stat-num">8</span>
          <span class="stat-label">Kabupaten Kawasan Toba</span>
        </div>
      </div>
    </div>

    <!-- TABS -->
    <div class="dash-tabs fade-in">
      <button
        class="dash-tab-btn"
        :class="{ active: currentTab === 'reviews' }"
        @click="currentTab = 'reviews'"
      >
        💬 Ulasan Saya ({{ myReviews.length }})
      </button>
      <button
        class="dash-tab-btn"
        :class="{ active: currentTab === 'recommendations' }"
        @click="currentTab = 'recommendations'"
      >
        ⭐ Rekomendasi Destinasi Populer
      </button>
    </div>

    <!-- TAB 1: MY REVIEWS -->
    <div v-if="currentTab === 'reviews'" class="tab-panel card fade-in">
      <div class="panel-header">
        <div>
          <h2>Riwayat Ulasan & Penilaian Anda</h2>
          <p class="panel-sub">Ulasan yang Anda kirimkan untuk objek wisata maupun layanan lokal di kawasan Danau Toba.</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        Memuat ulasan Anda...
      </div>

      <div v-else-if="myReviews.length === 0" class="empty-reviews-state">
        <div class="empty-icon">✍️</div>
        <h3>Anda Belum Menulis Ulasan</h3>
        <p>Jelajahi objek wisata Danau Toba dan bagikan ulasan serta penilaian bintang Anda untuk membantu wisatawan lain!</p>
        <router-link to="/destinasi" class="btn btn-primary" style="margin-top: 1rem;">
          Mulai Menjelajahi Destinasi
        </router-link>
      </div>

      <div v-else class="my-reviews-list">
        <div v-for="rev in myReviews" :key="rev.id" class="my-review-card">
          <div class="my-rev-header">
            <div>
              <span class="badge-target">{{ rev.target_type === 'destination' ? '📍 Destinasi' : '🧶 Layanan' }}</span>
              <h3 class="my-rev-target-name">{{ rev.target_name || ('Objek #' + rev.target_id) }}</h3>
              <span class="my-rev-date">{{ rev.created_at }}</span>
            </div>
            <div class="my-rev-stars">
              ★ {{ Number(rev.rating).toFixed(1) }}
            </div>
          </div>
          <p class="my-rev-comment">"{{ rev.review_text }}"</p>
          <div v-if="rev.target_slug" class="my-rev-footer">
            <router-link :to="`/${rev.target_type === 'destination' ? 'destinasi' : 'jasa-lokal'}/${rev.target_slug}`" class="btn-link">
              Buka Halaman Tempat Ini →
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: RECOMMENDATIONS -->
    <div v-if="currentTab === 'recommendations'" class="tab-panel card fade-in">
      <div class="panel-header">
        <div>
          <h2>Destinasi Rekomendasi Paling Populer</h2>
          <p class="panel-sub">Destinasi dengan ulasan positif terbanyak yang wajib Anda kunjungi.</p>
        </div>
      </div>

      <div class="recs-grid">
        <div v-for="d in featuredDestinations" :key="d.id" class="rec-card card">
          <div class="rec-img-wrap">
            <img :src="d.image_url || 'https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=600&auto=format&fit=crop&q=80'" :alt="d.name" class="rec-img" />
            <span class="rec-rating-badge">★ {{ Number(d.rating_avg || 4.8).toFixed(1) }}</span>
          </div>
          <div class="rec-body">
            <span class="rec-category">{{ d.category_name }} • {{ d.regency_short || d.regency_name }}</span>
            <h3 class="rec-name">{{ d.name }}</h3>
            <p class="rec-price">Tiket: <strong>{{ d.price_display }}</strong></p>
            <router-link :to="`/destinasi/${d.slug}`" class="btn btn-secondary btn-sm" style="width: 100%; margin-top: 0.75rem;">
              Lihat Detail & Tulis Ulasan
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL EDIT PROFIL & UPLOAD FOTO -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-card fade-in" style="max-width: 540px;">
        <div class="modal-header">
          <h2 class="modal-title">Edit Profil Pengguna</h2>
          <button @click="showEditModal = false" class="modal-close-btn">&times;</button>
        </div>

        <form @submit.prevent="saveProfile" class="edit-profile-form">
          <!-- AVATAR UPLOAD & PREVIEW -->
          <div class="form-group text-center">
            <label class="form-label" style="display:block; margin-bottom: 0.75rem;">Foto Profil</label>
            <div class="avatar-preview-box">
              <img v-if="editForm.avatar_url" :src="editForm.avatar_url" alt="Preview Foto" class="preview-avatar-img" />
              <div v-else class="preview-avatar-placeholder">
                {{ editForm.name ? editForm.name.charAt(0).toUpperCase() : 'U' }}
              </div>
            </div>

            <div class="avatar-upload-controls">
              <label class="btn btn-secondary btn-sm upload-btn-label">
                📁 Upload Foto Baru
                <input type="file" accept="image/*" @change="handleFileUpload" style="display: none;" />
              </label>
              <button v-if="editForm.avatar_url" type="button" @click="editForm.avatar_url = ''" class="btn btn-sm btn-link-danger">
                Hapus Foto
              </button>
            </div>
            <small class="upload-hint">Foto otomatis di-crop & dioptimalkan (JPG, PNG, WebP)</small>
          </div>

          <!-- NAMA LENGKAP -->
          <div class="form-group">
            <label class="form-label">Nama Lengkap *</label>
            <input v-model="editForm.name" type="text" class="form-input" placeholder="Nama Anda" required />
          </div>

          <!-- EMAIL (READONLY) -->
          <div class="form-group">
            <label class="form-label">Alamat Email</label>
            <input :value="user?.email" type="email" class="form-input disabled-input" disabled />
            <small class="field-hint">Alamat email digunakan untuk login dan tidak dapat diubah.</small>
          </div>

          <!-- NOMOR HP / WHATSAPP -->
          <div class="form-group">
            <label class="form-label">Nomor Telepon / WhatsApp</label>
            <input v-model="editForm.phone" type="text" class="form-input" placeholder="Contoh: 081234567890" />
          </div>

          <!-- BIO -->
          <div class="form-group">
            <label class="form-label">Bio / Tentang Diri Anda</label>
            <textarea
              v-model="editForm.bio"
              rows="3"
              class="form-textarea"
              placeholder="Ceritakan minat Anda dalam berwisata, makanan favorit di Danau Toba, atau profesi Anda..."
            ></textarea>
          </div>

          <div v-if="editError" class="alert-error">
            {{ editError }}
          </div>

          <div class="modal-actions">
            <button type="button" @click="showEditModal = false" class="btn btn-secondary">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../api';
import { useAuth } from '../auth';

const { currentUser: user, setUser } = useAuth();

const currentTab = ref('reviews');
const myReviews = ref([]);
const featuredDestinations = ref([]);
const loading = ref(true);

const showEditModal = ref(false);
const saving = ref(false);
const editError = ref('');
const saveSuccessMsg = ref('');

const editForm = ref({
  name: '',
  phone: '',
  bio: '',
  avatar_url: ''
});

const averageGivenRating = computed(() => {
  if (myReviews.value.length === 0) return '0.0';
  const sum = myReviews.value.reduce((acc, r) => acc + Number(r.rating || 0), 0);
  return (sum / myReviews.value.length).toFixed(1);
});

function openEditModal() {
  if (user.value) {
    editForm.value = {
      name: user.value.name || '',
      phone: user.value.phone || '',
      bio: user.value.bio || '',
      avatar_url: user.value.avatar_url || ''
    };
  }
  editError.value = '';
  showEditModal.value = true;
}

// Convert and compress chosen file to lightweight Base64 image
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    editError.value = 'Ukuran file foto maksimal adalah 10 MB.';
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      // Resize to square max 260x260 for optimal avatar
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 260;
      let width = img.width;
      let height = img.height;

      // Crop to square from center
      const minSide = Math.min(width, height);
      const startX = (width - minSide) / 2;
      const startY = (height - minSide) / 2;

      canvas.width = MAX_SIZE;
      canvas.height = MAX_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, MAX_SIZE, MAX_SIZE);

      // Export as jpeg 0.85 quality -> compact ~25KB
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      editForm.value.avatar_url = compressedDataUrl;
      editError.value = '';
    };
    img.onerror = () => {
      editError.value = 'Gagal membaca format gambar.';
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

async function saveProfile() {
  if (!editForm.value.name.trim()) {
    editError.value = 'Nama lengkap wajib diisi.';
    return;
  }

  saving.value = true;
  editError.value = '';
  try {
    const res = await api.updateProfile({
      name: editForm.value.name.trim(),
      phone: editForm.value.phone.trim(),
      bio: editForm.value.bio.trim(),
      avatar_url: editForm.value.avatar_url
    });

    if (res.success && res.user) {
      setUser(res.user);
      showEditModal.value = false;
      saveSuccessMsg.value = 'Profil dan foto Anda berhasil diperbarui!';
      setTimeout(() => {
        saveSuccessMsg.value = '';
      }, 3500);
    } else {
      editError.value = res.message || 'Gagal menyimpan perubahan profil.';
    }
  } catch (err) {
    editError.value = 'Terjadi kesalahan server saat memperbarui profil.';
  } finally {
    saving.value = false;
  }
}

async function loadUserData() {
  if (!user.value) return;
  loading.value = true;
  try {
    const [revRes, featRes, meRes] = await Promise.all([
      api.getReviews({ user_id: user.value.id }),
      api.getFeaturedDestinations(),
      api.getMe()
    ]);

    if (revRes.success) myReviews.value = revRes.data || [];
    if (featRes.success) featuredDestinations.value = featRes.data || [];
    if (meRes.success && meRes.user) {
      setUser(meRes.user);
    }
  } catch (err) {
    console.error('Error loading profile data:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadUserData();
});
</script>

<style scoped>
.profile-page {
  padding-top: 2.5rem;
  padding-bottom: 5rem;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  padding: 2.25rem;
  border-radius: var(--radius-xl);
  margin-bottom: 1.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.user-intro {
  display: flex;
  align-items: flex-start;
  gap: 1.75rem;
  flex: 1;
}

/* AVATAR WRAPPER */
.avatar-wrapper {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}

.avatar-wrapper:hover .avatar-edit-badge {
  transform: scale(1.15);
  background: #0284c7;
}

.user-avatar-large {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #047857 100%);
  color: white;
  font-size: 2.5rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.user-avatar-img {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
}

.avatar-edit-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #047857;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  border: 2px solid white;
  transition: transform 0.2s ease, background 0.2s ease;
}

.badge-role-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.35rem;
}

.user-role-badge {
  font-size: 0.725rem;
  font-weight: 800;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  letter-spacing: 0.04em;
}

.badge-user {
  background: #065f46;
  color: #ffffff;
}

.badge-partner {
  background: #5b21b6;
  color: #ffffff;
}

.account-status-chip {
  font-size: 0.75rem;
  color: #065f46;
  font-weight: 700;
}

.user-display-name {
  font-size: 1.85rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
}

.user-contact-chips {
  display: flex;
  gap: 0.75rem;
  margin: 0.4rem 0 0.75rem;
  flex-wrap: wrap;
}

.contact-chip {
  font-size: 0.825rem;
  color: #64748b;
  background: #f8fafc;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid #f1f5f9;
}

.user-bio-text {
  font-size: 0.925rem;
  color: #475569;
  line-height: 1.5;
  background: #f8fafc;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  border-left: 3px solid #10b981;
  max-width: 680px;
  margin: 0;
}

.profile-header-actions {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  flex-shrink: 0;
}

.btn-edit-profile {
  font-weight: 700;
}

.alert-success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 0.85rem 1.25rem;
  border-radius: var(--radius-lg);
  margin-bottom: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* STATS */
.user-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius-lg);
}

.stat-icon {
  font-size: 2rem;
}

.stat-num {
  display: block;
  font-size: 1.65rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.1;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
}

/* TABS */
.dash-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.25rem;
}

.dash-tab-btn {
  background: transparent;
  border: none;
  font-size: 0.95rem;
  font-weight: 700;
  color: #64748b;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.dash-tab-btn:hover {
  color: var(--primary-600);
}

.dash-tab-btn.active {
  color: #0369a1;
  border-bottom: 3px solid #0369a1;
  margin-bottom: -0.35rem;
  background: white;
}

.tab-panel {
  padding: 1.75rem;
  border-radius: var(--radius-xl);
}

.panel-header {
  margin-bottom: 1.5rem;
}

.panel-header h2 {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.panel-sub {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

/* REVIEWS */
.my-reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.my-review-card {
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  background: #fafafa;
  transition: all var(--transition-fast);
}

.my-review-card:hover {
  border-color: #cbd5e1;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.my-rev-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.badge-target {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
}

.my-rev-target-name {
  font-size: 1.1rem;
  margin: 0.25rem 0;
  color: #1e293b;
}

.my-rev-date {
  font-size: 0.75rem;
  color: #475569;
}

.my-rev-stars {
  font-size: 1.15rem;
  font-weight: 800;
  color: #b45309;
}

.my-rev-comment {
  margin: 0.75rem 0 0;
  font-style: italic;
  color: #475569;
  line-height: 1.5;
}

.my-rev-footer {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f1f5f9;
}

.btn-link {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0369a1;
  text-decoration: underline;
}

.btn-link:hover {
  text-decoration: underline;
}

.empty-reviews-state {
  text-align: center;
  padding: 3.5rem 1.5rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
}

/* RECS GRID */
.recs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
}

.rec-card {
  overflow: hidden;
  border-radius: var(--radius-lg);
  transition: transform var(--transition-fast);
}

.rec-card:hover {
  transform: translateY(-3px);
}

.rec-img-wrap {
  position: relative;
  height: 140px;
}

.rec-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rec-rating-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  color: #fbbf24;
  font-weight: 800;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-full);
}

.rec-body {
  padding: 1rem;
}

.rec-category {
  font-size: 0.725rem;
  color: var(--text-muted);
  font-weight: 600;
}

.rec-name {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0.25rem 0;
  color: #1e293b;
  line-height: 1.3;
}

.rec-price {
  font-size: 0.8rem;
  color: #475569;
  margin: 0.25rem 0;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
}

/* MODAL EDIT PROFIL */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
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
  width: 100%;
  padding: 2rem;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.modal-title {
  font-size: 1.35rem;
  color: #0f172a;
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.75rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
}

.avatar-preview-box {
  display: flex;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.preview-avatar-img {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #10b981;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-avatar-placeholder {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 2.25rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-upload-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
}

.upload-btn-label {
  cursor: pointer;
}

.btn-link-danger {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-link-danger:hover {
  text-decoration: underline;
}

.upload-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  display: block;
}

.disabled-input {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}

.field-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.25rem;
  display: block;
}

.alert-error {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  margin-top: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: stretch;
  }
  .user-intro {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .badge-role-row, .user-contact-chips {
    justify-content: center;
  }
  .profile-header-actions {
    width: 100%;
  }
  .profile-header-actions button,
  .profile-header-actions a {
    width: 100%;
  }
}
</style>
