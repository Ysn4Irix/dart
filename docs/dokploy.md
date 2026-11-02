# Deploying Dart on Dokploy

This guide outlines how to deploy **Dart** (Telegram-backed Private Cloud Storage) on **[Dokploy](https://dokploy.com/)** using Docker Compose.

---

## 1. Prerequisites
- A running Dokploy server instance with Docker installed.
- A domain or subdomain configured (e.g. `dart.yourdomain.com`) pointing to your server's public IP address.
- (Optional) Telegram `API ID` and `API Hash` from [my.telegram.org](https://my.telegram.org) (you can also configure these inside the Dart web interface).

---

## 2. Dokploy Project Setup

1. **Create a Project:** In your Dokploy dashboard, create a new project (e.g., `Dart Cloud`).
2. **Add a Service:** Click **Create Service** and select **Compose**.
3. **Configure Source:**
   - Choose **Git** repository and provide your Dart Git repository URL and branch (`main`).
   - Dokploy automatically detects the root `docker-compose.yml`.

---

## 3. Environment Variables in Dokploy

In Dokploy's **Environment** tab for your Compose service, configure the following:

```env
PORT=4000
HOST=0.0.0.0
DATA_DIR=/app/data
PUBLIC_URL=https://dart.yourdomain.com

# Optional (Can also be connected via Web UI after launch):
TELEGRAM_API_ID=
TELEGRAM_API_HASH=
TELEGRAM_SESSION_STRING=
```

---

## 4. Domain & SSL Setup in Dokploy

1. In the **Domains** tab in Dokploy:
   - **Host:** `dart.yourdomain.com`
   - **Port:** `4000`
   - **Service Name:** `dart`
   - **Certificate:** Let's Encrypt (automatic SSL)
2. Save and generate the certificate.

---

## 5. Storage & Persistence

The `docker-compose.yml` mounts a named Docker volume:
```yaml
volumes:
  - dart_data:/app/data
```
This volume securely retains:
- SQLite database (`drive.db`, `drive.db-wal`, `drive.db-shm`) storing indexed file metadata, folders, users, and share links.
- Telegram MTProto session credentials (`telegram_session.json`).

All session and file records survive container redeploys and image updates.

---

## 6. Deploy & Access

1. Click **Deploy** in Dokploy.
2. Once the health check turns green (`http://127.0.0.1:4000/api/auth/setup-status`), navigate to `https://dart.yourdomain.com`.
3. Complete the initial Master Account onboarding and start uploading files directly to your Telegram storage!
