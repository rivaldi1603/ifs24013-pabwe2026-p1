<template>
  <div class="admin-page container">
    <!-- HEADER ADMIN -->
    <div class="dash-header admin-header-theme fade-in">
      <div>
        <div class="badge-role-row">
          <span class="user-role-badge badge-admin-glow">👑 SUPER ADMINISTRATOR</span>
          <span class="badge-system-status">Pusat Kendali Seluruh Konten</span>
        </div>
        <h1 class="dash-title">Panel Pengelolaan JelajahToba</h1>
        <p class="dash-subtitle">
          Selamat datang, <strong>{{ user?.name }}</strong>. Sebagai Administrator, Anda memiliki akses penuh untuk menambah, mengedit, dan menghapus seluruh konten platform: Destinasi, Jasa Budaya, Jadwal Ferry, Kuliner Khas, Cerita Toba, Ulasan, dan Pengguna.
        </p>
      </div>

      <div class="dash-quick-create">
        <button v-if="currentTab === 'destinations'" @click="openAddDestinationModal" class="btn btn-primary">
          + Tambah Destinasi Baru
        </button>
        <button v-else-if="currentTab === 'services'" @click="openAddServiceModal" class="btn btn-accent">
          + Tambah Jasa / Homestay
        </button>
        <button v-else-if="currentTab === 'transport'" @click="openAddTransportModal" class="btn btn-primary">
          + Tambah Rute Ferry
        </button>
        <button v-else-if="currentTab === 'culinary'" @click="openAddCulinaryModal" class="btn btn-accent">
          + Tambah Kuliner Khas
        </button>
        <button v-else-if="currentTab === 'articles'" @click="openAddArticleModal" class="btn btn-primary">
          + Tulis Cerita Toba
        </button>
      </div>
    </div>

    <!-- METRICS GRID -->
    <div class="metrics-grid fade-in">
      <div class="metric-card card" @click="currentTab = 'destinations'" style="cursor: pointer;">
        <div class="metric-icon-wrap" style="background: #e0f2fe; color: #0284c7;">📍</div>
        <div class="metric-data">
          <span class="metric-num">{{ destinations.length }}</span>
          <span class="metric-label">Destinasi Wisata</span>
        </div>
      </div>
      <div class="metric-card card" @click="currentTab = 'services'" style="cursor: pointer;">
        <div class="metric-icon-wrap" style="background: #d1fae5; color: #059669;">🧶</div>
        <div class="metric-data">
          <span class="metric-num">{{ services.length }}</span>
          <span class="metric-label">Jasa & Homestay</span>
        </div>
      </div>
      <div class="metric-card card" @click="currentTab = 'transport'" style="cursor: pointer;">
        <div class="metric-icon-wrap" style="background: #e0e7ff; color: #4338ca;">🚢</div>
        <div class="metric-data">
          <span class="metric-num">{{ transportRoutes.length }}</span>
          <span class="metric-label">Jadwal Ferry & Kapal</span>
        </div>
      </div>
      <div class="metric-card card" @click="currentTab = 'culinary'" style="cursor: pointer;">
        <div class="metric-icon-wrap" style="background: #ffedd5; color: #c2410c;">🍲</div>
        <div class="metric-data">
          <span class="metric-num">{{ culinaryItems.length }}</span>
          <span class="metric-label">Menu Kuliner Khas</span>
        </div>
      </div>
      <div class="metric-card card" @click="currentTab = 'articles'" style="cursor: pointer;">
        <div class="metric-icon-wrap" style="background: #fef3c7; color: #b45309;">📖</div>
        <div class="metric-data">
          <span class="metric-num">{{ articles.length }}</span>
          <span class="metric-label">Cerita / Artikel Toba</span>
        </div>
      </div>
      <div class="metric-card card" @click="currentTab = 'reviews'" style="cursor: pointer;">
        <div class="metric-icon-wrap" style="background: #fee2e2; color: #dc2626;">💬</div>
        <div class="metric-data">
          <span class="metric-num">{{ allReviews.length }}</span>
          <span class="metric-label">Ulasan Pengunjung</span>
        </div>
      </div>
      <div class="metric-card card" @click="currentTab = 'users'" style="cursor: pointer;">
        <div class="metric-icon-wrap" style="background: #f3e8ff; color: #7c3aed;">👥</div>
        <div class="metric-data">
          <span class="metric-num">{{ usersList.length }}</span>
          <span class="metric-label">Pengguna Terdaftar</span>
        </div>
      </div>
    </div>

    <!-- 7 TABS ADMIN UNTUK SELURUH HALAMAN -->
    <div class="dash-tabs fade-in">
      <button
        class="dash-tab-btn"
        :class="{ active: currentTab === 'destinations' }"
        @click="currentTab = 'destinations'"
      >
        📍 Destinasi ({{ destinations.length }})
      </button>
      <button
        class="dash-tab-btn"
        :class="{ active: currentTab === 'services' }"
        @click="currentTab = 'services'"
      >
        🧶 Jasa & Homestay ({{ services.length }})
      </button>
      <button
        class="dash-tab-btn"
        :class="{ active: currentTab === 'transport' }"
        @click="currentTab = 'transport'"
      >
        🚢 Jadwal Ferry ({{ transportRoutes.length }})
      </button>
      <button
        class="dash-tab-btn"
        :class="{ active: currentTab === 'culinary' }"
        @click="currentTab = 'culinary'"
      >
        🍲 Kuliner Khas ({{ culinaryItems.length }})
      </button>
      <button
        class="dash-tab-btn"
        :class="{ active: currentTab === 'articles' }"
        @click="currentTab = 'articles'"
      >
        📖 Cerita Toba ({{ articles.length }})
      </button>
      <button
        class="dash-tab-btn"
        :class="{ active: currentTab === 'reviews' }"
        @click="currentTab = 'reviews'"
      >
        💬 Moderasi Ulasan ({{ allReviews.length }})
      </button>
      <button
        class="dash-tab-btn"
        :class="{ active: currentTab === 'users' }"
        @click="currentTab = 'users'"
      >
        👥 Pengguna ({{ usersList.length }})
      </button>
    </div>

    <!-- TAB 1: DESTINASI WISATA -->
    <div v-if="currentTab === 'destinations'" class="tab-panel card fade-in">
      <div class="panel-header">
        <div>
          <h2>Kelola Destinasi Wisata</h2>
          <p class="panel-sub">Tambah, ubah data, atau hapus tempat wisata di kawasan Danau Toba.</p>
        </div>
        <div class="panel-tools">
          <input v-model="destSearch" type="text" placeholder="Cari destinasi..." class="form-input search-mini" />
          <button @click="openAddDestinationModal" class="btn btn-primary btn-sm">+ Tambah</button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Destinasi</th>
              <th>Kabupaten</th>
              <th>Tarif</th>
              <th>Rating</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in filteredDestinations" :key="d.id">
              <td><span class="id-tag">#{{ d.id }}</span></td>
              <td>
                <strong>{{ d.name }}</strong>
                <span class="table-sub">{{ d.category_name }}</span>
              </td>
              <td>{{ d.regency_short || d.regency_name }}</td>
              <td>{{ d.price_display }}</td>
              <td>★ {{ Number(d.rating_avg || 4.5).toFixed(1) }} ({{ d.review_count || 0 }})</td>
              <td>
                <div class="table-actions">
                  <button @click="editDestination(d)" class="btn-table btn-edit">✏️ Edit</button>
                  <button @click="deleteDest(d.id, d.name)" class="btn-table btn-del">🗑️ Hapus</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 2: JASA BUDAYA & HOMESTAY -->
    <div v-if="currentTab === 'services'" class="tab-panel card fade-in">
      <div class="panel-header">
        <div>
          <h2>Kelola Jasa Budaya & Homestay Warga</h2>
          <p class="panel-sub">Layanan berbasis komunitas lokal Danau Toba.</p>
        </div>
        <div class="panel-tools">
          <input v-model="serviceSearch" type="text" placeholder="Cari jasa / pengelola..." class="form-input search-mini" />
          <button @click="openAddServiceModal" class="btn btn-accent btn-sm">+ Tambah</button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Layanan</th>
              <th>Penyedia / Warga</th>
              <th>Tipe</th>
              <th>Tarif</th>
              <th>WhatsApp</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in filteredServices" :key="s.id">
              <td><span class="id-tag">#{{ s.id }}</span></td>
              <td>
                <strong>{{ s.name }}</strong>
                <span class="table-sub">{{ s.regency_short || s.regency_name }}</span>
              </td>
              <td>{{ s.provider_name }}</td>
              <td><span class="badge badge-service">{{ formatServiceType(s.service_type) }}</span></td>
              <td>{{ s.price_display }} <small v-if="s.price_unit">/{{ s.price_unit }}</small></td>
              <td><code>{{ s.contact_wa || '-' }}</code></td>
              <td>
                <div class="table-actions">
                  <button @click="editService(s)" class="btn-table btn-edit">✏️ Edit</button>
                  <button @click="deleteServ(s.id, s.name)" class="btn-table btn-del">🗑️ Hapus</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 3: JADWAL FERRY & TRANSPORTASI -->
    <div v-if="currentTab === 'transport'" class="tab-panel card fade-in">
      <div class="panel-header">
        <div>
          <h2>Kelola Jadwal Ferry & Transportasi Danau Toba</h2>
          <p class="panel-sub">Jadwal penyeberangan KMP Ferry, kapal kayu tradisional, dan shuttle darat.</p>
        </div>
        <div class="panel-tools">
          <input v-model="transportSearch" type="text" placeholder="Cari rute penyeberangan..." class="form-input search-mini" />
          <button @click="openAddTransportModal" class="btn btn-primary btn-sm">+ Tambah Rute</button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Rute Penyeberangan</th>
              <th>Jenis</th>
              <th>Arah / Lintasan</th>
              <th>Jadwal / Jam Berangkat</th>
              <th>Tarif</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in filteredTransport" :key="t.id">
              <td><span class="id-tag">#{{ t.id }}</span></td>
              <td>
                <strong>{{ t.name }}</strong>
                <span class="table-sub">{{ t.operator || 'Dishub' }}</span>
              </td>
              <td>
                <span class="badge" :class="t.transport_type === 'ferry' ? 'badge-role-admin' : 'badge-role-partner'">
                  {{ t.transport_type === 'ferry' ? '🚢 Ferry KMP' : (t.transport_type === 'traditional_boat' ? '⛵ Kapal Tradisional' : '🚐 Shuttle') }}
                </span>
              </td>
              <td><strong>{{ t.route_direction }}</strong></td>
              <td>{{ t.departure_hours }}</td>
              <td>{{ t.price_display }}</td>
              <td>
                <div class="table-actions">
                  <button @click="editTransport(t)" class="btn-table btn-edit">✏️ Edit</button>
                  <button @click="deleteTrans(t.id, t.name)" class="btn-table btn-del">🗑️ Hapus</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 4: KULINER KHAS BATAK -->
    <div v-if="currentTab === 'culinary'" class="tab-panel card fade-in">
      <div class="panel-header">
        <div>
          <h2>Kelola Menu Kuliner Khas</h2>
          <p class="panel-sub">Katalog kuliner tradisional Danau Toba (Naniura, Arsik, Sasagun, dll).</p>
        </div>
        <div class="panel-tools">
          <input v-model="culinarySearch" type="text" placeholder="Cari kuliner..." class="form-input search-mini" />
          <button @click="openAddCulinaryModal" class="btn btn-accent btn-sm">+ Tambah Kuliner</button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Kuliner</th>
              <th>Status Halal</th>
              <th>Asal Daerah</th>
              <th>Deskripsi Singkat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filteredCulinary" :key="c.id">
              <td><span class="id-tag">#{{ c.id }}</span></td>
              <td><strong>{{ c.name }}</strong></td>
              <td>
                <span class="badge" :style="c.halal_status === 'Halal' ? 'background:#d1fae5; color:#065f46;' : 'background:#fee2e2; color:#991b1b;'">
                  {{ c.halal_status }}
                </span>
              </td>
              <td>{{ c.origin_region }}</td>
              <td><p class="table-desc-cell">{{ c.description }}</p></td>
              <td>
                <div class="table-actions">
                  <button @click="editCulinary(c)" class="btn-table btn-edit">✏️ Edit</button>
                  <button @click="deleteCulin(c.id, c.name)" class="btn-table btn-del">🗑️ Hapus</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 5: CERITA TOBA (ARTIKEL) -->
    <div v-if="currentTab === 'articles'" class="tab-panel card fade-in">
      <div class="panel-header">
        <div>
          <h2>Kelola Cerita Danau Toba (Artikel Budaya & Wisata)</h2>
          <p class="panel-sub">Artikel wawasan budaya, legenda, dan tips perjalanan bagi wisatawan.</p>
        </div>
        <div class="panel-tools">
          <input v-model="articleSearch" type="text" placeholder="Cari judul cerita..." class="form-input search-mini" />
          <button @click="openAddArticleModal" class="btn btn-primary btn-sm">+ Tulis Cerita Baru</button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Judul Cerita / Artikel</th>
              <th>Wilayah Kabupaten</th>
              <th>Ringkasan Cerita</th>
              <th>Tanggal Publikasi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in filteredArticles" :key="a.id">
              <td><span class="id-tag">#{{ a.id }}</span></td>
              <td>
                <strong>{{ a.title }}</strong>
                <span class="table-sub"><a :href="a.source_url || '#'" target="_blank" style="color:var(--primary-600);">Buka Sumber Tautan</a></span>
              </td>
              <td>{{ a.regency_short || a.regency_name || 'Kawasan Toba' }}</td>
              <td><p class="table-desc-cell">{{ a.summary }}</p></td>
              <td><small class="time-sub">{{ a.published_at }}</small></td>
              <td>
                <div class="table-actions">
                  <button @click="editArticle(a)" class="btn-table btn-edit">✏️ Edit</button>
                  <button @click="deleteArtic(a.id, a.title)" class="btn-table btn-del">🗑️ Hapus</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 6: MODERASI ULASAN PENGUNJUNG -->
    <div v-if="currentTab === 'reviews'" class="tab-panel card fade-in">
      <div class="panel-header">
        <div>
          <h2>Moderasi Ulasan Pengunjung</h2>
          <p class="panel-sub">Hapus ulasan spam atau komentar tidak pantas dari pengunjung.</p>
        </div>
        <div class="panel-tools">
          <input v-model="reviewSearch" type="text" placeholder="Cari pengulas..." class="form-input search-mini" />
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Pengulas</th>
              <th>Target Tempat</th>
              <th>Rating</th>
              <th>Komentar</th>
              <th>Waktu</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filteredReviews" :key="r.id">
              <td><span class="id-tag">#{{ r.id }}</span></td>
              <td>
                <strong>{{ r.reviewer_name }}</strong>
                <span class="table-sub">{{ r.user_id ? 'Terdaftar' : 'Tamu' }}</span>
              </td>
              <td>
                <span class="badge-target">{{ r.target_type === 'destination' ? '📍 Destinasi' : '🧶 Layanan' }}</span>
                <div style="font-weight: 600; margin-top: 2px;">{{ r.target_name || ('ID: ' + r.target_id) }}</div>
              </td>
              <td><span class="rating-stars-gold">★ {{ Number(r.rating).toFixed(1) }}</span></td>
              <td><p class="review-comment-full">"{{ r.review_text }}"</p></td>
              <td><small class="time-sub">{{ r.created_at }}</small></td>
              <td>
                <button @click="handleDeleteReview(r.id)" class="btn-table btn-del">🗑️ Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 7: MANAJEMEN PENGGUNA (USERS) -->
    <div v-if="currentTab === 'users'" class="tab-panel card fade-in">
      <div class="panel-header">
        <div>
          <h2>Daftar Pengguna Terdaftar</h2>
          <p class="panel-sub">Seluruh pengguna platform JelajahToba yang tersimpan di basis data.</p>
        </div>
        <div class="panel-tools">
          <input v-model="userSearch" type="text" placeholder="Cari nama atau email..." class="form-input search-mini" />
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Lengkap</th>
              <th>Email</th>
              <th>Role</th>
              <th>Nomor HP</th>
              <th>Bio Pengguna</th>
              <th>Terdaftar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filteredUsersList" :key="u.id">
              <td><span class="id-tag">#{{ u.id }}</span></td>
              <td>
                <strong>{{ u.name }}</strong>
                <span v-if="u.organization" class="table-sub">{{ u.organization }}</span>
              </td>
              <td><code>{{ u.email }}</code></td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'badge-role-admin': u.role === 'admin',
                    'badge-role-partner': u.role === 'partner',
                    'badge-role-user': u.role === 'user'
                  }"
                >
                  {{ u.role === 'admin' ? '👑 Admin' : (u.role === 'partner' ? '🧶 Mitra' : '👤 Wisatawan') }}
                </span>
              </td>
              <td>{{ u.phone || '-' }}</td>
              <td><small class="table-desc-cell">{{ u.bio || '-' }}</small></td>
              <td><small class="time-sub">{{ u.created_at }}</small></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ==================== MODALS ==================== -->

    <!-- MODAL 1: DESTINASI -->
    <div v-if="destModalOpen" class="modal-overlay" @click.self="destModalOpen = false">
      <div class="modal-card fade-in">
        <div class="modal-header">
          <h2 class="modal-title">{{ destForm.id ? 'Edit Destinasi' : 'Tambah Destinasi Baru' }}</h2>
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
            <label class="form-label">Kabupaten *</label>
            <select v-model="destForm.regency_id" class="form-select" required>
              <option v-for="r in regencies" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tarif Tiket Display</label>
            <input v-model="destForm.price_display" type="text" placeholder="Rp 10.000 / Gratis" class="form-input" />
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
            <label class="form-label">URL Gambar</label>
            <input v-model="destForm.image_url" type="text" placeholder="https://..." class="form-input" />
          </div>
          <div class="form-group full-width">
            <label class="form-label">Deskripsi Lengkap</label>
            <textarea v-model="destForm.description" rows="3" class="form-textarea"></textarea>
          </div>
          <div class="modal-actions full-width">
            <button type="button" @click="destModalOpen = false" class="btn btn-secondary">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Simpan Destinasi' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: JASA / HOMESTAY -->
    <div v-if="serviceModalOpen" class="modal-overlay" @click.self="serviceModalOpen = false">
      <div class="modal-card fade-in">
        <div class="modal-header">
          <h2 class="modal-title">{{ serviceForm.id ? 'Edit Jasa / Homestay' : 'Tambah Jasa Baru' }}</h2>
          <button @click="serviceModalOpen = false" class="modal-close-btn">&times;</button>
        </div>
        <form @submit.prevent="saveService" class="modal-form-grid">
          <div class="form-group full-width">
            <label class="form-label">Nama Layanan *</label>
            <input v-model="serviceForm.name" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Penyedia / Warga *</label>
            <input v-model="serviceForm.provider_name" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Jenis Layanan</label>
            <select v-model="serviceForm.service_type" class="form-select">
              <option value="cultural_experience">Workshop & Budaya</option>
              <option value="homestay">Homestay Warga</option>
              <option value="tour_guide">Pemandu Lokal</option>
              <option value="adventure">Petualangan Air/Alam</option>
              <option value="boat_rental">Sewa Solu / Perahu</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Kabupaten *</label>
            <select v-model="serviceForm.regency_id" class="form-select" required>
              <option v-for="r in regencies" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nomor WhatsApp</label>
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
            <label class="form-label">Deskripsi Layanan</label>
            <textarea v-model="serviceForm.description" rows="3" class="form-textarea"></textarea>
          </div>
          <div class="modal-actions full-width">
            <button type="button" @click="serviceModalOpen = false" class="btn btn-secondary">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Simpan Layanan' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 3: TRANSPORTASI / FERRY -->
    <div v-if="transportModalOpen" class="modal-overlay" @click.self="transportModalOpen = false">
      <div class="modal-card fade-in">
        <div class="modal-header">
          <h2 class="modal-title">{{ transportForm.id ? 'Edit Rute Penyeberangan' : 'Tambah Rute Penyeberangan Baru' }}</h2>
          <button @click="transportModalOpen = false" class="modal-close-btn">&times;</button>
        </div>
        <form @submit.prevent="saveTransport" class="modal-form-grid">
          <div class="form-group full-width">
            <label class="form-label">Nama Rute / Dermaga *</label>
            <input v-model="transportForm.name" type="text" class="form-input" placeholder="Contoh: Dermaga Ajibata - Tomok (KMP Ihan Batak)" required />
          </div>
          <div class="form-group">
            <label class="form-label">Jenis Transportasi</label>
            <select v-model="transportForm.transport_type" class="form-select">
              <option value="ferry">Kapal Motor Penyeberangan (KMP Ferry)</option>
              <option value="traditional_boat">Kapal Kayu Tradisional</option>
              <option value="land_shuttle">Shuttle / Angkutan Darat</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Arah / Lintasan *</label>
            <input v-model="transportForm.route_direction" type="text" placeholder="Contoh: Ajibata (Toba) ⇄ Tomok (Samosir)" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Jadwal Keberangkatan</label>
            <input v-model="transportForm.departure_hours" type="text" placeholder="Contoh: 07.30, 09.30, 11.30, 13.30, 15.30, 18.00 WIB" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Tarif Display</label>
            <input v-model="transportForm.price_display" type="text" placeholder="Rp 15.000 / orang (Kendaraan Rp 50.000)" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Operator / Pengelola</label>
            <input v-model="transportForm.operator" type="text" placeholder="PT ASDP Indonesia Ferry / Swasta" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Kontak / Call Center</label>
            <input v-model="transportForm.contact" type="text" placeholder="191 (ASDP) / 0812345678" class="form-input" />
          </div>
          <div class="form-group full-width">
            <label class="form-label">Catatan / Deskripsi Rute</label>
            <textarea v-model="transportForm.description" rows="2" class="form-textarea" placeholder="Waktu tempuh sekitar 45 menit, melayani kendaraan roda 2 dan roda 4."></textarea>
          </div>
          <div class="modal-actions full-width">
            <button type="button" @click="transportModalOpen = false" class="btn btn-secondary">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Simpan Rute' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 4: KULINER -->
    <div v-if="culinaryModalOpen" class="modal-overlay" @click.self="culinaryModalOpen = false">
      <div class="modal-card fade-in">
        <div class="modal-header">
          <h2 class="modal-title">{{ culinaryForm.id ? 'Edit Kuliner Khas' : 'Tambah Menu Kuliner Khas' }}</h2>
          <button @click="culinaryModalOpen = false" class="modal-close-btn">&times;</button>
        </div>
        <form @submit.prevent="saveCulinary" class="modal-form-grid">
          <div class="form-group full-width">
            <label class="form-label">Nama Makanan / Minuman *</label>
            <input v-model="culinaryForm.name" type="text" class="form-input" placeholder="Contoh: Ikan Mas Arsik" required />
          </div>
          <div class="form-group">
            <label class="form-label">Status Kehalalan</label>
            <select v-model="culinaryForm.halal_status" class="form-select">
              <option value="Halal">Halal (Ikan / Sayur / Ayam / Kue)</option>
              <option value="Non-Halal">Non-Halal (Tradisional Khas)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Asal Daerah / Wilayah</label>
            <input v-model="culinaryForm.origin_region" type="text" placeholder="Contoh: Samosir / Balige" class="form-input" />
          </div>
          <div class="form-group full-width">
            <label class="form-label">URL Foto Makanan</label>
            <input v-model="culinaryForm.image_url" type="text" placeholder="https://..." class="form-input" />
          </div>
          <div class="form-group full-width">
            <label class="form-label">Deskripsi & Ciri Khas Bumbu</label>
            <textarea v-model="culinaryForm.description" rows="3" class="form-textarea" placeholder="Bumbu andaliman yang beraroma jeruk tajam, menggunakan asam gelugur..."></textarea>
          </div>
          <div class="modal-actions full-width">
            <button type="button" @click="culinaryModalOpen = false" class="btn btn-secondary">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Simpan Kuliner' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 5: ARTIKEL / CERITA TOBA -->
    <div v-if="articleModalOpen" class="modal-overlay" @click.self="articleModalOpen = false">
      <div class="modal-card fade-in">
        <div class="modal-header">
          <h2 class="modal-title">{{ articleForm.id ? 'Edit Cerita Toba' : 'Tulis Cerita / Artikel Baru' }}</h2>
          <button @click="articleModalOpen = false" class="modal-close-btn">&times;</button>
        </div>
        <form @submit.prevent="saveArticle" class="modal-form-grid">
          <div class="form-group full-width">
            <label class="form-label">Judul Artikel / Cerita Budaya *</label>
            <input v-model="articleForm.title" type="text" class="form-input" placeholder="Contoh: Legenda Terbentuknya Danau Toba dan Kearifan Tradisi Batak" required />
          </div>
          <div class="form-group">
            <label class="form-label">Wilayah Kabupaten Terkait</label>
            <select v-model="articleForm.regency_id" class="form-select">
              <option :value="null">Kawasan Danau Toba Umum</option>
              <option v-for="r in regencies" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tanggal Publikasi</label>
            <input v-model="articleForm.published_at" type="date" class="form-input" />
          </div>
          <div class="form-group full-width">
            <label class="form-label">Tautan Sumber Berita / Referensi Asli</label>
            <input v-model="articleForm.source_url" type="text" placeholder="https://..." class="form-input" />
          </div>
          <div class="form-group full-width">
            <label class="form-label">Isi / Ringkasan Cerita</label>
            <textarea v-model="articleForm.summary" rows="4" class="form-textarea" placeholder="Tuliskan cerita, makna filosofis, atau ulasan perjalanan..."></textarea>
          </div>
          <div class="modal-actions full-width">
            <button type="button" @click="articleModalOpen = false" class="btn btn-secondary">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Publikasikan Cerita' }}</button>
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

