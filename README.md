# IFOROS — freight operations foundation

The first executable milestone for the staged Netley brief. Reuses the inspected CisDriver 3 cargo concepts: consignment references, individual package dimensions, server-calculated totals, validated scans, depot isolation, optimistic versions, idempotency and audit evidence.

This repository now includes a working local frontend, REST backend and persistent SQLite database. It is a development foundation for synthetic data, with no live DHL connection or operational release approval. The enterprise stack and integration gates remain in the backlog.

## Run

For VS Code, open `IFOROS.code-workspace`. Included tasks start the app and run the pre-commit checks; the debug configuration starts the local backend. See [commit review](docs/COMMIT_REVIEW.md) for the review scope.

Requires Node.js 24.14 or later. No package downloads required.

```powershell
node scripts/dev.cjs
```

Open http://127.0.0.1:4300, select a demo role, and click **Open demo workspace**. This explicit local demo seeds synthetic shipments, a receiving scan, missing-piece reconciliation and a customs hold when the database is empty. Credentials live in server memory and change on restart. Browser tokens are kept in memory only. `supervisor` can import and receive; `compliance` records holds and decisions. Disconnect to switch roles. All data persists in `.data/iforos.sqlite`. You can also double-click `Start IFOROS.cmd` to start the server.

Demo role access is enabled only by `scripts/dev.cjs`, for loopback access with the expected localhost host. It intentionally allows local users to explore all synthetic roles. Use only synthetic data in this mode. `npm start` does not expose the demo role endpoint.

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
