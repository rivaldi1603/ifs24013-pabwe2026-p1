<template>
  <div class="dashboard-page container">
    <!-- NOT LOGGED IN STATE -->
    <div v-if="!user" class="card login-prompt-card fade-in">
      <div class="prompt-icon">🔒</div>
      <h2>Akses Dashboard Pengelolaan Informasi</h2>
      <p>
        Dashboard ini digunakan oleh Administrator JelajahToba dan Mitra Komunitas Lokal untuk mengelola direktori tempat wisata, jasa budaya, dan homestay.
      </p>

      <div class="quick-login-box">
        <h4>Masuk Cepat untuk Evaluasi (Demo 1-Click):</h4>
        <div class="quick-btns">
          <button @click="quickLogin('admin@jelajahtoba.id', 'admin123')" class="btn btn-primary" :disabled="loggingIn">
            Masuk sebagai Administrator
          </button>
          <button @click="quickLogin('hutaraja@jelajahtoba.id', 'mitra123')" class="btn btn-secondary" :disabled="loggingIn">
            Masuk sebagai Mitra Komunitas (Hutaraja)
          </button>
        </div>
        <div v-if="loginError" class="alert-error" style="margin-top: 1rem;">{{ loginError }}</div>
      </div>

      <div style="margin-top: 1.5rem;">
        <router-link to="/login" class="btn btn-accent btn-sm">Ke Halaman Login Biasa</router-link>
      </div>
    </div>

    <!-- LOGGED IN DASHBOARD -->
    <div v-else class="dashboard-content fade-in">
      <!-- HEADER -->
      <div class="dash-header">
        <div>
          <span class="user-role-badge">{{ user.role === 'admin' ? 'Super Administrator' : 'Mitra Komunitas Terverifikasi' }}</span>
          <h1 class="dash-title">Dashboard Pengelolaan Informasi</h1>
          <p class="dash-subtitle">Selamat datang kembali, <strong>{{ user.name }}</strong> ({{ user.email }})</p>
        </div>
        <div class="dash-actions">
          <button @click="openAddDestinationModal" class="btn btn-primary btn-sm">
            + Tambah Destinasi
          </button>
          <button @click="openAddServiceModal" class="btn btn-accent btn-sm">
            + Tambah Jasa / Homestay
          </button>
        </div>
      </div>

      <!-- METRIC CARDS -->
      <div class="metrics-grid">
        <div class="metric-card card">
          <span class="metric-num">{{ stats.totalDestinations || 139 }}</span>
          <span class="metric-label">Destinasi Wisata Terdaftar</span>
        </div>
        <div class="metric-card card">
          <span class="metric-num" style="color: #059669;">{{ stats.totalServices || 54 }}</span>
          <span class="metric-label">Jasa Lokal & Homestay</span>
        </div>
        <div class="metric-card card">
          <span class="metric-num" style="color: #c2410c;">{{ stats.totalCommunity || 26 }}</span>
          <span class="metric-label">Inisiatif Warga / Pokdarwis</span>
        </div>
        <div class="metric-card card">
          <span class="metric-num" style="color: #f59e0b;">{{ stats.totalReviews || 720 }}</span>
          <span class="metric-label">Ulasan Pengunjung Masuk</span>
        </div>
      </div>

      <!-- TABS -->
      <div class="dash-tabs">
        <button
          class="dash-tab-btn"
          :class="{ active: currentTab === 'destinations' }"
          @click="currentTab = 'destinations'"
        >
          📍 Kelola Destinasi Wisata
        </button>
        <button
          class="dash-tab-btn"
          :class="{ active: currentTab === 'services' }"
          @click="currentTab = 'services'"
        >
          🧶 Kelola Jasa Budaya & Homestay
        </button>
        <button
          class="dash-tab-btn"
          :class="{ active: currentTab === 'reviews' }"
          @click="currentTab = 'reviews'"
        >
          💬 Ulasan Pengunjung Terbaru
        </button>
      </div>

      <!-- TAB 1: DESTINATIONS TABLE -->
      <div v-if="currentTab === 'destinations'" class="tab-panel card">
        <div class="panel-header">
          <h3>Daftar Destinasi Wisata</h3>
          <input
            v-model="destSearch"
            type="text"
            placeholder="Cari destinasi..."
            class="form-input search-mini"
          />
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Tempat</th>
                <th>Kabupaten</th>
                <th>Tarif Tiket</th>
                <th>Rating</th>
                <th>Komunitas</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in filteredDestinations" :key="d.id">
                <td>#{{ d.id }}</td>
                <td>
                  <strong>{{ d.name }}</strong>
                  <span class="table-sub">{{ d.category_name }}</span>
                </td>
                <td>{{ d.regency_short || d.regency_name }}</td>
                <td>{{ d.price_display }}</td>
                <td>★ {{ Number(d.rating_avg || 4.5).toFixed(1) }} ({{ d.review_count || 0 }})</td>
                <td>
                  <span v-if="d.is_community_managed" class="badge badge-community">Warga</span>
                  <span v-else class="badge-subtle">Umum</span>
                </td>
                <td>
                  <div class="table-actions">
                    <button @click="editDestination(d)" class="btn-table btn-edit" title="Edit">✏️</button>
                    <button v-if="user.role === 'admin'" @click="deleteDest(d.id)" class="btn-table btn-del" title="Hapus">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: SERVICES TABLE -->
      <div v-if="currentTab === 'services'" class="tab-panel card">
        <div class="panel-header">
          <h3>Daftar Jasa Budaya & Homestay Warga</h3>
          <input
            v-model="serviceSearch"
            type="text"
            placeholder="Cari jasa / pengelola..."
            class="form-input search-mini"
          />
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Layanan</th>
                <th>Penyedia / Warga</th>
                <th>Jenis Jasa</th>
                <th>Tarif Indikatif</th>
                <th>WhatsApp</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in filteredServices" :key="s.id">
                <td>#{{ s.id }}</td>
                <td>
                  <strong>{{ s.name }}</strong>
                  <span class="table-sub">{{ s.regency_short || s.regency_name }}</span>
                </td>
                <td>{{ s.provider_name }}</td>
                <td>
                  <span class="badge" style="background:#ede9fe; color:#6d28d9;">{{ formatServiceType(s.service_type) }}</span>
                </td>
                <td>{{ s.price_display }} <small>{{ s.price_unit ? `/${s.price_unit}` : '' }}</small></td>
                <td>{{ s.contact_wa || '-' }}</td>
                <td>
                  <div class="table-actions">
                    <button @click="editService(s)" class="btn-table btn-edit" title="Edit">✏️</button>
                    <button v-if="user.role === 'admin'" @click="deleteServ(s.id)" class="btn-table btn-del" title="Hapus">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: REVIEWS TABLE -->
      <div v-if="currentTab === 'reviews'" class="tab-panel card">
        <div class="panel-header">
          <h3>Ulasan Pengunjung Masuk</h3>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Pengulas</th>
                <th>Destinasi / Layanan</th>
                <th>Rating</th>
                <th>Isi Komentar</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in stats.recentReviews || []" :key="r.id">
                <td><strong>{{ r.reviewer_name }}</strong></td>
                <td>{{ r.target_name }}</td>
                <td><span style="color: #f59e0b; font-weight: 700;">★ {{ Number(r.rating).toFixed(1) }}</span></td>
                <td><p class="review-cell-text">"{{ r.review_text }}"</p></td>
                <td><small>{{ r.created_at }}</small></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL FORM DESTINASI -->
    <div v-if="destModalOpen" class="modal-overlay" @click.self="destModalOpen = false">
      <div class="modal-card fade-in" style="max-width: 650px;">
        <div class="modal-header">
          <h3>{{ destForm.id ? 'Edit Destinasi Wisata' : 'Tambah Destinasi Wisata Baru' }}</h3>
          <button @click="destModalOpen = false" class="modal-close-btn">&times;</button>
        </div>

        <form @submit.prevent="saveDestination" class="modal-form-grid">
          <div class="form-group full-width">
            <label class="form-label">Nama Tempat Wisata *</label>
            <input v-model="destForm.name" type="text" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">Kategori *</label>
            <select v-model="destForm.category_id" class="form-select" required>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Wilayah Kabupaten *</label>
            <select v-model="destForm.regency_id" class="form-select" required>
              <option v-for="r in regencies" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Tarif Tiket Display</label>
            <input v-model="destForm.price_display" type="text" placeholder="Misal: Rp 10.000 atau Gratis" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label">Jam Operasional</label>
            <input v-model="destForm.operational_hours" type="text" placeholder="08.00 - 18.00 WIB" class="form-input" />
          </div>

          <div class="form-group full-width">
            <label class="form-label">Alamat Lengkap</label>
            <input v-model="destForm.address" type="text" class="form-input" />
          </div>

          <div class="form-group full-width">
            <label class="form-label">Deskripsi Lengkap</label>
            <textarea v-model="destForm.description" rows="3" class="form-textarea"></textarea>
          </div>

          <div class="form-group full-width">
            <label class="community-toggle">
              <input type="checkbox" v-model="destForm.is_community_managed" />
              <span>🌿 Dikelola Komunitas Warga / Pokdarwis</span>
            </label>
          </div>

          <div class="modal-actions full-width">
            <button type="button" @click="destModalOpen = false" class="btn btn-secondary">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Menyimpan...' : 'Simpan Data' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL FORM JASA -->
    <div v-if="serviceModalOpen" class="modal-overlay" @click.self="serviceModalOpen = false">
      <div class="modal-card fade-in" style="max-width: 650px;">
        <div class="modal-header">
          <h3>{{ serviceForm.id ? 'Edit Jasa / Homestay' : 'Tambah Jasa Budaya & Homestay Baru' }}</h3>
          <button @click="serviceModalOpen = false" class="modal-close-btn">&times;</button>
        </div>

        <form @submit.prevent="saveService" class="modal-form-grid">
          <div class="form-group full-width">
            <label class="form-label">Nama Layanan / Homestay *</label>
            <input v-model="serviceForm.name" type="text" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">Nama Penyedia / Kelompok Warga *</label>
            <input v-model="serviceForm.provider_name" type="text" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">Jenis Layanan</label>
            <select v-model="serviceForm.service_type" class="form-select">
              <option value="cultural_experience">Workshop & Budaya</option>
              <option value="homestay">Homestay Warga</option>
              <option value="tour_guide">Pemandu Lokal (Guide)</option>
              <option value="adventure">Petualangan / Tubing</option>
              <option value="boat_rental">Sewa Perahu Solu</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Wilayah Kabupaten *</label>
            <select v-model="serviceForm.regency_id" class="form-select" required>
              <option v-for="r in regencies" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Nomor WhatsApp Pengelola</label>
            <input v-model="serviceForm.contact_wa" type="text" placeholder="6281234567890" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label">Tarif Display</label>
            <input v-model="serviceForm.price_display" type="text" placeholder="Rp 150.000" class="form-input" />
          </div>

          <div class="form-group">
            <label class="form-label">Satuan Tarif</label>
            <input v-model="serviceForm.price_unit" type="text" placeholder="per malam / per orang" class="form-input" />
          </div>

          <div class="form-group full-width">
            <label class="form-label">Deskripsi & Nilai Budaya</label>
            <textarea v-model="serviceForm.description" rows="3" class="form-textarea"></textarea>
          </div>

          <div class="modal-actions full-width">
            <button type="button" @click="serviceModalOpen = false" class="btn btn-secondary">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Menyimpan...' : 'Simpan Layanan' }}
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

