# First milestone delivery evidence

Delivered 10 October 2026 (Adelaide). Local synthetic freight foundation; not a complete enterprise release.

## Inspected environment

The IFOROS working directory contained only `.git`. The adjacent CisDriver 3 project was inspected read-only, especially cargo validation, package schema, job linkage, scan guards and cargo tests. No customer database or live source system was accessed or copied. Node 24.19.0 was available. No external dependencies were installed.

## Implemented

- Browser operations dashboard, CSV/JSON file import, receiving, reconciliation, clearance decisions and audit views.
- Persistent relational shipments, individual pieces, clearance records, exceptions, idempotency responses and immutable audit history.
- Transactional import validation and duplicate detection; contradictory source data is rejected rather than overwritten.
- CisDriver export adapter with centimetre/kilogram conversion and consignment/package provenance. Aggregate barcode counts are rejected. Authoritative dueAt is required separately from ETA.
- Optimistic version checks, depot-scoped reads/writes, backend role checks, request replay and HTTP security headers.
- Piece receiving distinguishes expected records from physical arrival. Reconciliation opens missing-piece exceptions; completion of receiving resolves them.
- Compliance decisions are independent by kind/action; missing approved rule profiles keep all movement eligibility blocked.

Migration: `apps/api/migrations/001_foundation.sql` (version 1). API contracts and local startup procedure: README.

## Validation

`npm test`: eight test cases pass, including HTTP requests against an actual ephemeral server, import/receiving/hold persistence across database reopen, rollback, duplicate scans, reconciliation, role and depot boundaries, stale edits, CSV parsing, source status distrust, expiry, independent clearances and explicit demo-mode access guards.

`npm run check`: backend and frontend JavaScript syntax checks pass.

The initial default Node test runner could not spawn workers in this sandbox (`EPERM`). Tests now use the supported single-process `--test-isolation=none` mode. A clearance INSERT placeholder mismatch found by the workflow test was corrected before the passing run.

Browser verification executed on localhost: demo supervisor login rendered persisted freight, receiving `SYN-P002` changed the visible consignment from 1/2 to 2/2 received and recorded its receiving location. The dashboard then showed two received pieces and the missing-piece exception resolved. A screenshot confirmed the dashboard renders in the in-app browser. File upload, compliance form interaction and all role switching have not yet been exhaustively browser-tested. Automated tests do not prove enterprise concurrency, operational acceptance, approved compliance applicability, production security or real integration compatibility.

## Remaining work and dependencies

Excel/PDF extraction, approved profile configuration, enterprise SSO/MFA, PostgreSQL/PostGIS migration, durable import jobs, retention/encryption/backup controls and exception ownership/resolution administration remain backlog work. Planning, routing, pickups, transfers, loading, manifests and driver execution are not implemented.

Before live integration, obtain approved exports/contracts, individual barcode mapping, commitment authority, organisation/depot mapping and source revision semantics. Before pilot use, obtain named operational, compliance, security and release owners and complete their validation gates. No approval is required to continue independent synthetic development.
