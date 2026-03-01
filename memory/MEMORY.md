# TelepromptPI Project Memory

## Project Overview
Web-based teleprompter app for Raspberry Pi with hardware mirror setup.
- Original: Laravel 6 + Vue.js + MySQL
- **New (v2)**: React 18 + Node.js/Express + SQLite (in `client/` and `server/` dirs)

## Key Architecture (v2)
- `server/` — Node.js Express backend (port 3001), ESM, better-sqlite3, JWT auth, multer uploads
- `client/` — React 18 + Vite + Tailwind CSS 3, proxies `/api/*` to server
- Root `package.json` runs both via `concurrently` with `npm run dev`

## Core Teleprompter Behaviour (Player.jsx)
- Text container has `transform: scaleY(-1)` (flips text for mirror reflection)
- Scroll container starts at **max scrollTop** (bottom), scrolls UP (decreasing scrollTop) as the script plays
- `speedRef.current * 0.5` px per animation frame via requestAnimationFrame
- Keyboard: Space/Enter=play/pause, ←=restart, →=jump to end, ↑/↓=speed ±1
- Controls auto-hide after 3s when playing; mouse/touch movement reveals them

## Setup Commands
```bash
cp .env.example .env   # in server/ directory
npm install            # in root
npm run install:all    # installs server + client deps
npm run dev            # starts both
```

## Important Files
- `server/index.js` — Express entry point, serves built React in production
- `server/db.js` — SQLite setup (users + transcripts tables), creates `server/uploads/`
- `server/routes/transcripts.js` — CRUD + multer file upload
- `client/src/pages/Player.jsx` — Teleprompter player with scroll/keyboard logic
- `client/src/pages/Home.jsx` — Transcript list + drag-and-drop upload
- `client/vite.config.js` — Proxies `/api` to localhost:3001
