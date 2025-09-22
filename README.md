# Book Reader (Vite + React + Tailwind + PWA)

A responsive PWA book reader that connects to Google Drive and lists/opens PDFs from a Drive folder named `Book_Reader`. Optimized for phones and tablets.

## Features
- Offline-capable PWA with install support (via `vite-plugin-pwa`)
- Mobile-first responsive reader UI with Tailwind CSS
- Google Identity Services (OAuth2) authentication
- Google Drive integration:
  - Ensures/uses a folder `Book_Reader`
  - List PDFs, upload PDFs, view selected PDF
- Light/Dark theme toggle and basic reading controls (font size, line height, margin)

## Quickstart
1. Install deps
	```powershell
	npm install
	```
2. Copy `.env.example` to `.env` and set `VITE_GOOGLE_CLIENT_ID`
3. Dev server
	```powershell
	npm run dev
	```
4. Build + preview (tests PWA service worker)
	```powershell
	npm run build
	npm run preview
	```

## Google Cloud setup
1. Create a Google Cloud project and enable the Drive API.
2. Create OAuth 2.0 Client ID (Web application) in Credentials.
3. Add Authorized JavaScript origins (e.g., `http://localhost:5173` and your deploy URL).
4. Copy the Client ID to `.env` as `VITE_GOOGLE_CLIENT_ID`.

Permissions used:
- `drive.readonly` (list/read user Drive files)
- `drive.file` (create/manage files created by this app; used for uploads to `Book_Reader`)

## Folder strategy in Drive
- A folder named `Book_Reader` is created/used in the user’s My Drive.
- PDFs uploaded via the app go into this folder.
- The library view lists all non-trashed PDFs from this folder.

## Notes
- The built-in PDF viewer uses the browser’s native PDF rendering via `iframe` blob URLs.
- For advanced features (bookmarks, annotations, text selection), integrate a PDF viewer library (PDF.js) later.

## Tech
- Vite + React (SWC)
- Tailwind CSS v4
- vite-plugin-pwa
- Google Identity Services (GIS)

