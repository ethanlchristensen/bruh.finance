# Build stage
# Using slim instead of alpine for better native module compatibility
FROM node:20-slim AS build

WORKDIR /app

# Accept build arguments
ARG VITE_APP_BACKEND_API_URL
ARG VITE_APP_BACKEND_API_VERSION
ENV VITE_APP_BACKEND_API_URL=$VITE_APP_BACKEND_API_URL
ENV VITE_APP_BACKEND_API_VERSION=$VITE_APP_BACKEND_API_VERSION

# Copy package files
COPY package*.json ./

# The "Universal Fix":
# 1. We delete the lockfile inside the container so npm doesn't use the Windows settings
# 2. We install fresh for the container's architecture
RUN rm -f package-lock.json && \
    npm install --platform=linux --arch=arm64

# Copy source code
COPY . .

# Build the Vite app
RUN npm run build

# Production stage
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]