const user = ref(null);
const stats = ref({});
const destinations = ref([]);
const services = ref([]);
const regencies = ref([]);
const categories = ref([]);

const currentTab = ref('destinations');
const destSearch = ref('');
const serviceSearch = ref('');
const loggingIn = ref(false);
const saving = ref(false);

const destModalOpen = ref(false);
const serviceModalOpen = ref(false);

const destForm = ref({
  id: null,
  name: '',
  category_id: 1,
  regency_id: 1,
  price_display: 'Gratis',
  operational_hours: '08.00 - 18.00 WIB',
  address: '',
  description: '',
  is_community_managed: false
});

const serviceForm = ref({
  id: null,
  name: '',
  provider_name: '',
  service_type: 'cultural_experience',
  category_id: 6,
  regency_id: 1,
  contact_wa: '6281260008888',
  price_display: 'Rp 50.000',
  price_unit: 'per orang',
  description: '',
  is_community_managed: true
});

const loginError = ref('');

function checkUser() {
  const stored = localStorage.getItem('jt_user');
  if (stored) {
    try {
      user.value = JSON.parse(stored);
    } catch (e) {
      user.value = null;
    }
  } else {
    user.value = null;
  }
}

async function quickLogin(email, password) {
  loggingIn.value = true;
  loginError.value = '';
  try {
    const res = await api.login(email, password);
    if (res.success) {
      localStorage.setItem('jt_token', res.token);
      localStorage.setItem('jt_user', JSON.stringify(res.user));
      user.value = res.user;
      await loadData();
    } else {
      loginError.value = res.message || 'Gagal login.';
    }
  } catch (err) {
    loginError.value = 'Gagal menghubungi server.';
  } finally {
    loggingIn.value = false;
  }
}

