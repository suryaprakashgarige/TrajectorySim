# frontend/Dockerfile
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Default nginx config is usually fine for SPAs, but might need a custom one for routing
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
