# Estágio 1: Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copia os arquivos de dependência primeiro (aproveita o cache do Docker)
COPY package*.json ./

# Instala todas as dependências (incluindo as de desenvolvimento)
RUN npm install

# Copia o resto do código
COPY . .

# Compila o projeto NestJS
RUN npm run build

# Estágio 2: Produção
FROM node:20-alpine

WORKDIR /usr/src/app

# Copia apenas o que é necessário do estágio de build
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist

# Cria a pasta onde o SQLite vai salvar o arquivo do banco
RUN mkdir -p /usr/src/app/data

EXPOSE 3000

# Inicia o servidor em modo de produção
CMD [ "npm", "run", "start:prod" ]