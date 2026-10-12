CREATE TABLE IF NOT EXISTS runs (
 id TEXT PRIMARY KEY, depot TEXT NOT NULL, name TEXT NOT NULL, driver_id TEXT NOT NULL,
 postcodes TEXT NOT NULL, capacity_kg REAL NOT NULL CHECK(capacity_kg>0),
 capacity_m3 REAL NOT NULL CHECK(capacity_m3>0), start_at TEXT NOT NULL, end_at TEXT NOT NULL,
 depot_lat REAL NOT NULL, depot_lon REAL NOT NULL, status TEXT NOT NULL DEFAULT 'DRAFT',
 version INTEGER NOT NULL DEFAULT 1, route_json TEXT, UNIQUE(depot,id)
);
CREATE TABLE IF NOT EXISTS run_stops (
 id TEXT PRIMARY KEY, depot TEXT NOT NULL, run_id TEXT NOT NULL, shipment_id TEXT NOT NULL,
 address TEXT NOT NULL, postcode TEXT NOT NULL, lat REAL NOT NULL, lon REAL NOT NULL,
 service_minutes REAL NOT NULL, position INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1,
 FOREIGN KEY(depot,run_id) REFERENCES runs(depot,id),
 FOREIGN KEY(depot,shipment_id) REFERENCES shipments(depot,id)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_assignment ON run_stops(depot,shipment_id) WHERE active=1;
CREATE TABLE IF NOT EXISTS driver_scans (
 run_id TEXT NOT NULL, piece_id TEXT NOT NULL, driver_id TEXT NOT NULL, created_at TEXT NOT NULL,
 PRIMARY KEY(run_id,piece_id), FOREIGN KEY(run_id) REFERENCES runs(id), FOREIGN KEY(piece_id) REFERENCES pieces(id)
);
CREATE TABLE IF NOT EXISTS run_changes (
 id TEXT PRIMARY KEY, run_id TEXT NOT NULL, shipment_id TEXT NOT NULL, driver_id TEXT NOT NULL,
 reason TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'PENDING', created_at TEXT NOT NULL,
 FOREIGN KEY(run_id) REFERENCES runs(id), FOREIGN KEY(shipment_id) REFERENCES shipments(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_change ON run_changes(run_id,shipment_id) WHERE state='PENDING';
INSERT OR IGNORE INTO migrations VALUES(2);
