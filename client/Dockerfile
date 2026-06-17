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
ENV VITE_API_URL=/api
RUN npm run build

FROM nginx:alpine AS client-prod
COPY --from=client-build /usr/local/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]