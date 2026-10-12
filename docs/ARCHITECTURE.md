# IFOROS architecture and integration boundaries

11 October increment: `planning.cjs`, `routing.cjs` and migration 002 now implement run assignment, parcel acknowledgements, removal requests and delivery-only route ordering. Their contracts, limits and execution evidence are in `RUN_WORKFLOW.md`; they supersede earlier statements below that no planning implementation exists. No approved live integration or dispatch authority is implied.

Status: first executable local freight foundation implemented; not a production or pilot approval. This document interprets the two supplied IFOROS directives. The source Driver App - Replica(CisDriver3) was inspected read-only; no live DHL connection or access approval has been established.

## Delivery boundary

The first milestone establishes expected shipments, individual pieces, validated import, persistent receiving scans, reconciliation exceptions, independent clearance evidence, role/depot access and audit history. Planning must consume these verified records. Receiving does not imply loading, dispatch, delivery or compliance clearance.

The implementation uses a local Node.js 24 modular backend with built-in SQLite persistence and a vanilla browser frontend, avoiding external package dependencies for this milestone. This choice is a reproducible development foundation, not evidence of enterprise scale, high availability, SSO or operational resilience. The authoritative executable API and schema are the backend source and migrations; verify exact endpoint names against those files.

## Domain contracts

| Boundary | Required invariant |
| --- | --- |
| Shipment | One consignment can contain many independently identifiable pieces; preserve AWB/MAWB/HAWB and customer/source references. |
| Piece | Unique barcode in its approved scope; explicit weight and dimensions with units; physical location changes require evidence. |
| Import | Validate the complete request before accepting operational data; conflicting existing identifiers produce visible errors, not silent replacement. Preserve source identity. |
| Receiving | A scan references a known piece and authenticated depot; repeat events cannot create another piece or receipt. Missing expected pieces remain visible. |
| Reconciliation | Expected, received, held and eligible quantities are separate measures; an imported status is not physical evidence. |
| Clearance | Current records retain kind, action, status, authority, evidence reference, server decision time, optional expiry and actor. Structured conditions, external decision timestamps and approved owner/profile governance remain backlog work. |
| Eligibility | Evaluate each intended action using an approved applicable profile. Absent profile or unresolved required evidence blocks permission. |
| Mutation | Authorisation, validation, optimistic resource version, idempotency, persistence and audit form one controlled command boundary. |
| Audit | Record actor, scoped resource, action and server time. Application audit does not itself prove external tamper resistance. |

Action-specific checks cover airport transfer, warehouse movement, loading, customer delivery and outbound tender separately. Customs-controlled movement never establishes customer-delivery permission. Profiles must distinguish business unit, service, mode, origin/transit/destination, commodity, effective dates and authoritative source. No live approved profile is assumed. A recorded approval without an approved applicable profile is insufficient.

Role/depot isolation is enforced server-side through local environment-provisioned bearer credentials. The browser's chosen depot is not an authority. These credentials are a development access mechanism; enterprise identity, session expiry/revocation, MFA and lifecycle administration remain future work.

## CisDriver3 reuse

The adjacent implementation separates courier jobs from physical cargo, uses server-calculated package totals, scoped cargo access, immutable scan events, idempotency and resource versions. IFOROS adopts those concepts while adding a depot receiving lifecycle and independent release controls.

Read-only evidence: `../Driver App - Replica(CisDriver3)/apps/api/logistics.cjs`, `jobs.cjs`, `schema.sql`, `server.cjs`, and `docs/PRODUCT_ARCHITECTURE.md`.

| Source cargo field | IFOROS meaning / safeguard |
| --- | --- |
| `id`, `organisation_id`, `job_id` | Source provenance and optional booking link; never trust these for target authorisation. |
| `data.consignmentNumber`, `awb`, `mawb`, `hawb` | Shipment references, retaining original values and source identity. |
| `client`, `hostFreightCompany`, `shipper`, `consignee`, origin/destination fields | Commercial and journey metadata, subject to mapping validation. |
| `eta`, `ata`, `availability`, `cutOff` | Distinct operational times; neither ETA nor cutoff is automatically an authoritative delivery commitment. |
| `packages[].barcode` | Physical piece identifier only when uniquely attributable to one actual piece. |
| `count` | Source permits aggregate package counts; count greater than one requires explicit unique piece identifiers or rejection/manual reconciliation. Do not invent barcodes or assume one aggregate scan received every piece. |
| `weight_kg`, `length_cm`, `width_cm`, `height_cm` (stored rows) / `weightKg`, `lengthCm`, `widthCm`, `heightCm` (write contract) | Normalise explicit units; calculate volume as length × width × height in centimetres divided by 1,000,000. Source count multiplies totals, not individual identity. |
| `customsStatus`, `releaseStatus`, extracted document text | Untrusted source metadata; never create approved regulatory release automatically. |
| Pickup/delivery scan | Driver execution evidence; do not reinterpret it as a depot receiving scan. |

The adapter accepts authorised exports as input. It is not a synchronisation worker, a live API connection or writeback to CisDriver3. Before a live connector, agree source ownership, unique identifiers, revision semantics, deleted/tombstoned records, polling/event frequency, retries, reconciliation, access and retention.

## Future service interfaces

Allocation consumes verified freight, handling eligibility, approved run boundaries, driver/vehicle availability and commitments. It proposes assignments separately from physical warehouse transfer tasks. Supervisor approval precedes executable transfer, verified receipt and loading.

Routing must use an approved road-routing provider plus suitable optimisation method. Its contract must distinguish feasible, partial, proven infeasible, timeout, invalid input and provider failure, with explicit unassigned work and independent validation. Delivery reduces vehicle load; pickups increase it; depot unloading is explicit. No route solver, mapping integration or workload balancing is claimed in this foundation.

## Deployment and evidence

Local development runs against persistent SQLite. Schema creation/migration must be versioned and documented in code. Production design requires identity review, TLS, managed secrets, backups with tested restoration, monitoring, incident response, retention, deployment controls and approved hosting. Preserve existing depot procedures as the agreed fallback during any later bounded pilot.

Only executed tests and observed workflows are evidence. Planned performance assumptions (1,500 pieces, 300 stops, 50 pickups, 20 drivers, 30 concurrent users, 120-second planning budget and three-second dashboard percentile) remain unvalidated until measured with defined hardware and boundaries.