const { currentUser: user } = useAuth();

// Datasets
const destinations = ref([]);
const services = ref([]);
const transportRoutes = ref([]);
const culinaryItems = ref([]);
const articles = ref([]);
const allReviews = ref([]);
const usersList = ref([]);
const regencies = ref([]);
const categories = ref([]);

// Active tab
const currentTab = ref('destinations');

// Search states
const destSearch = ref('');
const serviceSearch = ref('');
const transportSearch = ref('');
const culinarySearch = ref('');
const articleSearch = ref('');
const reviewSearch = ref('');
const userSearch = ref('');

// Modals states
const saving = ref(false);
const destModalOpen = ref(false);
const serviceModalOpen = ref(false);
const transportModalOpen = ref(false);
const culinaryModalOpen = ref(false);
const articleModalOpen = ref(false);

// Forms
const destForm = ref({ id: null, name: '', category_id: 1, regency_id: 1, price_display: 'Gratis', operational_hours: '08.00 - 18.00 WIB', address: '', image_url: '', description: '', is_community_managed: false });
const serviceForm = ref({ id: null, name: '', provider_name: '', service_type: 'cultural_experience', category_id: 4, regency_id: 1, contact_wa: '', price_display: '', price_unit: '', description: '' });
const transportForm = ref({ id: null, name: '', transport_type: 'ferry', route_direction: '', vehicle_type: 'Kapal Ferry KMP', departure_hours: '', price_display: '', description: '', operator: 'ASDP / Swasta', contact: '' });
const culinaryForm = ref({ id: null, name: '', halal_status: 'Halal', origin_region: 'Danau Toba', description: '', image_url: '' });
const articleForm = ref({ id: null, title: '', regency_id: null, published_at: new Date().toISOString().split('T')[0], source_url: '', summary: '' });

