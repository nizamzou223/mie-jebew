import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// Verifikasi token JWT pada header Authorization: Bearer <token>
export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Token tidak ditemukan." });

  try {
    const payload = jwt.verify(token, SECRET);
    // payload: { id, username, role, branch_id, full_name }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Token tidak valid atau kedaluwarsa." });
  }
}

// Batasi akses hanya untuk role tertentu, mis. adminOnly = requireRole("admin")
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Akses ditolak." });
    }
    next();
  };
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      branch_id: user.branch_id,
      full_name: user.full_name,
    },
    SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
  );
}
