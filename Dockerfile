FROM node:22-slim

WORKDIR /app

# Copy root manifest + lock file, and web workspace manifest.
# The root package-lock.json covers all workspace deps so no
# separate web/package-lock.json is needed.
COPY package.json package-lock.json ./
COPY web/package.json ./web/

RUN npm ci

COPY . .
RUN npm --prefix web run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/server.js"]
