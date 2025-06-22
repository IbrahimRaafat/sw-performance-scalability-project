# Use official Node.js LTS image for build
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production image
FROM node:20 AS prod
WORKDIR /app
COPY --from=build /app /app
RUN npm install -g serve
EXPOSE 3000
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "3000"] 