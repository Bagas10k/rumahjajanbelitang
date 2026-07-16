# Sistem Dashboard Pengelolaan Keuangan — Pusat Krupuk Belitang

Menambahkan sistem dashboard keuangan yang lengkap dan siap operasi, mencakup alur order barang, keranjang, checkout, hingga pencetakan resi. Sekaligus melakukan koreksi terhadap bug dan kekurangan pada codebase yang ada.

---

## User Review Required

> [!IMPORTANT]
> **Database Schema Baru**: Rencana ini menambah 3 tabel baru di Supabase (`financial_transactions`, `expenses`, `cash_flow_summary`). Pastikan Supabase project sudah terkonfigurasi dengan benar (saat ini credential masih placeholder di `.env`).

> [!WARNING]
> **Mock Authentication**: Sistem auth saat ini masih mock (admin/admin). Dalam rencana ini saya akan memperbaikinya agar lebih aman untuk operasional, tapi belum menggunakan Supabase Auth penuh. Jika ingin auth production-level, beri tahu saya.

---

## Koreksi & Perbaikan yang Ditemukan

Berikut masalah yang saya temukan dan akan diperbaiki:

| # | Masalah | Dampak | Solusi |
|---|---------|--------|--------|
| 1 | **Supabase credentials masih placeholder** di `.env` | App tidak bisa konek ke database | Akan ditambahkan fallback yang jelas + peringatan di UI |
| 2 | **iPaymu API tidak terhubung ke frontend** — CheckoutModal menampilkan gambar QRIS statis, tidak memanggil `/api/payment` | Pembayaran tidak otomatis | Akan diwiring-kan dengan fallback ke QRIS manual |
| 3 | **Tidak ada routing URL** — semua state-based | Tidak bisa deep-link, refresh hilang state | Akan ditambahkan hash-based routing ringan |
| 4 | **NavLink "Kategori" dan "Tentang Kami" placeholder** | Link mati | Akan diimplementasikan |
| 5 | **Tidak ada search/filter di catalog** | UX buruk jika produk banyak | Akan ditambahkan |
| 6 | **AdminDashboard.tsx monolitik (996 baris)** | Sulit maintain | Akan dipecah ke sub-komponen |
| 7 | **RLS Supabase disabled** | Keamanan produksi | Akan ditambahkan catatan, belum diaktifkan sampai auth ready |
| 8 | **`paymentGateway.ts` tidak dipakai** | Dead code | Akan dihapus/dimanfaatkan |
| 9 | **Tidak ada validasi form yang kuat** | User bisa submit data kosong | Akan ditambahkan validasi |
| 10 | **Tidak ada error boundary** | Error crash seluruh app | Akan ditambahkan |

---

## Proposed Changes

Perubahan dikelompokkan per komponen/fitur:

---

### 1. Database Schema — Tabel Keuangan Baru

#### [MODIFY] [supabase_schema.sql](file:///c:/Users/bagas/Desktop/pusatkrupuk/supabase_schema.sql)

Menambahkan 3 tabel baru:

**`financial_transactions`** — Pencatatan setiap transaksi keuangan:
| Column | Type | Keterangan |
|--------|------|------------|
| id | UUID (PK) | Auto-generated |
| order_id | VARCHAR (FK→orders) | Nullable, linked ke order |
| type | VARCHAR | `income` / `expense` / `refund` |
| category | VARCHAR | `product_sale` / `shipping` / `operational` / `material` / `salary` / `other` |
| description | TEXT | Keterangan transaksi |
| amount | NUMERIC | Jumlah (selalu positif) |
| payment_method | VARCHAR | `qris` / `cod` / `transfer` / `cash` |
| reference_number | VARCHAR | Nomor referensi/resi |
| created_by | VARCHAR | Username admin |
| created_at | TIMESTAMPTZ | Waktu transaksi |

