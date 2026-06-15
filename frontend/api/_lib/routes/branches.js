import { Router } from "express";
import pool from "../db.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

// GET /api/branches  — semua role boleh baca (dipakai untuk dropdown/label)
router.get("/", async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT id, uuid, name, address, phone_number, is_active FROM branches ORDER BY id"
  );
  res.json(rows.map((b) => ({ ...b, is_active: !!b.is_active })));
});

// POST /api/branches  — admin saja
router.post("/", requireRole("admin"), async (req, res) => {
  const { name, address = null, phone_number = null, is_active = true } = req.body || {};
  if (!name) return res.status(400).json({ message: "Nama cabang wajib diisi." });

  const [r] = await pool.query(
    "INSERT INTO branches (uuid, name, address, phone_number, is_active) VALUES (UUID(), ?, ?, ?, ?)",
    [name, address, phone_number, is_active ? 1 : 0]
  );
  const [rows] = await pool.query("SELECT id, uuid, name, address, phone_number, is_active FROM branches WHERE id = ?", [r.insertId]);
  res.status(201).json({ ...rows[0], is_active: !!rows[0].is_active });
});

// PUT /api/branches/:id  — admin saja
router.put("/:id", requireRole("admin"), async (req, res) => {
  const { name, address = null, phone_number = null, is_active = true } = req.body || {};
  if (!name) return res.status(400).json({ message: "Nama cabang wajib diisi." });

  const [r] = await pool.query(
    "UPDATE branches SET name = ?, address = ?, phone_number = ?, is_active = ? WHERE id = ?",
    [name, address, phone_number, is_active ? 1 : 0, req.params.id]
  );
  if (r.affectedRows === 0) return res.status(404).json({ message: "Cabang tidak ditemukan." });

  const [rows] = await pool.query("SELECT id, uuid, name, address, phone_number, is_active FROM branches WHERE id = ?", [req.params.id]);
  res.json({ ...rows[0], is_active: !!rows[0].is_active });
});

export default router;
