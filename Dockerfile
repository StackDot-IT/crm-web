# syntax=docker/dockerfile:1

# ── Stage 1: build the Vite app ──
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Base path the browser uses for API calls. "/api" = same origin, proxied by nginx below.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ── Stage 2: serve static files with nginx ──
FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
