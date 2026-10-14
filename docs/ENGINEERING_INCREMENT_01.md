# Controlled increment 01 — eligibility and workload baseline

14 October 2026. Implements R-ELIG/R-WORK corrections identified in ENGINEERING_REVIEW_2026-10-14.md; not complete enterprise delivery.

## Changes and acceptance evidence

| Files | Purpose | Validation |
| --- | --- | --- |
| `apps/api/workload.cjs` | Explicit service/access/piece handling, depot and contingency components; known-minute lower bound, unknown travel and unapproved policy reported | Minute arithmetic, heavy-piece effect, invalid inputs, missing travel tests |
| `apps/api/planning.cjs` | Operational allocation excludes unresolved eligibility; explicit development rehearsal permits synthetic records while still excluding missing/held freight; ranks compatible runs by projected known working utilisation; retains unassigned reasons and audited explanation | Exclusion, rehearsal safety, balancing and audit tests |
| `apps/api/migrations/003_fingers_cycles.sql` | Moves inline ALTER statements into an atomic transaction in a versioned file; existing complete schema retained | Fresh schema in all planning test fixtures and idempotent schema initialization in server tests |
| `apps/web/planning.js`, `redesign.css` | Exposes workload lower bounds and last allocation reasons; synthetic action labelled explicitly | Syntax checked; browser interaction remains pending |
| `scripts/dev.cjs`, `tests/planning.test.cjs` | Synthetic fixture calls explicitly request rehearsal | Existing planning regression tests pass |
| `tests/workload.test.cjs` | Five additional abnormal/safety/balancing cases | Executed with full suite |
| `package.json` | New workload module included in syntax checks | `npm run check` |

`npm test`: 23 tests pass. `npm run check`: passes. No performance benchmark, legal assessment, independent 25-person review, mobile hardware test, live DHL connection or deployment is claimed.

## Reproduce

1. `npm ci` if dependencies are not installed.
2. `npm test` and `npm run check`.
3. `npm run dev`, then open http://127.0.0.1:4300 and choose Depot workspace.
4. Configure Finger 1–3, A/B cycle and operating date on a draft run; old unconfigured runs are excluded.
5. Use **Preview synthetic allocations** to exercise development fixtures. Check added work minutes and explicit unassigned reasons. For normal operational calls, POST `/api/v1/planning/allocate` with the cycle filters and without `rehearsal`; unresolved eligibility remains excluded.
6. Calculate an available road route and inspect known travel versus missing policy components. Reordering or cycle changes still invalidate the route.

## Limits and risks

Handling assumptions are baseline planning inputs, not approved DHL safe-lifting rules. Heavy freight may require equipment/qualifications that this estimator cannot establish. Missing travel, break/access/handling policy and pickups prevent a complete workload estimate. Known-time filtering cannot establish full route feasibility; an approved solver and independent validator remain required.

The fail-closed missing compliance profile means no real shipment is currently eligible for operational automatic allocation. Do not relax that gate to make the UI look successful. Manual draft-stop editing remains a review tool and is not an operational allocation approval. Driver/vehicle availability, shared-address grouping and mandatory handling qualifications remain required next work.

Next implementation gates: lifecycle/approval-lock correction, approved profile model, authenticated durable scan inbox with device provenance/replay, typed API contracts, resource inventory and independent route constraint validator. Infrastructure, identity and scanner integrations require approved interfaces and owners.
