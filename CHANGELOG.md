# Changelog

## 0.1.1 (Astro / BAOBAB)

- Polished BAOBAB Astro footer copy and structure: clearer BAOBAB/BOOKBAT wording, improved line grouping, and cleaner section flow
- Added version tags next to both footer brand names and removed the redundant standalone version row
- Added/positioned gray divider and moved BAOBAB-specific `data/library.json` usage guidance into the BAOBAB section
- Clarified footer attribution and links (`baobab.junglestar.org`, `junglestar.org`, repo, license)
- Correction release: reverted accidental `0.8.3` version bump on BOOKBAT webapp/root back to `0.8.1`

## 0.8.1

- Added per-status totals directly to all Library filter tabs (`All`, `To Read`, `Reading`, `Read`)
- Simplified tab count display by removing square brackets from labels (`All 56` style)
- Removed malformed tracked filename `Icon\r` that caused broken/404 row behavior in GitHub repo view; added ignore protection for Finder `Icon*` artifacts

## 0.8.0

- Library sort UX upgrade in webapp: added Publisher sort support and refactored sorting into field + global direction toggle (`↑/↓`) instead of verbose per-option A/Z labels
- Astro client sort parity: added Publisher sort support, then moved to field + direction toggle model to match the main app behavior
- Fixed Library sort dropdown readability: content-based dropdown width + no-wrap options to prevent multi-line split labels
- Enlarged Book Details cover presentation to full-width hero style at top of detail card, with metadata/actions stacked below
- Improved large-screen background/frame behavior: frame now activates at the same breakpoint where nav shifts to top, and frame body uses 75% alpha for controlled see-through effect
- Fixed large-screen layout/flex overflow causing hidden footer and oversized empty vertical space (notably in relaxed Scan view)
- Consolidated conflicting `@media (min-width: 640px)` frame/nav rules into a single source of truth and removed obsolete/dead rules
- Fixed startup splashscreen viewport coverage across aspect ratios by forcing full-screen cover behavior, preventing lime background bleed at screen edges
- Footer/readability refinements: black footer card, increased top spacing, and brighter secondary text for improved contrast
- Typography cleanup: enforced minimum 14px text, raised key meta/help copy to 15px, normalized odd 15.84px values, and removed unused muted-overlay tokens
- Header controls UX polish: moved title count into `All [N]` tab and removed standalone count pill above search
- Unified CTA/button language and shape: uppercase button text and consistent corner radius treatment across controls
- Fixed small browser-default button text fallback (`13.333px`) by setting explicit button typography and separating text-button vs icon-button sizing in library header actions
- Export help improvements: clarified Google Sheets setup wording (web version, no browser extension needed), added top-right `Copy code` button with `Copied` state for Apps Script snippet
- Google Sheets push feedback hardening: added inline sending/success/error status messaging in UI (not only toast/confirm dialog)
- Webhook/export reliability and diagnostics: improved Apps Script URL validation/normalization (accept bare deployment URLs, normalize to `/exec`, reject `/dev`), added targeted network failure guidance for `Failed to fetch`, and reduced preflight/CORS issues by using simple POST payload request
- Ran full preflight gates from workspace root with passing results: `pnpm format`, `pnpm lint`, `pnpm test`, `pnpm build`

## 0.7.4

- Moved the Astro export panel out of the book grid into its own standalone section below the list
- Kept export layout responsive: full-width on mobile, centered at mobile-like width on larger screens
- Styled export wrapper as a separate black card with gap spacing to match footer-level visual separation

## 0.7.3

- Added Firefox-specific scanner fallback by disabling native `BarcodeDetector` usage in `Scanner.svelte` when Firefox is detected

## 0.7.2

- Added BAOBAB Astro display component configuration defaults in `apps/astro-site/src/config/bookbat-client.config.ts` with toggles for header/footer, export feature/options, load placeholder, and unstyled mode
- Added page-level preview controls in `apps/astro-site/src/pages/index.astro` to simulate component rendering states from the frontend while keeping source-of-truth config in the page
- Refined Astro display structure and presentation: updated index title, moved footer outside the inner body section, and moved background rendering from `.bfc` to `.bfc_body`
- Re-ran preflight gates from workspace root (`pnpm format`, `pnpm lint`, `pnpm test`, `pnpm build`) with passing results

## 0.7.1

