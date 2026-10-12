# IFOROS — freight operations foundation

The depot and driver planning increment is described in [run workflow](docs/RUN_WORKFLOW.md): check-in panel, draft postcode allocations, depot confirmation, driver parcel scans, route edits and a road-based synthetic demonstration. The scanner vendor integration remains pending.

The first executable milestone for the staged Netley brief. Reuses the inspected CisDriver 3 cargo concepts: consignment references, individual package dimensions, server-calculated totals, validated scans, depot isolation, optimistic versions, idempotency and audit evidence.

This repository now includes a working local frontend, REST backend and persistent SQLite database. It is a development foundation for synthetic data, with no live DHL connection or operational release approval. The enterprise stack and integration gates remain in the backlog.

## Run

For VS Code, open `IFOROS.code-workspace`. Included tasks start the app and run the pre-commit checks; the debug configuration starts the local backend. See [commit review](docs/COMMIT_REVIEW.md) for the review scope.

Requires Node.js 24.14 or later. Install the locally served ZXing barcode decoder on first setup with `npm ci`.

```powershell
npm run dev
```

Open http://127.0.0.1:4300, select a demo role, and click **Open demo workspace**. This explicit local demo seeds synthetic shipments, a receiving scan, missing-piece reconciliation and a customs hold when the database is empty. Credentials live in server memory and change on restart. Browser tokens are kept in memory only. `supervisor` can import and receive; `compliance` records holds and decisions. Disconnect to switch roles. All data persists in `.data/iforos.sqlite`. You can also double-click `Start IFOROS.cmd` to start the server.

Demo role access is enabled only by `scripts/dev.cjs`, for loopback access with the expected localhost host. It intentionally allows local users to explore all synthetic roles. Use only synthetic data in this mode. `npm start` does not expose the demo role endpoint.

Keep the terminal running while using the website. Press Ctrl+C to stop it. If port 4300 is already in use, open the existing localhost page or stop the application using that port before starting again. The Desktop project folder opens the same source files as this workspace.

For explicitly configured local credentials, set `IFOROS_USERS` to a JSON array of `{id,role,depot,token}` and use `npm start`. Tokens must be unique and at least 32 characters. Never commit credentials. All servers bind to loopback. This local bearer mechanism does not implement enterprise SSO/MFA or production transport encryption.

## Verify the first workflow

1. Connect with the supervisor token; download and import the synthetic JSON under Inbound freight.
2. Receive `SYN-P001` for `SYN-NET-001`; leave `SYN-P002` unreceived.
3. Reconcile that consignment to register a missing-piece exception.
4. Scan `SYN-P001` again to record a duplicate without changing receiving state.
5. Switch to compliance and record an evidenced customs HOLD for customer delivery.
6. Review received, expected, held and missing counts and audit history. Restart the server to verify persistence.

Every customer delivery remains blocked until an approved applicable compliance rule profile is implemented. A RELEASED decision alone cannot bypass that gate. Other movement actions are evaluated separately. There is no dispatch endpoint in this milestone.

```powershell
npm test
npm run check
```

Tests exercise HTTP authorization, cross-depot isolation, transaction rollback, grouped-package rejection, source release distrust, version conflicts, replay, receiving, holds, audit immutability and restart persistence.

## Barcode scanning

Open **Barcode scanning** after signing in. **Open phone camera** requests camera permission, prefers the rear camera and decodes barcodes locally with ZXing (including Code 128, Code 39, EAN/UPC and QR). Detection stops the camera and fills the barcode for review; **Confirm receiving** records the physical event through the existing role, version and duplicate checks. Frames are not uploaded. Stop, navigation, logout and leaving the page release the camera.

USB/Bluetooth scanners configured as keyboard input can scan into the focused barcode box and send Enter. Unknown scans create exceptions; repeated scans cannot receive the piece twice. Other scanner protocols require their vendor integration.

Phone access requires an approved reachable HTTPS deployment; `127.0.0.1` on the phone is the phone itself. The current local server remains PC-only. This change does not configure a public deployment, phone push notification, or SMS invitation. Camera denial/no-device messages explain how to use scanner/manual input instead.

## Imports and CisDriver 3

- JSON: `{format:"json",shipments:[{reference,dueAt,pieces:[{barcode,weightKg,lengthCm,widthCm,heightCm}]}]}`.
- CSV: one row per piece; required headers `reference,dueAt,barcode,weightKg,lengthCm,widthCm,heightCm`. Optional `awb,mawb,hawb,client,destination`. Shipment fields must agree across rows.
- CisDriver cargo export: `{format:"cisdriver3",items:[...]}` using the existing cargo GET representation (`data`, `packages`, `id`). Provide an authoritative `dueAt` timestamp per cargo record: existing ETA/ATA is not treated as a delivery commitment. Adapter accepts snake_case exported measurements and camelCase write measurements. `count` must be exactly 1 per unique barcode; grouped packages require upstream piece identification. Source customs/release text is retained as metadata only.

All commitments require timezone-qualified ISO timestamps. CSV and JSON files are bounded to 2 MB and 1,500 pieces. Imports are all-or-nothing. Identical source/reference records are recognised as duplicates; changed records produce a review conflict. Excel, PDF/OCR and live API synchronisation remain unimplemented.

## API

All endpoints below use a configured bearer token. Every mutation needs `Idempotency-Key`; a reused key with a different request is rejected.

| Endpoint | Behaviour |
| --- | --- |
| `GET /api/v1/me` | Current identity, depot and role |
| `GET /api/v1/dashboard` | Persisted freight metrics, pieces and exceptions |
| `POST /api/v1/imports` | CSV, JSON or CisDriver cargo adapter import |
| `GET /api/v1/shipments/:id` | Shipment, pieces, clearances and eligibility |
| `POST /api/v1/receiving/scans` | `{barcode,location,version}`; configured Netley location |
| `POST /api/v1/shipments/:id/reconcile` | `{version}`; missing-piece evidence |
| `POST /api/v1/shipments/:id/clearances` | `{version,kind,action,status,authority,evidence,expiresAt?}`; compliance role |
| `GET /api/v1/shipments/:id/eligibility?action=customer_delivery` | Action-specific fail-closed decision |
| `GET /api/v1/audit` | Last 500 depot audit events |

Duplicate/unknown scans return HTTP 409 and persist an exception and audit event. Version conflicts return 409 without changing freight. Successful mutations return 200, including request replays. Migration `001_foundation.sql` runs at startup and is recorded in `migrations`.

See [architecture](docs/ARCHITECTURE.md), [staged backlog](docs/BACKLOG.md) and [risks/dependencies](docs/RISKS.md). Next gates: approve source ownership and individual barcode mapping; implement enterprise identity and PostgreSQL migration; approve compliance applicability profiles; then introduce workload balancing and independently validated delivery/pickup planning.
