import openpyxl
import sqlite3
import json
import re
import os
import hashlib
from datetime import datetime

EXCEL_FILE = "Salinan dari Dataset HackathonTourism - IT DEL.xlsx"
OUTPUT_DIR = "data_clean"
DB_FILE = "database.sqlite"
SCHEMA_FILE = "schema.sql"
SEED_FILE = "seed.sql"
OUTPUT_EXCEL = "JelajahToba_Dataset_Normalized.xlsx"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def clean_str(val):
    if val is None:
        return ""
    s = str(val).strip()
    s = s.replace("\xa0", " ").replace("\ufffd", "")
    s = re.sub(r'\r\n', '\n', s)
    s = re.sub(r'\n{3,}', '\n\n', s)
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        s = s[1:-1].strip()
    return s

def slugify(text):
    text = clean_str(text).lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def parse_rating(val):
    if val is None:
        return 0.0
    s = str(val).strip().replace(',', '.')
    try:
        r = float(s)
        return round(min(max(r, 0.0), 5.0), 1)
    except:
        return 0.0

def parse_lat_long(val):
    if not val:
        return None, None
    s = clean_str(val)
    parts = [p.strip() for p in s.split(',')]
    if len(parts) >= 2:
        try:
            lat = float(parts[0])
            lng = float(parts[1])
            if 1.0 <= lat <= 4.0 and 97.0 <= lng <= 101.0:
                return round(lat, 6), round(lng, 6)
        except:
            pass
    return None, None

def parse_price(val):
    if val is None or str(val).strip() == "":
        return 0, 0, "Hubungi Pengelola"
    if isinstance(val, (int, float)):
        num = int(val)
        return num, num, f"Rp {num:,}".replace(",", ".")
    s = str(val).strip().replace("\xa0", " ").replace("\ufffd", "")
    sl = s.lower()
    if "gratis" in sl or "free" in sl:
        return 0, 0, "Gratis"
    if "sukarela" in sl:
        return 0, 0, "Sukarela"
    
    # If string ends with .0 from Python float string conversion (e.g. '100000.0')
    s = re.sub(r'\.0$', '', s)
    sl = s.lower()
    
    if "rb" in sl:
        nums = re.findall(r'(\d+)\s*rb', sl)
        if len(nums) == 1:
            val_num = int(nums[0]) * 1000
            return val_num, val_num, f"Rp {val_num:,}".replace(",", ".")
        elif len(nums) >= 2:
            min_val = min(int(n) for n in nums) * 1000
            max_val = max(int(n) for n in nums) * 1000
            return min_val, max_val, f"Rp {min_val:,} - Rp {max_val:,}".replace(",", ".")

    # Remove thousand dots: '250.000' -> '250000'
    s_nodots = re.sub(r'\.(?=\d{3})', '', s)
    parts = re.split(r'[-–—~]|sampai|sd', s_nodots)
    if len(parts) >= 2:
        def extract_num(txt):
            d = re.sub(r'[^\d]', '', txt)
            return int(d) if d else None
        n1 = extract_num(parts[0])
        n2 = extract_num(parts[1])
        if n1 and n2:
            p_min = min(n1, n2)
            p_max = max(n1, n2)
            return p_min, p_max, f"Rp {p_min:,} - Rp {p_max:,}".replace(",", ".")
            
    # Single number
    d = re.sub(r'[^\d]', '', s_nodots)
    if d:
        p = int(d)
        return p, p, f"Rp {p:,}".replace(",", ".")

    return 0, 0, clean_str(val)

def detect_regency(text):
    t = clean_str(text).lower()
    if any(k in t for k in ["kabupaten toba", "toba, sumatera utara", "balige", "laguboti", "porsea", "ajibata", "sigumpar", "habinsaran", "lumban bulbul", "silalahi pagar batu"]):
        return 1 # Toba
    if any(k in t for k in ["kabupaten samosir", "samosir, sumatera utara", "pangururan", "tuktuk", "tuk-tuk", "tomok", "ambarita", "simanindo", "parbaba", "palipi", "onan runggu"]):
        return 2 # Samosir
    if any(k in t for k in ["kabupaten simalungun", "simalungun, sumatera utara", "parapat", "girsang", "simarjarunjung", "sidamanik", "tigaras", "purba", "haranggaol", "tonduhan", "sipolha"]):
        return 3 # Simalungun
    if any(k in t for k in ["tapanuli utara", "taput", "tarutung", "silangit", "siborong", "muara", "sipoholon"]):
        return 4 # Tapanuli Utara
    if any(k in t for k in ["humbang hasundutan", "humbahas", "dolok sanggul", "bakkara", "sipinsur", "tipang", "lintong"]):
        return 5 # Humbang Hasundutan
    if any(k in t for k in ["dairi", "sidikalang", "paropo", "tao silalahi", "silahisabungan"]):
        return 6 # Dairi
    if any(k in t for k in ["karo", "berastagi", "tongging", "kabanjahe", "sipiso", "gundaling"]):
        return 7 # Karo
    if any(k in t for k in ["pakpak", "salak"]):
        return 8 # Pakpak Bharat
    if "toba" in t: return 1
    if "samosir" in t: return 2
    if "simalungun" in t: return 3
    return 1 # Default Toba