- Renamed workspace package identifiers from `@books-freedom/*` to `@bookbat/*` and updated related imports/scripts/docs
- Renamed active localStorage/service-worker key namespaces to `bookbat*` while preserving migration from legacy `books-freedom*` keys
- Updated README hero image to `apps/webapp/src/assets/startscreen.svg`

## 0.7.0

- Updated app footer open-source repo link to `https://github.com/junglesta/bookbat`
- Updated local git remote `origin` to the renamed `bookbat` repository URL
- Removed unused legacy asset `apps/webapp/src/assets/header-logo.svg`

## 0.6.0

- Rebranded in-app/PWA surfaces to `BOOK BAT` and made the footer brand clickable to reopen the startup splash
- Introduced `startscreen.svg` startup flow while keeping `readme.svg` behind `HELP`; startup/help/share overlays now use persistent tap-to-close behavior without timer and removed the close-circle on help/share
- Updated canonical/share URL usage in the webapp to `https://bat.junglestar.org/` and kept startup splash scrollable for larger artwork
- Re-ran preflight gates (format, lint, test, build) from workspace root with passing results

## 0.5.5

- Prefixed export filenames with current date in `YYMMDD` format and kept `<library-name>-<title-count>` suffix (example: `261225-next-xmas-book-gifts-99.json`)
- Tightened global page/app spacing and viewport sizing to reduce unnecessary first-paint scrolling and keep footer actions visible on mobile
- Re-ran preflight gates (format, lint, test, build) from workspace root with passing results

## 0.5.4

- Updated export filenames to include current library title count (for example `MyBooks-55.json`)
- Reduced global app-shell vertical padding/height pressure so footer actions are visible on first paint across views without unnecessary scroll
- Re-ran preflight gates (format, lint, test, build) from workspace root with passing results

## 0.5.3

- Fixed scanner helper overlay shape on mobile by replacing unstable library-drawn guide visuals with app-controlled viewfinder overlay rendering
- Made scan box sizing responsive to real viewfinder dimensions so the helper frame keeps consistent proportions across devices
- Re-ran preflight gates (format, lint, test, build) from workspace root with passing results

## 0.5.2

- Fixed Netlify publish target mismatch by restoring root `netlify.toml` with `publish = "dist/webapp"`
- Rebuilt production bundle after version bump so generated app footer/title metadata align with `v0.5.x`
- Re-ran preflight gates (format, lint, test, build) from workspace root with passing results

## 0.5.1

- Synced `pnpm-lock.yaml` to workspace package layout to satisfy CI/Netlify `--frozen-lockfile` installs
- Verified monorepo webapp preflight gates (format, lint, test, build) all pass from workspace root

## 0.5.0

- Migrated repository to workspace monorepo layout (`apps/webapp`, `apps/astro-site`, `packages/library-core`)
- Added initial Astro `BOOK FREEDDOM CLIENT` list component scaffold with search/sort/details plus thumbnail service-worker caching
- Introduced canonical drop-in dataset flow via `data/library.json` with sync/apply scripts (`data:sync`, `data:apply`, dummy dataset support)
- Added webapp first-load seeding from `/library.json` for easier local bootstrap from drop-in data
- Added local HTTPS/LAN development support with generated certs and `dev:webapp:https` workflow
- Removed legacy Docker/container files and stale build/cache artifacts during cleanup; unified webapp build output to `dist/webapp`

## 0.4.9

- Hid the compact library card when a title is expanded, so only the inline detail panel is shown for the selected book
- Kept lint/test/build preflight checks green after the library row rendering adjustment

## 0.4.8

- Moved single-title details rendering inline under the selected library card row instead of using a detached bottom popover
- Added guarded in-view scrolling when opening details so the expanded item stays visible in long lists
- Updated book detail `Save` action to remain disabled/dimmed until a real field or star-rating change is made

## 0.4.7

- Simplified cover loading flow: always show placeholder while image is loading
- Persist successful fallback cover URL back to `book.coverUrl` so future renders try the known-good source first
- Aligned service-worker cache policy helpers/tests with runtime behavior for approved cross-origin cover hosts

## 0.4.6

- Increased footer branding/attribution text size by another 10% for better readability
- Added app-managed cover image caching in the service worker for supported external cover hosts
- Wired library drop to clear the dedicated cover cache (`CLEAR_COVER_CACHE`) so cached covers are purged with the library

## 0.4.5

- Improved HELP splash behavior across aspect ratios by enabling full-screen vertical scrolling of `readme.svg` with hidden scrollbars
- Added visible top-right circular `X` close control for HELP and SHARE splash overlays
- Updated canonical/share URL usage to `https://bat.junglestar.org/` in app metadata, share splash text, and README logo link
- Refined splash close interactions to avoid accidental close while scrolling help content

