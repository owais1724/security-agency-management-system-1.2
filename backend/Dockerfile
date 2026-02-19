# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev)
RUN npm install

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Copy package files
COPY --from=builder /app/package*.json ./

# Copy full node_modules (includes prisma CLI for migrations)
COPY --from=builder /app/node_modules ./node_modules

# Copy built app and prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Run migrations, seed initial data, then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
