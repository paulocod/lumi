FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências primeiro
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Copiar o resto do código
COPY . .

# Gerar o build
RUN npm run build

# Gerar o Prisma Client
RUN npx prisma generate

# Expor a porta
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm run start:prod"]
