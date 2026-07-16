-- =========================================================================
-- SUPABASE DATABASE SCHEMA FOR PUSAT KRUPUK BELITANG
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.
-- =========================================================================

-- 1. TABEL PRODUCTS (Katalog Krupuk)
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR NOT NULL,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  original_price NUMERIC NOT NULL,
  discount_price NUMERIC,
  stock INTEGER NOT NULL DEFAULT 0,
  category VARCHAR NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABEL ORDERS (Transaksi Pesanan)
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR PRIMARY KEY,
  customer JSONB NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_status VARCHAR NOT NULL DEFAULT 'pending',
  payment_method VARCHAR NOT NULL,
  delivery_status VARCHAR NOT NULL DEFAULT 'packing',
  unique_code INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABEL FINANCIAL_TRANSACTIONS (Pencatatan Transaksi Keuangan)
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR REFERENCES orders(id) ON DELETE SET NULL,
  type VARCHAR NOT NULL CHECK (type IN ('income', 'expense', 'refund')),
  category VARCHAR NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  payment_method VARCHAR NOT NULL DEFAULT 'cash',
  reference_number VARCHAR DEFAULT '',
  created_by VARCHAR NOT NULL DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABEL EXPENSES (Pencatatan Pengeluaran Bisnis)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR NOT NULL CHECK (category IN ('bahan_baku', 'operasional', 'gaji', 'pengiriman', 'lainnya')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  created_by VARCHAR NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABEL DAILY_SUMMARY (Ringkasan Keuangan Harian)
CREATE TABLE IF NOT EXISTS daily_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  total_income NUMERIC NOT NULL DEFAULT 0,
  total_expense NUMERIC NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_items_sold INTEGER NOT NULL DEFAULT 0,
  net_profit NUMERIC NOT NULL DEFAULT 0
);

-- 6. PENGATURAN KEAMANAN (Row Level Security - RLS)
-- Untuk kemudahan testing lokalan, kita nonaktifkan RLS terlebih dahulu.
-- (Pada produksi asli, disarankan membuat kebijakan READ untuk publik dan WRITE untuk admin)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summary DISABLE ROW LEVEL SECURITY;

-- 4. INSERT DATA AWAL (Optional: Mengisi data katalog awal)
INSERT INTO products (id, name, description, image_url, gallery, original_price, discount_price, stock, category, is_featured, variants)
VALUES 
(
  'prod-1', 
  'Krupuk Ikan Tenggiri Super', 
  'Renyah, gurih, dibuat dengan daging ikan tenggiri asli pilihan dan resep tradisional.', 
  '/krupuk_tenggiri.png', 
  '["/krupuk_tenggiri.png", "/krupuk_bawang.png", "/krupuk_jengkol.png"]', 
  150000, 
  127500, 
  40, 
  'Krupuk Ikan', 
  true, 
  '[
    {"id": "var-1", "name": "Paket Besar 1 Kg", "price": 150000, "discountPrice": 127500, "stock": 5},
    {"id": "var-2", "name": "Paket Sedang 500 Gram", "price": 80000, "discountPrice": 68000, "stock": 10},
    {"id": "var-3", "name": "Pouch Eceran 100 Gram", "price": 20000, "discountPrice": 17000, "stock": 25}
  ]'::jsonb
),
(
  'prod-2', 
  'Krupuk Jengkol Pedas Gurih', 
  'Paduan rasa jengkol khas dengan balutan bumbu pedas manis gurih yang bikin nagih.', 
  '/krupuk_jengkol.png', 
  '["/krupuk_jengkol.png", "/krupuk_tenggiri.png"]', 
  120000, 
  99000, 
  42, 
  'Krupuk Jengkol', 
  true, 
  '[
    {"id": "var-4", "name": "Paket Besar 1 Kg", "price": 120000, "discountPrice": 99000, "stock": 4},
    {"id": "var-5", "name": "Paket Sedang 500 Gram", "price": 65000, "discountPrice": 55000, "stock": 8},
    {"id": "var-6", "name": "Pouch Eceran 100 Gram", "price": 15000, "discountPrice": null, "stock": 30}
  ]'::jsonb
),
(
  'prod-3', 
  'Krupuk Bawang Original Toples', 
  'Krupuk bawang klasik renyah dalam kemasan toples praktis, kedap udara, dan higienis.', 
  '/krupuk_bawang.png', 
  '["/krupuk_bawang.png", "/krupuk_hampers.png"]', 
  110000, 
  null, 
  58, 
  'Krupuk Bawang', 
  false, 
  '[
    {"id": "var-7", "name": "Toples Besar (1.5 Kg)", "price": 110000, "discountPrice": null, "stock": 6},
    {"id": "var-8", "name": "Toples Sedang (800g)", "price": 65000, "discountPrice": null, "stock": 12},
    {"id": "var-9", "name": "Pouch Eceran (200g)", "price": 18000, "discountPrice": null, "stock": 40}
  ]'::jsonb
),
(
  'prod-4', 
  'Paket Hampers Krupuk Asli', 
  'Hampers eksklusif berisi macam-macam krupuk khas Belitang terlaris untuk kerabat.', 
  '/krupuk_hampers.png', 
  '["/krupuk_hampers.png", "/krupuk_tenggiri.png", "/krupuk_bawang.png"]', 
  220000, 
  187000, 
  10, 
  'Hampers', 
  true, 
  '[
    {"id": "var-10", "name": "Hampers Premium (Isi 5)", "price": 220000, "discountPrice": 187000, "stock": 3},
    {"id": "var-11", "name": "Hampers Hemat (Isi 3)", "price": 140000, "discountPrice": 119000, "stock": 7}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
