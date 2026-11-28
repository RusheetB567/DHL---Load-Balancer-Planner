# Interface redesign — 14 October 2026

The presentation now separates depot and driver entry points with two large workspace choices. The depot Today screen prioritises check-in, run planning, received-piece progress, actual run cards and exception shortcuts. Navigation uses short action labels. Planning moves parcel work into a primary column and the route summary/road path into a separate panel. Driver screens retain larger tap targets and add Scan parcels, My stops and Depot messages shortcuts. Mobile layouts collapse to a single column and horizontally scrollable navigation.

Implementation: `experience.js` adds presentation and navigation around the existing renderers; `redesign.css` supplies the visual system. Data remains sourced from the existing authenticated APIs. No authorisation or dispatch gate was removed. The local simulation entry points remain limited to explicit development mode.

Validation: 15 freight, planning and scanner tests pass; JavaScript syntax checks pass; homepage and new script/style endpoints return HTTP 200. Browser automation was rejected by the browser URL policy on this turn, so screenshot/visual and interaction verification of the redesigned layout is pending user review. No commit or push performed.
