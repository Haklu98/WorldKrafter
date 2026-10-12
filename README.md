# WorldKrafter

Electron app scaffold, set up for Windows, macOS and Linux and ready for Steam later.

## Setup

```bash
npm install --save-dev electron electron-builder
npm install steamworks.js
npm start
```

Without the Steam client running, the window shows "Steam not available". That is expected.
To test Steam locally, launch the Steam client first (it uses the test App ID 480 in `steam_appid.txt`).

## Layout

- `src/main/main.js`     window creation and IPC handlers (Node side)
- `src/main/steam.js`    optional Steamworks wrapper (fails gracefully)
- `src/preload/`         the only bridge between UI and Node
- `src/renderer/`        your UI; swap in React/Vue/Svelte via Vite when ready
- `electron-builder.yml` packaging config (unpacked folders for Steam depots)

## Building

Native modules are per-OS, so build each platform on its own OS.
The included GitHub Actions workflow does this for you on push.

```bash
npm run dist:win    # on Windows
npm run dist:mac    # on macOS
npm run dist:linux  # on Linux
```

## Steam checklist (later)

1. Sign up for Steamworks and pay the per-app fee.
2. Get your App ID, put it in `steam.init(<id>)`, and do not ship `steam_appid.txt`.
3. Create depots for Windows, Mac and Linux, and upload builds with SteamPipe (`steamcmd`).
4. Fill in the store page, capsule art, and pricing, then submit for review.
5. Optional: Steam Cloud, achievements, and Workshop through steamworks.js.
6. macOS: code-sign and notarize. Windows: signing is recommended to reduce SmartScreen warnings.
