# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.13.4] - 2026-11-04

### Removed
- **"Served directly from Telegram Storage" Label:** Removed the subtitle text from the header branding on the public download file page (`<PublicSharePage>`) and the server fallback view (`shares.ts`) for a cleaner, privacy-focused download presentation.

## [0.13.3] - 2026-11-03

### Removed
- **"Open in Telegram" Download Page Action:** Removed the "Open in Telegram" / "View in Telegram" button and associated deep links from both the client SPA download page (`<PublicSharePage>`) and the standalone server-rendered HTML fallback in `shares.ts`. The primary "Download File" action is now cleanly centered and prioritized.

## [0.13.2] - 2026-11-03

### Fixed
- **Modal Layering & Stacking Hierarchy (ShareModal over PreviewModal):** Fixed an issue where clicking the "Share" action inside `<PreviewModal>` opened the `<ShareModal>` backwards (underneath the preview). Elevated `<ShareModal>` to `z-[60]` with dedicated DOM reordering in `<App>`, backdrop dismissal, and capture-phase Escape key handling that closes the share dialog without dismissing the active file preview.
- **Global Dialog & Toast Stacking Integrity:** Adjusted `<DialogContext>` confirm/prompt dialogs to `z-[70]` and `<ToastContext>` notifications to `z-[80]`, ensuring prompt/confirm dialogs and toast alerts are never occluded by full-screen file previewers or sub-modals.

## [0.13.1] - 2026-11-03

### Fixed
- **Public URL HTML Download Page Routing:** Resolved an issue where accessing a public share link (`/s/:slug`) in a web browser returned raw JSON metadata instead of the download page. Browser requests are now properly served the interactive frontend download page (`index.html` loading `<PublicSharePage>`), with a clean server-side HTML fallback when running without built assets. Dedicated JSON metadata remains available at `GET /api/shares/:slug` and for programmatic requests with `Accept: application/json`.
- **Dynamic Public URL Host Resolution:** Derived the default public URL in `POST /api/shares` dynamically from incoming request protocol and host headers when `PUBLIC_URL` is not set in the environment, ensuring correct links when deployed behind proxies or on custom ports.
- **Public Share Test Suite (`server/test/shares.test.ts`):** Added automated unit test coverage verifying HTML download page delivery for browser requests, JSON metadata responses for API callers, and 404/410 handling.

## [0.13.0] - 2026-11-02

### Added
- **Content-Aware File Loading Skeletons:** Implemented responsive animated shimmer card and row skeleton states for grid and list view modes in `<FileGrid>`, preventing the empty-storage card ("No files displayed yet") from flashing while drive contents are loading.
- **Graceful Toast Notification System (`ToastContext`):** Introduced a non-intrusive, accessible toast notification manager supporting `success`, `error`, `info`, and `warning` notifications with auto-dismiss timers, pause-on-hover, custom actions, and smooth slide/fade animations adhering strictly to clean card styling without decorative badges.
- **React Runtime Error Boundary (`ErrorBoundary`):** Added a top-level error boundary capturing unexpected React rendering exceptions, presenting a branded recovery interface with diagnostic stack details, "Reload Application", "Return to Home", and "Copy Diagnostics" capabilities.
- **Custom 404 Not Found Page (`NotFoundPage`):** Created a branded Dart 404 error page for unmatched URLs or non-existent assets with theme-toggle support and instant navigation back to the dashboard.
- **Enhanced Public Share Error View:** Replaced generic alert cards on `/s/:slug` with an informative branded inactive share view distinguishing between expired links, missing files, and revoked access.

### Changed
- **Replaced Disruptive Modal Alerts:** Migrated file and folder operational feedback (creations, deletions, moves, uploads, syncs, copy link) from blocking modal alerts to graceful toast notifications while preserving `dialog.confirm` for destructive operations.

## [0.12.0] - 2026-11-02

