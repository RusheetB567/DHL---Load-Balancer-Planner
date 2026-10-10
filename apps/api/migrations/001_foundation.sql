PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS shipments(
 id TEXT PRIMARY KEY, depot TEXT NOT NULL, source TEXT NOT NULL, reference TEXT NOT NULL,
 data TEXT NOT NULL, due_at TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL, UNIQUE(depot,source,reference), UNIQUE(depot,id)
);
CREATE TABLE IF NOT EXISTS pieces(
 id TEXT PRIMARY KEY, depot TEXT NOT NULL, shipment_id TEXT NOT NULL, barcode TEXT NOT NULL,
 weight_kg REAL NOT NULL CHECK(weight_kg>=0), length_cm REAL NOT NULL CHECK(length_cm>0),
 width_cm REAL NOT NULL CHECK(width_cm>0), height_cm REAL NOT NULL CHECK(height_cm>0),
 received_at TEXT, location TEXT, UNIQUE(depot,barcode),
 FOREIGN KEY(depot,shipment_id) REFERENCES shipments(depot,id)
);
CREATE TABLE IF NOT EXISTS clearances(
 id TEXT PRIMARY KEY, depot TEXT NOT NULL, shipment_id TEXT NOT NULL, kind TEXT NOT NULL,
 action TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('HOLD','RELEASED','PENDING')),
 authority TEXT NOT NULL, evidence TEXT NOT NULL, expires_at TEXT, actor TEXT NOT NULL, created_at TEXT NOT NULL,
 FOREIGN KEY(depot,shipment_id) REFERENCES shipments(depot,id)
);
CREATE TABLE IF NOT EXISTS exceptions(
 id TEXT PRIMARY KEY, depot TEXT NOT NULL, shipment_id TEXT, kind TEXT NOT NULL, detail TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'OPEN', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events(
 id TEXT PRIMARY KEY, depot TEXT NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL,
 entity TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS immutable_events_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'Audit events are immutable'); END;
CREATE TRIGGER IF NOT EXISTS immutable_events_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'Audit events are immutable'); END;
CREATE TRIGGER IF NOT EXISTS immutable_clearance_update BEFORE UPDATE ON clearances BEGIN SELECT RAISE(ABORT,'Clearance decisions are immutable'); END;
CREATE TRIGGER IF NOT EXISTS immutable_clearance_delete BEFORE DELETE ON clearances BEGIN SELECT RAISE(ABORT,'Clearance decisions are immutable'); END;
CREATE TABLE IF NOT EXISTS requests(depot TEXT, actor TEXT, key TEXT, digest TEXT NOT NULL, response TEXT NOT NULL, PRIMARY KEY(depot,actor,key));
CREATE INDEX IF NOT EXISTS pieces_shipment ON pieces(depot,shipment_id);
CREATE INDEX IF NOT EXISTS events_depot ON events(depot,created_at);
INSERT OR IGNORE INTO migrations VALUES(1);
