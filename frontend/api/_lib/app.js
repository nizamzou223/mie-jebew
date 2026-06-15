import "express-async-errors";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import branchRoutes from "./routes/branches.js";
import userRoutes from "./routes/users.js";
import menuRoutes from "./routes/menu.js";
import expenseRoutes from "./routes/expenses.js";
import orderRoutes from "./routes/orders.js";

dotenv.config();

const app = express();

// CORS: jika CORS_ORIGIN tidak diisi atau "*", izinkan semua origin
// (aman karena di Vercel frontend & backend satu domain — tidak ada cross-origin).
const corsOrigin =
  process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== "*"
    ? process.env.CORS_ORIGIN
    : true;
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "mie-jebew-api" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/orders", orderRoutes);

// 404
app.use((_req, res) => res.status(404).json({ message: "Endpoint tidak ditemukan." }));

// Error handler terpusat (menangkap error async yang dilempar dari route).
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Terjadi kesalahan server." });
});

export default app;
