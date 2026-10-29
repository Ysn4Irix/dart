# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
