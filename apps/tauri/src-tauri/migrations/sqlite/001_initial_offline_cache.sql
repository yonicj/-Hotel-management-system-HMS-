-- Local SQLite tables for offline operation
CREATE TABLE IF NOT EXISTS offline_outbox (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  action TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cached_rooms (
  id TEXT PRIMARY KEY,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL,
  status TEXT NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cached_pos_menu (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  category TEXT NOT NULL
);
