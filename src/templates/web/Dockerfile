FROM oven/bun:1

WORKDIR /app

# Only copy package files first to leverage cache
COPY package.json ./

# Install and setup as root
RUN bun install && \
    mkdir -p /app/node_modules/.astro && \
    chown -R bun:bun /app && \
    chmod -R 755 /app/node_modules/.astro

# Switch to bun user
USER bun

EXPOSE 4321

# Use an entrypoint script to ensure directory exists
CMD ["sh", "-c", "\
    if [ ! -d /app/node_modules/.astro ]; then \
    mkdir -p /app/node_modules/.astro; \
    fi && \
    bun run dev \
    "]
