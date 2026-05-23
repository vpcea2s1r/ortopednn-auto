FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache git openssh-client curl jq
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /data /data/drafts /data/stats
ENV NODE_ENV=production
ENV DATA_DIR=/data
EXPOSE 3000
CMD ["node", "app.js"]