async function loadAllData() {
  try {
    const [destRes, servRes, transRes, culinRes, artRes, revRes, userRes, regRes, catRes] = await Promise.all([
      api.getDestinations({ limit: 100 }),
      api.getServices({ limit: 100 }),
      api.getTransport(),
      api.getCulinary(),
      api.getArticles(),
      api.getReviews({ limit: 100 }),
      api.getUsers(),
      api.getRegencies(),
      api.getCategories()
    ]);

    if (destRes.success) destinations.value = destRes.data || [];
    if (servRes.success) services.value = servRes.data || [];
    if (transRes.success) transportRoutes.value = transRes.data || [];
    if (culinRes.success) culinaryItems.value = culinRes.data || [];
    if (artRes.success) articles.value = artRes.data || [];
    if (revRes.success) allReviews.value = revRes.data || [];
    if (userRes.success) usersList.value = userRes.data || [];
    if (regRes.success) regencies.value = regRes.data || [];
    if (catRes.success) categories.value = catRes.data || [];
  } catch (err) {
    console.error('Error loading admin content:', err);
  }
}

// Filtered lists
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

const filteredTransport = computed(() => {
  if (!transportSearch.value.trim()) return transportRoutes.value;
  const q = transportSearch.value.toLowerCase();
  return transportRoutes.value.filter(t => t.name.toLowerCase().includes(q) || t.route_direction.toLowerCase().includes(q));
});

