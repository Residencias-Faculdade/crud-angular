# COMPATIBILIDADE COM ATIVIDADENGX - Dockerfile multi-stage
# ARQUIVO NOVO (antes nao existia). Copia fiel do padrao atividadengx/Dockerfile
# node:22-alpine build -> nginx:alpine runtime, permite compor com shell via docker-compose
# npm run build agora inclui scripts/postbuild.mjs que gera main.js estavel para a shell
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf # config com CORS + main.js no-cache
COPY --from=build /app/dist/primeiro-projeto/browser /usr/share/nginx/html # mesma estrutura que shell copia dist/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