print("Loading workbook...")
wb = openpyxl.load_workbook(EXCEL_FILE, data_only=True)

# 1. REGENCIES
regencies_data = [
    {"id": 1, "name": "Kabupaten Toba", "short_name": "Toba", "capital": "Balige", "description": "Pusat budaya Batak Toba, museum TB Silalahi, pantai pasir putih Lumban Bulbul, dan gerbang selatan Danau Toba."},
    {"id": 2, "name": "Kabupaten Samosir", "short_name": "Samosir", "capital": "Pangururan", "description": "Pulau vulkanik di tengah Danau Toba, kaya akan situs sejarah Batak, Tomok, Tuktuk, dan desa tenun Hutaraja."},
    {"id": 3, "name": "Kabupaten Simalungun", "short_name": "Simalungun", "capital": "Raya / Parapat", "description": "Gerbang utama wisata Parapat, kebun teh Sidamanik, Bukit Indah Simarjarunjung, dan panorama danau yang spektakuler."},
    {"id": 4, "name": "Kabupaten Tapanuli Utara", "short_name": "Tapanuli Utara", "capital": "Tarutung", "description": "Pintu masuk udara Bandara Internasional Silangit, Geosite Huta Ginjang, pemandian air soda Sipoholon, dan pacuan kuda tradisional."},
    {"id": 5, "name": "Kabupaten Humbang Hasundutan", "short_name": "Humbang Hasundutan", "capital": "Dolok Sanggul", "description": "Lembah Bakkara tempat kelahiran Raja Sisingamangaraja XII, Geosite Sipinsur dengan panorama pulau Sibandang, dan kopi arabika Lintong."},
    {"id": 6, "name": "Kabupaten Dairi", "short_name": "Dairi", "capital": "Sidikalang", "description": "Kawasan Tao Silalahi dengan garis pantai terpanjang dan danau terdalam, bukit perkemahan Paropo, dan kopi legendaris Sidikalang."},
    {"id": 7, "name": "Kabupaten Karo", "short_name": "Karo", "capital": "Kabanjahe", "description": "Gerbang utara kaldera Danau Toba, air terjun Sipiso-piso setinggi 120m, desa Tongging, dan agrowisata pegunungan Berastagi."},
    {"id": 8, "name": "Kabupaten Pakpak Bharat", "short_name": "Pakpak Bharat", "capital": "Salak", "description": "Wilayah penyangga ekosistem Danau Toba dengan hutan tropis, air terjun Lae Une, dan kebudayaan suku Batak Pakpak."}
]

# 2. CATEGORIES
categories_data = [
    {"id": 1, "slug": "wisata-alam", "name": "Wisata Alam", "type": "place", "icon": "mountain", "description": "Perbukitan, pantai danau, air terjun, dan panorama alam Danau Toba."},
    {"id": 2, "slug": "wisata-budaya", "name": "Wisata Budaya & Sejarah", "type": "place", "icon": "landmark", "description": "Museum, situs bersejarah, rumah bolon, dan makam raja-raja Batak."},
    {"id": 3, "slug": "desa-wisata", "name": "Desa Wisata & Geosite", "type": "place", "icon": "tree", "description": "Desa berbasis komunitas lokal dan geosite warisan geologi UNESCO."},
    {"id": 4, "slug": "homestay-lokal", "name": "Homestay & Penginapan Warga", "type": "service", "icon": "home", "description": "Akomodasi milik warga lokal dengan keramahan autentik dan harga terjangkau."},
    {"id": 5, "slug": "pemandu-wisata", "name": "Pemandu Lokal (Tour Guide)", "type": "service", "icon": "user-check", "description": "Pemandu berlisensi dan pemuda desa pemandu trekking, geosite, dan sejarah."},
    {"id": 6, "slug": "pengalaman-budaya", "name": "Pengalaman & Workshop Budaya", "type": "service", "icon": "palette", "description": "Workshop tenun ulos, latihan tari tor-tor, sanggar seni, dan river tubing warga."},
    {"id": 7, "slug": "kuliner-khas", "name": "Kuliner & Restoran Khas", "type": "place", "icon": "utensils", "description": "Rumah makan khas Batak, kuliner halal ramah muslim, dan kedai kopi lokal."},
    {"id": 8, "slug": "transportasi-lokal", "name": "Transportasi & Penyeberangan", "type": "transport", "icon": "ship", "description": "Jadwal kapal ferry penyeberangan Danau Toba, angkutan umum KBT/KPT, dan rental lokal."}
]

