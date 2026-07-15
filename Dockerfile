# syntax=docker/dockerfile:1

# ---- deps: install dependencies (cached separately from source) ----
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- builder: compile the app (also used to run migrations/seed in prod) ----
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Dummy values so build-time env validation (src/shared/infrastructure/config/env.config.ts)
# passes even though real secrets are only injected at container runtime.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build \
    AUTH_SECRET=build-time-placeholder-secret-32-chars-min \
    AUTH_URL=http://localhost:3000 \
    ANTHROPIC_API_KEY=sk-ant-build-placeholder \
    STRIPE_SECRET_KEY=sk_test_build-placeholder \
    NEXT_PUBLIC_APP_URL=http://localhost:3000 \
    NODE_ENV=production

RUN pnpm build

# ---- runner: minimal production image ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
