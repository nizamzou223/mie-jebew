import { Router } from "express";
import pool from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

// Ubah "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS" agar aman di-parse Date() browser.
const toIso = (d) => (typeof d === "string" ? d.replace(" ", "T") : d);

// GET /api/orders  — admin: semua / kasir: cabang sendiri. Hasil bersarang items + payment.
router.get("/", async (req, res) => {
  let sql = "SELECT * FROM orders";
  const params = [];
  if (req.user.role !== "admin") {
    sql += " WHERE branch_id = ?";
    params.push(req.user.branch_id);
  }
  sql += " ORDER BY order_date DESC, id DESC";

  const [orders] = await pool.query(sql, params);
  if (orders.length === 0) return res.json([]);

  const ids = orders.map((o) => o.id);
  const [items] = await pool.query(
    "SELECT id, order_id, menu_item_id, quantity, price_per_item, subtotal, notes FROM order_items WHERE order_id IN (?)",
    [ids]
  );
  const [payments] = await pool.query(
    "SELECT order_id, method, amount_paid, change_given, status FROM payments WHERE order_id IN (?)",
    [ids]
  );

  const itemsByOrder = {};
  for (const it of items) (itemsByOrder[it.order_id] ||= []).push(it);
  const payByOrder = {};
  for (const p of payments) payByOrder[p.order_id] = p;

  res.json(
    orders.map((o) => ({
      ...o,
      order_date: toIso(o.order_date),
      items: itemsByOrder[o.id] || [],
      payment: payByOrder[o.id] || null,
    }))
  );
});

// Bangun nomor pesanan unik: ORD-YYYYMMDD-B{branch}-{urut3digit}
async function nextOrderNumber(conn, branchId) {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const [[{ cnt }]] = await conn.query(
    "SELECT COUNT(*) AS cnt FROM orders WHERE branch_id = ? AND DATE(order_date) = CURDATE()",
    [branchId]
  );
  const seq = String(cnt + 1).padStart(3, "0");
  return `ORD-${ymd}-B${branchId}-${seq}`;
}

// POST /api/orders  — buat transaksi baru (harga dihitung ulang dari DB demi keamanan)
router.post("/", async (req, res) => {
  const { items, discount_amount = 0, payment } = req.body || {};

  // Tentukan cabang: kasir -> cabangnya sendiri, admin -> dari body.
  const branchId = req.user.role === "cashier" ? req.user.branch_id : req.body.branch_id;

  if (!branchId) return res.status(400).json({ message: "Cabang tidak valid." });
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Keranjang kosong." });
  }
  if (!payment || !payment.method) {
    return res.status(400).json({ message: "Data pembayaran tidak lengkap." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Ambil harga terkini dari DB untuk tiap item.
    const menuIds = [...new Set(items.map((i) => i.menu_item_id))];
    const [menuRows] = await conn.query(
      "SELECT id, price, is_available FROM menu_items WHERE id IN (?)",
      [menuIds]
    );
    const menuMap = {};
    for (const m of menuRows) menuMap[m.id] = m;

    let totalAmount = 0;
    const computedItems = items.map((it) => {
      const menu = menuMap[it.menu_item_id];
      if (!menu) throw { status: 400, message: `Menu id ${it.menu_item_id} tidak ditemukan.` };
      if (!menu.is_available) throw { status: 400, message: `Menu id ${it.menu_item_id} sedang habis.` };
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      const price = Number(menu.price);
      const subtotal = price * qty;
      totalAmount += subtotal;
      return { menu_item_id: it.menu_item_id, quantity: qty, price_per_item: price, subtotal, notes: it.notes || "" };
    });

    const discount = Math.min(Math.max(Number(discount_amount) || 0, 0), totalAmount);
    const finalAmount = totalAmount - discount;

    const amountPaid = payment.method === "cash" ? Number(payment.amount_paid) || 0 : finalAmount;
    if (payment.method === "cash" && amountPaid < finalAmount) {
      throw { status: 400, message: "Jumlah dibayar kurang dari total." };
    }
    const changeGiven = Math.max(0, amountPaid - finalAmount);

    const orderNumber = await nextOrderNumber(conn, branchId);

    const [r] = await conn.query(
      `INSERT INTO orders (uuid, branch_id, cashier_id, order_number, order_date, total_amount, discount_amount, final_amount, status)
       VALUES (UUID(), ?, ?, ?, NOW(), ?, ?, ?, 'completed')`,
      [branchId, req.user.id, orderNumber, totalAmount, discount, finalAmount]
    );
    const orderId = r.insertId;

    const itemValues = computedItems.map((it) => [orderId, it.menu_item_id, it.quantity, it.price_per_item, it.subtotal, it.notes]);
    await conn.query(
      "INSERT INTO order_items (order_id, menu_item_id, quantity, price_per_item, subtotal, notes) VALUES ?",
      [itemValues]
    );

    await conn.query(
      "INSERT INTO payments (order_id, method, amount_paid, change_given, status) VALUES (?, ?, ?, ?, 'success')",
      [orderId, payment.method, amountPaid, changeGiven]
    );

    await conn.commit();

    // Ambil kembali pesanan lengkap untuk dikirim ke frontend (untuk struk).
    const [[order]] = await conn.query("SELECT * FROM orders WHERE id = ?", [orderId]);
    const [savedItems] = await conn.query(
      "SELECT id, order_id, menu_item_id, quantity, price_per_item, subtotal, notes FROM order_items WHERE order_id = ?",
      [orderId]
    );
    const [[pay]] = await conn.query(
      "SELECT order_id, method, amount_paid, change_given, status FROM payments WHERE order_id = ?",
      [orderId]
    );

    res.status(201).json({
      ...order,
      order_date: toIso(order.order_date),
      items: savedItems,
      payment: pay,
    });
  } catch (err) {
    await conn.rollback();
    const status = err.status || 500;
    res.status(status).json({ message: err.message || "Gagal menyimpan transaksi." });
  } finally {
    conn.release();
  }
});

export default router;
