// Klien API terpusat untuk semua komunikasi dengan backend Express.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const TOKEN_KEY = "mj_token";
const USER_KEY = "mj_user";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};
export const setSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch { /* respons tanpa body */ }

  if (!res.ok) {
    const err = new Error((data && data.message) || `Terjadi kesalahan (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  login: (username, password) => request("/auth/login", { method: "POST", body: { username, password } }),

  // Master data
  getBranches: () => request("/branches"),
  createBranch: (b) => request("/branches", { method: "POST", body: b }),
  updateBranch: (id, b) => request(`/branches/${id}`, { method: "PUT", body: b }),

  getUsers: () => request("/users"),
  createUser: (u) => request("/users", { method: "POST", body: u }),
  updateUser: (id, u) => request(`/users/${id}`, { method: "PUT", body: u }),

  getCategories: () => request("/menu/categories"),
  getMenu: () => request("/menu"),
  createMenu: (m) => request("/menu", { method: "POST", body: m }),
  updateMenu: (id, m) => request(`/menu/${id}`, { method: "PUT", body: m }),
  toggleMenu: (id) => request(`/menu/${id}/availability`, { method: "PATCH" }),
  deleteMenu: (id) => request(`/menu/${id}`, { method: "DELETE" }),

  // Transaksi & operasional
  getExpenses: () => request("/expenses"),
  createExpense: (e) => request("/expenses", { method: "POST", body: e }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: "DELETE" }),

  getOrders: () => request("/orders"),
  createOrder: (o) => request("/orders", { method: "POST", body: o }),
};
