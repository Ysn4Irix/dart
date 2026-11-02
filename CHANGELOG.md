# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
