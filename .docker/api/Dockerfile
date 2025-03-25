# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM imbios/bun-node:latest-jod-slim AS base
WORKDIR /api

# Step 1 - install dependencies
COPY package.json bun.lock ./
RUN bun install

# Step 3 - expose the port
EXPOSE 3000

CMD ["bun", "dev"]