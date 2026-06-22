FROM node:latest AS base
WORKDIR /usr/local/app

FROM base AS auth-dev
COPY package.json package-lock.json ./
COPY tsconfig.json jest.config.cjs ./
RUN npm install
COPY spec ./spec
COPY src ./src
CMD ["npm", "run", "dev"]

FROM auth-dev AS test
RUN npm run test || true

# FROM base AS final
# ENV NODE_ENV=production
# COPY --from=test /usr/local/app/package.json /usr/local/app/package-lock.json ./
# RUN npm ci --production && \
#     npm cache clean --force
# COPY src ./src
# EXPOSE 3001

## Build stage: compile TypeScript to JavaScript
FROM auth-dev AS build
RUN npm run build

## Final image: copy compiled output and production deps
FROM base AS final
ENV NODE_ENV=production
COPY --from=test /usr/local/app/package.json /usr/local/app/package-lock.json ./
RUN npm ci --production && \
    npm cache clean --force
COPY --from=build /usr/local/app/dist ./dist
COPY src ./src
EXPOSE 3001
CMD ["node", "dist/index.js"]
