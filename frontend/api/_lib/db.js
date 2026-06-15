import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Aktifkan SSL bila host MySQL terkelola memintanya (Aiven, TiDB Cloud, dll).
// Set DB_SSL=true di environment. Untuk verifikasi penuh sertakan sertifikat CA
// lewat DB_SSL_CA (isi PEM), jika tidak koneksi tetap terenkripsi tanpa verifikasi CA.
const useSsl = process.env.DB_SSL === "true" || process.env.DB_SSL === "REQUIRED";
const sslOption = useSsl
  ? (process.env.DB_SSL_CA
      ? { ca: process.env.DB_SSL_CA }
      : { rejectUnauthorized: false })
  : undefined;

// Connection pool — dipakai ulang di seluruh aplikasi.
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mie_jebew",
  ssl: sslOption,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Kembalikan DECIMAL & BIGINT sebagai number JS (bukan string)
  decimalNumbers: true,
  dateStrings: true,
});

// Cek koneksi saat startup supaya error cepat ketahuan.
export async function assertDbConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

export default pool;
