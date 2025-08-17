# syntax=docker/dockerfile:1.7

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies using a cached npm directory to speed up rebuilds
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy the rest of the source and build
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine AS runtime

# Copy build output to nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Configure Nginx for SPA routing and static asset caching
# We overwrite the default server config with a simple SPA-friendly config
RUN rm -f /etc/nginx/conf.d/default.conf \
  && printf 'server {\n' \
            '  listen 80;\n' \
            '  server_name _;\n' \
            '  root /usr/share/nginx/html;\n' \
            '  index index.html;\n' \
            '  # Serve static files and cache aggressively\n' \
            '  location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|otf)$ {\n' \
            '    expires 1y;\n' \
            '    add_header Cache-Control "public, immutable";\n' \
            '    try_files $uri =404;\n' \
            '  }\n' \
            '  # SPA fallback: route all non-file requests to index.html\n' \
            '  location / {\n' \
            '    try_files $uri $uri/ /index.html;\n' \
            '  }\n' \
            '}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
