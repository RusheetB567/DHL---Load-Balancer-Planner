# Advance load planning and premium workflow increment

28 November 2026. Existing DEVELOPMENT checkout extended; no commit or push included.

## Operational understanding

Permanent drivers retain their base run ownership. FLEXI is support requested for a particular date/cycle and part of an area. The user clarified that some areas have separately shown FLEXI zones, while other support areas are decided on request from the day's freight volume. The photographs are not treated as exact GIS polygons, and suffixes such as X or 1 are not assumed to identify FLEXI runs.

Geographic loops A–E/CITY are distinct from daily A/B cycles and physical Fingers 1–3. Normal reported volumes of roughly 1,200 per cycle and busy-day volumes of 3,000–3,500 shipments are planning scenarios; shipment and individual-piece counts remain separate.

## Implemented

- `territory-catalogue.json`: 26 distinct photographed codes, suburb/postcode lists, visible driver labels, source photo names and AGBC service-day notes. All begin unconfirmed and require depot review. A postcode list on a sign is not treated as a one-to-one postal validation dataset. Ambiguous or contradictory matches remain exceptions.
- Forecast before receiving: `planningDate`, suburb, postcode and optional `planningCycle` are retained from JSON/CSV imports. Due-date day is the labelled fallback where no planningDate is supplied. Expected/received/matched/ambiguous counts are separate. Shared-address service is counted once, with all parcel handling retained. Forecasting never changes receiving, physical custody, clearance or dispatch.
- Permanent/FLEXI profiles: reviewed classification, linked registered driver, known work budget and weight/volume limits. Unknown travel, staffing and territory ownership remain visible; low known workload is not a guarantee of spare driving capacity.
- FLEXI requests: explicit depot request, date, cycle, estimated minutes and area/reason; supervisor-controlled assignment/cancellation/completion with versions, audit and replay protection. Recording staffing help does not automatically assign parcels or replace the permanent owner.
- Address camera/photo/manual entry: locally served Tesseract worker, core and English data. Live viewfinder prefers rear camera, requests permission only on tap, captures then reads; choose-photo/manual fallback remains. Recognised text is a suggestion and confirmation is mandatory. Multiple detected addresses require selection/entry rather than automatic bulk acceptance.
- Planned stops: persistent address, date, delivery/pickup type, expected parcel quantity, service minutes, first/auto/last preference and notes. These are review-only preferences pending verified coordinates/parcel linkage. Copy requires fresh confirmation; removal archives a draft and preserves evidence.
- IFOROS frontend inspired by the supplied Spoke screenshots: Today/Tomorrow/custom-date run sheet, own colours/typography, driver/finger/cycle selection, advanced depot settings, searchable forecast, focused FLEXI-request sheet, route-view/stop-list tabs and mobile-friendly stop cards. No Spoke account, API, assets or SDK is connected/copied.

## API and migrations

- `GET /api/v1/territories`, `POST /api/v1/territories/:code`
- `GET /api/v1/forecast?date=YYYY-MM-DD&cycle=A` (cycle optional for whole day)
- `GET/POST /api/v1/flexi-requests`, `POST /api/v1/flexi-requests/:id`
- `GET/POST /api/v1/address-drafts`, `POST /api/v1/address-drafts/:id/archive`

All operational endpoints require existing role/depot authentication. Mutations require Idempotency-Key. Drivers can see their own captured drafts and assigned runs; territory/forecast/support administration remains depot-only.

Migration 004 creates territory profiles, address drafts and FLEXI requests. Migration 005 transactionally adds stop details and draft versions. Source photographs stay in the user's Pictures folder and are not copied into web assets.

## Try it

1. `npm ci`, `npm test`, `npm run check`, then `npm run preview`.
2. Open http://127.0.0.1:4300. Choose Depot workspace; Plan ahead opens first. Choose Today/Tomorrow/date and whole-day or A/B cycle.
3. Review photographed territory criteria and permanent driver links before trusting matched totals. Confirm FLEXI coverage only from reviewed depot boundaries, never guessed colours.
4. Import expected shipment records. An example manifest can be downloaded from the empty forecast and imported using Import parcels. It is explicitly synthetic and does not receive pieces.
5. Request FLEXI support when required. Choose the cycle and record the specific area/reason. A supervisor records a proposed support driver, preserving the permanent owner.
6. Open Read an address. Use camera/photo or type; review address, suburb, postcode and stop details, tick confirmation, then save. Drafts remain outside physical freight accounting until coordinates and parcel links are verified.
7. In Plan & assign runs, Create run opens the Today/Tomorrow sheet. Existing receiving, release and supervisor checks still apply.

## Validation and limits

40 automated tests pass, including forecast-before-arrival, overlap/no double count, delivery-day notes, role/depot isolation, request-only FLEXI, stale versions, confirmation, stop details/archive and premium DOM interactions. Tests use jsdom for UI logic; that is not visual browser or physical-device verification. Camera denial and late permission cancellation release paths are covered.

A real locally generated synthetic image was read by the local OCR engine: `139 Test Street / Example Suburb SA 5009` was suggested correctly, with OCR confidence 95. That is not a real-label accuracy benchmark. The user must confirm all fields.

`npm run benchmark:forecast` reconciled 3,500 synthetic single-piece shipments in one A-cycle forecast, with zero receiving scans. On Node 24.19.0 / Windows / Intel i5-12600 / in-memory SQLite / one user, the recorded run took 177 ms for batched import and 1,228 ms for forecasting. No disk/concurrent/device/routing/production throughput claim follows. Imports retain the 1,500-piece per-request limit; larger days use multiple batches.

Exact FLEXI polygons, permanent/FLEXI code classifications, real registered driver identities, licensed geocoding/street basemap, live DHL/scanner feeds, real-address road-provider coverage, full pickup routing and dispatch approval remain dependencies. No real data is uploaded by OCR and no live integration is implied. Desktop/mobile visual layout, phone hardware camera and live-browser OCR still need hands-on review.