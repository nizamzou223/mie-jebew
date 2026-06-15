import { Router } from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";
import { signToken, authRequired } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi." });
  }

  const [rows] = await pool.query(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username]
  );
  const user = rows[0];

  // Pesan generik supaya tidak membocorkan username mana yang valid.
  if (!user || !user.is_active) {
    return res.status(401).json({ message: "Username atau password salah." });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ message: "Username atau password salah." });
  }

  const safeUser = {
    id: user.id,
    uuid: user.uuid,
    branch_id: user.branch_id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    is_active: !!user.is_active,
  };

  res.json({ token: signToken(safeUser), user: safeUser });
});

// GET /api/auth/me  (validasi token & ambil profil terbaru)
router.get("/me", authRequired, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, uuid, branch_id, username, full_name, role, is_active FROM users WHERE id = ? LIMIT 1",
    [req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ message: "Pengguna tidak ditemukan." });
  res.json({ ...rows[0], is_active: !!rows[0].is_active });
});

export default router;