# 3. USERS (Seed for Authentication)
# Password default: "admin123", "mitra123", "user123" (disimpan dalam bentuk hash SHA256 / format bcrypt mock)
users_data = [
    {"id": 1, "name": "Admin JelajahToba", "email": "admin@jelajahtoba.id", "password": hashlib.sha256("admin123".encode()).hexdigest(), "role": "admin", "phone": "08126001001", "organization": "Pengelola Direktori JelajahToba"},
    {"id": 2, "name": "Saut Sitorus (Ketua Pokdarwis Hutaraja)", "email": "hutaraja@jelajahtoba.id", "password": hashlib.sha256("mitra123".encode()).hexdigest(), "role": "partner", "phone": "081375223344", "organization": "Komunitas Tenun Hutaraja Samosir"},
    {"id": 3, "name": "Tigor Sirait (Pemandu Geopark Kaldera)", "email": "tigor.guide@jelajahtoba.id", "password": hashlib.sha256("mitra123".encode()).hexdigest(), "role": "partner", "phone": "082165889900", "organization": "Himpunan Pramuwisata Toba"},
    {"id": 4, "name": "Inang Dame Homestay", "email": "dame.homestay@jelajahtoba.id", "password": hashlib.sha256("mitra123".encode()).hexdigest(), "role": "partner", "phone": "085270112233", "organization": "Asosiasi Homestay Lumban Bulbul"},
    {"id": 5, "name": "Budi Santoso (Wisatawan)", "email": "budi.traveler@gmail.com", "password": hashlib.sha256("user123".encode()).hexdigest(), "role": "user", "phone": "081912345678", "organization": "Wisatawan Mandiri"}
]

# 4. DESTINATIONS (from 'wisata-metadata')
destinations_sheet = wb['wisata-metadata']
dest_rows = list(destinations_sheet.iter_rows(values_only=True))
dest_header = dest_rows[0]

destinations_data = []
dest_name_to_id = {}
used_dest_slugs = set()
curr_id = 1

for r in dest_rows[1:]:
    if not any(r): continue
    d = dict(zip(dest_header, r))
    name = clean_str(d.get('place-name'))
    if not name or name.lower() == 'place-name': continue

    ptype = clean_str(d.get('place-type'))
    fee = d.get('entry-fee')
    latlong = d.get('lat-long')
    op_hour = clean_str(d.get('operational-hour')) or "08.00 - 18.00 WIB"
    addr = clean_str(d.get('address'))
    rating = parse_rating(d.get('place-rating')) or 4.2
    status = clean_str(d.get('status')) or "beroperasi"
    desc = clean_str(d.get('description')) or f"Objek wisata {name} berlokasi di kawasan Danau Toba dengan keindahan dan keunikan khas lokal."

    lat, lng = parse_lat_long(latlong)
    p_min, p_max, p_disp = parse_price(fee)
    reg_id = detect_regency(addr + " " + name)

    # Category mapping
    cat_id = 1 # Wisata Alam
    if any(k in ptype.lower() for k in ["budaya", "sejarah", "museum", "balai", "rohani"]) or any(k in name.lower() for k in ["museum", "makam", "situs", "gereja", "salib", "rumah bolon"]):
        cat_id = 2 # Budaya & Sejarah
    elif "desa" in name.lower() or "huta" in name.lower() or "geosite" in name.lower():
        cat_id = 3 # Desa Wisata

    is_community = 1 if (cat_id in [2, 3] or "pokdarwis" in desc.lower() or "pantai" in name.lower()) else 0

    dest_slug = slugify(name)
    base_slug = dest_slug
    s_count = 1
    while dest_slug in used_dest_slugs:
        s_count += 1
        dest_slug = f"{base_slug}-{s_count}"
    used_dest_slugs.add(dest_slug)

    dest_item = {
        "id": curr_id,
        "name": name,
        "slug": dest_slug,
        "category_id": cat_id,
        "regency_id": reg_id,
        "description": desc,
        "address": addr,
        "latitude": lat,
        "longitude": lng,
        "price_min": p_min,
        "price_max": p_max,
        "price_display": p_disp,
        "operational_hours": op_hour,
        "contact_phone": "0812-6000-8888",
        "contact_wa": "6281260008888",
        "rating_avg": rating,
        "review_count": 0,
        "is_community_managed": is_community,
        "status": status,
        "image_url": f"https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=800&q=80"
    }
    destinations_data.append(dest_item)
    dest_name_to_id[name.lower()] = curr_id
    curr_id += 1

print(f"Extracted {len(destinations_data)} destinations.")

# 5. LOCAL SERVICES & HOMESTAYS & COMMUNITY EXPERIENCES
services_data = []
used_service_slugs = set()
service_id = 1

# A. From 'hotel-metadata' (Homestays & Villas)
hotel_sheet = wb['hotel-metadata']
hotel_rows = list(hotel_sheet.iter_rows(values_only=True))
hotel_header = hotel_rows[0]

