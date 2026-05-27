FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml ./
COPY api/package.json ./api/
RUN pnpm install --filter api --ignore-scripts
COPY api/ ./api/
RUN pnpm --filter api build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/api/dist ./dist
COPY --from=builder /app/api/package.json ./
RUN pnpm install --prod --ignore-scripts
EXPOSE 3000
CMD ["node", "dist/main.js"]
