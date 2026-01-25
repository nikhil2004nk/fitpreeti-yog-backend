# ============================================
# Stage 1: Builder - Compile TypeScript
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
# Use --legacy-peer-deps to resolve @nestjs/config conflicts
RUN npm ci --legacy-peer-deps

# Copy source code and configuration
COPY . .

# Build the application
RUN npm run build

# ============================================
# Stage 2: Production - Minimal runtime image
# ============================================
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
# Use --legacy-peer-deps to resolve @nestjs/config conflicts
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy any other required files (e.g., .env.example if needed)
# COPY --chown=nestjs:nodejs .env.example .env.example

# Switch to non-root user
USER nestjs

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application using the correct entry point
CMD ["node", "dist/api/index.js"]