for r in hotel_rows[1:]:
    if not any(r): continue
    d = dict(zip(hotel_header, r))
    name = clean_str(d.get('place-name'))
    if not name or name.lower() == 'place-name': continue

    price = d.get('price-per-head')
    fac = clean_str(d.get('Fasilitas')) or "Kamar tidur, kamar mandi, sarapan"
    addr = clean_str(d.get('address'))
    latlong = d.get('lat-long')
    rating = parse_rating(d.get('place-rating')) or 4.5
    ptype = clean_str(d.get('place-type')) or "Homestay"

    lat, lng = parse_lat_long(latlong)
    p_min, p_max, p_disp = parse_price(price)
    reg_id = detect_regency(addr + " " + name)

    is_homestay = "homestay" in name.lower() or "guest house" in ptype.lower() or "rumah wisata" in ptype.lower() or "pondok" in ptype.lower()

    srv_slug = slugify(name)
    b_slug = srv_slug
    s_c = 1
    while srv_slug in used_service_slugs:
        s_c += 1
        srv_slug = f"{b_slug}-{s_c}"
    used_service_slugs.add(srv_slug)

    services_data.append({
        "id": service_id,
        "name": name,
        "slug": srv_slug,
        "category_id": 4, # Homestay & Penginapan Warga
        "regency_id": reg_id,
        "provider_name": f"Pengelola {name}",
        "service_type": "homestay",
        "description": f"Penginapan lokal di kawasan {regencies_data[reg_id-1]['name']} dengan fasilitas {fac}. Suasana hangat dan ramah masyarakat lokal.",
        "price_min": p_min or 150000,
        "price_max": p_max or 350000,
        "price_unit": "per malam",
        "price_display": p_disp if p_disp != "Hubungi Pengelola" else "Rp 150.000 - Rp 350.000",
        "facilities": fac,
        "address": addr,
        "latitude": lat,
        "longitude": lng,
        "contact_phone": "0813-7000-1122",
        "contact_wa": "6281370001122",
        "rating_avg": rating,
        "review_count": 0,
        "is_community_managed": 1 if is_homestay else 0,
        "is_verified": 1,
        "status": "active"
    })
    service_id += 1

# B. From 'Attractions Info' (Jasa Budaya, Atraksi & Olahraga Petualangan Komunitas)
attractions_sheet = wb['Attractions Info']
attr_rows = list(attractions_sheet.iter_rows(values_only=True))

for r in attr_rows[2:]: # Skip title rows
    if not any(r): continue
    kab_raw, name, desc, loc, hours, price_raw, hist = r[1], r[2], r[3], r[4], r[5], r[6], r[7]
    name = clean_str(name)
    if not name: continue

    desc = clean_str(desc)
    hist = clean_str(hist)
    full_desc = f"{desc}\n\nLatar Belakang Budaya & Komunitas:\n{hist}" if hist else desc
    loc = clean_str(loc) or "Kawasan Danau Toba"
    hours = clean_str(hours) or "08.00 - 17.00 WIB"
    reg_id = detect_regency(str(kab_raw) + " " + loc + " " + name)
    p_min, p_max, p_disp = parse_price(price_raw)

    stype = "cultural_experience"
    cat_id = 6 # Pengalaman & Workshop Budaya
    if any(k in name.lower() for k in ["paralayang", "tubing", "kano", "flyboard", "atv", "canyoneering", "berkuda"]):
        stype = "adventure"
    elif any(k in name.lower() for k in ["sigale", "ulos", "budaya", "pacuan"]):
        stype = "cultural_experience"

    srv_slug = slugify(name)
    b_slug = srv_slug
    s_c = 1
    while srv_slug in used_service_slugs:
        s_c += 1
        srv_slug = f"{b_slug}-{s_c}"
    used_service_slugs.add(srv_slug)

    services_data.append({
        "id": service_id,
        "name": name,
        "slug": srv_slug,
        "category_id": cat_id,
        "regency_id": reg_id,
        "provider_name": f"Kelompok Pengelola {name}",
        "service_type": stype,
        "description": full_desc,
        "price_min": p_min or 50000,
        "price_max": p_max or 250000,
        "price_unit": "per orang / paket",
        "price_display": p_disp if p_disp != "Hubungi Pengelola" else "Rp 50.000 - Rp 250.000",
        "facilities": "Pemandu lokal, alat keselamatan/perlengkapan, spot foto",
        "address": loc,
        "latitude": None,
        "longitude": None,
        "contact_phone": "0812-7888-9900",
        "contact_wa": "6281278889900",
        "rating_avg": 4.8,
        "review_count": 0,
        "is_community_managed": 1,
        "is_verified": 1,
        "status": "active"
    })
    service_id += 1

