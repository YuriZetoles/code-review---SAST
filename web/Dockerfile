FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml ./
COPY api/package.json ./api/
COPY web/package.json ./web/
RUN pnpm install --ignore-scripts
COPY web/ ./web/
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter web build

FROM nginx:alpine
COPY --from=builder /app/web/dist /usr/share/nginx/html
COPY script/scan.sh /usr/share/nginx/html/scan.sh
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
