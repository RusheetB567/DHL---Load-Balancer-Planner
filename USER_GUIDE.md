# IFOROS — Simple User Guide

IFOROS helps depot staff organise parcels and helps drivers see which parcels and delivery stops belong to their run.

It brings receiving, parcel checks, run planning and driver confirmation into one place. This version is still being developed and uses sample data for demonstrations. It is not connected to live DHL systems or an external scanner app yet.

## What the system helps you do

- See which parcels are expected and which have arrived.
- Scan a parcel and record where it is at the depot.
- Find missing parcels, repeat scans and parcels that are on hold.
- Organise work into Finger 1, Finger 2 and Finger 3.
- Plan morning and afternoon runs and assign them to drivers.
- Review estimated work time and why a parcel needs attention.
- Let drivers scan their assigned parcels and ask depot staff to remove parcels they are not taking.
- Review the order of delivery stops and the available road-route demonstration.

## A few useful words

| Word | Simple meaning |
| --- | --- |
| Shipment / consignment | A delivery booking. It may contain several separate parcels. |
| Piece / parcel | One physical item with its own barcode. |
| Finger | One of the depot's three sorting or staging areas. |
| Cycle | The morning or afternoon planning period. |
| Run | A driver's planned list of delivery stops and parcels. |
| Hold | A restriction that needs to be resolved before the parcel can leave. |
| Exception | Something that needs a staff member to check, such as a missing parcel. |
| Rehearsal | A practice workflow using sample parcels. It does not authorise a real dispatch. |

## Fingers and daily cycles

The system uses **FINGER 1, FINGER 2 and FINGER 3**. Depot staff select the correct finger when receiving parcels and setting up a run.

- **A cycle:** starts at 7:00 am and finishes between 11:30 and 11:45 am.
- **B cycle:** starts between 11:30 and 11:45 am and finishes between 4:00 and 5:00 pm.

The default handover is 11:45 am. Times use Adelaide local time, including daylight saving. Staff must select the correct operating date as well as the finger and cycle. Older runs may need these settings entered before they can be used for automatic suggestions.

Changing a parcel's planned run does not move the physical parcel. Staff still need to check where it is.

## How to open the system

1. Open the project folder and double-click **Start IFOROS.cmd**. On the configured PC, the Desktop shortcut **IFOROS - Start Localhost** opens the same launcher.
2. Wait for the preview to start, then open [http://127.0.0.1:4300/](http://127.0.0.1:4300/).
3. Choose **Depot workspace** or **Driver workspace**. The demonstration also offers a role selector for trying different accounts.

If the page does not load, run `npm run preview` in the project terminal, then refresh the page. The computer needs Node.js installed; first-time setup may also need `npm ci`. Ask the person setting up the system if these are missing.

This address works on the computer running the app. A phone needs a separate reachable HTTPS address; the PC's localhost address will not connect the phone to the depot.

## A normal depot workflow

1. **Bring in the parcel list.** Use **Import parcels** to load an approved CSV or JSON file. An imported parcel is only expected freight; it is not marked as physically received.
2. **Check parcels in.** Open **Check in parcels**, focus the barcode box, scan the parcel, select its physical location and confirm receiving. You can also type the barcode. The camera button requests permission before using a compatible camera.
3. **Check anything unusual.** Use **Missing parcels**, **Needs attention** or **Freight holds** to review problems. A duplicate scan does not create a second parcel. Unknown barcodes need staff review.
4. **Set up the run.** Open **Plan & assign runs**. Select a driver, Finger 1–3, A or B cycle, date, postcodes and vehicle capacity limits.
5. **Review suggestions.** Automatic suggestions consider the run settings, available capacity and known work time. Unresolved parcels stay visible with a reason. In the demonstration, the button is labelled **Preview synthetic allocations**.
6. **Check the route and changes.** Review stops, work estimates and any driver requests. Changes clear the previous road plan so it can be checked again.
7. **Send the practice list.** **Send synthetic rehearsal** makes the sample list available to the assigned driver account inside this app. It does not send to a separate driver app or authorise real dispatch.

## A normal driver workflow

1. Open **Driver workspace** and look at **My route**.
2. Check the run name, finger, cycle, date and parcel list.
3. Scan each parcel you are taking. A parcel already scanned is identified as a repeat.
4. If a parcel is staying behind, choose **Ask depot to remove** and enter the reason. The parcel remains on your list until depot staff confirm the change.
5. Use **Move earlier** or **Move later** to propose a different stop order. The changed plan needs recalculation and depot review.
6. Use **Refresh parcel list** to see depot updates.

A recorded scan is a parcel check. It is not proof that the parcel has been delivered.

## Using the route view

Where road data is available, **Calculate road route** creates an ordered stop list and road-path view. Drag the view to move around, use the zoom buttons or supported pinch/scroll controls, select **Fit route**, or open **Full screen**. Numbered markers correspond to the delivery stops.

The included road demonstration covers fixed sample Netley stops. Other addresses need an approved road-routing service. The current view has no street basemap or live traffic. A displayed route is not permission to carry held or missing freight.

## Understanding work estimates

The system shows known minutes for stop work, handling, depot work and available road travel, plus an allowance for delays. Unknown items are listed separately. Estimates are provisional and still need checking against actual depot and driver experience. Equal parcel counts do not necessarily mean equal work.

## What is not ready for real operation yet

Live DHL/scanner connections, approved release rules, complete loading and dispatch controls, delivery evidence, combined pickup planning and offline phone synchronisation still require further work and approval. Real dispatch remains blocked by the current release controls. Do not use the demonstration as authority to move or deliver freight.

For technical setup and development notes, see [README.md](README.md). For ordinary use, start with the steps in this guide.