# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
