# Depot and driver workflow — 11 October 2026

Reference: Spoke/Circuit's published mobile product listing and the user's supplied screenshots informed numbered stops, large controls, scanning, editing and navigation handoff. Both supplied YouTube URLs could not be retrieved; no video review is claimed.

## Try the working demonstration

Run `npm run dev` and open http://127.0.0.1:4300. Choose **supervisor** for depot work or **Demo driver** for the assigned parcel list.

1. Depot check-in panel: scan a barcode and confirm its physical receiving location. Reconciliation remains available separately.
2. Runs & drivers: create runs with driver, postcodes, capacities, depot coordinates and shift times. Add verified-address stops or use draft postcode allocation.
3. Send synthetic rehearsal: only explicitly synthetic freight is permitted in development. The assigned driver sees the same database-backed list in this web app.
4. Driver: scan each parcel, request that depot remove parcels staying behind, and move stops earlier/later.
5. Supervisor: approve or reject removal requests, record a decision note and resend the revised list. Removal never occurs merely because a driver asks; removed shipments return to the unassigned register.
6. Calculate road route: the fixed synthetic Netley stops use an OSRM road-data snapshot. Road-based driving time, ordered visits, return time, distance and a numbered road-path diagram are persisted. Every edit invalidates this road plan and requires recalculation/review.

Rehearsal parcel scanning does not load or dispatch physical freight. Live publishing checks current receiving/release controls, capacities, driver scans and feasible route status. The missing approved compliance profile still blocks live dispatch.

## Routing boundary

Set `IFOROS_ROUTING_URL` to an approved OSRM-compatible service before starting the backend to enable road calculations for other addresses. Local HTTP services are allowed; remote services require HTTPS. Requests send coordinates to the configured service. Synthetic fallback is limited to the exact four demo coordinates and records explicitly marked synthetic. No customer data was sent to the public demonstration provider.

The saved demonstration snapshot names the public OSRM source and timestamp. It is road data, not straight-line distance, but has no live traffic. The road-path diagram has no street basemap. At eight stops or fewer, all orders are evaluated for minimum driving time while checking completion deadlines, service durations and depot return. Larger runs use a labelled nearest-road-time heuristic; optimality is not claimed. Missing connections, infeasible deadlines and provider failures remain explicit. This is a delivery-only pilot solver, not a full pickup/delivery VRP or heavy-vehicle compliance validator.

## Access and integration

Driver IDs and depot scopes are enforced on the server. Versions reject stale edits; idempotency prevents duplicate mutations. Depot decisions and scans are audited. Migration 002 adds runs, stops, driver scan acknowledgements and confirmation requests.

This release sends records to the built-in driver web view. It does not send to CisDriver or another installed scanner app, push notifications, SMS or email. Those connections await the scanner/driver app details and authorised contracts. Phone access still needs reachable HTTPS and approved identity. No commit, push or deployment is included.

## Verification

Fifteen tests pass: existing freight/scanner checks plus allocation, replay, wrong-driver isolation, driver scanning, held-piece rejection, depot confirmation, route calculation, stale versions and invalidation. Browser verification confirms the simplified driver screen, saved driver scan, pending removal request, supervisor approval, return to unassigned, recalculation from three to two stops and resending of the revised synthetic list. The first demo route calculated 7.5 km/14 driving minutes; after removal it calculated 5.7 km/10 driving minutes from the saved road snapshot. These are demonstration estimates, not benchmark or live-traffic claims. No physical scanner/phone camera or live DHL operation was tested.
