# Local preview recovery — 15 October 2026

Observed failure: no process was listening on 127.0.0.1:4300. The website could not load because the development server was stopped.

`npm run preview` now launches a detached, hidden, loopback-only development process, waits for an IFOROS database health response and prints the ready URL. Running it again reuses the healthy server. It refuses to replace an unknown/unhealthy service on the same port. Startup output is retained in `.data/preview.log`. This is not a Windows service and does not automatically start after a computer reboot.

The Desktop **IFOROS - Start Localhost** shortcut already targets the project launcher, which now starts this persistent preview and opens the website only after success. VS Code also has **IFOROS: Start persistent preview**. `npm run dev` remains the foreground development command.

Verification executed: first preview command started the process successfully; a separate command reused it; health, homepage and all checked script/style assets returned HTTP 200. All 24 automated tests pass, including health without operational data access. JavaScript syntax checks pass. No browser visual verification is claimed for this fix. No commit or push performed.
