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

RUN npm install

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