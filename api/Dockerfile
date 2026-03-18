FROM oven/bun:alpine

WORKDIR /usr/src/app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

CMD ["bun", "run", "start"]