### Added
- **Responsive Files Pagination:** Added fluid pagination to the file explorer with a grid-aligned default of 24 items per page (cleanly divisible across 1, 2, 3, 4, and 6 columns), customizable page size selector (`12`, `24`, `48`, `96`, `All`), smooth scroll restoration to top of list, item range indicator (`Showing 1–24 of 142 files`), and dynamic numbered pagination controls with ellipsis truncation.
- **Backend Pagination & Count:** Extended `fileRepo.list()` and `fileRepo.count()` in `server/src/db/index.ts` with optional `limit` and `offset` support, and updated `GET /api/files` to return pagination metadata `{ files, total, limit, offset, page, pageSize, totalPages }` while maintaining full backward compatibility.
- **Files Pagination Test Suite (`server/test/files.test.ts`):** Added unit test coverage for `fileRepo.count()`, offset/limit pagination retrieval across distinct batches, and paginated keyword search.

### Changed
- **Optimized Theme Switching Performance:** Eliminated theme-toggle flash, lag, and style recalculation stutter by using hardware-accelerated native View Transitions (`document.startViewTransition`) on supporting browsers and immediate synchronous DOM attribute updates (`data-theme`, `classList`), backed by a coordinated 200ms cubic-bezier transition fallback (`.theme-transition`).
- **Cleaned Up Obsolete Authentication Components:** Removed deprecated `SetupScreen.tsx` to eliminate redundant master setup code and avoid confusion with unified account creation.

## [0.11.2] - 2026-11-02

### Changed
- **Default to Sign In View:** Set the Sign In page (`initialMode="login"`) as the unconditional default view on application launch. Users can smoothly switch to account creation via *"Don't have an account? Create an account"*.

## [0.11.1] - 2026-11-02

### Fixed
- **Unified Authentication & Sign-Up Flow:** Removed duplicate "Set up master account" action on `<LoginScreen>`. The sign-up flow and master account creation are unified into a single streamlined screen that automatically opens in registration mode on first launch (`needsSetup`) or login mode on subsequent visits, with a single intuitive switcher between *"Don't have an account? Create an account"* and *"Already have an account? Sign in"*.

## [0.11.0] - 2026-11-02

### Added
- **Multi-User Registration Endpoint (`POST /api/auth/register`):** Added backend registration allowing multiple independent user accounts to register with username validation (3-30 characters, alphanumeric/dashes/underscores) and case-insensitive uniqueness checks.
- **Interactive Login & Registration Mode Switcher (`<LoginScreen>`):** Enhanced the login gate with a seamless mode switcher between "Sign In" (for existing accounts) and "Create Account" (for new users). Includes password confirmation and unrecoverable credentials acknowledgment.
- **Setup-to-Login Navigation Flow (`<SetupScreen>` & `<App>`):** Added an "Already have an account? Sign in" shortcut on the initial setup screen, enabling users with pre-existing database accounts or re-deployments to bypass setup and authenticate immediately.
- **Multi-User Authentication Suite (`server/test/auth.test.ts`):** Added comprehensive unit test suite verifying multi-user creation, case-insensitive username retrieval, distinct password verification, and session lifecycle isolation.

## [0.10.6] - 2026-11-02

### Fixed
- **Host Port Mapping Conflict Resolution:** Updated `docker-compose.yml` to map to `${HOST_PORT:-4001}:4000` instead of hardcoding `4000:4000`. Prevents Docker daemon bind errors (`0.0.0.0:4000 port is already allocated`) when the host machine has an existing service or development process occupying port 4000.

## [0.10.5] - 2026-11-02

### Fixed
- **pnpm v11 `allowBuilds` Support:** Configured the `allowBuilds` map in `pnpm-workspace.yaml` (`esbuild: true`, `bufferutil: false`, `utf-8-validate: false`, `es5-ext: false`). pnpm v11 deprecated legacy `onlyBuiltDependencies` and `ignoredBuiltDependencies`, requiring explicit boolean mapping in `allowBuilds` to authorize required build scripts (`esbuild`) while blocking optional native bindings without throwing `ERR_PNPM_IGNORED_BUILDS`.

## [0.10.4] - 2026-11-02

### Fixed
- **Docker Production Install Lifecycle Scripts:** Added `ignoredBuiltDependencies` for optional WebSocket native bindings (`bufferutil`, `utf-8-validate`, `es5-ext`) in `pnpm-workspace.yaml`, and passed `--ignore-scripts` to `pnpm --filter dart-server install --prod` in `Dockerfile`. Resolves `ERR_PNPM_IGNORED_BUILDS` during Docker container builds in pnpm v10+.

