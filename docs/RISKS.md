# IFOROS risks, limitations and operational gates

Status: initial register. Owners below are required accountability roles; individual appointments and decision dates await discovery. The first milestone is local development software and synthetic workflow evidence, not an approved freight operating system.

| ID | Risk / present limitation | Control or next action | Accountable owner / gate |
| --- | --- | --- | --- |
| R01 | No verified live DHL interface or source authority | Use explicit synthetic/authorised exports; inventory contracts and permissions before connector deployment. | Integration + product owner / discovery |
| R02 | CisDriver aggregate package count can conceal missing pieces | Reject ambiguous count>1 exports or require actual unique per-piece identifiers; never fabricate physical identity. | Freight/data + operations / import acceptance |
| R03 | Imported customs/release text may be mistaken for permission | Keep as provenance only; independent clearance decisions and approved action profiles required. | Compliance/safety / every movement gate |
| R04 | No approved live applicable compliance profile | Fail closed; obtain source, owner, version, applicability, effective period and independent validation. | Compliance owner / pilot |
| R05 | One depot/business unit policy incorrectly reused elsewhere | Explicit profile/depot configuration and server-side isolation; assess Netley, Pooraka and Edinburgh separately. | Product owner + security / expansion |
| R06 | Local bearer access lacks enterprise identity lifecycle | Environment credentials only for development; implement approved SSO/MFA, expiry/revocation and administration. | Security / pilot |
| R07 | SQLite/local process is not proven for enterprise concurrency or availability | Measure contention and capacity; choose approved hosting/database after discovery. | Architect + data + SRE / readiness |
| R08 | Due dates/time interpretation and provenance unresolved | Require authoritative commitments, timezone semantics and verified mapping; ETA/cutoff are not delivery deadlines. | Business analyst + integration / discovery |
| R09 | Receiving mistaken for dispatch/delivery evidence | Separate states and event types; require explicit verified transfers/loading and authorised plans later. | Operations + allocation / planning |
| R10 | Application audit lacks independently secured retention | Preserve atomic audit now; design tamper resistance, restricted access, retention and monitoring. | Security + SRE / readiness |
| R11 | No full backup, recovery, monitoring or incident exercise | Define RPO/RTO with owners and execute restore/fallback scenarios before pilot. | SRE + release / readiness |
| R12 | Allocation, routing, pickups, transfers/loading and driver execution deferred | Do not use foundation to authorise dispatch; build and validate staged planning/execution scope. | Technical lead + operations / planning |
| R13 | Optimiser or AI advice may imply unsafe feasibility | Independent mandatory-constraint validator; explicit solver status and unassigned work; no autonomous clearance. | Optimisation + compliance / planning |
| R14 | Performance targets unmeasured | Validate benchmark relevance; record hardware/data/provider latency and percentile method. | QA/performance / readiness |
| R15 | Privacy, retention, supplier conditions and data ownership unresolved | Minimise sample data; agree approved processing/storage and access conditions before real records. | Security/privacy + sponsor / pilot |
| R16 | Offline/replayed/stale driver updates can overwrite decisions | Versioned commands and explicit conflict reconciliation, secure device storage and approved offline policy. | Driver engineer + security / execution |
| R17 | Schedule/funding assumptions treated as guarantees | Phase effort/cost allocation, contingency and formal business-case gate after discovery. | Project manager + sponsor / funding |

## Approval and stop conditions

Technical tests do not substitute for DHL operational approval, compliance validation, security acceptance or regulatory certification. No live deployment or external writeback is assumed.

Begin a later pilot in observation mode, with baseline measures agreed before collecting results. Permit only selected supervisor-approved recommendations inside agreed runs/interfaces. Name who can stop the pilot and how fallback and later reconciliation work.

Stop/revert on unauthorised movement, lost freight accountability, material access failure, unsafe/systematically invalid plans or unreconciled assignment/manifest conflicts. Existing approved operational procedures must remain available as the fallback.

## Evidence rules

Record executed test commands/results, observed workflow screenshots where useful, migration version, API contracts, outstanding defects and test limitations in release evidence. These documents intentionally do not claim tests passed, enterprise security reviewed, legal rules verified, recovery proven or production readiness. Update status only when corresponding evidence exists.