# C. Curated Community Local Guides (Pemandu Lokal Berpengalaman)
local_guides = [
    {
        "name": "Pemandu Sejarah Raja Sisingamangaraja & Lembah Bakkara",
        "regency_id": 5, # Humbahas
        "provider_name": "Tumpak Sinambela (Tetua Adat Bakkara)",
        "service_type": "tour_guide",
        "description": "Menyusuri jejak perjuangan Pahlawan Nasional Sisingamangaraja XII, Aek Sipangolu, Tombak Sulu-sulu, dan cerita lisan tradisi Batak langsung dari tetua adat.",
        "price_min": 150000, "price_max": 250000, "price_unit": "per trip (maks 5 orang)",
        "price_display": "Rp 150.000 - Rp 250.000 / trip",
        "address": "Lembah Bakkara, Kec. Baktiraja, Humbang Hasundutan",
        "contact_phone": "0821-6543-9911", "contact_wa": "6282165439911", "rating_avg": 4.9
    },
    {
        "name": "Trekking Guide Geosite Huta Ginjang & Pemandangan Kaldera",
        "regency_id": 4, # Taput
        "provider_name": "Erick Hutabarat (Pemuda Sadar Wisata Muara)",
        "service_type": "tour_guide",
        "description": "Pemanduan jalur trekking perbukitan pinus Huta Ginjang dengan pemandangan 360 derajat Danau Toba dan Pulau Sibandang, serta edukasi fenomena supervolcano.",
        "price_min": 100000, "price_max": 200000, "price_unit": "per trip",
        "price_display": "Rp 100.000 - Rp 200.000 / trip",
        "address": "Huta Ginjang, Kec. Muara, Tapanuli Utara",
        "contact_phone": "0813-9088-7766", "contact_wa": "6281390887766", "rating_avg": 4.8
    },
    {
        "name": "Live Workshop Belajar Menenun Ulos Tradisional",
        "regency_id": 2, # Samosir
        "provider_name": "Inang Martalina Simarmata (Penenun Hutaraja)",
        "service_type": "cultural_experience",
        "description": "Praktik langsung teknik menenun ulos Batak dengan alat tenun tradisional (gedokan), memahami makna motif ragi hotang, mangiring, dan sibolang.",
        "price_min": 75000, "price_max": 150000, "price_unit": "per orang (termasuk bahan)",
        "price_display": "Rp 75.000 - Rp 150.000 / orang",
        "address": "Kampung Ulos Hutaraja, Desa Lumban Suhi-suhi Toruan, Samosir",
        "contact_phone": "0852-6111-2244", "contact_wa": "6285261112244", "rating_avg": 5.0
    },
    {
        "name": "Sewa Perahu Tradisional Solu Bolon Keliling Pantai Lumban Bulbul",
        "regency_id": 1, # Toba
        "provider_name": "Nelayan Tradisional Lumban Bulbul",
        "service_type": "boat_rental",
        "description": "Menikmati tenangnya air danau dengan perahu tradisional dayung kayu (solu) ditemani nelayan lokal sambil menyaksikan matahari terbit (sunrise).",
        "price_min": 50000, "price_max": 100000, "price_unit": "per jam (kapasitas 4 orang)",
        "price_display": "Rp 50.000 - Rp 100.000 / jam",
        "address": "Pantai Lumban Bulbul, Balige, Kabupaten Toba",
        "contact_phone": "0812-3344-5566", "contact_wa": "6281233445566", "rating_avg": 4.7
    }
]

for g in local_guides:
    srv_slug = slugify(g["name"])
    b_slug = srv_slug
    s_c = 1
    while srv_slug in used_service_slugs:
        s_c += 1
        srv_slug = f"{b_slug}-{s_c}"
    used_service_slugs.add(srv_slug)

    services_data.append({
        "id": service_id,
        "name": g["name"],
        "slug": srv_slug,
        "category_id": 5 if "guide" in g["service_type"] else 6,
        "regency_id": g["regency_id"],
        "provider_name": g["provider_name"],
        "service_type": g["service_type"],
        "description": g["description"],
        "price_min": g["price_min"],
        "price_max": g["price_max"],
        "price_unit": g["price_unit"],
        "price_display": g["price_display"],
        "facilities": "Pemandu lokal berpengalaman, briefing budaya, alat bantu",
        "address": g["address"],
        "latitude": None,
        "longitude": None,
        "contact_phone": g["contact_phone"],
        "contact_wa": g["contact_wa"],
        "rating_avg": g["rating_avg"],
        "review_count": 0,
        "is_community_managed": 1,
        "is_verified": 1,
        "status": "active"
    })
    service_id += 1

print(f"Extracted {len(services_data)} local services.")

# 6. TRANSPORT ROUTES (from 'transportasi')
trans_sheet = wb['transportasi']
trans_rows = list(trans_sheet.iter_rows(values_only=True))
trans_header = trans_rows[0]

transport_data = []
t_id = 1

for r in trans_rows[1:]:
    if not any(r): continue
    d = dict(zip(trans_header, r))
    name = clean_str(d.get('transport-name'))
    if not name or name.lower() == 'transport-name': continue

    direction = clean_str(d.get('direction'))
    price = d.get('price')
    car_type = clean_str(d.get('jenis-mobil'))
    desc = clean_str(d.get('description'))
    hours = clean_str(d.get('operational-hour')) or "Sesuai Jadwal"

    p_min, p_max, p_disp = parse_price(price)
    is_ferry = "ferry" in car_type.lower() or "kmp" in name.lower() or "ke" in direction.lower()

    ttype = "ferry" if is_ferry else "land_shuttle"

    transport_data.append({
        "id": t_id,
        "name": name,
        "transport_type": ttype,
        "route_direction": direction,
        "vehicle_type": car_type or ("Kapal Ferry Ro-Ro" if is_ferry else "Minibus"),
        "departure_hours": hours,
        "price_min": p_min or 10000,
        "price_max": p_max or 90000,
        "price_display": p_disp if p_disp != "Hubungi Pengelola" else "Rp 15.000 - Rp 90.000",
        "description": desc or f"Layanan transportasi {name} melayani rute {direction}.",
        "operator": "PT ASDP Indonesia Ferry / Koperasi Angkutan Lokal",
        "contact": "191 (ASDP) / Terminal Terkait"
    })
    t_id += 1

