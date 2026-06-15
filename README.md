# 🍜 Mie Jebew — Sistem Kasir (POS) Multi-Cabang

Aplikasi kasir/POS untuk jaringan kedai mie dengan banyak cabang. Dibangun ulang dari prototipe React (data mock) menjadi sistem **full-stack** dengan database **MySQL** sungguhan.

**Stack:**
- **Frontend:** React 18 + Vite (tampilan asli dipertahankan)
- **Backend:** Node.js + Express (REST API)
- **Database:** MySQL / MariaDB
- **Auth:** JWT + password bcrypt

---

## ✨ Fitur

- 🔐 **Login** dua peran: **admin** (akses penuh) & **kasir** (POS + riwayat cabangnya)
- 📊 **Dashboard** — pendapatan, pengeluaran, laba, performa per cabang, menu terlaris
- 🛒 **Kasir POS** — keranjang, diskon, pembayaran (tunai/QRIS/kartu), cetak struk
- 🧾 **Transaksi** — daftar + filter + detail pesanan
- 🍜 **Menu** — CRUD item + kategori + status ketersediaan
- 💵 **Pengeluaran** — catat & hapus biaya operasional
- 🏪 **Cabang** & 👥 **Pengguna** — manajemen (admin)
- 📈 **Laporan** — penjualan per cabang, menu terlaris, pengeluaran, metode bayar

---

## 📁 Struktur Folder

```
mie-jebew-app/
├── database/
│   └── mie_jebew.sql        # Skema + data awal (import ke MySQL)
├── backend/                 # REST API (Express)
│   ├── server.js
│   ├── db.js
│   ├── middleware/auth.js
│   ├── routes/              # auth, branches, users, menu, expenses, orders
│   └── .env.example
└── frontend/                # React + Vite
    ├── src/App.jsx          # Seluruh UI
    ├── src/api.js           # Klien API
    └── .env.example
```

---

## 🚀 Cara Menjalankan

### Prasyarat
- **Node.js** v18+ (`node -v`)
- **MySQL** atau **MariaDB** (mis. lewat **XAMPP**)

### 1️⃣ Database

Buat database dan import skema + data awal.

**Lewat phpMyAdmin (XAMPP):** buka phpMyAdmin → tab **Import** → pilih `database/mie_jebew.sql` → **Go**.

**Atau lewat terminal:**
```bash
mysql -u root -p < database/mie_jebew.sql
```
> File ini otomatis membuat database `mie_jebew` beserta semua tabel & data contoh.

### 2️⃣ Backend (API)

```bash
cd backend
npm install
cp .env.example .env      # Windows: copy .env.example .env
```
Edit `.env` sesuaikan dengan MySQL kamu (di XAMPP biasanya user `root` tanpa password):
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=mie_jebew
JWT_SECRET=ganti-jadi-rahasia-acak
```
Jalankan:
```bash
npm start
```
API aktif di **http://localhost:4000**. Cek: buka http://localhost:4000/api/health → `{"ok":true}`.

### 3️⃣ Frontend (UI)

Buka terminal **baru**:
```bash
cd frontend
npm install
cp .env.example .env      # opsional, default sudah benar
npm run dev
```
Buka **http://localhost:5173** di browser.

---

## 🔑 Akun Demo

| Username  | Password   | Peran  | Akses               |
|-----------|------------|--------|---------------------|
| `admin`   | `admin123` | Admin  | Semua menu & cabang |
| `kasir_a` | `kasir123` | Kasir  | POS Cabang A        |
| `kasir_b` | `kasir123` | Kasir  | POS Cabang B        |

---

## 🔌 Ringkasan Endpoint API

| Method | Endpoint                      | Keterangan                         |
|--------|-------------------------------|------------------------------------|
| POST   | `/api/auth/login`             | Login → token JWT                  |
| GET    | `/api/branches`               | Daftar cabang                      |
| POST/PUT | `/api/branches[/:id]`       | Tambah/ubah cabang (admin)         |
| GET    | `/api/users`                  | Daftar pengguna (admin)            |
| POST/PUT | `/api/users[/:id]`          | Tambah/ubah pengguna (admin)       |
| GET    | `/api/menu` · `/menu/categories` | Menu & kategori                 |
| POST/PUT/DELETE | `/api/menu[/:id]`    | Kelola menu (admin)                |
| PATCH  | `/api/menu/:id/availability`  | Toggle ketersediaan (admin)        |
| GET/POST/DELETE | `/api/expenses[/:id]` | Pengeluaran (terfilter per peran)  |
| GET    | `/api/orders`                 | Transaksi (terfilter per peran)    |
| POST   | `/api/orders`                 | Buat transaksi baru                |

Semua endpoint (kecuali login & health) butuh header `Authorization: Bearer <token>`.

---

## 🛡️ Catatan Keamanan & Desain

- **Password di-hash bcrypt** — tidak disimpan dalam bentuk teks biasa.
- **Harga & total transaksi dihitung ulang di server** dari harga menu di database, bukan percaya kiriman dari browser (mencegah manipulasi harga).
- **Transaksi POS bersifat atomik** (`orders` + `order_items` + `payments` dalam satu DB transaction) — jika gagal, semuanya dibatalkan.
- **Filter per peran di sisi server**: kasir hanya bisa melihat/menambah data cabangnya sendiri.
- **Nomor pesanan** dibuat otomatis & unik per cabang per hari: `ORD-YYYYMMDD-B{cabang}-{urut}`.

---

## ❓ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `Gagal terkoneksi ke MySQL` | Pastikan MySQL/XAMPP menyala & `.env` benar |
| Frontend "Gagal Memuat Data" | Pastikan backend (`npm start`) jalan di port 4000 |
| `Access denied for user` | Cek `DB_USER`/`DB_PASSWORD` di `backend/.env` |
| CORS error di console | Sesuaikan `CORS_ORIGIN` di `.env` dengan URL frontend |
| Port 4000/5173 dipakai | Ubah `PORT` (backend) atau port di `vite.config.js` |
