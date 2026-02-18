# Unformat Shredder — Project Spec (AI Agent Context)

## Overview
- **Canonical URL:** https://www.unformat.online/shredder
  - This is served via Vercel rewrite proxy from the main site. The actual Vercel deployment URL is different — always use the canonical URL in metadata.
- **Purpose:** 100% client-side file metadata remover. Strips EXIF/GPS from images, sanitizes PDFs, redacts text logs. No files ever leave the browser.
- **Repo:** `github.com/JagadeeshGeerla/unformat.online.shredder`
- **Related:** Main site at `github.com/JagadeeshGeerla/unformat.online`

## Tech Stack
- **Framework:** Next.js 14.1, App Router, TypeScript
- **Styling:** Tailwind CSS (dark theme only, `bg-neutral-950`)
- **Animation:** framer-motion (LiveLog entries, AnimatePresence stage transitions)
- **File processing libs:** `pdf-lib` (PDF manipulation), `exifr` (EXIF reading), `pako` (zlib compression)
- **Testing:** Vitest (`lib/file-processing.test.ts`, `app/page.test.tsx`)

## File Map

```
app/
  layout.tsx          Root layout — metadata, canonical URL, JSON-LD structured data
  page.tsx            Main UI — 4-stage state machine (idle→inspecting→review→done)
  globals.css         Tailwind directives + scrollbar utilities
  robots.ts           Typed robots config (MetadataRoute.Robots)

components/
  drop-zone.tsx       Drag-and-drop file input component
  live-log.tsx        Terminal-style log stream (framer-motion entry animations)
  features.tsx        "How it works" / feature cards section

lib/
  file-processing.ts  Core logic: inspectFile(), shredFile(), formatBytes(), getFileType()
                      Supported types: jpg/png (exifr), pdf (pdf-lib), txt/log/json (text redaction)

sample/               Sample test files (pdf, log, json) — do not delete
scripts/              generate-pdf.mjs — dev utility for creating test PDFs
```

## Application Flow (page.tsx)

4 stages managed by `stage` state:
1. **idle** — shows `<DropZone>` for file selection
2. **inspecting** — calls `inspectFile()`, shows spinner
3. **review** — shows metadata list with risk levels (high/medium/low), "SHRED METADATA" button
4. **done** — shows download link for cleaned file

`<LiveLog>` terminal is always visible below the main card, streams logs from all stages.

## Key Architecture Constraints

- **Zero server calls** — all processing in `lib/file-processing.ts` runs in the browser. Do not add API routes, server actions, or `fetch()` calls to external services. This is the core privacy claim.
- **Canonical URL** — metadata, OG, and canonical must always reference `https://www.unformat.online/shredder`, not the raw Vercel deployment URL.

## Supported File Types (lib/file-processing.ts)

| Type | Detection | EXIF/Metadata removed via |
|------|-----------|---------------------------|
| JPG/PNG | mime type | `exifr` read + canvas redraw |
| PDF | mime type | `pdf-lib` — strip metadata dict |
| TXT/LOG/JSON | extension | Regex-based PII redaction |

## Build & Deploy

```bash
npm run build   # in project root
```
- Must pass with 0 TypeScript errors.
- Expected routes: 3 (`/`, `/_not-found`, `/robots.txt` — all static).
- Vercel deploys on push to `main`.

## Do NOT

- Add server-side routes, API routes, or any `fetch()` to external URLs — defeats the privacy guarantee.
- Restore `legacy_vanilla/` folder — it was a deleted prototype, not used.
- Change the canonical/OG URL away from `https://www.unformat.online/shredder`.
- Modify `.claude/settings.local.json` — local-only, not in git.
