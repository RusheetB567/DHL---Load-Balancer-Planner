# Netley fingers and operating cycles

Receiving locations now offer FINGER 1, FINGER 2 and FINGER 3. Run records persist finger, cycle and operating date (schema migration version 3). The planning board shows all three fingers with A/B cycle slots. Runs created in the UI require these selections. Existing records are marked unconfigured until depot staff save their settings; freight histories are not silently rewritten.

Defaults based on the user's time ranges: A 07:00–11:45; B 11:45–17:00. Depot staff can choose A's finish at 11:30–11:45, B's start at 11:30–11:45 and B's finish at 16:00–17:00. Stored timestamps use Australia/Adelaide including daylight saving. Final depot timing policy still needs confirmation. Saving a changed cycle clears the previous route and requires recalculation/review.

Draft allocation filters the selected finger/cycle/date as well as shipment metadata, postcode and capacity. Pieces received at a different numbered finger are not silently reassigned. Geographic run boundaries still need approved postcode configuration; cycle selection does not authorise postponing a service commitment or bypassing a hold.

Route maps now have zoom buttons, wheel/pinch zoom, pointer dragging, keyboard panning, fit-route, full screen and clickable stop markers. Geometry remains provider road data with numbered stops; a street basemap is not included. Synthetic road snapshots and operational release limitations remain as documented in RUN_WORKFLOW.md.

Validation: 18 automated tests pass, including Adelaide daylight-saving/standard-time conversion and invalid cycle rejection. Source syntax and localhost asset loading checked. The current browser policy previously blocked visual automation; physical touch, full-screen and responsive visual checks remain pending user review. No commit or push performed.
