FROM node:latest AS base
WORKDIR /usr/local/app

################## CLIENT STAGES ##################

FROM base AS client-base
COPY package.json package-lock.json ./
RUN npm install
COPY .eslintrc.cjs index.html vite.config.ts ./
COPY public ./public
COPY src ./src

FROM client-base AS client-dev
CMD ["npm", "run", "dev"]

FROM client-base AS client-build
RUN npm run build