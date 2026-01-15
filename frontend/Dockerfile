# ========================================
# Stage 1: Dependencies
# ========================================
FROM node:25-alpine AS deps
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci

# ========================================
# Stage 2: Builder
# ========================================
FROM node:25-alpine AS builder
WORKDIR /app

# Copiar dependencias del stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno para build
ARG NEXT_PUBLIC_API_REST_URL
ARG NEXT_PUBLIC_AUTH_SERVICE_URL
ARG NEXT_PUBLIC_GRAPHQL_URL
ARG NEXT_PUBLIC_WEBSOCKET_URL

ENV NEXT_PUBLIC_API_REST_URL=$NEXT_PUBLIC_API_REST_URL
ENV NEXT_PUBLIC_AUTH_SERVICE_URL=$NEXT_PUBLIC_AUTH_SERVICE_URL
ENV NEXT_PUBLIC_GRAPHQL_URL=$NEXT_PUBLIC_GRAPHQL_URL
ENV NEXT_PUBLIC_WEBSOCKET_URL=$NEXT_PUBLIC_WEBSOCKET_URL

# Build
RUN npm run build

# ========================================
# Stage 3: Runner
# ========================================
FROM node:25-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Cambiar ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 7171

ENV PORT=7171
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
