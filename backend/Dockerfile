# ── Stage 1: Install dependencies ──
FROM oven/bun:1-alpine AS builder

WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# ── Stage 2: Runtime ──
FROM oven/bun:1-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
EXPOSE 8080

# Run as the image's unprivileged user, not root.
USER bun

# Liveness only. Readiness (/api/v1/health) would make Docker restart-loop the
# container on a transient DB blip, which fixes nothing. The deploy gates on
# readiness instead.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/v1/healthcheck').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "src/index.js"]