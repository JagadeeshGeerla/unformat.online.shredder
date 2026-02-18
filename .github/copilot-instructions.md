# Unformat Shredder — GitHub Copilot Instructions

## Overview
- **Canonical URL:** https://www.unformat.online/shredder (proxied via Vercel rewrite from main site)
- **Purpose:** 100% client-side file metadata remover — strips EXIF/GPS from images, sanitizes PDFs, redacts text logs. No files ever leave the browser.
- **Repo:** `github.com/JagadeeshGeerla/unformat.online.shredder`

## Tech Stack
- Next.js 14.1, App Router, TypeScript, Tailwind CSS (dark theme only)
- framer-motion (stage transitions, LiveLog entry animations)
- `pdf-lib` — PDF metadata stripping
- `exifr` — EXIF/GPS reading from images
- `pako` — zlib compression for PDF processing
- Vitest for testing

## Key Files
- `app/layout.tsx` — metadata, canonical URL, JSON-LD
- `app/page.tsx` — 4-stage UI state machine (idle → inspecting → review → done)
- `lib/file-processing.ts` — core logic: `inspectFile()`, `shredFile()`, `formatBytes()`, `getFileType()`
- `components/drop-zone.tsx` — drag-and-drop file input
- `components/live-log.tsx` — terminal-style log stream
- `components/features.tsx` — feature/how-it-works section

## Supported File Types
- **JPG/PNG:** EXIF stripped via `exifr` + canvas redraw
- **PDF:** metadata dict removed via `pdf-lib`
- **TXT/LOG/JSON:** regex-based PII redaction

## Architecture Constraints
- **Zero server calls** — all processing is client-side in `lib/file-processing.ts`. Do not add API routes, server actions, or external `fetch()` calls.
- **Canonical URL** — always `https://www.unformat.online/shredder` in metadata and OG tags.

## Build
```bash
npm run build   # must pass with 0 TS errors; expect 3 static routes
```

## Do NOT
- Add server-side routes or any fetch to external URLs — defeats the privacy claim
- Restore `legacy_vanilla/` — it was a deleted unused prototype
- Change the canonical URL away from `https://www.unformat.online/shredder`
- Modify `.claude/settings.local.json` — local-only, not in git