print(f"Extracted {len(transport_data)} transport routes.")

# 7. CULINARY ITEMS (from 'kuliner')
culinary_sheet = wb['kuliner']
cul_rows = list(culinary_sheet.iter_rows(values_only=True))
culinary_data = []
cul_id = 1

for r in cul_rows[1:]:
    if not any(r): continue
    name = clean_str(r[1])
    desc = clean_str(r[2])
    if not name or name.lower() == 'kuliner-name': continue

    culinary_data.append({
        "id": cul_id,
        "name": name,
        "slug": slugify(name),
        "description": desc,
        "halal_status": "Halal" if name in ["Dali ni Horbo", "Mie Gomak", "Mie Sop", "Sira Pege", "Sambal Tuktuk", "Naniarsik", "Na Tinombur"] else "Non-Halal (Daging Khas)",
        "origin_region": "Batak Toba / Samosir / Tapanuli",
        "is_traditional": 1
    })
    cul_id += 1

print(f"Extracted {len(culinary_data)} culinary items.")

# 8. RESTAURANTS & EATERIES (from 'resto-metadata')
resto_sheet = wb['resto-metadata']
resto_rows = list(resto_sheet.iter_rows(values_only=True))
resto_header = resto_rows[0]
restaurants_data = []
used_resto_slugs = set()
resto_id = 1

for r in resto_rows[1:]:
    if not any(r): continue
    d = dict(zip(resto_header, r))
    name = clean_str(d.get('place-name'))
    if not name or name.lower() == 'place-name': continue

    price = d.get('price-per-head')
    menu = clean_str(d.get('recommend-menu'))
    addr = clean_str(d.get('address'))
    latlong = d.get('lat-long')
    rating = parse_rating(d.get('place-rating')) or 4.3

    lat, lng = parse_lat_long(latlong)
    p_min, p_max, p_disp = parse_price(price)
    reg_id = detect_regency(addr + " " + name)

    is_halal = "halal" in (name + " " + menu).lower() or "islam" in name.lower()

    rst_slug = slugify(name)
    b_slug = rst_slug
    r_c = 1
    while rst_slug in used_resto_slugs:
        r_c += 1
        rst_slug = f"{b_slug}-{r_c}"
    used_resto_slugs.add(rst_slug)

    restaurants_data.append({
        "id": resto_id,
        "name": name,
        "slug": rst_slug,
        "regency_id": reg_id,
        "recommended_menu": menu,
        "address": addr,
        "latitude": lat,
        "longitude": lng,
        "price_min": p_min or 20000,
        "price_max": p_max or 60000,
        "price_display": p_disp if p_disp != "Hubungi Pengelola" else "Rp 25.000 - Rp 50.000",
        "rating_avg": rating,
        "is_halal_certified": 1 if is_halal else 0,
        "contact": "0812-8899-7711"
    })
    resto_id += 1

print(f"Extracted {len(restaurants_data)} restaurants.")

# 9. ARTICLES (from 'Artikel Danau Toba')
art_sheet = wb['Artikel Danau Toba']
art_rows = list(art_sheet.iter_rows(values_only=True))
articles_data = []
art_id = 1

for r in art_rows[1:]:
    if not any(r): continue
    title = clean_str(r[1])
    kab = clean_str(r[2])
    summary = clean_str(r[3])
    url = clean_str(r[4])
    if not title or title.lower() == 'judul artikel': continue

    reg_id = detect_regency(kab + " " + title)

    articles_data.append({
        "id": art_id,
        "title": title,
        "slug": slugify(title),
        "regency_id": reg_id,
        "summary": summary,
        "source_url": url,
        "published_at": "2026-08-15"
    })
    art_id += 1

print(f"Extracted {len(articles_data)} articles.")

# 10. REVIEWS & RATINGS (Extract from 'wisata-v2')
# Sample relevant, non-empty, high-quality reviews linked to destinations
review_sheet = wb['wisata-v2']
rev_data = []
rev_id = 1
dest_review_counts = {}
dest_rating_sums = {}

def norm_text(s):
    return re.sub(r'[^a-zA-Z0-9]', '', clean_str(s).lower())

norm_dest_map = {norm_text(d["name"]): d["id"] for d in destinations_data}

