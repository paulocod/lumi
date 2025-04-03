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

# Expor a porta
EXPOSE 3001

# Comando para executar a aplicação
CMD ["node", "dist/src/main.js"]
