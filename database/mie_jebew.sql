-- =====================================================================
--  MIE JEBEW - Sistem Kasir (POS) Multi-Cabang
--  Database: MySQL 8.x / MariaDB 10.x
--  Cara import:
--    1. Lewat phpMyAdmin: buat lalu import file ini, ATAU
--    2. Lewat terminal:  mysql -u root -p < database/mie_jebew.sql
--
--  Catatan password (sudah di-hash bcrypt):
--    admin    / admin123
--    kasir_a  / kasir123
--    kasir_b  / kasir123
-- =====================================================================

DROP DATABASE IF EXISTS mie_jebew;
CREATE DATABASE mie_jebew CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mie_jebew;

-- ---------------------------------------------------------------------
-- TABEL: branches (cabang)
-- ---------------------------------------------------------------------
CREATE TABLE branches (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid          CHAR(36)     NOT NULL DEFAULT (UUID()),
  name          VARCHAR(150) NOT NULL,
  address       VARCHAR(255) DEFAULT NULL,
  phone_number  VARCHAR(40)  DEFAULT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_branches_uuid (uuid)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABEL: users (pengguna: admin / cashier)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid          CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id     INT UNSIGNED DEFAULT NULL,                 -- NULL = admin (semua cabang)
  username      VARCHAR(60)  NOT NULL,
  password      VARCHAR(255) NOT NULL,                     -- bcrypt hash
  full_name     VARCHAR(120) NOT NULL,
  role          ENUM('admin','cashier') NOT NULL DEFAULT 'cashier',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_uuid (uuid),
  KEY fk_users_branch (branch_id),
  CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABEL: menu_categories (kategori menu)
-- ---------------------------------------------------------------------
CREATE TABLE menu_categories (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid          CHAR(36)     NOT NULL DEFAULT (UUID()),
  name          VARCHAR(80)  NOT NULL,
  description   VARCHAR(255) DEFAULT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_uuid (uuid)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABEL: menu_items (item menu)
-- ---------------------------------------------------------------------
CREATE TABLE menu_items (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid          CHAR(36)     NOT NULL DEFAULT (UUID()),
  category_id   INT UNSIGNED NOT NULL,
  name          VARCHAR(120) NOT NULL,
  description   VARCHAR(255) DEFAULT NULL,
  price         DECIMAL(12,2) NOT NULL DEFAULT 0,
  image_url     VARCHAR(255) DEFAULT NULL,
  is_available  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_menu_items_uuid (uuid),
  KEY fk_menu_items_category (category_id),
  CONSTRAINT fk_menu_items_category FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABEL: expenses (pengeluaran operasional)
-- ---------------------------------------------------------------------
CREATE TABLE expenses (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid          CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id     INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED DEFAULT NULL,
  expense_date  DATE         NOT NULL,
  description   VARCHAR(255) NOT NULL,
  amount        DECIMAL(12,2) NOT NULL DEFAULT 0,
  category      VARCHAR(60)  DEFAULT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_expenses_uuid (uuid),
  KEY fk_expenses_branch (branch_id),
  KEY fk_expenses_user (user_id),
  CONSTRAINT fk_expenses_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  CONSTRAINT fk_expenses_user   FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABEL: orders (transaksi / pesanan)
-- ---------------------------------------------------------------------
CREATE TABLE orders (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)     NOT NULL DEFAULT (UUID()),
  branch_id       INT UNSIGNED NOT NULL,
  cashier_id      INT UNSIGNED DEFAULT NULL,
  order_number    VARCHAR(50)  NOT NULL,
  order_date      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  final_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
  status          ENUM('completed','pending','cancelled') NOT NULL DEFAULT 'completed',
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_uuid (uuid),
  UNIQUE KEY uq_orders_number (order_number),
  KEY fk_orders_branch (branch_id),
  KEY fk_orders_cashier (cashier_id),
  CONSTRAINT fk_orders_branch  FOREIGN KEY (branch_id)  REFERENCES branches(id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_cashier FOREIGN KEY (cashier_id) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABEL: order_items (rincian item per pesanan)
-- ---------------------------------------------------------------------
CREATE TABLE order_items (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id        INT UNSIGNED NOT NULL,
  menu_item_id    INT UNSIGNED DEFAULT NULL,
  quantity        INT          NOT NULL DEFAULT 1,
  price_per_item  DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes           VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_oi_order (order_id),
  KEY fk_oi_menu (menu_item_id),
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id)     REFERENCES orders(id)     ON DELETE CASCADE,
  CONSTRAINT fk_oi_menu  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABEL: payments (pembayaran, 1 pembayaran per pesanan)
-- ---------------------------------------------------------------------
CREATE TABLE payments (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id      INT UNSIGNED NOT NULL,
  method        ENUM('cash','qris','card') NOT NULL DEFAULT 'cash',
  amount_paid   DECIMAL(12,2) NOT NULL DEFAULT 0,
  change_given  DECIMAL(12,2) NOT NULL DEFAULT 0,
  status        ENUM('success','pending','failed') NOT NULL DEFAULT 'success',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_order (order_id),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
--  DATA AWAL (SEED) -- sama dengan mock data pada file mie.jsx
-- =====================================================================

-- Cabang
INSERT INTO branches (id, uuid, name, address, phone_number, is_active) VALUES
  (1, 'b1', 'Mie Jebew Cabang A', 'Jl. Sudirman No. 10, Jakarta',   '021-1234567', 1),
  (2, 'b2', 'Mie Jebew Cabang B', 'Jl. Malioboro No. 5, Yogyakarta', '0274-9876543', 1),
  (3, 'b3', 'Mie Jebew Cabang C', 'Jl. Pemuda No. 88, Semarang',     '024-5551234', 0);

-- Pengguna (password bcrypt: admin123 / kasir123)
INSERT INTO users (id, uuid, branch_id, username, password, full_name, role, is_active) VALUES
  (1, 'u1', NULL, 'admin',   '$2b$10$SyAi4b9q0ezrbqYvtvkleueQ3lfcjco5fqw9TIAB.g4jJhZYqKm/.', 'Super Admin',   'admin',   1),
  (2, 'u2', 1,    'kasir_a', '$2b$10$UQf6YW2mPLxN2W2ifrI.uut3bpSPIix7fmhh4.S2IWS4SFcO5fc7i', 'Budi Santoso',  'cashier', 1),
  (3, 'u3', 2,    'kasir_b', '$2b$10$UQf6YW2mPLxN2W2ifrI.uut3bpSPIix7fmhh4.S2IWS4SFcO5fc7i', 'Siti Rahayu',   'cashier', 1);

-- Kategori menu
INSERT INTO menu_categories (id, uuid, name, description) VALUES
  (1, 'c1', 'Mie',     'Aneka sajian mie khas Jebew'),
  (2, 'c2', 'Minuman', 'Minuman segar pilihan'),
  (3, 'c3', 'Snack',   'Camilan pelengkap');

-- Item menu
INSERT INTO menu_items (id, uuid, category_id, name, description, price, is_available) VALUES
  (1, 'mi1', 1, 'Mie Ayam Original',  'Mie kenyal dengan ayam suwir',          15000, 1),
  (2, 'mi2', 1, 'Mie Ayam Bakso',     'Mie ayam lengkap dengan bakso sapi',    18000, 1),
  (3, 'mi3', 1, 'Mie Goreng Spesial', 'Mie goreng kering bumbu rahasia',       17000, 1),
  (4, 'mi4', 1, 'Mie Jebew Komplit',  'Paket lengkap semua topping',           25000, 1),
  (5, 'mi5', 2, 'Es Teh Manis',       'Teh manis segar dengan es batu',         5000, 1),
  (6, 'mi6', 2, 'Es Jeruk Peras',     'Jeruk segar diperas langsung',           7000, 1),
  (7, 'mi7', 2, 'Air Mineral',        'Air mineral dingin',                     3000, 1),
  (8, 'mi8', 3, 'Pangsit Goreng',     'Pangsit renyah goreng crispy',           8000, 1),
  (9, 'mi9', 3, 'Kerupuk Udang',      'Kerupuk udang asli',                     4000, 1);

-- Pengeluaran
INSERT INTO expenses (id, uuid, branch_id, user_id, expense_date, description, amount, category) VALUES
  (1, 'e1', 1, 1, '2025-05-20', 'Pembelian bahan baku mie', 500000, 'Bahan Baku'),
  (2, 'e2', 1, 1, '2025-05-21', 'Tagihan listrik bulan Mei', 350000, 'Listrik'),
  (3, 'e3', 2, 1, '2025-05-21', 'Gaji kasir harian',         200000, 'Gaji'),
  (4, 'e4', 2, 1, '2025-05-22', 'Bahan baku ayam segar',     400000, 'Bahan Baku');

-- Pesanan
INSERT INTO orders (id, uuid, branch_id, cashier_id, order_number, order_date, total_amount, discount_amount, final_amount, status) VALUES
  (1, 'o1', 1, 2, 'ORD-20250520-001', '2025-05-20 09:00:00', 33000, 0,    33000, 'completed'),
  (2, 'o2', 1, 2, 'ORD-20250520-002', '2025-05-20 10:30:00', 25000, 2500, 22500, 'completed'),
  (3, 'o3', 2, 3, 'ORD-20250521-001', '2025-05-21 08:45:00', 46000, 0,    46000, 'completed');

-- Rincian item pesanan
INSERT INTO order_items (id, order_id, menu_item_id, quantity, price_per_item, subtotal, notes) VALUES
  (1, 1, 1, 1, 15000, 15000, ''),
  (2, 1, 5, 2,  5000, 10000, ''),
  (3, 1, 8, 1,  8000,  8000, ''),
  (4, 2, 4, 1, 25000, 25000, 'Pedas sedang'),
  (5, 3, 2, 2, 18000, 36000, ''),
  (6, 3, 7, 2,  3000,  6000, ''),
  (7, 3, 9, 1,  4000,  4000, '');

-- Pembayaran
INSERT INTO payments (order_id, method, amount_paid, change_given, status) VALUES
  (1, 'cash', 50000, 17000, 'success'),
  (2, 'qris', 22500, 0,     'success'),
  (3, 'card', 46000, 0,     'success');
