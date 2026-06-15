import { Router } from "express";
import pool from "../db.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

// ---- KATEGORI ----------------------------------------------------------
// GET /api/menu/categories
router.get("/categories", async (_req, res) => {
  const [rows] = await pool.query("SELECT id, uuid, name, description FROM menu_categories ORDER BY id");
  res.json(rows);
});

// ---- ITEM MENU ---------------------------------------------------------
// GET /api/menu  — semua role (kasir butuh untuk POS)
router.get("/", async (_req, res) => {
  const [rows] = await pool.query(
    "SELECT id, uuid, category_id, name, description, price, image_url, is_available FROM menu_items ORDER BY id"
  );
  res.json(rows.map((m) => ({ ...m, is_available: !!m.is_available })));
});

// POST /api/menu  — admin saja
router.post("/", requireRole("admin"), async (req, res) => {
  const { category_id, name, description = null, price, is_available = true } = req.body || {};
  if (!name || price == null || !category_id) {
    return res.status(400).json({ message: "Kategori, nama, dan harga wajib diisi." });
  }
  const [r] = await pool.query(
    "INSERT INTO menu_items (uuid, category_id, name, description, price, is_available) VALUES (UUID(), ?, ?, ?, ?, ?)",
    [category_id, name, description, price, is_available ? 1 : 0]
  );
  const [rows] = await pool.query("SELECT id, uuid, category_id, name, description, price, image_url, is_available FROM menu_items WHERE id = ?", [r.insertId]);
  res.status(201).json({ ...rows[0], is_available: !!rows[0].is_available });
});

// PUT /api/menu/:id  — admin saja
router.put("/:id", requireRole("admin"), async (req, res) => {
  const { category_id, name, description = null, price, is_available = true } = req.body || {};
  if (!name || price == null || !category_id) {
    return res.status(400).json({ message: "Kategori, nama, dan harga wajib diisi." });
  }
  const [r] = await pool.query(
    "UPDATE menu_items SET category_id = ?, name = ?, description = ?, price = ?, is_available = ? WHERE id = ?",
    [category_id, name, description, price, is_available ? 1 : 0, req.params.id]
  );
  if (r.affectedRows === 0) return res.status(404).json({ message: "Menu tidak ditemukan." });
  const [rows] = await pool.query("SELECT id, uuid, category_id, name, description, price, image_url, is_available FROM menu_items WHERE id = ?", [req.params.id]);
  res.json({ ...rows[0], is_available: !!rows[0].is_available });
});

// PATCH /api/menu/:id/availability  — toggle cepat (admin saja)
router.patch("/:id/availability", requireRole("admin"), async (req, res) => {
  const [r] = await pool.query(
    "UPDATE menu_items SET is_available = NOT is_available WHERE id = ?",
    [req.params.id]
  );
  if (r.affectedRows === 0) return res.status(404).json({ message: "Menu tidak ditemukan." });
  const [rows] = await pool.query("SELECT id, uuid, category_id, name, description, price, image_url, is_available FROM menu_items WHERE id = ?", [req.params.id]);
  res.json({ ...rows[0], is_available: !!rows[0].is_available });
});

// DELETE /api/menu/:id  — admin saja
router.delete("/:id", requireRole("admin"), async (req, res) => {
  const [r] = await pool.query("DELETE FROM menu_items WHERE id = ?", [req.params.id]);
  if (r.affectedRows === 0) return res.status(404).json({ message: "Menu tidak ditemukan." });
  res.json({ ok: true });
});

export default router;
