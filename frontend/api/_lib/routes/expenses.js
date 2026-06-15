import { Router } from "express";
import pool from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

// GET /api/expenses  — admin: semua / kasir: cabang sendiri saja
router.get("/", async (req, res) => {
  let sql =
    "SELECT id, uuid, branch_id, user_id, expense_date, description, amount, category FROM expenses";
  const params = [];
  if (req.user.role !== "admin") {
    sql += " WHERE branch_id = ?";
    params.push(req.user.branch_id);
  }
  sql += " ORDER BY expense_date DESC, id DESC";
  const [rows] = await pool.query(sql, params);
  res.json(rows);
});

// POST /api/expenses
router.post("/", async (req, res) => {
  let { branch_id, expense_date, description, amount, category = null } = req.body || {};
  // Kasir hanya boleh mencatat untuk cabangnya sendiri.
  if (req.user.role !== "admin") branch_id = req.user.branch_id;

  if (!branch_id || !expense_date || !description || amount == null) {
    return res.status(400).json({ message: "Cabang, tanggal, deskripsi, dan jumlah wajib diisi." });
  }

  const [r] = await pool.query(
    "INSERT INTO expenses (uuid, branch_id, user_id, expense_date, description, amount, category) VALUES (UUID(), ?, ?, ?, ?, ?, ?)",
    [branch_id, req.user.id, expense_date, description, amount, category || null]
  );
  const [rows] = await pool.query(
    "SELECT id, uuid, branch_id, user_id, expense_date, description, amount, category FROM expenses WHERE id = ?",
    [r.insertId]
  );
  res.status(201).json(rows[0]);
});

// DELETE /api/expenses/:id
router.delete("/:id", async (req, res) => {
  // Kasir hanya boleh menghapus pengeluaran cabangnya.
  let sql = "DELETE FROM expenses WHERE id = ?";
  const params = [req.params.id];
  if (req.user.role !== "admin") {
    sql += " AND branch_id = ?";
    params.push(req.user.branch_id);
  }
  const [r] = await pool.query(sql, params);
  if (r.affectedRows === 0) return res.status(404).json({ message: "Pengeluaran tidak ditemukan." });
  res.json({ ok: true });
});

export default router;