**`expenses`** — Pencatatan pengeluaran bisnis:
| Column | Type | Keterangan |
|--------|------|------------|
| id | UUID (PK) | Auto-generated |
| category | VARCHAR | `bahan_baku` / `operasional` / `gaji` / `pengiriman` / `lainnya` |
| description | TEXT | Detail pengeluaran |
| amount | NUMERIC | Jumlah |
| receipt_url | VARCHAR | Bukti pengeluaran (opsional) |
| created_by | VARCHAR | Username admin |
| created_at | TIMESTAMPTZ | Waktu |

**`daily_summary`** — Ringkasan harian otomatis:
| Column | Type | Keterangan |
|--------|------|------------|
| id | UUID (PK) | Auto-generated |
| date | DATE (UNIQUE) | Tanggal |
| total_income | NUMERIC | Total pemasukan |
| total_expense | NUMERIC | Total pengeluaran |
| total_orders | INTEGER | Jumlah order |
| total_items_sold | INTEGER | Jumlah item terjual |
| net_profit | NUMERIC | Laba bersih |

---

### 2. TypeScript Types — Tipe Data Baru

#### [MODIFY] [index.ts](file:///c:/Users/bagas/Desktop/pusatkrupuk/src/types/index.ts)

Menambahkan interface baru:
- `FinancialTransaction` — mencatat semua transaksi masuk/keluar
- `Expense` — pencatatan pengeluaran
- `DailySummary` — ringkasan keuangan harian
- `FinancialFilter` — filter untuk laporan (dateRange, category, type)
- `DashboardStats` — statistik dashboard (omset, laba, tren)
- `ReceiptData` — data untuk cetak resi/struk

---

### 3. State Management — Store Baru untuk Keuangan

#### [MODIFY] [useCartStore.ts](file:///c:/Users/bagas/Desktop/pusatkrupuk/src/store/useCartStore.ts)

Menambahkan state & actions baru:
- `financialTransactions: FinancialTransaction[]`
- `expenses: Expense[]`
- `dailySummaries: DailySummary[]`
- Actions: `fetchFinancialData()`, `addExpense()`, `addTransaction()`, `getFinancialStats(dateRange)`, `getDailySummary(date)`, `generateReceipt(orderId)`

---

### 4. Dashboard Keuangan — Komponen Baru

#### [MODIFY] [AdminDashboard.tsx](file:///c:/Users/bagas/Desktop/pusatkrupuk/src/components/AdminDashboard.tsx)

Refactor dashboard monolitik menjadi modular, dan tambahkan tab-tab keuangan baru:

**Tab yang sudah ada (diperbaiki):**
- 📦 **Pesanan** — Tabel pesanan dengan filter status, pencarian, detail popup (diperbaiki)
- 📋 **Inventaris** — CRUD produk dengan manajemen stok varian (diperbaiki)

**Tab baru yang ditambahkan:**

##### Tab 💰 Ringkasan Keuangan (Overview)
- **KPI Cards** yang lebih komprehensif:
  - Omset Hari Ini (vs kemarin, dengan persentase naik/turun)
  - Omset Bulan Ini (vs bulan lalu)
  - Laba Bersih (pendapatan − pengeluaran)
  - Total Transaksi Hari Ini
  - Rata-rata Nilai Pesanan
  - Varian Kritis (stok ≤ 5)
- **Grafik Pendapatan** — Line chart 30 hari terakhir (pendapatan vs pengeluaran)
- **Grafik Pie** — Komposisi pendapatan per kategori produk
- **Produk Terlaris** — Bar chart horizontal top 5
- **Aktivitas Terbaru** — Timeline transaksi terakhir

##### Tab 📊 Laporan Keuangan
- **Filter** berdasarkan: Rentang tanggal, Kategori, Tipe transaksi
- **Tabel Transaksi** dengan:
  - Tanggal, Deskripsi, Kategori, Tipe (masuk/keluar), Jumlah, Metode Bayar, Ref Number
  - Sorting per kolom
  - Pagination
- **Summary Bar** di atas tabel: Total Masuk | Total Keluar | Saldo
- **Export** ke PDF dan CSV (via browser-native)