## [0.10.3] - 2026-11-02

### Fixed
- **Node.js 22 LTS in GitHub Actions Workflows:** Upgraded `node-version` from `20` to `22` in both `.github/workflows/ci.yml` and `.github/workflows/release.yml`. Node.js 22+ is required for the native `node:sqlite` (`DatabaseSync`) module introduced in Node v22.5.0.
- **Database Self-Initialization on Connection:** Added automatic `initDatabase()` invocation inside `getDatabase()` in `server/src/db/index.ts`. Guarantees all SQLite tables exist immediately when repositories or test suites run in clean environments without needing an explicit application bootstrap.

## [0.10.2] - 2026-11-02

### Removed
- **Dokploy Specific Documentation:** Removed Dokploy 1-Click setup instructions from `README.md` and deleted `docs/dokploy.md`, retaining streamlined standard Docker Compose deployment documentation.

## [0.10.1] - 2026-11-02

### Fixed
- **CI Test Runner File Pattern:** Updated the test command in `server/package.json` to `"test": "tsx --test --test-concurrency=1 test/*.test.ts"`. Resolves `Could not find 'test/**/*.test.ts'` errors under POSIX environments (e.g., GitHub Actions Ubuntu runner `/bin/sh`) where recursive globbing without matching subdirectories leaves literal patterns unexpanded.
- **SQLite Concurrency Busy Timeout:** Added `sqlite.exec('PRAGMA busy_timeout = 5000;')` in `server/src/db/index.ts` alongside `--test-concurrency=1` to guarantee graceful lock waiting and prevent transient `Error: database is locked` exceptions during sequential or parallel database calls.

## [0.10.0] - 2026-11-02

### Added
- **Dokploy & Docker Compose Support:** Added first-class support for deploying Dart on Dokploy and standalone Docker Compose via a multi-stage production `Dockerfile` and `docker-compose.yml`.
- **Integrated Production Static Asset Serving:** Integrated `@fastify/static` with client SPA fallback into Fastify core, serving the built frontend and backend API on a single unified port with zero CORS or reverse-proxy buffering friction.
- **Persistent Volume Session Storage:** Automatically saves and restores Telegram MTProto credentials in `DATA_DIR/telegram_session.json` across container recreations, updates, and host reboots.
- **Dokploy Deployment Guide:** Documented comprehensive setup instructions covering Git Compose deployment, domain routing, persistent volume binding, and SSL in [`docs/dokploy.md`](docs/dokploy.md).

## [0.9.2] - 2026-11-02

### Fixed
- **Recent Files Date Filter Reset:** Automatically reset the date range filter back to "All Dates" (`'all'`) when switching away from "Recent Files" (`__recent__`) to "All Files" (`null`) or any custom folder. Prevents past-week filters from inadvertently persisting into the root drive.

## [0.9.1] - 2026-11-02

### Enhanced
- **Responsive Mobile Navigation & Drawer:** Added mobile slide-out drawer navigation for `<Sidebar>` triggered by a hamburger button in `<Header>`, ensuring small-screen users can browse folders and inspect storage statistics without layout overflow.
- **Adaptive Header Layout:** Responsive action button collapse for mobile viewports, shrinking button labels to clear icon targets on narrow viewports while maintaining accessible `aria-label`s.
- **Global Drag-and-Drop File Upload:** Direct file dropping anywhere in the application window brings up a focused drop overlay, seamlessly staging dropped files into `<UploadModal>` for immediate upload.
- **Rapid Keyboard Search (`Cmd+K` / `Ctrl+K`):** Global shortcut instantly focuses the search input from any view; added an inline clear button and escape key binding.
- **Sequential File Carousel & Code Viewer (`<PreviewModal>`):** Added Left/Right file navigation buttons, keyboard arrow navigation (`ArrowLeft` / `ArrowRight`), active file position counter (`File X of Y`), and line-numbered presentation for text/source files.
- **Refined Empty Search Feedback:** Tailored empty search state in `<FileGrid>` explaining zero-match queries with a one-click "Clear Search" button.
- **Accessibility & antislop Compliance:** Applied consistent `focus-visible` emerald rings, WCAG AA contrast adjustments for secondary text, smooth custom scrollbars, and verified complete absence of decorative badges/pills.

