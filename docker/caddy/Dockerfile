# 第一阶段：构建 React Web
FROM node:20-alpine AS web-builder

WORKDIR /app

ENV COREPACK_ENABLE_STRICT=0
ENV COREPACK_DEFAULT_TO_LATEST=0
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com

RUN corepack enable pnpm && \
    pnpm config set registry https://registry.npmmirror.com

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile --filter web --filter @jizhang/shared

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm --filter web build

# 第二阶段：Caddy 镜像，内嵌静态文件
FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=web-builder /app/apps/web/dist /srv/web

EXPOSE 80 443
