# Telegram Drive Storage - Implementation Plan

## Overview
Transform Telegram's "Saved Messages" into an organized, private cloud storage system with desktop-grade web explorer and hybrid sharing capabilities (public streaming links + Telegram deep-links).

---

## Architecture Summary
- **Backend:** Node.js (TypeScript) + Fastify
- **Telegram Client:** GramJS (MTProto user session directly accessing `InputPeerSelf` / Saved Messages)
- **Database:** Embedded SQLite via native `node:sqlite` for virtual folders, file metadata, and share tokens
- **Frontend:** React + Vite + Tailwind CSS (File explorer UI with drag-and-drop, search, and previews)
- **Sharing Engine:** HTTP 206 Partial Content streaming proxy for non-Telegram users + Telegram deep-links

---

## Implementation Status
- [x] **Task 1: Scaffold Monorepo / Project Structure**
  - Initialized monorepo with `server/` (Fastify + TypeScript) and `client/` (React + Vite + Tailwind CSS v4).
- [x] **Task 2: Telegram MTProto Authentication & Session Handler**
  - GramJS client session manager, phone code login flow, and session persistence in `.env`.
- [x] **Task 3: SQLite Database & Virtual Filesystem Schema**
  - Native `node:sqlite` repository for folders, files, and shares with foreign key enforcement and WAL mode.
- [x] **Task 4: Stream Concurrency & FloodWait Limiter**
  - Concurrency limiting queue and automatic exponential backoff for Telegram `FloodWait`.
- [x] **Task 5: Chunked Upload Pipeline**
  - Fastify multipart uploader streaming files directly to Telegram Saved Messages (`'me'`).
- [x] **Task 6: HTTP 206 Streaming Proxy (Zero Disk Buffer)**
  - Byte-range parser and chunk iterator streaming directly to HTTP client with lazy out-of-band deletion detection.
- [x] **Task 7: Desktop Web Explorer UI**
  - Google Drive style dashboard with folder navigation, file grid, search, and drag-and-drop uploader.
- [x] **Task 8: Share Modal & Public Recipient Page**
  - Share link generator and recipient landing page (`/s/:slug`) with inline streaming and Telegram deep-link.
- [x] **Task 9: CI/CD Workflow & Documentation**
  - GitHub Actions CI workflow, `.env.example`, `README.md`, and `CHANGELOG.md`.
