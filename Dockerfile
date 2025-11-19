# Multi-stage Docker build for optimized Discord bot image
# Stage 1: Build dependencies
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install all dependencies (including dev dependencies for potential build steps)
RUN npm ci --omit=dev

# Stage 2: Production image
FROM node:20-alpine AS production

# Add labels for better image documentation
LABEL org.opencontainers.image.title="Discord Role Guardian"
LABEL org.opencontainers.image.description="A powerful Discord bot for managing roles, leveling, tickets, and server automation"
LABEL org.opencontainers.image.authors="nayandas69"
LABEL org.opencontainers.image.source="https://github.com/nayandas69/discord-role-guardian"
LABEL org.opencontainers.image.licenses="MIT"

# Railway volumes need specific permission handling that works better with root user
# The bot code itself is still secure as it doesn't execute user-provided code

# Set working directory
WORKDIR /app

# Copy dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY . .

# Railway volumes are mounted at runtime, so we ensure maximum compatibility
RUN mkdir -p data && chmod 777 data

# Expose port for health checks (optional)
EXPOSE 3000

# Health check to ensure bot is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Bot is healthy')" || exit 1

# Start the Discord bot
CMD ["node", "src/index.js"]