const filteredCulinary = computed(() => {
  if (!culinarySearch.value.trim()) return culinaryItems.value;
  const q = culinarySearch.value.toLowerCase();
  return culinaryItems.value.filter(c => c.name.toLowerCase().includes(q) || (c.origin_region && c.origin_region.toLowerCase().includes(q)));
});

const filteredArticles = computed(() => {
  if (!articleSearch.value.trim()) return articles.value;
  const q = articleSearch.value.toLowerCase();
  return articles.value.filter(a => a.title.toLowerCase().includes(q) || (a.summary && a.summary.toLowerCase().includes(q)));
});

const filteredReviews = computed(() => {
  if (!reviewSearch.value.trim()) return allReviews.value;
  const q = reviewSearch.value.toLowerCase();
  return allReviews.value.filter(r => (r.reviewer_name && r.reviewer_name.toLowerCase().includes(q)) || (r.review_text && r.review_text.toLowerCase().includes(q)));
});

const filteredUsersList = computed(() => {
  if (!userSearch.value.trim()) return usersList.value;
  const q = userSearch.value.toLowerCase();
  return usersList.value.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
});

function formatServiceType(t) {
  const map = { homestay: 'Homestay', cultural_experience: 'Budaya', tour_guide: 'Pemandu', adventure: 'Petualangan', boat_rental: 'Sewa Perahu' };
  return map[t] || t;
}

