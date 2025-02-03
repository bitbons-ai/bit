FROM oven/bun:1

WORKDIR /app

# Cache dependencies
COPY package.json package-lock.json* bun.lockb* ./
RUN bun install

# Copy source files, respecting .dockerignore
COPY . .

ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

# In development, run dev server directly
CMD echo "Starting development server..." && bun run dev