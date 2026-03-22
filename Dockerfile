# syntax=docker/dockerfile:1
# Build one Next.js app from the monorepo. Set build-args TURBO_FILTER, APP_DIR, PORT.
# Example: docker build --build-arg TURBO_FILTER=@mediconnect/web --build-arg APP_DIR=web --build-arg PORT=3000 -t mediconnect-web .

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS builder
COPY . .

ENV DOCKER_NEXT_STANDALONE=1

ARG TURBO_FILTER="@mediconnect/web"
ARG NEXT_PUBLIC_URL_WEB=http://localhost:3000
ARG NEXT_PUBLIC_URL_VIDEO=http://localhost:3001
ARG NEXT_PUBLIC_URL_DASHBOARD=http://localhost:3002
ARG NEXT_PUBLIC_URL_APPOINTMENTS=http://localhost:3003
ARG NEXT_PUBLIC_URL_AI_AGENT=http://localhost:3004
ARG NEXT_PUBLIC_URL_ADMIN=http://localhost:3005

ENV NEXT_PUBLIC_URL_WEB=$NEXT_PUBLIC_URL_WEB
ENV NEXT_PUBLIC_URL_VIDEO=$NEXT_PUBLIC_URL_VIDEO
ENV NEXT_PUBLIC_URL_DASHBOARD=$NEXT_PUBLIC_URL_DASHBOARD
ENV NEXT_PUBLIC_URL_APPOINTMENTS=$NEXT_PUBLIC_URL_APPOINTMENTS
ENV NEXT_PUBLIC_URL_AI_AGENT=$NEXT_PUBLIC_URL_AI_AGENT
ENV NEXT_PUBLIC_URL_ADMIN=$NEXT_PUBLIC_URL_ADMIN

# Prisma install/build need a URL string. Use the same host as docker-compose (`postgres` service name).
# If Next/Webpack inlines DATABASE_URL at build time, 127.0.0.1 breaks login inside the container (wrong DB).
ENV DATABASE_URL=postgresql://mediconnect:mediconnect@postgres:5432/mediconnect

# Prisma engines: detect OpenSSL. onnxruntime-node (via @huggingface/transformers / LiveKit): skip optional CUDA
# binary download — it 404s in many CI/Docker environments and is not needed for the Next.js apps here.
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV ONNXRUNTIME_NODE_INSTALL_CUDA=skip

RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter="${TURBO_FILTER}..."

FROM base AS runner
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ARG APP_DIR=web
ARG PORT=3000

ENV NODE_ENV=production
ENV PORT=${PORT}
ENV HOSTNAME=0.0.0.0
ENV APP_DIR=${APP_DIR}

RUN groupadd --gid 1001 nodejs && useradd --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_DIR}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/${APP_DIR}/.next/static ./apps/${APP_DIR}/.next/static

USER nextjs

EXPOSE 3000 3001 3002 3003 3004 3005

WORKDIR /app
CMD ["sh", "-c", "exec node apps/${APP_DIR}/server.js"]
