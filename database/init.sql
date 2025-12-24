PRAGMA foreign_keys = ON;

-- =========================
-- Usuarios administrador
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

-- =========================
-- Servicios del spa
-- =========================
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,          -- 🔒 evita duplicados
  duration_minutes INTEGER NOT NULL
);

-- =========================
-- Citas (fuente interna)
-- Google Calendar es la agenda oficial
-- =========================
CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  service_id INTEGER NOT NULL,

  start_datetime TEXT NOT NULL,   -- ISO 8601
  end_datetime TEXT NOT NULL,     -- ISO 8601

  google_event_id TEXT NOT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- =========================
-- Servicios iniciales del spa
-- (NO se duplican al reiniciar)
-- =========================
INSERT OR IGNORE INTO services (name, duration_minutes) VALUES
  ('Masaje relajante', 60),
  ('Facial premium', 90),
  ('Ritual spa completo', 120);
