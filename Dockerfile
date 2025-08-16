# Stage 1: Build app
FROM node:20-alpine AS builder

WORKDIR /app

# copy package.json và lockfile trước để tối ưu cache
COPY package*.json ./

RUN npm ci

# copy toàn bộ source
COPY . .

# build production
RUN npm run build

# Stage 2: Nginx serve static
FROM nginx:alpine

# copy file build ra thư mục nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# copy nginx config (nếu có tuỳ chỉnh rewrite cho SPA)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]