# Walkthrough — Sistem Dashboard Keuangan & Cetak Resi

Kami telah berhasil menerapkan dashboard manajemen keuangan terperinci dan sistem cetak resi berkualitas tinggi (siap operasi) untuk **Pusat Krupuk Belitang**. 

---

## 🛠️ Ringkasan Perubahan

### 1. Database Schema (`supabase_schema.sql`)
Menambahkan **3 tabel baru** untuk mendukung pencatatan keuangan:
- `financial_transactions`: Pencatatan transaksi masuk (income), keluar (expense), dan refund.
- `expenses`: Deteksi dan input pengeluaran operasional secara rinci.
- `daily_summary`: Ringkasan harian otomatis untuk omset, laba, dan total item terjual.

### 2. State & Data Layer (`useFinancialStore.ts` & `index.ts`)
- Membuat Zustand store keuangan terpisah yang ter-persist ke localStorage.
- Menambahkan actions otomatis untuk merekam transaksi ketika pesanan di-checkout atau di-update status pembayarannya.
- Mendukung filter pencarian berdasarkan rentang tanggal, kategori, dan jenis transaksi.

### 3. Visualisasi Chart Native (`MiniChart.tsx`)
- Membuat visualisasi chart bar & trend horizontal/vertical murni menggunakan **SVG native** (tanpa dependensi eksternal) agar menjaga bundle size tetap ringan dan cepat dimuat.

### 4. Sistem Cetak Resi & CSS Print (`ReceiptPrinter.tsx` & `index.css`)
- Membuat template struk/resi thermal 80mm profesional dengan layout khusus cetak printer.
- Menggunakan CSS `@media print` untuk secara otomatis menyembunyikan semua elemen UI (navbar, tombol, dll) saat cetak, sehingga yang tercetak hanya resinya.
- Menyediakan tombol "Cetak Resi" di:
  1. Halaman Sukses Checkout (untuk pelanggan).
  2. Halaman Lacak Status Pesanan (untuk pelanggan).
  3. Admin Dashboard Tab Pesanan & Tab Resi (untuk admin).

### 5. Modul Dashboard Admin Baru (`AdminDashboard.tsx`)
Refactoring dashboard admin monolitik menjadi terstruktur dengan tab:
- 📊 **Ringkasan**: Analisis KPI keuangan (Omset Hari ini/Bulan ini, Laba Bersih), grafik tren, dan statistik terlaris.
- 📦 **Pesanan**: Pengelolaan invoice lengkap dengan status bayar/kirim dan cetak resi.
- 📋 **Inventaris**: Pengelolaan katalog dan stok varian produk secara langsung.
- 📊 **Laporan**: Riwayat keuangan masuk/keluar terperinci dengan filter tanggal dan fitur **Export ke CSV**.
- 💸 **Pengeluaran**: Form input pengeluaran instan dan pembagian kategori pengeluaran (Bahan baku, gaji, operasional, dll).
- 🧾 **Resi & Struk**: Direktori cetak resi cepat untuk semua pesanan yang terdaftar.

---

## 🔍 Cara Verifikasi / Demo

1. **Jalankan Aplikasi**:
   Pastikan program Anda berjalan (`npm run dev` dan `npm run api` di port 3001).
   
2. **Lakukan Pemesanan (Sebagai Pelanggan)**:
   - Pilih krupuk dan varian kemasannya dari halaman utama.
   - Tambahkan ke keranjang belanja, lalu klik checkout.
   - Isi form alamat pengiriman, pilih metode pembayaran (COD atau QRIS), lalu konfirmasi pesanan.
   - Setelah sukses, Anda akan melihat tombol **Cetak Resi**. Klik tombol tersebut untuk melihat pratinjau struk thermal 80mm dan memicu browser print dialog.

3. **Cek Lacak Status**:
   - Salin ID Invoice pesanan Anda.
   - Buka menu **Cek Status Pesanan**, masukkan ID Invoice dan cari.
   - Anda juga bisa memicu cetak resi langsung dari halaman pelacakan ini.

4. **Kelola Dashboard Keuangan (Sebagai Admin)**:
   - Klik tombol **Login** di kanan atas, pilih tab **Admin**, dan masuk dengan kredensial default (`admin` / `admin`).
   - Buka **Admin Panel** di navbar.
   - Buka tab **Laporan** untuk melihat pencatatan otomatis transaksi penjualan Anda. Anda bisa mengklik **Export CSV** untuk mendownload laporannya.
   - Buka tab **Pengeluaran**, lalu coba masukkan pengeluaran baru (misal: "Beli Tepung 50kg", Rp 250.000). Grafik ringkasan kategori akan langsung menyesuaikan.
   - Cek tab **Ringkasan** untuk memantau laba bersih Anda (Total Omset Penjualan dikurangi Pengeluaran).