##### Tab 💸 Pengeluaran
- **Form Input Pengeluaran** — Kategori (dropdown), Deskripsi, Jumlah, Upload bukti (opsional)
- **Daftar Pengeluaran** — Tabel dengan filter kategori dan tanggal
- **Ringkasan Pengeluaran** — Per kategori (bahan baku, operasional, gaji, dll.)
- **Chart Pengeluaran** — Breakdown per kategori (donut chart)

##### Tab 🧾 Resi & Struk
- **Generator Resi** — Pilih order, otomatis generate resi siap cetak
- **Template Resi** berisi:
  - Header: Logo + Nama Toko + Alamat + Telepon
  - No. Invoice, Tanggal, Metode Bayar
  - Tabel Item: Nama produk, Varian, Qty, Harga satuan, Subtotal
  - Ringkasan: Subtotal, Kode Unik, Total
  - Data Customer: Nama, Telepon, Alamat
  - Footer: Terima kasih + kebijakan retur
- **Print Preview** — Modal dengan preview resi
- **Cetak** — `window.print()` dengan CSS `@media print`
- **Riwayat Cetak** — Log resi yang sudah dicetak

---

### 5. Perbaikan Alur Order → Checkout → Resi

#### [MODIFY] [CheckoutModal.tsx](file:///c:/Users/bagas/Desktop/pusatkrupuk/src/components/CheckoutModal.tsx)

- Perbaiki validasi form customer (nama, telepon wajib, format valid)
- Setelah order berhasil dibuat, otomatis catat `financial_transaction` tipe `income`
- Tambahkan tombol "Cetak Resi" di halaman sukses checkout
- Tampilkan nomor invoice yang jelas

#### [MODIFY] [CartDrawer.tsx](file:///c:/Users/bagas/Desktop/pusatkrupuk/src/components/CartDrawer.tsx)

- Tambahkan indikator stok tersisa per item
- Validasi stok sebelum checkout
- Tambahkan catatan/notes per item (opsional)

#### [MODIFY] [OrderStatusPage.tsx](file:///c:/Users/bagas/Desktop/pusatkrupuk/src/components/OrderStatusPage.tsx)

- Tambahkan tombol "Cetak Resi" untuk order yang sudah `paid`
- Perbaiki tampilan stepper agar lebih informatif

---

### 6. Komponen Baru — Pencetakan Resi

#### [NEW] [ReceiptPrinter.tsx](file:///c:/Users/bagas/Desktop/pusatkrupuk/src/components/ReceiptPrinter.tsx)

Komponen cetak resi yang reusable:
- Print-friendly layout (thermal printer 80mm / A4)
- CSS `@media print` untuk hide UI elements
- Support cetak langsung via `window.print()`
- Template profesional dengan branding toko

#### [NEW] [receipt-print.css](file:///c:/Users/bagas/Desktop/pusatkrupuk/src/receipt-print.css)

Stylesheet khusus untuk print layout:
- `@media print` rules
- Hide navbar, sidebar, footer saat cetak
- Optimasi untuk thermal printer dan A4

---

### 7. Komponen Baru — Chart & Visualisasi

#### [NEW] [MiniChart.tsx](file:///c:/Users/bagas/Desktop/pusatkrupuk/src/components/charts/MiniChart.tsx)

Chart ringan tanpa library eksternal (pure SVG):
- **LineChart** — Tren pendapatan/pengeluaran
- **BarChart** — Produk terlaris / perbandingan
- **DonutChart** — Komposisi kategori
- **SparkLine** — Mini chart di KPI cards

> Saya sengaja menggunakan SVG native daripada library chart (Recharts/Chart.js) untuk menghindari dependency tambahan dan menjaga bundle size ringan.

---

### 8. Perbaikan Navigasi & Routing

#### [MODIFY] [App.tsx](file:///c:/Users/bagas/Desktop/pusatkrupuk/src/App.tsx)

- Implementasi hash-based routing (`#catalog`, `#status`, `#admin`, `#about`)
- Sinkronkan state dengan URL hash
- Support browser back/forward

