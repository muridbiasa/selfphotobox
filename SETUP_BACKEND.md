# Setup Backend: GAS + Midtrans + Vercel

## Arsitektur Final

```
[Tablet Kiosk]
     │
     ▼
[Frontend Vercel]
     │
     ├─ POST /api/pay/token  ──► Midtrans API  (buat QRIS token)
     ├─ GET  /api/pay/status ──► Midtrans API  (polling status)
     └─ POST /api/upload     ──► GAS Script    (simpan ke Drive)
                                      │
                              [Google Drive]  +  [Google Sheets Log]
```

---

## LANGKAH 1 — Deploy Google Apps Script

1. Buka [script.google.com](https://script.google.com) → **New Project**
2. Hapus semua isi default, paste seluruh isi file `gas/Code.gs`
3. Klik **Deploy** → **New deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone** ← wajib!
4. Klik **Deploy** → copy URL yang muncul (format: `https://script.google.com/macros/s/XXXX/exec`)
5. Simpan URL ini sebagai `GAS_URL` di Vercel

> **Setiap kali kamu edit Code.gs**, deploy ulang sebagai versi baru (bukan update deployment lama).

---

## LANGKAH 2 — Midtrans Setup

1. Daftar/login di [dashboard.midtrans.com](https://dashboard.midtrans.com)
2. Pastikan **mode Production** sudah aktif (atau Sandbox untuk testing dulu)
3. Masuk **Settings → Access Keys**:
   - Copy **Server Key** → simpan sebagai `MIDTRANS_SERVER_KEY` di Vercel (JANGAN di .env publik!)
   - Copy **Client Key** → simpan sebagai `VITE_MIDTRANS_CLIENT_KEY` di Vercel
4. Masuk **Settings → Configuration**:
   - **Payment Notification URL**: `https://your-app.vercel.app/api/pay/notify`
   - Centang: `POST`

---

## LANGKAH 3 — Vercel Environment Variables

Di dashboard Vercel → project → **Settings → Environment Variables**, tambahkan:

| Key | Value | Environment |
|-----|-------|-------------|
| `MIDTRANS_SERVER_KEY` | `Mid-server-xxx...` | Production |
| `VITE_MIDTRANS_CLIENT_KEY` | `Mid-client-xxx...` | Production |
| `GAS_URL` | `https://script.google.com/macros/s/xxx/exec` | Production |
| `APP_URL` | `https://your-app.vercel.app` | Production |

Setelah tambah env vars → **Redeploy** (bukan redeploy with cache).

---

## LANGKAH 4 — Testing End-to-End

### Tes GAS dulu (tanpa frontend):
Buka URL GAS di browser → harusnya muncul `{"status":"GAS backend aktif","version":"1.0"}`

### Tes Midtrans Sandbox:
1. Ganti `index.html` Snap SDK URL ke sandbox:
   `https://app.sandbox.midtrans.com/snap/snap.js`
2. Pakai Server/Client Key sandbox
3. Bayar pakai QRIS test Midtrans (ada di docs Midtrans)

### Tes upload foto:
```bash
curl -X POST https://your-app.vercel.app/api/upload \
  -H "Content-Type: application/json" \
  -d '{"orderId":"TEST-001","image":"data:image/jpeg;base64,/9j/..."}'
```

---

## Troubleshooting

| Problem | Solusi |
|---------|--------|
| Snap popup tidak muncul | Cek `VITE_MIDTRANS_CLIENT_KEY` di Vercel env + redeploy |
| `/api/pay/token` 500 error | Cek `MIDTRANS_SERVER_KEY` di Vercel env |
| Upload foto gagal | Cek `GAS_URL` di Vercel env, pastikan GAS sudah di-deploy sebagai Web App |
| GAS error "tidak punya akses" | Pastikan deploy GAS dengan "Access: Anyone" |
| Foto tidak muncul di Drive | Cek folder `Memo4Frame_Photos` di Google Drive akun yang deploy GAS |
