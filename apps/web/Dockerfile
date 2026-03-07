# ---- 构建阶段 ----
FROM node:20-alpine AS builder

WORKDIR /app

# 只复制 web + shared 的 package.json，跳过 mobile 避免安装 Expo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

# 仅安装 web 和 shared 的依赖，忽略 mobile
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile --filter web --filter @jizhang/shared

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# 生产环境下 Caddy 代理 /api，前端使用相对路径
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm --filter web build

# ---- 最终阶段：仅保留静态产物供 Caddy 挂载 ----
FROM alpine:3.19 AS dist
COPY --from=builder /app/apps/web/dist /srv/web
