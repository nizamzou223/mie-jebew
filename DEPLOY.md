# 🚀 Deploy Mie Jebew — Semua di Vercel (gratis, tanpa kartu)

Frontend (React/Vite) + backend (Express) jadi SATU proyek Vercel.
Backend berjalan sebagai Serverless Function di dalam `frontend/api/`.
Database: MySQL Aiven.

## Struktur
- `frontend/` ............ proyek yang di-deploy (Root Directory di Vercel)
  - `api/index.js` ....... serverless function (menjalankan Express)
  - `api/_lib/` .......... kode backend (app, db, routes, middleware)
  - `src/` ............... aplikasi React
  - `vercel.json` ........ arahkan /api/* ke function
  - `server.local.js` .... untuk menjalankan API saat LOKAL
- `database/mie_jebew.sql` . skema + data

## Deploy di Vercel
1. vercel.com → login GitHub → Add New… → Project → import repo `mie-jebew`.
2. **Root Directory: `frontend`** (klik Edit → pilih folder frontend). PENTING.
   - Dengan ini Vercel melihat SATU proyek Vite + folder api/ (function),
     sehingga TIDAK muncul lagi deteksi "multiple services".
3. Framework Preset: Vite (otomatis).
4. Environment Variables (dari Aiven):
   ```
   DB_HOST     = <host-aiven>
   DB_PORT     = 28727
   DB_USER     = avnadmin
   DB_PASSWORD = <password-aiven>
   DB_NAME     = defaultdb
   DB_SSL      = true
   JWT_SECRET  = <teks-acak-panjang>
   VITE_API_URL = /api
   ```
5. Deploy → buka `https://....vercel.app/api/health` → `{"ok":true}`.
6. Buka URL utama → login admin / admin123.

## Lokal (opsional)
- API:      di folder frontend → buat `.env` berisi kredensial DB → `npm run server`
- Frontend: `npm run dev` (set VITE_API_URL=http://localhost:4000/api di .env)
