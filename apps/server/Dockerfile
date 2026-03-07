# ---- 构建阶段 ----
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

ENV COREPACK_ENABLE_STRICT=0
ENV COREPACK_DEFAULT_TO_LATEST=0
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

WORKDIR /app

RUN corepack enable pnpm && \
    pnpm config set registry https://registry.npmmirror.com

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile --filter server --filter @jizhang/shared

COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

RUN pnpm --filter server build

# ---- 运行阶段 ----
FROM node:20-alpine AS runner

RUN apk add --no-cache python3 make g++

ENV COREPACK_ENABLE_STRICT=0
ENV COREPACK_DEFAULT_TO_LATEST=0
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/data/jizhang/jizhang.db

WORKDIR /app

RUN corepack enable pnpm && \
    pnpm config set registry https://registry.npmmirror.com

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile --filter server --prod

# 编译 better-sqlite3 原生模块
RUN cd node_modules/.pnpm/better-sqlite3*/node_modules/better-sqlite3 && \
    npm run build-release 2>/dev/null || true

COPY --from=builder /app/apps/server/dist ./apps/server/dist

RUN mkdir -p /data/jizhang

EXPOSE 3001

CMD ["node", "apps/server/dist/index.js"]
