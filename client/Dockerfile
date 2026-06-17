FROM node:lts-alpine AS builder
WORKDIR /usr/local/app
COPY package.json package-lock.json ./
RUN npm ci
COPY .eslintrc.cjs index.html vite.config.ts tsconfig.json ./
COPY public ./public
COPY src ./src
ENV VITE_API_URL=/api
RUN npx vite build

FROM nginx:alpine AS production
COPY --from=builder /usr/local/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