## 0.4.4

- Reworked splash UX to use the new `readme.svg` splash screen artwork
- Added footer action buttons (`HELP` and `SHARE`) with larger outlined limegreen tap targets
- `HELP` now opens splash help overlay and closes on click
- `SHARE` now opens a dedicated splash overlay with centered QR code and closes on click
- Removed splash version badge overlay from the splash screen
- Added app meta title version binding (`Books Freedom v<version>`) from `package.json`
- Updated local skill registry and preflight workflow wiring (`preflight` script + step list alignment)

## 0.4.3

- Completed full preflight routine: format, lint, test, build (all passing)
- Refined Scan/Add layout behavior to remove dead vertical space and keep sections top-aligned across viewport sizes
- Improved scanner stop/reset reliability on desktop by forcing clean scanner viewport remount
- Made Export subtitle library name clickable to navigate directly to Library view
- Hardened cover rendering with fallback candidates and persistent placeholder behavior when no real cover exists
- Replaced emoji placeholders with the Library nav icon in lime accent for visual consistency

## 0.4.2

- Removed top logo-heavy branding from app layout; added subtle text footer with version and project attribution links
- Added scan-title info accordion explaining ISBN purpose and usage
- Refined library header UX: moved count to second row with actions, restored `titles` suffix, improved icon/row alignment
- Improved import cover handling by normalizing multiple cover fields and converting legacy URL forms to usable `https` cover URLs
- Polished export and footer details (button text/icons/link styling) and aligned tests to current labels

## 0.4.1

- Refined Scan page visual balance and spacing between action sections for cleaner vertical rhythm
- Aligned Scan and manual-entry heading treatment for consistent hierarchy
- Updated scanner entry/button alignment: camera button now fit-content and centered, manual ISBN action rows use clearer input/button grid alignment

## 0.4.0

- Applied CSS convention skill across app UI: migrated class naming to `snake_case` in Svelte markup, class directives, selector strings, and global stylesheet selectors
- Updated dynamic status badge class binding in book cards to explicit `snake_case` mappings
- Verified convention refactor with full format/lint/test/build preflight

## 0.3.13

- Unified confirmation and error/feedback UX using branded in-app `<details>` panels (drop library, remove book, export push confirmation)
- Refactored scan/manual ISBN feedback to RBAND-style inline notes (camera errors, invalid ISBN checksum, lookup errors)
- Hardened import feedback: unsupported or invalid import files now show in-app RBAND import errors; added parser validation for empty/invalid JSON/CSV
- Export format titles now use limegreen brand accent for clearer visual hierarchy
- Removed unused `ConfirmDialog` component after migrating to inline detail-based confirmations

## 0.3.12

- Fixed "Scan Another" flow by resetting scanner instance deterministically
- Added library append import for JSON/CSV (and `.css` CSV fallback) with dedupe + import summary feedback
- Preserved `coverUrl` and related metadata during JSON import so cover previews survive import
- Added "Drop" action to clear entire library
- Replaced browser delete confirms with in-app confirmation dialogs (book remove + drop library)
- Improved Library header count UX (`N titles` badge instead of unlabeled number)

## 0.3.11

- Added page-level UI tests (Scan, Export, Library) with Testing Library + jsdom setup
- Replaced runtime `any` error handling with typed/centralized error parsing helper
- Hardened ISBN lookup network handling with request timeout + safer JSON parsing
- Fixed Goodreads export date formatting for invalid dates (now blank instead of invalid date tokens)

## 0.3.10

- Export hardening: neutralize spreadsheet formula-like cells in CSV/TSV exports
- Added export tests for formula-injection regression coverage
- Skills overhaul: updated all project skills from old Astro/server assumptions to Svelte + Vite static workflow
- Updated preflight skill and executed preflight checks (format/lint/test/build passed; preview blocked by sandbox port restriction)
## 0.3.9

- now using codex
- Repo Consistency Cleanup (P3): 
- Resolve duplicate PWA artifacts and keep one canonical manifest/sw.
- Standardize localStorage key namespace (books-freedom vs sokola_*), with migration.
- Files: `src/client/manifest.json`, `src/client/public/manifest.json`,`src/client/sw.js`, `src/client/public/sw.js`, `storage.ts`, `stores.svelte.ts`, `ExportPage.svelte`


