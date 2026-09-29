# ==========================================
# Stage 1: Build SentinelAI Frontend
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for efficient layer caching
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy full application source
COPY . .

# Build production bundle
RUN npm run build

# ==========================================
# Stage 2: High-Performance Production Runner
# ==========================================
FROM nginx:1.27-alpine AS runner

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Configure container healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