// 1. Destinations
function openAddDestinationModal() {
  destForm.value = { id: null, name: '', category_id: categories.value[0]?.id || 1, regency_id: regencies.value[0]?.id || 1, price_display: 'Gratis', operational_hours: '08.00 - 18.00 WIB', address: '', image_url: '', description: '', is_community_managed: false };
  destModalOpen.value = true;
}
function editDestination(d) {
  destForm.value = { ...d, is_community_managed: !!d.is_community_managed };
  destModalOpen.value = true;
}
async function saveDestination() {
  saving.value = true;
  try {
    const res = destForm.value.id ? await api.updateDestination(destForm.value.id, destForm.value) : await api.createDestination(destForm.value);
    if (res.success) { destModalOpen.value = false; await loadAllData(); alert('Destinasi berhasil disimpan!'); }
    else alert(res.message || 'Gagal menyimpan.');
  } finally { saving.value = false; }
}
async function deleteDest(id, name) {
  if (!confirm(`Hapus destinasi "${name}"?`)) return;
  const res = await api.deleteDestination(id);
  if (res.success) { await loadAllData(); alert('Destinasi berhasil dihapus.'); }
}

// 2. Services
function openAddServiceModal() {
  serviceForm.value = { id: null, name: '', provider_name: '', service_type: 'cultural_experience', category_id: 4, regency_id: regencies.value[0]?.id || 1, contact_wa: '', price_display: 'Rp 50.000', price_unit: 'per orang', description: '' };
  serviceModalOpen.value = true;
}
function editService(s) {
  serviceForm.value = { ...s };
  serviceModalOpen.value = true;
}
async function saveService() {
  saving.value = true;
  try {
    const res = serviceForm.value.id ? await api.updateService(serviceForm.value.id, serviceForm.value) : await api.createService(serviceForm.value);
    if (res.success) { serviceModalOpen.value = false; await loadAllData(); alert('Layanan berhasil disimpan!'); }
    else alert(res.message || 'Gagal menyimpan.');
  } finally { saving.value = false; }
}
async function deleteServ(id, name) {
  if (!confirm(`Hapus layanan "${name}"?`)) return;
  const res = await api.deleteService(id);
  if (res.success) { await loadAllData(); alert('Layanan berhasil dihapus.'); }
}

