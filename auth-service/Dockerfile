FROM node:lts-alpine AS deps
WORKDIR /usr/local/app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:lts-alpine AS production
ENV NODE_ENV=production
WORKDIR /usr/local/app
COPY --from=deps /usr/local/app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
EXPOSE 3001
CMD ["npx", "tsx", "src/index.ts"]