## [0.9.0] - 2026-11-02

### Added
- **Multi-File Selection & Bulk Actions:** Comprehensive selection management supporting per-card checkboxes, hover overlays, keyboard range selection (Shift+Click), "Select All" / "Deselect All" toolbar controls, and table header toggles.
- **Floating Bulk Action Bar (`<BulkActionBar>`):** Bottom-anchored action bar displaying the count of selected files, combined byte size, real-time 1 GB ZIP threshold indicator, and one-click actions: "Download ZIP", "Move", "Delete", and "Deselect".
- **Destination Folder Organizer Modal (`<MoveFilesModal>`):** Interactive dialog allowing users to batch relocate files to any folder or back to Root Drive ("All Files"). Features quick "+ New Folder" folder creation directly within the dialog with instant folder selection.
- **Streaming Bulk ZIP Downloader:** Backend streaming endpoint (`GET /api/files/download-zip?ids=...` and `POST /api/files/download-zip`) powered by `archiver` ZipArchive. Downloads multiple Telegram files directly into a consolidated `.zip` archive sequentially on the fly with zero disk consumption, client disconnect cancellation, and automatic filename collision resolution (`file (1).txt`).
- **Batch Atomic Database Operations:** Added `fileRepo.bulkMove`, `fileRepo.bulkDelete`, `fileRepo.getByIds`, and `deletedMessageRepo.bulkAdd` running within atomic SQLite transactions for high performance and integrity.
- **Safety Batch Limit:** Enforced 1 GB maximum batch size protection with client-side warnings and backend HTTP 400 enforcement to prevent network timeouts.
- **Comprehensive Unit Testing:** Added `server/test/bulk.test.ts` verifying bulk retrieval, multi-file atomic moves, root relocations, batch tombstones, and bulk deletions.

## [0.8.2] - 2026-11-02

### Changed
- **Connection Status Label:** Renamed "Telegram Connected" to "Connected" in the navigation bar (`<Header>`) and authorization dialog (`<AuthModal>`).

### Added
- **Immutable & Unrecoverable Account Warning:** Added a clear warning callout on `<SetupScreen>` during master account onboarding, notifying owners that credentials cannot be reset or recovered without physical access to the server database.
- **Setup Acknowledgment Guard:** Added a mandatory confirmation checkbox requiring users to acknowledge the unrecoverable and immutable nature of the account before creating it.

## [0.8.1] - 2026-11-02

### Fixed
- **View File Action Availability:** Removed the overly restrictive media-type gate (`hasPreview` / `isMedia`) in `<FileGrid>` that completely hid the View button for archives, applications, and non-media files. Every non-deleted file now features an explicit "View file" action.
- **Card & Row Direct Click-to-View:** Enabled clicking anywhere on file cards (Grid view) or table rows (List view) to instantly open the file in the viewer, with `stopPropagation` isolated on sub-actions (Download, Share, Delete).
- **Accurate In-Browser Media & Document Rendering:** Enhanced `getFileViewerType` in `<PreviewModal>` to properly detect images (`.jpg`, `.png`, `.gif`, `.webp`, `.svg`), videos (`.mp4`, `.webm`, `.mkv`), audio (`.mp3`, `.wav`, `.ogg`, `.m4a`), PDFs, and code/text (`.ts`, `.js`, `.py`, `.sh`, `.ps1`, `.json`, `.yaml`, `.csv`, `.md`, `.txt`) even when Telegram catalogs them as generic `application/octet-stream`.
- **Dynamic Server MIME Resolution:** Implemented `resolveMimeType()` in `server/src/telegram/streamer.ts` to infer correct `Content-Type` headers from file extensions on streaming and range requests, enabling native browser playback and PDF viewing.
- **Query Param Token Authentication:** Updated `getSessionFromRequest()` to support `?token=` parameter extraction, ensuring inline media players, iframes, and cross-context elements authenticate reliably without cookie race conditions.
- **Media Buffering & Fallback States:** Added buffering spinners and error states to `<PreviewModal>` with direct download fallbacks, keyboard `Escape` closing, and backdrop dismissal.
- **Generic File Overview:** Added structured file metadata inspection with dedicated category icons and direct "Download File" and "Share" actions for binary and archive formats.