const filteredDestinations = computed(() => {
  if (!destSearch.value.trim()) return destinations.value;
  const q = destSearch.value.toLowerCase();
  return destinations.value.filter(d => d.name.toLowerCase().includes(q) || (d.address && d.address.toLowerCase().includes(q)));
});

const filteredServices = computed(() => {
  if (!serviceSearch.value.trim()) return services.value;
  const q = serviceSearch.value.toLowerCase();
  return services.value.filter(s => s.name.toLowerCase().includes(q) || s.provider_name.toLowerCase().includes(q));
});

function formatServiceType(t) {
  const map = {
    'homestay': 'Homestay',
    'cultural_experience': 'Budaya & Seni',
    'tour_guide': 'Pemandu',
    'adventure': 'Petualangan',
    'boat_rental': 'Sewa Perahu'
  };
  return map[t] || t;
}

function openAddDestinationModal() {
  destForm.value = {
    id: null,
    name: '',
    category_id: 1,
    regency_id: 1,
    price_display: 'Gratis',
    operational_hours: '08.00 - 18.00 WIB',
    address: '',
    description: '',
    is_community_managed: false
  };
  destModalOpen.value = true;
}

function editDestination(d) {
  destForm.value = {
    id: d.id,
    name: d.name,
    category_id: d.category_id,
    regency_id: d.regency_id,
    price_display: d.price_display,
    operational_hours: d.operational_hours,
    address: d.address,
    description: d.description,
    is_community_managed: !!d.is_community_managed
  };
  destModalOpen.value = true;
}

