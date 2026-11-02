# ==========================================
# Multi-stage Production Dockerfile for Dart
# Telegram-backed Private Cloud Storage
# ==========================================

# Stage 1: Build Client & Server
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy monorepo manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install all dependencies (including devDependencies for TypeScript & Vite)
RUN pnpm install --frozen-lockfile

# Copy source trees
COPY client/ ./client/
COPY server/ ./server/

# Build client SPA and server TypeScript distribution
RUN pnpm --filter dart-client run build
RUN pnpm --filter dart-server run build

# ==========================================
# Stage 2: Minimal Production Runtime
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000 \
    HOST=0.0.0.0 \
    DATA_DIR=/app/data \
    CLIENT_DIST=/app/client/dist

# Install wget for health checks
RUN apk add --no-cache wget

# Enable pnpm in runner for isolated production installs
RUN corepack enable && corepack prepare pnpm@latest --activate

# Prepare persistent data directory with proper ownership
RUN mkdir -p /app/data && chown -R node:node /app/data

# Copy workspace configuration and server package
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node server/package.json ./server/

# Install only production dependencies
RUN pnpm --filter dart-server install --prod --frozen-lockfile

# Copy compiled server distribution and built frontend static assets
COPY --chown=node:node --from=builder /app/server/dist ./server/dist
COPY --chown=node:node --from=builder /app/client/dist ./client/dist

# Run as non-root node user for security
USER node

# Expose default HTTP port
EXPOSE 4000

# Health check checking auth setup endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:4000/api/auth/setup-status || exit 1

# Start Fastify server
CMD ["node", "server/dist/index.js"]
