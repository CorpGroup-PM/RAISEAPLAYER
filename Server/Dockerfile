# --- STAGE 1: BUILD ---
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
COPY prisma.config.ts ./

# Dummy DATABASE_URL for Prisma generate (build-time only)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate

COPY . .
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache wget

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
