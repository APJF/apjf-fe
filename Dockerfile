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

# Copy Nginx configuration (separated from Dockerfile)
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
