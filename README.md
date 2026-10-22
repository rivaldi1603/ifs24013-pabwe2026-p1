# JelajahToba: Direktori Wisata dan Jasa Lokal Danau Toba

Aplikasi Web Direktori Wisata dan Jasa Lokal Berbasis Komunitas di Kawasan Kaldera Danau Toba (*UNESCO Global Geopark*).

Proyek ini dikembangkan untuk memenuhi **Proyek 1 Mata Kuliah Pengembangan Aplikasi Berbasis Web (PABWE)** - Institut Teknologi Del (IT DEL).

---

## 1. Arsitektur & Teknologi

Sesuai ketentuan dan panduan proyek:
- **Frontend:** [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/) + [Vue Router 4](https://router.vuejs.org/) (Styling: Modern Vanilla CSS Design System).
- **Backend:** [Express.js](https://expressjs.com/) (RESTful API, validasi input, autentikasi JWT, role-based authorization).
- **Database:** [SQLite](https://www.sqlite.org/) (`database.sqlite`) via `better-sqlite3`.
- **Dataset:** Hasil pembersihan dan normalisasi (3NF) dari data mentah Hackathon Tourism IT Del (139 destinasi, 54 jasa lokal/homestay, 16 rute ferry ASDP, 12 kuliner tradisi, 148 restoran, 720+ ulasan otentik).

---

## 2. Struktur Direktori Proyek

```
Persiapan proyek/
├── backend/                              # Back-End (Express.js + SQLite)
│   ├── database.sqlite                   # Database SQLite aktif
│   ├── db.js                             # Modul koneksi better-sqlite3 (WAL mode)
│   ├── server.js                         # Entry point Express API (Port 5000)
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js                       # JWT verification & role-based middleware
│   └── routes/
│       ├── auth.routes.js                # Autentikasi (/api/auth)
│       ├── destinations.routes.js        # Objek wisata (/api/destinations)
│       ├── services.routes.js            # Jasa budaya & homestay (/api/services)
│       ├── transport.routes.js           # Jadwal ferry ASDP (/api/transport)
│       ├── culinary.routes.js            # Kuliner & resto (/api/culinary)
│       ├── reviews.routes.js             # Ulasan pengunjung (/api/reviews)
│       ├── meta.routes.js                # Kategori, kabupaten, statistik (/api/meta)
│       └── articles.routes.js            # Edukasi geopark (/api/articles)
│
├── frontend/                             # Front-End (Vue 3 + Vite)
│   ├── index.html                        # Entry HTML
│   ├── vite.config.js                    # Konfigurasi Vite & proxy ke port 5000
│   ├── package.json
│   └── src/
│       ├── main.js                       # Entry Vue App
│       ├── App.vue                       # Root layout (Navbar, RouterView, Footer)
│       ├── index.css                     # Design System CSS (Lake Toba aesthetic)
│       ├── api.js                        # Service layer client API
│       ├── router/
│       │   └── index.js                  # Routing Vue Router
│       ├── components/
│       │   ├── Navbar.vue                # Navigasi utama & auth status
│       │   ├── Footer.vue                # Footer informasi & kabupaten
│       │   ├── DestinationCard.vue       # Komponen kartu destinasi
│       │   ├── ServiceCard.vue           # Komponen kartu jasa & WhatsApp button
│       │   └── ReviewModal.vue           # Modal interaktif kirim ulasan & bintang
│       └── views/
│           ├── HomeView.vue              # Beranda (Hero, search, highlight, USP)
│           ├── DestinationsView.vue      # Direktori wisata (Filter multi-kriteria)
│           ├── DestinationDetailView.vue # Detail destinasi & ulasan
│           ├── ServicesView.vue          # Direktori jasa budaya & homestay warga
│           ├── ServiceDetailView.vue     # Detail jasa & booking WhatsApp
│           ├── TransportView.vue         # Jadwal kapal ferry ASDP & rute darat
│           ├── CulinaryView.vue          # 12 kuliner tradisi Batak & resto halal
│           ├── ArticlesView.vue          # Artikel geologis kaldera Toba
│           ├── DashboardView.vue         # Dashboard pengelolaan (Admin & Mitra)
│           └── LoginView.vue             # Login & registrasi akun
│
├── data_clean/                           # Dataset bersih dalam format JSON terstruktur
├── schema.sql                            # DDL Skema SQLite lengkap (3NF)
├── seed.sql                              # DML SQL Insert data
├── clean_and_normalize.py                # Pipeline Python ETL ekstraksi & pembersihan
└── JelajahToba_Dataset_Normalized.xlsx    # Spreadsheet Excel multi-sheet terverifikasi
```

---

## 3. Cara Menjalankan Aplikasi di Komputer Lokal

### Langkah 1: Jalankan Backend (Express.js)
Buka terminal baru:
```bash
cd backend
bun install   # atau: npm install
npm run dev   # Server berjalan di http://localhost:5000
```

### Langkah 2: Jalankan Frontend (Vue 3)
Buka terminal kedua:
```bash
cd frontend
bun install   # atau: npm install
npm run dev   # Antarmuka berjalan di http://localhost:3000
```

Buka peramban (browser) di: **`http://localhost:3000`**

---

## 4. Akun Demo untuk Pengujian & Evaluasi

Tersedia tombol *1-Click Demo Login* pada halaman Login & Dashboard:

| Role | Email | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@jelajahtoba.id` | `admin123` | Akses penuh dashboard, tambah/edit/hapus destinasi & jasa, lihat statistik |
| **Mitra Komunitas** | `hutaraja@jelajahtoba.id` | `mitra123` | Tambah & edit layanan budaya/homestay komunitas |
| **Wisatawan** | `budi.traveler@gmail.com` | `user123` | Menjelajah, memberikan ulasan dan rating |

---

## 5. Fitur Utama yang Telah Diimplementasikan

1. **Direktori Tempat & Jasa**:
   - 139 Objek Wisata (Wisata Alam, Budaya, Cagar Budaya, Museum, Geosite).
   - 54 Jasa Lokal & Pengalaman Komunitas (Homestay warga, Workshop tenun ulos, Pemandu lokal, River tubing Ajibata, Sewa perahu Solu).
2. **Pencarian & Filter Multi-Kriteria**:
   - Filter 8 Kabupaten lingkar Toba (Toba, Samosir, Simalungun, Taput, Humbahas, Dairi, Karo, Pakpak Bharat).
   - Filter Kategori & jenis jasa.
   - Filter khusus *"Hanya Dikelola Warga / Pokdarwis"*.
   - Filter *"Rumah Makan Halal / Ramah Muslim"*.
3. **Detail Lokasi & Kontak**:
   - Integrasi link Google Maps koordinat GPS (`latitude`, `longitude`).
   - Jam operasional dan harga tiket indikatif.
   - Tombol **Direct WhatsApp Booking** ke kontak nomor pengelola lokal.
4. **Ulasan & Penilaian Bintang**:
   - 720+ ulasan pengunjung riil.
   - Form modal interaktif untuk submit ulasan baru dengan penghitungan rata-rata rating secara otomatis (*real-time aggregation*).
5. **Jadwal Ferry ASDP**:
   - Jadwal KMP Ihan Batak, KMP Tao Toba, KMP Kaldera Toba, KMP Sumut, KMP Muara Putih antarpelabuhan Danau Toba.
6. **Dashboard Pengelolaan Informasi**:
   - Kartu metrik total data.
   - Manajemen CRUD Destinasi & Jasa Budaya.
