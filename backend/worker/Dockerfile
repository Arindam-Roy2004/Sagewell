FROM node:22-alpine AS builder
WORKDIR /app/worker

ENV PUPPETEER_SKIP_DOWNLOAD=true
# Install worker dependencies
COPY worker/package*.json ./
# `npm ci` installs exactly what package-lock.json pins, so every build is reproducible.
RUN npm ci --omit=dev --legacy-peer-deps

FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /app/worker/node_modules ./node_modules
COPY shared/ ./shared/
COPY worker/ ./worker/

ENV NODE_ENV=production
# Run as the image's unprivileged user, not root.
USER node
CMD ["node", "worker/index.js"]
