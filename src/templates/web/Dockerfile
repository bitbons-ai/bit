FROM oven/bun:1

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Ensure the app directory is owned by the non-root user
RUN chown -R appuser:appgroup /app

# Cache dependencies
COPY --chown=appuser:appgroup package.json package-lock.json* bun.lockb* ./
RUN bun install

# Copy source files, respecting .dockerignore
COPY --chown=appuser:appgroup . .

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=4321

# Expose the port
EXPOSE 4321

# Switch to non-root user
USER appuser

# In development, run dev server directly
CMD echo "Starting development server..." && bun run dev