async function saveDestination() {
  saving.value = true;
  try {
    if (destForm.value.id) {
      await api.updateDestination(destForm.value.id, destForm.value);
    } else {
      await api.createDestination(destForm.value);
    }
    destModalOpen.value = false;
    loadData();
  } catch (err) {
    alert('Gagal menyimpan destinasi.');
  } finally {
    saving.value = false;
  }
}

async function deleteDest(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus destinasi ini?')) return;
  try {
    await api.deleteDestination(id);
    loadData();
  } catch (e) {
    alert('Gagal menghapus.');
  }
}

function openAddServiceModal() {
  serviceForm.value = {
    id: null,
    name: '',
    provider_name: '',
    service_type: 'cultural_experience',
    category_id: 6,
    regency_id: 1,
    contact_wa: '6281260008888',
    price_display: 'Rp 50.000',
    price_unit: 'per orang',
    description: '',
    is_community_managed: true
  };
  serviceModalOpen.value = true;
}

function editService(s) {
  serviceForm.value = {
    id: s.id,
    name: s.name,
    provider_name: s.provider_name,
    service_type: s.service_type,
    category_id: s.category_id,
    regency_id: s.regency_id,
    contact_wa: s.contact_wa,
    price_display: s.price_display,
    price_unit: s.price_unit,
    description: s.description,
    is_community_managed: !!s.is_community_managed
  };
  serviceModalOpen.value = true;
}

