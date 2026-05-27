# Panduan Self-Hosting: GitHub, Vercel, & Platform Container

Aplikasi **Memo Kiosk Photobox** ini adalah aplikasi **Full-Stack (Vite/React untuk Frontend + Express untuk Backend)**. 

---

## 1. Mengapa `index.html` Langsung Dibuka Menghasilkan Layar Putih (Blank Screen)?

Jika Anda mencoba membuka `index.html` secara langsung menggunakan browser (misalnya mengklik dua kali file tersebut, atau me-live-kan secara statis tanpa server), halaman akan kosong/putih karena:
1. **ES Modules**: React modern dan Vite menggunakan sintaks tipe modul (`<script type="module" src="...">`). Browser melarang pemuatan file modul langsung dari local path (`file:///...`) karena kebijakan keamanan (CORS). Harus dijalankan lewat server lokal / server produksi.
2. **Belum di-Build**: Kode sumber React (.tsx) harus dikonversi (di-bundling) menjadi JavaScript murni terlebih dahulu menggunakan perintah `npm run build`.
3. **Butuh Express Backend**: Aplikasi ini memiliki backend server (`server.ts`) yang mengatur API untuk QR Code, simulasi QRIS Pembayaran (`/pay-simulate`), serta endpoint download foto hasil composite (`/api/download`). Jika hanya meng-host sisi static web saja, fitur interaktif ini tidak akan berfungsi.

---

## 2. Cara Export Code ke GitHub Anda

1. Di AI Studio, silakan ekspor/unduh project Anda sebagai file ZIP lewat menu **Settings / Export** (atau gunakan integrasi GitHub langsung jika tersedia di AI Studio).
2. Ekstrak file ZIP di komputer Anda.
3. Buka terminal di folder hasil ekstrak, lalu jalankan perintah berikut untuk menginisialisasi repo Git dan lakukan push ke GitHub Anda:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Memo Kiosk Photobox"
   git branch -M main
   git remote add origin https://github.com/USERNAME-ANDA/NAMA-REPO-ANDA.git
   git push -u origin main
   ```

---

## 3. Pilihan Platform Hosting Terbaik

Karena aplikasi ini memiliki Express Backend dengan **penyimpanan data sementara di memori server (In-Memory Map)**, ada dua pilihan platform yang bisa Anda gunakan:

### OPSI A: Menggunakan Railway, Render, atau Koyeb (SANGAT DIREKOMENDASIKAN 🌟)
Platform ini adalah **Container Hosting** yang menjalankan server Node.js asli dan terus menyala 24/7. Platform ini sangat cocok untuk aplikasi full-stack Express.

*   **Kelebihan**: 
    - Sangat stabil.
    - Menjalankan perintah `npm run start` secara terus-menerus.
    - Penyimpanan memori sementara (seperti ID Order aktif, QRIS state) aman tidak akan gampang hilang saat ditinggal idle.
*   **Cara Setup di Render (dashboard.render.com)** atau **Railway (railway.app)**:
    1. Hubungkan akun GitHub Anda ke Render/Railway.
    2. Buat layanan baru bernama **Web Service**.
    3. Pilih repository GitHub project ini.
    4. Masukkan konfigurasi build berikut:
       *   **Runtime / Environment**: `Node`
       *   **Build Command**: `npm install && npm run build`
       *   **Start Command**: `npm run start`
    5. Atur **Environment Variables** (opsional):
       *   Jika Anda menggunakan API Key atau kunci eksternal, tambahkan di tab Environment.
    6. Deploy! Render/Railway akan mendeteksi Express dan memberikan alamat URL hosting gratis Anda (misal: `https://memo-kiosk.onrender.com`).

---

### OPSI B: Menggunakan Vercel + GitHub (Serverless)
Vercel adalah platform hosting berbasis **Serverless**. Vercel sangat bagus untuk static frontend, namun untuk Express API membutuhkan pengaturan khusus karena Vercel akan mengubah folder Express API menjadi Serverless Functions secara dinamis.

#### ⚠️ Limitasi Penting di Vercel:
Karena Vercel berjalan secara Serverless (fungsi akan tidur/mati otomatis jika tidak ada kunjungan, dan akan me-recreate instance baru saat diakses kembali):
*   Data order/foto yang disimpan di memori Express (`const orders = new Map()`) **akan terhapus sewaktu-waktu** jika server serverless tersebut "cold-start" (mati lalu menyala kembali).
*   Jika Anda tetap ingin menggunakan Vercel, sangat disarankan memperluas kode penyimpanan gambar dan order ke database persistence cloud eksternal (seperti MongoDB Atlas, PostgreSQL, Supabase, atau Firebase Firestore) agar data tidak hilang.

#### Cara Setup di Vercel:
Jika Anda ingin tetap men-deploy di Vercel, Anda memerlukan file konfigurasi `vercel.json` untuk mengalihkan backend routing ke server Express.

1. Buat file `vercel.json` di root direktori dengan kode berikut:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "dist/server.cjs",
         "use": "@vercel/node"
       },
       {
         "src": "index.html",
         "use": "@vercel/static"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "dist/server.cjs"
       },
       {
         "src": "/pay-simulate(.*)",
         "dest": "dist/server.cjs"
       },
       {
         "src": "/assets/(.*)",
         "dest": "/dist/assets/$1"
       },
       {
         "src": "/(.*)",
         "dest": "/index.html"
       }
     ]
   }
   ```
2. Hubungkan repository GitHub Anda ke Vercel (vercel.com).
3. Import project tersebut. Vercel akan membaca konfigurasi dan me-live-kan web Anda secara otomatis.

---

## 4. Cara Menjalankan Secara Lokal di Komputer Anda (Self-Host Local)

Kios photobox biasanya berjalan langsung dari komputer lokal di dalam bilik photobox demi performa kamera dan web yang lancar. Ini cara menjalankan secara lokal:

1. Di komputer Anda, pastikan sudah menginstal **Node.js** (versi 18 ke atas) dari [nodejs.org](https://nodejs.org).
2. Download file ZIP source code dari Kiosk Anda, lalu ekstrak ke folder mana pun.
3. Buka terminal/cmd di folder tersebut, lalu jalankan instalan dependency:
   ```bash
   npm install
   ```
4. Jalankan server lokal:
   ```bash
   npm run dev
   ```
5. Buka browser favorit Anda, lalu masukkan alamat web:
   ```
   http://localhost:3000
   ```
6. Web photobox siap digunakan! Jika ingin digunakan lewat HP (untuk scanner QR simulasi pembayaran), pastikan HP Anda terhubung ke Wi-Fi / LAN yang sama dengan komputer, lalu buka IP Lokal komputer Anda (contoh: `http://192.168.1.15:3000`).

---

Semoga panduan lengkap ini membantu kesuksesan instalasi dan self-host aplikasi photobox Anda! Jika ada yang ingin disesuaikan atau perlu bantuan integrasi database cloud agar bisa 100% lancar di Vercel, mari beri tahu saya!
