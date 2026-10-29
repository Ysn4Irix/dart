# TG-Drive: Telegram File Storage System

> Transform Telegram's "Saved Messages" into an organized, high-performance personal cloud storage system with a desktop-grade web explorer, chunked streaming, and hybrid sharing links.

---

## Features

- **Direct MTProto Connection:** Uses GramJS to interact directly with Telegram's client API, enabling support for files up to 2GB (or 4GB with Telegram Premium) stored directly in your private "Saved Messages".
- **Zero Disk Overhead Streaming Proxy:** Streams files on-the-fly to non-Telegram users with HTTP 206 Partial Content range requests. Recipients can seek audio/video without your server caching whole files to disk.
- **Hybrid Sharing Links:** Generate public share links (`/s/:slug`) that allow any web browser to stream or download, alongside a native "Open in Telegram" deep-link for instant app-to-app access.
- **Virtual Hierarchical Filesystem:** Nested folders, search, and file management powered by a lightweight, embedded SQLite database (`drive.db`).
- **Resilient Concurrency & Lazy Deletion:** Built-in concurrency queue with automatic Telegram `FloodWait` backoff retry, plus automatic lazy reconciliation if files are deleted from within the Telegram app.
- **Desktop-Grade Web Explorer:** Clean, responsive UI with virtualized file lists, folder navigation, drag-and-drop chunked uploads, and media previewers.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Frontend                        │
│   React 19 + Vite + Tailwind CSS v4 (Web File Manager)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / Streaming (HTTP 206)
┌──────────────────────────────▼──────────────────────────────┐
│                    Fastify / Node.js Core                   │
│                                                             │
│  ┌────────────────────┐  ┌───────────────────────────────┐  │
│  │   Auth & Session   │  │       Virtual Filesystem      │  │
│  │   (Telegram Login) │  │       (Embedded SQLite)       │  │
│  └────────────────────┘  └───────────────────────────────┘  │
│  ┌────────────────────┐  ┌───────────────────────────────┐  │
│  │  Streaming Gateway │  │      Share Link Service       │  │
│  │ (HTTP 206 Partial) │  │  (Public tokens & Deep-links) │  │
│  └─────────┬──────────┘  └───────────────────────────────┘  │
└────────────┼────────────────────────────────────────────────┘
             │ MTProto Protocol (Chunked TCP/WS)
┌────────────▼────────────────────────────────────────────────┐
│               Telegram Cloud Storage (MTProto)              │
│               Peer: InputPeerSelf ("Saved Messages")        │
└─────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js (v20+ or v24 LTS)
- pnpm (v10 or v11)
- Telegram `API ID` and `API Hash` from [my.telegram.org](https://my.telegram.org)

### Installation

1. Clone this repository and install dependencies:
   ```bash
   pnpm install
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Configure your Telegram credentials in `.env` (or use the web setup wizard on first run):
   ```ini
   PORT=4000
   PUBLIC_URL=http://localhost:3000
   TELEGRAM_API_ID=1234567
   TELEGRAM_API_HASH=your_api_hash_here
   ```

### Running the Application

- **Development Mode (Server + Client simultaneously):**
  ```bash
  pnpm dev
  ```
  - Frontend: `http://localhost:3000`
  - Backend API: `http://localhost:4000`

- **Build for Production:**
  ```bash
  pnpm build
  ```

- **Run Production Server:**
  ```bash
  pnpm start
  ```

---

## Continuous Integration & Release Policy

- **Workflows:** Production-ready GitHub Actions CI located in `.github/workflows/ci.yml` automates linting, typechecks, tests, and builds on pushes to `main` and pull requests.
- **Versioning:** Semantic Versioning (`MAJOR.MINOR.PATCH`) with Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`).
- **Security:** Zero secrets committed to Git; sessions and keys are stored strictly in local `.env` files ignored by version control.
