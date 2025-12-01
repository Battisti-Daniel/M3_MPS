# syntax=docker/dockerfile:1.6

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine AS base

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /usr/src/app

RUN apk add --no-cache libc6-compat

# ---------------------------------------------------------------
# Dependencies: install node_modules once for caching
# ---------------------------------------------------------------
FROM base AS deps

WORKDIR /usr/src/app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --legacy-peer-deps

# ---------------------------------------------------------------
# Builder: compila assets de produção
# ---------------------------------------------------------------
FROM deps AS builder

WORKDIR /usr/src/app

COPY frontend .
RUN npm run build

# ---------------------------------------------------------------
# Development image: hot reload + volumes
# ---------------------------------------------------------------
FROM deps AS development

ENV NODE_ENV=development

WORKDIR /usr/src/app
COPY frontend .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]

# ---------------------------------------------------------------
# Production image: serve conteúdo otimizado via Next.js
# ---------------------------------------------------------------
FROM base AS production

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /usr/src/app

COPY frontend/package.json frontend/package-lock.json ./
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY frontend/next.config.ts ./next.config.ts
COPY frontend/postcss.config.js ./postcss.config.js
COPY frontend/tailwind.config.js ./tailwind.config.js
COPY frontend/tsconfig.json ./tsconfig.json
COPY frontend/next-env.d.ts ./next-env.d.ts
COPY frontend/app/globals.css ./app/globals.css

EXPOSE 3000

CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]