#### [MODIFY] [Navbar.tsx](file:///c:/Users/bagas/Desktop/pusatkrupuk/src/components/Navbar.tsx)

- Fix link "Kategori" — scroll ke section produk dengan filter kategori
- Fix link "Tentang Kami" — navigasi ke halaman about
- Tambahkan breadcrumb di halaman admin

---

### 9. Halaman Baru — Tentang Kami

#### [NEW] [AboutSection.tsx](file:///c:/Users/bagas/Desktop/pusatkrupuk/src/components/AboutSection.tsx)

Section tentang toko:
- Cerita singkat bisnis krupuk Belitang
- Lokasi / kontak
- Keunggulan produk

---

### 10. Perbaikan & Polish

#### [MODIFY] [ProductCard.tsx](file:///c:/Users/bagas/Desktop/pusatkrupuk/src/components/ProductCard.tsx)
- Tambahkan badge "Habis" untuk stok 0
- Animasi hover yang lebih smooth

#### [MODIFY] [LoginModal.tsx](file:///c:/Users/bagas/Desktop/pusatkrupuk/src/components/LoginModal.tsx)
- Perbaiki keamanan mock auth (hash password sederhana)
- Tambahkan feedback error yang jelas

#### [DELETE] [paymentGateway.ts](file:///c:/Users/bagas/Desktop/pusatkrupuk/src/services/paymentGateway.ts)
- File ini tidak digunakan (dead code)

#### [MODIFY] [index.css](file:///c:/Users/bagas/Desktop/pusatkrupuk/src/index.css)
- Tambahkan CSS custom untuk print layout
- Tambahkan CSS variables untuk konsistensi warna dashboard

---

## Open Questions

> [!IMPORTANT]
> **1. Supabase**: Apakah Supabase project sudah dikonfigurasi? Credential di `.env` masih placeholder. Tanpa ini, semua fitur database tidak akan berjalan. Jika belum, saya bisa buat mode "demo" dengan data lokal terlebih dahulu.

> [!IMPORTANT]  
> **2. Mata Uang & Format**: Saya akan menggunakan format Rupiah Indonesia (Rp) sesuai yang sudah ada. Apakah ada kebutuhan multi-currency?

> [!NOTE]
> **3. Cetak Resi**: Saya akan membuat template resi yang support thermal printer 80mm dan juga A4. Apakah ada preferensi ukuran tertentu?

> [!NOTE]
> **4. Chart Library**: Saya akan menggunakan SVG native (tanpa library tambahan) untuk chart di dashboard. Ini menjaga app tetap ringan. Apakah setuju, atau preferensi menggunakan library seperti Recharts?

---

## Verification Plan

### Automated Tests
- Tidak ada test framework yang terpasang saat ini. Verifikasi dilakukan manual.

### Manual Verification
1. **Build check**: `npm run build` harus sukses tanpa error TypeScript
2. **Dev server**: `npm run dev` + `npm run api` harus berjalan tanpa crash
3. **Alur lengkap**: Buka catalog → pilih produk → tambah ke keranjang → checkout → lihat resi
4. **Dashboard**: Login admin → cek semua tab keuangan → input pengeluaran → lihat laporan → cetak resi
5. **Responsif**: Cek tampilan di mobile viewport (375px) dan desktop (1440px)
6. **Print**: Test cetak resi via browser print dialog

---

## Ringkasan Scope

| Area | Items |
|------|-------|
| **Tabel DB baru** | 3 tabel (financial_transactions, expenses, daily_summary) |
| **File baru** | ~5 file (ReceiptPrinter, MiniChart, AboutSection, receipt-print.css, dll.) |
| **File dimodifikasi** | ~10 file (AdminDashboard, CheckoutModal, CartDrawer, App, dll.) |
| **File dihapus** | 1 file (paymentGateway.ts dead code) |
| **Tab dashboard baru** | 4 tab (Ringkasan, Laporan, Pengeluaran, Resi) |
| **Koreksi bug** | 10 item perbaikan |