## [0.8.0] - 2026-11-02

### Added
- **Custom Dialog System (`useDialog` & `<DialogProvider>`):** Implemented an accessible dialog system completely eliminating native browser `window.alert()`, `window.confirm()`, and `window.prompt()`.
- **Custom Confirm Dialogs:** Styled confirmation modals with destructive/danger variants, clear explanatory copy, and keyboard shortcuts (`Enter` to confirm, `Escape` to cancel) for folder and file deletion.
- **Custom Prompt Dialogs:** Themed modal prompts with auto-focus inputs, inline validation, and Enter-key submission for folder creation.
- **Custom Alert Dialogs:** Non-blocking alert modals for operation failures, error feedback, and system notices with status-specific icons (error, warning, info, success).
- **Zero Decorative Badges:** Preserved strict anti-slop guidelines with clean typography, backdrop blur, and light/dark theme synchronization.

## [0.7.1] - 2026-11-02

### Fixed
- **Permanent Telegram Message Deletion:** `DELETE /api/files/:id` now deletes the underlying message directly from Telegram's Saved Messages (`client.deleteMessages('me', [messageId], { revoke: true })`).
- **Deleted Messages Tombstone Registry:** Added `deleted_messages` SQLite table and repository (`deletedMessageRepo`) to blacklist deleted message IDs, permanently preventing background or manual sync from resurrecting deleted files.
- **Optimistic File Deletion:** Instant UI removal in `<FileGrid>` upon deletion confirmation without waiting for network or sync latency, with automatic cleanup of active preview/share modals.

### Added
- **Text-Based Saved Messages Support:** Ingests and indexes non-media text messages, notes, code snippets, reminders, and links stored in Telegram Saved Messages into standard `.txt` text documents with authentic timestamps and byte sizes.
- **In-Browser Text Streaming & Viewer:** Full range-supported HTTP streaming for text documents and enhanced `<PreviewModal>` displaying scrollable text content with syntax typography, line wrapping, and one-click "Copy Text" action.
- **Modal Delete Action:** Quick delete capability directly from within the media/text preview dialog.

## [0.7.0] - 2026-10-31

### Added
- **Single-Owner Master Account Authentication:** Implemented private cloud storage access control requiring master account sign-in before accessing files, folders, and storage features.
- **First-Time Setup Onboarding Wizard (`<SetupScreen>`):** Automated initial launch setup screen guiding instance owners to configure their master username and master password.
- **Secure Password Hashing:** Node.js native `crypto.scryptSync` with unique 16-byte cryptographically secure salts and 64-byte derived keys with timing-safe comparisons (`timingSafeEqual`) protecting against timing attacks and GPU cracking.
- **HTTP-Only Session Management:** Secure, persistent 30-day session tokens backed by SQLite (`users` and `sessions` tables) with dual extraction via HTTP-only cookie (`dart_session`) and `Authorization: Bearer` headers.
- **Master Account Sign-In Screen (`<LoginScreen>`):** Polished sign-in gate for returning users with error messaging, autofocus, loading states, and full theme synchronization.
- **Global API Auth Guard:** Fastify `preHandler` hook enforcing strict 401 Unauthorized protection on all internal file and drive endpoints while preserving unauthenticated public access for external share links (`/s/:slug`).
- **Header User Identity & Sign Out:** Subtle authenticated username indicator and instant sign-out action in the top navigation bar adhering strictly to anti-slop and no-badge UI guidelines.

## [0.6.0] - 2026-10-30

### Added
- **Light & Dark Theme Engine:** Fully cohesive theme system supporting light mode and dark mode with Tailwind CSS v4 class-based variants (`.dark`).
- **One-Click Theme Toggle:** Added animated Sun / Moon switcher to the top navigation header with persistent storage (`dart_theme`) and system preference auto-detection.
- **Zero-Flash Theme Bootstrapping:** Inlined theme detection in `index.html` ensuring no FOIT (Flash of Incorrect Theme) upon page load or reload.
- **Tailored Light Mode Aesthetics:** Clean stone palette (`stone-50` background, `white` cards, `stone-200` borders, `stone-900` text) designed with crisp readability and zero decorative pill clutter.
- **Full Component Theming:** Synchronized light and dark themes across Header, Sidebar, FileGrid (both Grid and List views), PreviewModal, ShareModal, UploadModal, AuthModal, and PublicSharePage.