## 0.3.8

- till now used claudecode 
- Fixed leftover viewfinder overlay after scan (cleanup library DOM after Svelte re-render)
- Added Vitest unit tests (storage, export, isbn-lookup) — 41 tests
- Added Biome linter/formatter (v2.4.4)
- Biome auto-fix: template literals, parseInt radix, import ordering
- New scripts: test, test:watch, lint, format

## 0.3.7

- Fixed frozen UI on stop/scan: force-kill video tracks directly via MediaStream API
- Sync stopScanner for instant UI update (no await blocking)
- Deferred stop in decode callback to avoid library re-entrancy freeze

## 0.3.6

- Fixed camera not starting (reverted inner div approach that caused zero-size container)
- Set isScanning early so container has proper dimensions before library renders
- Removed innerHTML clearing — library clear() + Svelte reactivity handle cleanup
- "Try Again" button on failed ISBN lookup (from 0.3.5)

## 0.3.5

- Fixed stuck UI after failed ISBN lookup (scanner DOM separated from Svelte DOM)
- "Try Again" button shown when book lookup fails
- Scanner viewfinder improved (250x150 aspect ratio)

## 0.3.4

- Improved scanner viewfinder aspect ratio (250x150, easier to aim)

## 0.3.3

- Camera auto-stops after successful barcode scan
- Fixed Stop Camera button not working on desktop
- Simplified scanner cleanup (bulletproof stop/clear/innerHTML fallback)

## 0.3.2

- Fixed barcode scanner: was scanning QR codes instead of EAN-13 barcodes (wrong format enum)
- Added EAN-8 and UPC-A barcode format support
- Fixed scanner DOM swap destroying camera video feed
- Added Permissions-Policy camera header to netlify.toml
- Version number shown on splash screen

## 0.3.1

- Removed seed data — new users start with empty library
- Header logo shown on all pages (removed library-page hide)
- Consistent header spacing across all views

## 0.3.0

- Client-only architecture: removed Hono server, all logic runs in browser
- localStorage persistence (no server, no cloud, no tracking)
- Client-side ISBN lookup (Open Library + Google Books, direct CORS)
- Client-side export generation (JSON, CSV, Goodreads, LibraryThing) via Blob download
- Custom SVG splash screen artwork with dithered noise gradient background
- Custom SVG favicon (BF monogram)
- Header logo: "BOOK FREEDOM" line logo (stroke-only text with echo effect)
- Splash popover restored on both mobile and desktop (nav brand clickable)
- Manual language field in book detail editor
- Inline export feedback (spinner + "wait..." on card click)
- Fixed Svelte 5 `state_referenced_locally` warnings in BookDetail
- Fixed splash popover animation override
- Removed server dependencies (hono, uuid, concurrently)
- a11y: keyboard event handlers on all interactive elements
- README updated: new logo, "no account, no cloud, no tracking" quote, removed docker/server refs

## 0.2.1

- Rebrand app name from "sokola" to "BOOKS FREEDOM"
- New open book icon (replaces crosshair/book combo)
- Brand layout: BOOKS [icon] FREEDOM in one row (stacked on splash)
- Desktop frame: limegreen border with rounded corners at 1235px+, centered x/y
- Desktop scroll contained inside frame with hidden scrollbar
- Sticky nav inside desktop frame (no longer escapes container)
- GitHub repo renamed from bukuku to books-freedom
- Package name updated to books-freedom
- Export page: split subtitle and heading into separate elements
- Netlify deploy config (netlify.toml)
- README.md and LICENSE (CC BY-SA 4.0)
- PWA updated: manifest, service worker, canonical URL (bat.junglestar.org)
- Dithered noise background on desktop (SVG feTurbulence filter)

## 0.1.0

Initial release.

- ISBN barcode scanning via camera (html5-qrcode, EAN-13)
- Manual ISBN-13/ISBN-10 entry with auto-formatting
- Book lookup via Open Library + Google Books fallback
- Library view with search, status filters, sort, language filter
- Book detail editor (rating, status, notes, tags)
- Export: JSON, CSV, Goodreads CSV, LibraryThing TSV, Google Sheets webhook
- PWA installable (manifest, service worker, icons)
- HTTPS with self-signed certs for LAN camera access
- Dark theme, lime green accent, monospace font
- Responsive: bottom nav on mobile, top nav on desktop
- Docker multi-stage build with data volume
- ISBN lookup falls back to Google Books for language when OpenLibrary omits it