# Also support partial matches
for r in review_sheet.iter_rows(values_only=True):
    pname = clean_str(r[0])
    if not pname or pname.lower() == 'place-name': continue
    user_name = clean_str(r[2]) or "Pengunjung Anonim"
    rating = parse_rating(r[3])
    text = clean_str(r[4])
    pub_at = clean_str(r[5]) or "baru saja"

    if not text or len(text) < 10: continue

    # Find destination
    matched_id = norm_dest_map.get(norm_text(pname))
    if not matched_id:
        p_clean = norm_text(pname)
        for k, v in norm_dest_map.items():
            if k in p_clean or p_clean in k:
                matched_id = v
                break

    if matched_id:
        # Keep up to 8 reviews per destination to keep database lightweight & responsive
        count = dest_review_counts.get(matched_id, 0)
        if count < 8:
            rev_data.append({
                "id": rev_id,
                "target_type": "destination",
                "target_id": matched_id,
                "reviewer_name": user_name,
                "rating": rating if rating > 0 else 5.0,
                "review_text": text,
                "created_at": pub_at
            })
            dest_review_counts[matched_id] = count + 1
            dest_rating_sums[matched_id] = dest_rating_sums.get(matched_id, 0.0) + (rating if rating > 0 else 5.0)
            rev_id += 1

# Update destination ratings and review counts with real values
for d in destinations_data:
    did = d["id"]
    if did in dest_review_counts:
        d["review_count"] = dest_review_counts[did]
        d["rating_avg"] = round(dest_rating_sums[did] / dest_review_counts[did], 1)

print(f"Extracted {len(rev_data)} authentic reviews for destinations.")

# Add curated reviews for local services (homestays & cultural activities)
service_reviews = [
    {"target_type": "service", "target_id": 1, "reviewer_name": "Jessy Diferentemente", "rating": 5.0, "review_text": "Kamar-kamar sederhana di desa tradisional. Semuanya disiapkan untuk kami dan sangat rapi. Sekitar 100.000 per orang termasuk sarapan enak.", "created_at": "1 bulan lalu"},
    {"target_type": "service", "target_id": 2, "reviewer_name": "Rian Simatupang", "rating": 5.0, "review_text": "Pengalaman luar biasa! Pemilik homestay sangat ramah dan menceritakan silsilah keluarga serta sejarah kampung.", "created_at": "2 minggu lalu"},
    {"target_type": "service", "target_id": len(services_data) - 1, "reviewer_name": "Clara Sitompul", "rating": 5.0, "review_text": "Belajar tenun ulos langsung dari ibu-ibu penenun Hutaraja sangat mengesankan. Sangat sabar mengajari teknik dasarnya.", "created_at": "3 hari lalu"},
    {"target_type": "service", "target_id": len(services_data) - 3, "reviewer_name": "David Tan", "rating": 4.9, "review_text": "Pak Tumpak pemandu yang sangat berwawasan. Menjelajahi jejak Sisingamangaraja jadi sangat hidup dan bermakna.", "created_at": "1 minggu lalu"}
]

for sr in service_reviews:
    sr["id"] = rev_id
    rev_data.append(sr)
    rev_id += 1

# Update service review counts
for s in services_data:
    s_revs = [r for r in rev_data if r["target_type"] == "service" and r["target_id"] == s["id"]]
    if s_revs:
        s["review_count"] = len(s_revs)
        s["rating_avg"] = round(sum(r["rating"] for r in s_revs) / len(s_revs), 1)

# WRITE JSON FILES
def save_json(filename, data):
    p = os.path.join(OUTPUT_DIR, filename)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved: {p}")

save_json("regencies.json", regencies_data)
save_json("categories.json", categories_data)
save_json("users.json", users_data)
save_json("destinations.json", destinations_data)
save_json("services.json", services_data)
save_json("transport_routes.json", transport_data)
save_json("culinary.json", culinary_data)
save_json("restaurants.json", restaurants_data)
save_json("articles.json", articles_data)
save_json("reviews.json", rev_data)

# BUILD SQLITE DATABASE & SCHEMA & SEED
print("Building SQLite database and SQL scripts...")

schema_sql = """-- ====================================================================
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
"""

with open(SCHEMA_FILE, "w", encoding="utf-8") as f:
    f.write(schema_sql)
print(f"Saved: {SCHEMA_FILE}")

# Initialize SQLite
if os.path.exists(DB_FILE):
    os.remove(DB_FILE)

conn = sqlite3.connect(DB_FILE)
cur = conn.cursor()
cur.executescript(schema_sql)

# Insert Regencies
for r in regencies_data:
    cur.execute("INSERT INTO regencies (id, name, short_name, capital, description) VALUES (?, ?, ?, ?, ?)",
                (r["id"], r["name"], r["short_name"], r["capital"], r["description"]))

# Insert Categories
for c in categories_data:
    cur.execute("INSERT INTO categories (id, slug, name, type, icon, description) VALUES (?, ?, ?, ?, ?, ?)",
                (c["id"], c["slug"], c["name"], c["type"], c["icon"], c["description"]))

