# IFOROS staged requirements backlog

Status: requirements and acceptance roadmap, not a completed enterprise feature list. Timing in the supplied brief is indicative and depends on discovery, procurement and approval. Funding and staffing assumptions are not commitments.

## Release gates

| Stage | Scope | Exit evidence |
| --- | --- | --- |
| Discovery (indicative weeks 1–3) | Netley workflow, sample ownership, neighbouring pilot runs, integrations, baseline, rules and cost | Sponsor/product owner approve bounded scope; compliance and security owners identified. |
| Foundation (4–6) | Domain/schema, API contracts, local access isolation, reproducible environment | Executable foundation, reviewed boundaries and migration evidence. |
| Freight foundation (7–10) | Imports, shipments/pieces, receiving, locations, clearance records, exceptions and audit | Synthetic import → receive → duplicate/missing detection → hold → dashboard passes tests and role/depot checks. |
| Planning (11–16) | Workload, allocation, road routing, pickups, approval, transfer, loading | Independently checked feasible plans; blocked/unassigned work visible. |
| Pilot readiness (17–20) | Driver integration, debrief, reporting, UAT, security/load/recovery | Operations, security and system owners approve bounded pilot. |
| Controlled evaluation (21–24) | Observation then selected supervisor-approved recommendations | Baseline comparison, defect correction and rollout/extend/stop decision. |
| Rollout (25–28) | Approved deployment, training, support and stabilisation | Defined production scope formally accepted. |

## Functional coverage

| Directive module | First milestone / later acceptance |
| --- | --- |
| 01 Command centre | Record-derived expected, received, missing, held and eligible visibility; later routes, capacity, cutoffs and historical role dashboards. |
| 02 Shipment intelligence | Shipment/piece identity, measurements and receiving history; later full carrier/customer/journey enrichment and loading attribution. |
| 03 Import/extraction | CSV/JSON and CisDriver cargo adapter; later Excel, approved APIs, PDF/image review with provenance. Extraction never grants release. |
| 04 Warehouse | Receiving and location evidence; later approved hierarchical location catalogue, cages/bays/staging and movement workflows. |
| 05 Allocation | Deferred: postcode/run rules, handling/capacity constraints, approved reassignment and transfer tasks. |
| 06 Workload | Deferred: travel + delivery service + handling + pickup + depot processing + contingency; utilisation against available work minutes and required breaks. |
| 07 Optimisation | Deferred: road routes, multiple vehicles, windows, dynamic capacity, independent feasibility checks and honest solver outcomes. |
| 08 Pickup | Deferred: windows, uncertainty, dimensions, return/outbound cutoff and unexpected-load escalation. |
| 09 Supervisor control | Deferred: approved versioned plans, reasoned overrides within authority, publication and acknowledgement/revalidation. |
| 10 Transfers | Deferred: source/destination scans, handler, evidence, exception state; requested is distinct from completed. |
| 11 Loading | Deferred: piece/vehicle/driver reconciliation and complete-consignment checks before publication. |
| 12 Driver operations | Deferred: approved interface/integration, assigned manifests, scans, completion, navigation and controlled offline reconciliation. |
| 13 Exceptions | First receiving/reconciliation visibility; later owned severity/evidence/resolution lifecycle across operations. |
| 14 Returns/outbound | Deferred: failed deliveries, redelivery eligibility, collection reconciliation, deadlines and debrief. |
| 15 Rolling planner | Deferred: daily/next-day/seven-day forecast without unauthorised delivery postponement. |
| 16 Analytics | First operational counts; later defined performance denominators, secure exports and comparable baselines. |
| Additional compliance module | Independent clearance records and fail-closed action eligibility; approved applicable profiles and external authoritative evidence remain dependencies. |

## Seventeen engineering responsibilities

These are accountable functions, not evidence that 17 people or independent reviews have occurred.

| # / Function | Deliverable and boundary | Acceptance / stage |
| --- | --- | --- |
| 1 Project manager | Scope, budget, dependency/decision registers and gates | Owners and approved spending/effort recorded; discovery onward. |
| 2 Business analyst/logistics | Validated lifecycle and business-rule catalogue | Operations approves commitments, split rules, scans, cutoffs and run boundaries; discovery. |
| 3 Architect | Domain, integration, identity and deployment boundaries | Architecture reviewed against actual implementation; foundation onward. |
| 4 Technical lead | Shared contracts, implementation coordination and review | Integrated workflow and documented gaps; all stages. |
| 5 Freight backend | Import, identity, receiving and reconciliation | Atomic validation, duplicate/missing detection and audit tests; freight foundation. |
| 6 Allocation backend | Runs, assignments, approvals, transfer and manifests | Versions/revalidation and physical accountability enforced; planning. |
| 7 Optimisation | Workload, routing and independent plan validation | Mandatory constraints dominate efficiency; uncertainty/unassigned work explicit; planning. |
| 8 Database/data | Migrations, integrity, provenance, reporting and performance | Tested persistence/integrity and later restoration/load evidence; foundation onward. |
| 9 Integration | Source adapters, authorised connectors, scan synchronisation | Contract mapping, retries and reconciliation verified; foundation onward. |
| 10 Operations frontend | Freight/receiving/exception workflows | Actual records, actionable errors, scoped access and keyboard operation; freight foundation. |
| 11 Planning frontend | Allocation/workload/map comparisons | Constraints and transfer implications visible; planning. |
| 12 Driver workflows | Existing-driver integration, scans and offline events | Assignment isolation and stale/replayed/conflicting event reconciliation; pilot readiness. |
| 13 UX | Operational research and accessible design system | Staff validate receiving and dispatch usability; all stages. |
| 14 Security | Identity, threat model, privacy/access assurance | Depot/role tests now; enterprise SSO/MFA/security review before pilot. |
| 15 DevOps/SRE | Environments, CI, monitoring, backup/recovery and incident runbooks | Reproducible deployment and observed restoration/fallback; readiness. |
| 16 QA/performance | Automated, integration and measured performance tests | Evidence records hardware, data sizes, provider latency and limitations; all stages. |
| 17 UAT/release | Operational scenarios, readiness, training and handover | Named owners approve bounded pilot and production separately; readiness/rollout. |

## Immediate acceptance scenarios

1. Import a synthetic consignment with individually identifiable pieces and validated measurements.
2. Confirm persistence after process restart and correct server-derived totals.
3. Receive one known barcode at a scoped location, preserving actor/time/audit.
4. Repeat the same idempotency key; retain original result. Reuse the key with different payload; reject.
5. Scan an already received piece with a new event; show duplicate without inflating counts. Leave unreceived pieces visibly missing.
6. Record an active hold on due freight; retain the deadline while showing the restriction.
7. Reject stale-version updates and cross-depot/unauthorised role access.
8. Show eligibility blocked where a required clearance/profile is absent, even if source export says released.
9. Reject aggregate source package count without verified per-piece identities.

## Discovery decisions required

Assign an owner and decision date for source-of-truth identifiers/commitments/addresses, authorised export/API availability, clearance sources/profile approval, warehouse hierarchy, run/finger boundaries, shipment splitting, freeze/late-arrival policy, vehicle/equipment eligibility, shift/break requirements, collection windows/outbound cutoffs, driver interface, retention and supplier requirements. No live access, approval or business-rule applicability is inferred from the supplied brief.