// 3. Transport
function openAddTransportModal() {
  transportForm.value = { id: null, name: '', transport_type: 'ferry', route_direction: '', vehicle_type: 'Kapal Ferry KMP', departure_hours: 'Setiap 1 Jam', price_display: 'Rp 15.000 / orang', description: '', operator: 'ASDP Indonesia Ferry', contact: '' };
  transportModalOpen.value = true;
}
function editTransport(t) {
  transportForm.value = { ...t };
  transportModalOpen.value = true;
}
async function saveTransport() {
  saving.value = true;
  try {
    const res = transportForm.value.id ? await api.updateTransport(transportForm.value.id, transportForm.value) : await api.createTransport(transportForm.value);
    if (res.success) { transportModalOpen.value = false; await loadAllData(); alert('Rute transportasi berhasil disimpan!'); }
    else alert(res.message || 'Gagal menyimpan.');
  } finally { saving.value = false; }
}
async function deleteTrans(id, name) {
  if (!confirm(`Hapus rute "${name}"?`)) return;
  const res = await api.deleteTransport(id);
  if (res.success) { await loadAllData(); alert('Rute transportasi berhasil dihapus.'); }
}

// 4. Culinary
function openAddCulinaryModal() {
  culinaryForm.value = { id: null, name: '', halal_status: 'Halal', origin_region: 'Danau Toba', description: '', image_url: '' };
  culinaryModalOpen.value = true;
}
function editCulinary(c) {
  culinaryForm.value = { ...c };
  culinaryModalOpen.value = true;
}
async function saveCulinary() {
  saving.value = true;
  try {
    const res = culinaryForm.value.id ? await api.updateCulinary(culinaryForm.value.id, culinaryForm.value) : await api.createCulinary(culinaryForm.value);
    if (res.success) { culinaryModalOpen.value = false; await loadAllData(); alert('Menu kuliner berhasil disimpan!'); }
    else alert(res.message || 'Gagal menyimpan.');
  } finally { saving.value = false; }
}
async function deleteCulin(id, name) {
  if (!confirm(`Hapus menu kuliner "${name}"?`)) return;
  const res = await api.deleteCulinary(id);
  if (res.success) { await loadAllData(); alert('Menu kuliner berhasil dihapus.'); }
}

