FROM oven/bun:alpine AS builder
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./

RUN bun install --production --frozen-lockfile

RUN addgroup -S app && adduser -S app -G app

RUN chown app:app /app
USER app

COPY . .

CMD ["bun", "run", "start"]
