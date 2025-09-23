# Book Reader

## Dev

```powershell
npm install
npm run dev
```

This starts Vite at `http://localhost:5173` and the upload/list server at `http://localhost:8787`.

Set `GH_TOKEN` in `.env` for uploads and authenticated listing in dev.

## Build

```powershell
npm run build
```

## Deploy to GitHub Pages

1. Ensure the repo is `Swastik1204/Book_Reader` and Pages is enabled from branch `gh-pages`.
2. Build with the correct base:

```powershell
npm run build:gh
```

3. Publish the `dist` folder:

```powershell
npm run deploy:gh
```

Site will be available at `https://Swastik1204.github.io/Book_Reader/`.

Note: Uploading requires a server; GitHub Pages is static and cannot perform uploads. Use the local dev server (`npm run dev`) or host the Express server elsewhere and set `VITE_API_BASE` to that URL.

# Book Reader (Vite + React + Tailwind + PWA)

A responsive PWA book reader that lists PDFs from a GitHub repository folder and opens them directly in an in-app viewer. Optimized for phones and tablets.

## Features
- Offline-capable PWA with install support (via `vite-plugin-pwa`)
- Mobile-first responsive reader UI using Tailwind CSS + daisyUI components
- Drawer-based library sidebar with search and badges
- Theme switching with persistence (`retro`, `night`, `cupcake`)
- GitHub-backed library: lists `*.pdf` files from a repo path and opens via raw URL

## Configure your GitHub library
Set these environment variables in a `.env` file at the project root, or configure at runtime via `localStorage`.

Environment variables:
- `VITE_GH_OWNER` — GitHub user/organization (e.g., `my-user`)
- `VITE_GH_REPO` — Repository name (e.g., `my-books`)
- `VITE_GH_BRANCH` — Branch name (default `main`)
- `VITE_GH_PATH` — Path in repo where PDFs live (e.g., `pdfs`)

Runtime override (optional):
- In the browser devtools console, you can set a JSON config saved in `localStorage` under the key `gh_lib_cfg`, for example:
  ```js
  localStorage.setItem('gh_lib_cfg', JSON.stringify({
    owner: 'my-user',
    repo: 'my-books',
    branch: 'main',
    path: 'pdfs'
  }))
  ```

The app uses the GitHub Contents API to list PDFs in `owner/repo` at `path` on `branch`, filtering `*.pdf`. Each item opens using its raw download URL.

## Quickstart
1. Install deps
   ```powershell
   npm install
   ```
2. Configure your GitHub repo via `.env` (see above)
3. Dev server
   ```powershell
   npm run dev
   ```
4. Build + preview (tests PWA service worker)
   ```powershell
   npm run build
   npm run preview
   ```

## Notes
- The built-in PDF viewer uses the browser’s native PDF rendering via an `iframe` pointing to the raw file URL.
- For advanced features (bookmarks, annotations), consider integrating PDF.js later.
- There is no upload in-app; add PDFs directly to your repository folder and click Refresh in the app.

## Tech
- Vite + React (SWC)
- Tailwind CSS v4 + daisyUI
- `vite-plugin-pwa`