// 5. Articles
function openAddArticleModal() {
  articleForm.value = { id: null, title: '', regency_id: null, published_at: new Date().toISOString().split('T')[0], source_url: '', summary: '' };
  articleModalOpen.value = true;
}
function editArticle(a) {
  articleForm.value = { ...a };
  articleModalOpen.value = true;
}
async function saveArticle() {
  saving.value = true;
  try {
    const res = articleForm.value.id ? await api.updateArticle(articleForm.value.id, articleForm.value) : await api.createArticle(articleForm.value);
    if (res.success) { articleModalOpen.value = false; await loadAllData(); alert('Cerita Toba berhasil disimpan!'); }
    else alert(res.message || 'Gagal menyimpan.');
  } finally { saving.value = false; }
}
async function deleteArtic(id, title) {
  if (!confirm(`Hapus artikel "${title}"?`)) return;
  const res = await api.deleteArticle(id);
  if (res.success) { await loadAllData(); alert('Artikel berhasil dihapus.'); }
}

// 6. Reviews
async function handleDeleteReview(id) {
  if (!confirm(`Hapus ulasan #${id}?`)) return;
  const res = await api.deleteReview(id);
  if (res.success) { await loadAllData(); alert('Ulasan berhasil dihapus.'); }
}

onMounted(() => {
  loadAllData();
});
</script>