## [0.5.0] - 2026-10-30

### Added
- **Authentic Telegram Timestamps:** Synchronizes true Telegram message dates (`message.date * 1000`) across all synced files, backfilling existing files and preserving chronological history.
- **Date Range Filtering Presets:** Added quick date filters for "All Dates", "Last 24 Hours", "Past 7 Days", "Past 30 Days", and "Past Year" with live matching record counts.
- **Recent Files Quick Navigation:** Dedicated "Recent Files" view option in the storage sidebar and breadcrumb bar for instant access to the latest files.
- **Adaptive Timestamp Formatting:** Smart date formatting displaying relative recency ("Today, 10:45 AM", "Yesterday, 3:20 PM", "6d ago") for recent items and standard calendar dates for older items, with exact full timestamps on hover.
- **Compound Filters & Active Filter Controls:** Interactive quick-clear action for active date range filter combined with category selection and query search.

## [0.4.0] - 2026-10-30

### Added
- **Category Filtering Bar:** Instant category filtering across Documents, Images & Videos, Audio, Archives, APKs & Apps, and Code & Keys with live file count badges.
- **Grid and List View Modes:** Toggle between desktop card grid and tabular list view with sortable columns (Name, Date, Size, Type, Actions).
- **Multi-Field Sorting:** Sort by Date (Newest/Oldest), File Name (A-Z/Z-A), or File Size (Largest/Smallest).
- **Refined Display Styling:** Elevated desktop file explorer design with subtle borders, hover-activated actions, type-specific icons, and zero decorative badges per UI rules.

## [0.3.0] - 2026-10-30

### Added
- **Saved Messages Synchronization:** Ingests and indexes pre-existing files, documents, archives, APKs, videos, and photos from Telegram Saved Messages (`'me'`).
- **Sync API & Scanner:** Endpoint `POST /api/files/sync` to scan recent Saved Messages history and map media metadata into SQLite.
- **Auto-Sync & Header Action:** Dedicated "Sync Messages" action in header with animated feedback and automatic one-click import from empty states.
- **Stream Abort Guard:** Protected Vite proxy and Fastify stream against unhandled client disconnect errors during video/audio scrubbing.

## [0.2.0] - 2026-10-30

### Added
- **Brand Identity "Dart":** Rebranded the application across client dashboard, public share portal, and storage captions.
- **5 Arrow Brand Logo Concepts:** Vector SVG brand logos (Precision Dart, Forward Shift, Cloud Piercer, Monogram 'D', and Velocity Flight).
- **Interactive Brand Modal:** Live logo selector allowing real-time switching between all 5 concepts with browser persistence.
- **High-Res Concept Sheet:** Generated high-resolution brand showcase sheet saved to `client/public/dart_brand_logo_sheet.jpg`.

## [0.1.0] - 2026-10-29

### Added
- **MTProto Telegram Core:** Client session manager using GramJS targeting Saved Messages (`'me'`).
- **Zero-Disk Streaming Gateway:** Fastify HTTP 206 Partial Content range stream handler with automatic byte slicing.
- **Embedded Database:** Native `node:sqlite` persistence layer for hierarchical virtual directories, files metadata, and shares.
- **Public Share Links:** Recipient endpoint `/s/:slug` with direct browser streaming, attachment download, and native "Open in Telegram" deep-links.
- **Desktop Web Explorer:** React 19 + Vite + Tailwind CSS v4 file manager with drag-and-drop chunked uploader, folder tree, and inline media previewers.
- **Concurrency & Resilience:** Concurrency limiter for simultaneous streams and automatic `FloodWait` backoff retry.
- **Lazy File Reconciler:** Automatically detects out-of-band deletions inside Telegram and updates file status.
- **CI/CD:** Automated GitHub Actions workflow for typecheck, linting, and build verification.
