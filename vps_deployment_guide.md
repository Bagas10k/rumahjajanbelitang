# Panduan Deploy ke VPS — Pusat Krupuk Belitang

Aplikasi ini sudah **100% bersih dari error compilation (TypeScript & Vite build)** dan **bebas dari warning/error linter (Oxlint)**. Untuk memindahkan aplikasi ini ke VPS Linux Anda (Ubuntu/Debian), silakan ikuti panduan terperinci di bawah ini agar sistem dapat beroperasi secara online dengan lancar.

---

## 🏗️ Arsitektur Produksi di VPS

Di lingkungan produksi VPS, aplikasi akan dijalankan menggunakan skema berikut:
- **Frontend**: File static HTML/JS/CSS hasil build (`dist/`) akan disajikan oleh **Nginx** di port HTTP (80) atau HTTPS (443).
- **Backend (API)**: Script simulator API iPaymu & Webhook (`scripts/local-api.cjs`) dijalankan sebagai daemon menggunakan **PM2** di port internal `3001`.
- **Nginx Reverse Proxy**: Nginx akan mem-proxy semua request dari browser yang mengarah ke `/api` menuju port `3001` secara internal.

---

## 🛠️ Langkah-Langkah Setup & Deploy

### Langkah 1: Persiapan Server VPS
Hubungkan VPS Anda via SSH dan pastikan Node.js, Nginx, dan Git sudah terpasang.

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Pasang Node.js LTS (versi 20 atau terbaru)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Pasang Nginx & Git
sudo apt-get install -y nginx git

# Pasang PM2 secara global untuk mengelola proses backend Node.js
sudo npm install -y pm2 -g
```

---

### Langkah 2: Clone & Install Dependensi
Letakkan folder proyek Anda di VPS (misal di `/var/www/pusatkrupuk`).

```bash
# Buat direktori aplikasi
sudo mkdir -p /var/www/pusatkrupuk
sudo chown -R $USER:$USER /var/www/pusatkrupuk

# Clone repository atau upload file Anda ke direktori tersebut
# Lalu masuk ke direktori proyek
cd /var/www/pusatkrupuk

# Install dependensi frontend dan backend
npm install
```

---

### Langkah 3: Konfigurasi Environment (`.env`)
Salin file `.env` ke server VPS Anda dan pastikan kredensial Supabase sudah terisi dengan benar jika ingin menghubungkannya ke database Supabase secara live.

```bash
# Edit file .env di server VPS Anda
nano .env
```
Isi dengan data Supabase Anda:
```env
VITE_SUPABASE_URL=https://[id-project-anda].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-public-key-anda]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key-anda]
```
> **Catatan**: Jika kredensial di atas tidak diisi/dikosongkan, aplikasi akan otomatis beroperasi dalam **Local Fallback Mode** yang aman menggunakan localStorage secara instan tanpa crash.

---

### Langkah 4: Build Frontend untuk Produksi
Lakukan proses build untuk menghasilkan folder `dist/` yang dioptimasi.

```bash
# Build aplikasi
npm run build
```
Perintah ini akan membuat folder `/var/www/pusatkrupuk/dist` yang siap disajikan oleh Nginx.

---

### Langkah 5: Jalankan API Backend menggunakan PM2
Agar script API terus berjalan di latar belakang (dan restart otomatis jika server reboot), gunakan PM2.

```bash
# Jalankan local-api server dengan nama "krupuk-api"
pm2 start scripts/local-api.cjs --name "krupuk-api"

# Pastikan PM2 berjalan saat server reboot
pm2 startup
# (Jalankan perintah sudo env PATH... yang muncul di output terminal Anda)

# Simpan konfigurasi proses PM2 saat ini
pm2 save
```

---

### Langkah 6: Konfigurasi Nginx Web Server
Nginx digunakan untuk menyajikan frontend statis dan meneruskan (reverse-proxy) request `/api` ke backend PM2.

Buat file konfigurasi Nginx baru:
```bash
sudo nano /etc/nginx/sites-available/pusatkrupuk
```

Masukkan konfigurasi berikut (sesuaikan `server_name` dengan IP VPS atau domain Anda):

```nginx
server {
    listen 80;
    server_name vps-ip-anda-atau-domain.com;

    # Lokasi file static frontend (dist)
    root /var/www/pusatkrupuk/dist;
    index index.html;

    # Penanganan URL SPA React (agar refresh page tidak 404)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse Proxy untuk endpoint API ke PM2 port 3001
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Penanganan CORS tambahan (opsional)
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Optimasi Cache untuk static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # Error pages
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

Aktifkan konfigurasi Nginx tersebut:
```bash
# Buat symlink ke sites-enabled
sudo ln -s /etc/nginx/sites-available/pusatkrupuk /etc/nginx/sites-enabled/

# Hapus konfigurasi default (jika ada dan tidak digunakan)
sudo rm /etc/nginx/sites-enabled/default

# Uji konfigurasi Nginx
sudo nginx -t

# Reload Nginx jika tidak ada error
sudo systemctl reload nginx
```

---

## 🔒 Langkah Tambahan: Setup SSL (HTTPS Gratis dengan Let's Encrypt)
Sangat disarankan menggunakan SSL untuk keamanan transaksi. Jika Anda menggunakan domain:

```bash
# Pasang Certbot
sudo apt install certbot python3-certbot-nginx -y

# Jalankan Certbot untuk mendapatkan sertifikat SSL otomatis
sudo certbot --nginx -d domainanda.com
```
Certbot akan otomatis mengkonfigurasi SSL pada file Nginx Anda dan mengatur auto-renew.
