CREATE TABLE IF NOT EXISTS territory_profiles (
 depot TEXT NOT NULL, code TEXT NOT NULL, config TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
 PRIMARY KEY(depot,code)
);
CREATE TABLE IF NOT EXISTS address_drafts (
 id TEXT PRIMARY KEY, depot TEXT NOT NULL, created_by TEXT NOT NULL, address TEXT NOT NULL,
 suburb TEXT NOT NULL, postcode TEXT NOT NULL, planning_date TEXT NOT NULL, task_type TEXT NOT NULL,
 source TEXT NOT NULL, source_text TEXT NOT NULL, confirmed_at TEXT NOT NULL, status TEXT NOT NULL,
 UNIQUE(depot,id)
);
INSERT OR IGNORE INTO migrations VALUES(4);
CREATE TABLE IF NOT EXISTS flexi_requests (
 id TEXT PRIMARY KEY, depot TEXT NOT NULL, code TEXT NOT NULL, planning_date TEXT NOT NULL,
 cycle TEXT NOT NULL CHECK(cycle IN ('A','B')), minutes REAL NOT NULL, reason TEXT NOT NULL,
 requested_by TEXT NOT NULL, assigned_driver TEXT, state TEXT NOT NULL DEFAULT 'REQUESTED',
 version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, UNIQUE(depot,id)
);