<style scoped>
.admin-page {
  padding-top: 2rem;
  padding-bottom: 5rem;
}

.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  padding: 1.85rem 2rem;
  border-radius: var(--radius-xl);
  margin-bottom: 1.75rem;
}

.admin-header-theme {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  border-left: 6px solid #0284c7;
}

.badge-role-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.5rem;
}

.badge-admin-glow {
  background: #075985;
  color: #ffffff;
  font-size: 0.725rem;
  font-weight: 800;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
}

.badge-system-status {
  font-size: 0.725rem;
  color: #cbd5e1;
  font-weight: 600;
}

.dash-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: 0.4rem;
  color: white;
}

.dash-subtitle {
  font-size: 0.9rem;
  color: #e2e8f0;
  max-width: 780px;
  line-height: 1.5;
}

.dash-quick-create {
  flex-shrink: 0;
}

/* METRICS */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.15rem;
  border-radius: var(--radius-lg);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.metric-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.metric-num {
  font-size: 1.45rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.1;
  display: block;
}

.metric-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

/* TABS */
.dash-tabs {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.25rem;
  overflow-x: auto;
}

.dash-tab-btn {
  background: transparent;
  border: none;
  font-size: 0.875rem;
  font-weight: 700;
  color: #64748b;
  padding: 0.65rem 1.1rem;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
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

/* PANELS & TABLES */
.tab-panel {
  padding: 1.75rem;
  border-radius: var(--radius-xl);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.panel-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.panel-sub {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
}

.panel-tools {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.search-mini {
  max-width: 240px;
  padding: 0.45rem 0.75rem;
  font-size: 0.85rem;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.data-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
  text-align: left;
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.data-table tr:hover td {
  background: #f8fafc;
}

.id-tag {
  font-size: 0.75rem;
  font-family: monospace;
  color: #1e293b;
  background: #e2e8f0;
  font-weight: 700;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
}

.table-sub {
  display: block;
  font-size: 0.75rem;
  color: #475569;
}

.table-desc-cell {
  max-width: 260px;
  line-height: 1.4;
  margin: 0;
  color: #475569;
}

.review-comment-full {
  max-width: 280px;
  font-style: italic;
  color: #334155;
  margin: 0;
}

.time-sub {
  color: #475569;
  font-size: 0.75rem;
}

.rating-stars-gold {
  color: #b45309;
  font-weight: 800;
}

.badge-target {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  background: #f1f5f9;
}

.badge-service {
  background: #ede9fe;
  color: #6d28d9;
  font-size: 0.725rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-full);
}

.badge-role-admin {
  background: #e0f2fe;
  color: #0369a1;
  font-weight: 800;
}

.badge-role-partner {
  background: #f3e8ff;
  color: #7c3aed;
  font-weight: 800;
}

.badge-role-user {
  background: #d1fae5;
  color: #065f46;
  font-weight: 800;
}

.table-actions {
  display: flex;
  gap: 0.4rem;
}

.btn-table {
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: var(--radius-sm);
  padding: 0.3rem 0.55rem;
  font-size: 0.775rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-edit:hover {
  background: #f0f9ff;
  border-color: #0284c7;
  color: #0284c7;
}

.btn-del:hover {
  background: #fee2e2;
  border-color: #ef4444;
  color: #dc2626;
}

/* MODALS */
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
  max-width: 600px;
  padding: 1.75rem 2rem;
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

.modal-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.full-width {
  grid-column: span 2;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

@media (max-width: 768px) {
  .dash-header {
    flex-direction: column;
    align-items: stretch;
  }
  .modal-form-grid {
    grid-template-columns: 1fr;
  }
  .full-width {
    grid-column: span 1;
  }
}
</style>
