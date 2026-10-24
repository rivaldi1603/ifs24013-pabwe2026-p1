-- ====================================================================
-- SCHEMA DATABASE JELAYAHTOBA (DIREKTORI WISATA & JASA LOKAL DANAU TOBA)
-- Dibuat untuk Proyek 1 PABWE: Express.js (REST API) + SQLite + Vue.js
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. TABEL KABUPATEN (8 Wilayah Kawasan Danau Toba)
CREATE TABLE IF NOT EXISTS regencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    capital TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL KATEGORI (Wisata, Jasa, Transportasi, Kuliner)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('place', 'service', 'transport', 'culinary')),
    icon TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL PENGGUNA & AUTENTIKASI (Admin, Mitra Lokal, Wisatawan)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'partner', 'user')),
    phone TEXT,
    organization TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL DESTINASI WISATA (Objek Wisata, Alam, Budaya, Geosite)
CREATE TABLE IF NOT EXISTS destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category_id INTEGER NOT NULL,
    regency_id INTEGER NOT NULL,
    description TEXT,
    address TEXT,
    latitude REAL,
    longitude REAL,
    price_min INTEGER DEFAULT 0,
    price_max INTEGER DEFAULT 0,
    price_display TEXT DEFAULT 'Gratis',
    operational_hours TEXT DEFAULT '08.00 - 18.00 WIB',
    contact_phone TEXT,
    contact_wa TEXT,
    rating_avg REAL DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    is_community_managed INTEGER DEFAULT 0 CHECK(is_community_managed IN (0, 1)),
    status TEXT DEFAULT 'beroperasi',
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (regency_id) REFERENCES regencies(id) ON DELETE RESTRICT
);

-- 5. TABEL JASA LOKAL & PENGALAMAN BUDAYA (Fokus Nilai Tambah JelajahToba)
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category_id INTEGER NOT NULL,
    regency_id INTEGER NOT NULL,
    provider_name TEXT NOT NULL,
    service_type TEXT NOT NULL, -- homestay, tour_guide, cultural_experience, adventure, boat_rental
    description TEXT,
    price_min INTEGER DEFAULT 0,
    price_max INTEGER DEFAULT 0,
    price_unit TEXT DEFAULT 'per orang',
    price_display TEXT,
    facilities TEXT,
    address TEXT,
    latitude REAL,
    longitude REAL,
    contact_phone TEXT,
    contact_wa TEXT,
    rating_avg REAL DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    is_community_managed INTEGER DEFAULT 1 CHECK(is_community_managed IN (0, 1)),
    is_verified INTEGER DEFAULT 1 CHECK(is_verified IN (0, 1)),
    status TEXT DEFAULT 'active',
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (regency_id) REFERENCES regencies(id) ON DELETE RESTRICT
);

-- 6. TABEL TRANSPORTASI LOKAL & JADWAL FERRY
CREATE TABLE IF NOT EXISTS transport_routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    transport_type TEXT NOT NULL CHECK(transport_type IN ('ferry', 'land_shuttle', 'traditional_boat')),
    route_direction TEXT NOT NULL,
    vehicle_type TEXT,
    departure_hours TEXT,
    price_min INTEGER DEFAULT 0,
    price_max INTEGER DEFAULT 0,
    price_display TEXT,
    description TEXT,
    operator TEXT,
    contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABEL KULINER KHAS TRADISIONAL
CREATE TABLE IF NOT EXISTS culinary_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    halal_status TEXT,
    origin_region TEXT,
    is_traditional INTEGER DEFAULT 1,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABEL RESTORAN & RUMAH MAKAN LOKAL
CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    regency_id INTEGER NOT NULL,
    recommended_menu TEXT,
    address TEXT,
    latitude REAL,
    longitude REAL,
    price_min INTEGER DEFAULT 0,
    price_max INTEGER DEFAULT 0,
    price_display TEXT,
    rating_avg REAL DEFAULT 0.0,
    is_halal_certified INTEGER DEFAULT 0,
    contact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (regency_id) REFERENCES regencies(id) ON DELETE RESTRICT
);

-- 9. TABEL ARTIKEL & EDUKASI GEOPARK
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    regency_id INTEGER,
    summary TEXT,
    source_url TEXT,
    published_at DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (regency_id) REFERENCES regencies(id) ON DELETE SET NULL
);

-- 10. TABEL ULASAN & PENILAIAN PENGUNJUNG
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type TEXT NOT NULL CHECK(target_type IN ('destination', 'service')),
    target_id INTEGER NOT NULL,
    reviewer_name TEXT NOT NULL,
    user_id INTEGER,
    rating REAL NOT NULL CHECK(rating >= 1.0 AND rating <= 5.0),
    review_text TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- INDEXING UNTUK PERFORMA QUERY PENCARIAN & FILTERING
CREATE INDEX IF NOT EXISTS idx_dest_category ON destinations(category_id);
CREATE INDEX IF NOT EXISTS idx_dest_regency ON destinations(regency_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_regency ON services(regency_id);
CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_type, target_id);