# Insert Users
for u in users_data:
    cur.execute("INSERT INTO users (id, name, email, password, role, phone, organization) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (u["id"], u["name"], u["email"], u["password"], u["role"], u["phone"], u["organization"]))

# Insert Destinations
for d in destinations_data:
    cur.execute("""INSERT INTO destinations (id, name, slug, category_id, regency_id, description, address,
                   latitude, longitude, price_min, price_max, price_display, operational_hours,
                   contact_phone, contact_wa, rating_avg, review_count, is_community_managed, status, image_url)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (d["id"], d["name"], d["slug"], d["category_id"], d["regency_id"], d["description"], d["address"],
                 d["latitude"], d["longitude"], d["price_min"], d["price_max"], d["price_display"], d["operational_hours"],
                 d["contact_phone"], d["contact_wa"], d["rating_avg"], d["review_count"], d["is_community_managed"], d["status"], d["image_url"]))

# Insert Services
for s in services_data:
    cur.execute("""INSERT INTO services (id, name, slug, category_id, regency_id, provider_name, service_type,
                   description, price_min, price_max, price_unit, price_display, facilities, address,
                   latitude, longitude, contact_phone, contact_wa, rating_avg, review_count, is_community_managed, is_verified, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (s["id"], s["name"], s["slug"], s["category_id"], s["regency_id"], s["provider_name"], s["service_type"],
                 s["description"], s["price_min"], s["price_max"], s["price_unit"], s["price_display"], s["facilities"], s["address"],
                 s["latitude"], s["longitude"], s["contact_phone"], s["contact_wa"], s["rating_avg"], s["review_count"], s["is_community_managed"], s["is_verified"], s["status"]))

# Insert Transport
for t in transport_data:
    cur.execute("""INSERT INTO transport_routes (id, name, transport_type, route_direction, vehicle_type,
                   departure_hours, price_min, price_max, price_display, description, operator, contact)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (t["id"], t["name"], t["transport_type"], t["route_direction"], t["vehicle_type"],
                 t["departure_hours"], t["price_min"], t["price_max"], t["price_display"], t["description"], t["operator"], t["contact"]))

# Insert Culinary
for cu in culinary_data:
    cur.execute("""INSERT INTO culinary_items (id, name, slug, description, halal_status, origin_region, is_traditional)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (cu["id"], cu["name"], cu["slug"], cu["description"], cu["halal_status"], cu["origin_region"], cu["is_traditional"]))

# Insert Restaurants
for res in restaurants_data:
    cur.execute("""INSERT INTO restaurants (id, name, slug, regency_id, recommended_menu, address,
                   latitude, longitude, price_min, price_max, price_display, rating_avg, is_halal_certified, contact)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (res["id"], res["name"], res["slug"], res["regency_id"], res["recommended_menu"], res["address"],
                 res["latitude"], res["longitude"], res["price_min"], res["price_max"], res["price_display"], res["rating_avg"], res["is_halal_certified"], res["contact"]))

# Insert Articles
for a in articles_data:
    cur.execute("""INSERT INTO articles (id, title, slug, regency_id, summary, source_url, published_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (a["id"], a["title"], a["slug"], a["regency_id"], a["summary"], a["source_url"], a["published_at"]))

# Insert Reviews
for rv in rev_data:
    cur.execute("""INSERT INTO reviews (id, target_type, target_id, reviewer_name, user_id, rating, review_text, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (rv["id"], rv["target_type"], rv["target_id"], rv["reviewer_name"], None, rv["rating"], rv["review_text"], rv["created_at"]))

conn.commit()
print(f"Database populated successfully: {DB_FILE}")

# Dump to seed.sql
with open(SEED_FILE, "w", encoding="utf-8") as f:
    f.write(schema_sql)
    f.write("\n\n-- ================= DATA INSERTS =================\n\n")
    for line in conn.iterdump():
        if line.startswith("INSERT INTO"):
            f.write(line + "\n")
print(f"Saved: {SEED_FILE}")

conn.close()

# 11. EXPORT CLEANED NORMALIZED EXCEL FILE
print("Creating normalized Excel workbook...")
out_wb = openpyxl.Workbook()
# Remove default sheet
out_wb.remove(out_wb.active)

def add_sheet_from_data(wb_obj, sheet_name, data_list):
    if not data_list: return
    ws = wb_obj.create_sheet(title=sheet_name)
    headers = list(data_list[0].keys())
    ws.append(headers)
    for item in data_list:
        ws.append([item.get(h) for h in headers])

add_sheet_from_data(out_wb, "1. Regencies (Kabupaten)", regencies_data)
add_sheet_from_data(out_wb, "2. Categories (Kategori)", categories_data)
add_sheet_from_data(out_wb, "3. Destinations (Wisata)", destinations_data)
add_sheet_from_data(out_wb, "4. Services (Jasa & Homestay)", services_data)
add_sheet_from_data(out_wb, "5. Transport (Ferry & Shuttle)", transport_data)
add_sheet_from_data(out_wb, "6. Culinary (Kuliner Khas)", culinary_data)
add_sheet_from_data(out_wb, "7. Restaurants (Rumah Makan)", restaurants_data)
add_sheet_from_data(out_wb, "8. Articles (Artikel Budaya)", articles_data)
add_sheet_from_data(out_wb, "9. Reviews (Ulasan)", rev_data[:1000]) # Sample top 1000 reviews for Excel

out_wb.save(OUTPUT_EXCEL)
print(f"Saved normalized Excel: {OUTPUT_EXCEL}")
print("ALL TASKS COMPLETED SUCCESSFULLY!")
