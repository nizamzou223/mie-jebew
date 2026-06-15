import { Router } from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authRequired, requireRole("admin"));

// GET /api/users  — tanpa kolom password
router.get("/", async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT id, uuid, branch_id, username, full_name, role, is_active FROM users ORDER BY id"
  );
  res.json(rows.map((u) => ({ ...u, is_active: !!u.is_active })));
});

// POST /api/users
router.post("/", async (req, res) => {
  const { username, password, full_name, role = "cashier", branch_id = null, is_active = true } = req.body || {};
  if (!username || !full_name || !password) {
    return res.status(400).json({ message: "Username, nama lengkap, dan password wajib diisi." });
  }
  if (role === "cashier" && !branch_id) {
    return res.status(400).json({ message: "Kasir wajib memiliki cabang." });
  }

  // Cek username unik
  const [dup] = await pool.query("SELECT id FROM users WHERE username = ? LIMIT 1", [username]);
  if (dup.length) return res.status(409).json({ message: "Username sudah dipakai." });

  const hash = await bcrypt.hash(password, 10);
  const [r] = await pool.query(
    "INSERT INTO users (uuid, branch_id, username, password, full_name, role, is_active) VALUES (UUID(), ?, ?, ?, ?, ?, ?)",
    [branch_id || null, username, hash, full_name, role, is_active ? 1 : 0]
  );
  const [rows] = await pool.query(
    "SELECT id, uuid, branch_id, username, full_name, role, is_active FROM users WHERE id = ?",
    [r.insertId]
  );
  res.status(201).json({ ...rows[0], is_active: !!rows[0].is_active });
});

// PUT /api/users/:id  — password opsional (kosong = tidak diubah)
router.put("/:id", async (req, res) => {
  const { username, password, full_name, role = "cashier", branch_id = null, is_active = true } = req.body || {};
  if (!username || !full_name) {
    return res.status(400).json({ message: "Username dan nama lengkap wajib diisi." });
  }
  if (role === "cashier" && !branch_id) {
    return res.status(400).json({ message: "Kasir wajib memiliki cabang." });
  }

  const [dup] = await pool.query("SELECT id FROM users WHERE username = ? AND id <> ? LIMIT 1", [username, req.params.id]);
  if (dup.length) return res.status(409).json({ message: "Username sudah dipakai." });

  const fields = ["username = ?", "full_name = ?", "role = ?", "branch_id = ?", "is_active = ?"];
  const params = [username, full_name, role, branch_id || null, is_active ? 1 : 0];

  if (password) {
    fields.push("password = ?");
    params.push(await bcrypt.hash(password, 10));
  }
  params.push(req.params.id);

  const [r] = await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, params);
  if (r.affectedRows === 0) return res.status(404).json({ message: "Pengguna tidak ditemukan." });

  const [rows] = await pool.query(
    "SELECT id, uuid, branch_id, username, full_name, role, is_active FROM users WHERE id = ?",
    [req.params.id]
  );
  res.json({ ...rows[0], is_active: !!rows[0].is_active });
});

export default router;