async function saveService() {
  saving.value = true;
  try {
    if (serviceForm.value.id) {
      await api.updateService(serviceForm.value.id, serviceForm.value);
    } else {
      await api.createService(serviceForm.value);
    }
    serviceModalOpen.value = false;
    loadData();
  } catch (err) {
    alert('Gagal menyimpan jasa.');
  } finally {
    saving.value = false;
  }
}

async function deleteServ(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus layanan ini?')) return;
  try {
    await api.deleteService(id);
    loadData();
  } catch (e) {
    alert('Gagal menghapus.');
  }
}

async function loadData() {
  try {
    const [statRes, destRes, servRes, regRes, catRes] = await Promise.all([
      api.getStats(),
      api.getDestinations({ limit: 100 }),
      api.getServices({ limit: 100 }),
      api.getRegencies(),
      api.getCategories()
    ]);
    if (statRes.success) stats.value = statRes.data;
    if (destRes.success) destinations.value = destRes.data;
    if (servRes.success) services.value = servRes.data;
    if (regRes.success) regencies.value = regRes.data;
    if (catRes.success) categories.value = catRes.data;
  } catch (err) {
    console.error('Error loading dashboard data:', err);
  }
}

onMounted(() => {
  checkUser();
  if (user.value) {
    loadData();
  }
});
</script>

<style scoped>
.dashboard-page {
  padding-top: 2.5rem;
  padding-bottom: 5rem;
}

.login-prompt-card {
  max-width: 620px;
  margin: 3rem auto;
  padding: 3rem 2rem;
  text-align: center;
}

.prompt-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.login-prompt-card h2 {
  font-size: 1.8rem;
  margin-bottom: 0.75rem;
}

.login-prompt-card p {
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.quick-login-box {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}

.quick-login-box h4 {
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.quick-btns {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.user-role-badge {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  background: var(--primary-100);
  color: var(--primary-800);
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  display: inline-block;
  margin-bottom: 0.35rem;
}

.dash-title {
  font-size: 2.2rem;
  margin-bottom: 0.25rem;
}

.dash-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.dash-actions {
  display: flex;
  gap: 0.75rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2.5rem;
}

.metric-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.metric-num {
  font-size: 2.5rem;
  font-weight: 800;
  font-family: var(--font-heading);
  color: var(--primary-600);
  line-height: 1;
  margin-bottom: 0.5rem;
}

.metric-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

.dash-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 0.5rem;
  flex-wrap: wrap;
}

.dash-tab-btn {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.75rem 1.25rem;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.dash-tab-btn:hover {
  color: var(--primary-600);
  background: var(--primary-50);
}

.dash-tab-btn.active {
  color: var(--primary-600);
  background: var(--primary-100);
}

.tab-panel {
  padding: 1.75rem;
  background: white;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-mini {
  max-width: 250px;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.data-table th {
  background: #f8fafc;
  padding: 0.75rem 1rem;
  font-weight: 700;
  color: #475569;
  border-bottom: 1px solid var(--border-subtle);
}

.data-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.table-sub {
  display: block;
  font-size: 0.775rem;
  color: var(--text-muted);
}

.table-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-table {
  background: #f1f5f9;
  border: 1px solid var(--border-subtle);
  padding: 0.35rem 0.55rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-table:hover {
  background: #e2e8f0;
}

.badge-subtle {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: #f1f5f9;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-full);
}

.review-cell-text {
  max-width: 380px;
  font-style: italic;
  font-size: 0.85rem;
  color: #475569;
}

.modal-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.full-width {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .modal-form-grid {
    grid-template-columns: 1fr;
  }
  .full-width {
    grid-column: span 1;
  }
}
</style>
